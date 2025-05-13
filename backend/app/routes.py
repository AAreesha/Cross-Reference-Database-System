from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from langchain.schema import HumanMessage, SystemMessage
from langchain.chat_models import ChatOpenAI
from sqlalchemy import func, desc
from cache import get_cached_result, set_cached_result
import pandas as pd
import io
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, desc
from db import SessionLocal
from models import UnifiedIndex
from utils import generate_embedding, as_pgvector
import uuid
from fastapi import BackgroundTasks
from fastapi.responses import JSONResponse


router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/upload-file/")
async def upload_file(
    file: UploadFile = File(...),
    source_tag: str = Form(...),
    db: Session = Depends(get_db)
):
    filename = file.filename.lower().strip()
    if not filename.endswith((".xlsx", ".xls", ".csv")):
        raise HTTPException(status_code=400, detail="Only CSV or Excel files are supported")

    if source_tag not in {"db1", "db2", "db3", "db4"}:
        raise HTTPException(status_code=400, detail="Invalid source_tag value")

    try:
        contents = await file.read()
        if filename.endswith(".csv"):
            try:
                df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
            except UnicodeDecodeError:
                df = pd.read_csv(io.StringIO(contents.decode("cp1252")))
        else:
            df = pd.read_excel(io.BytesIO(contents), engine="openpyxl")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")

    df = df.dropna(how="all").drop_duplicates()
    inserted = 0
    records = []

    for _, row in df.iterrows():
        combined_text = " ".join(str(val).strip() for val in row if pd.notna(val)).strip()
        if not combined_text or combined_text.lower() == "nan":
            continue

        try:
            embedding = generate_embedding(combined_text)
        except Exception as e:
            print(f"⚠️ Skipping row due to embedding error: {e}")
            continue

        if not isinstance(embedding, list) or not all(isinstance(x, (float, int)) for x in embedding):
            print(f"⚠️ Invalid embedding for row: {combined_text}")
            continue

        records.append(UnifiedIndex(
            source_tag=source_tag,
            source_text=combined_text[:10000],  # Truncate if needed
            embedding=embedding
        ))
        inserted += 1

    try:
        if records:
            db.bulk_save_objects(records)
            db.commit()
    except Exception as db_err:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database insert failed: {str(db_err)}")

    return {
        "status": "success",
        "inserted_rows": inserted,
        "source_tag": source_tag,
        "filename": file.filename
    }


# Dictionary to track file upload status
upload_status = {}  # Format: {upload_id: {status: str, inserted: int}}

@router.post("/files/ingest")
async def ingest_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    source_tag: str = Form(...),
    db: Session = Depends(get_db)
):
    upload_id = str(uuid4())
    upload_status[upload_id] = {"status": "file upload pending", "inserted": 0}

    contents = await file.read()
    background_tasks.add_task(process_upload_file, contents, file.filename, source_tag, upload_id, db)

    return {"upload_id": upload_id, "status": "file upload pending"}

@router.get("/files/status/{upload_id}")
async def get_upload_status(upload_id: str):
    if upload_id not in upload_status:
        raise HTTPException(status_code=404, detail="Invalid upload_id")
    return upload_status[upload_id]

def process_upload_file(contents, filename, source_tag, upload_id, db):
    try:
        if filename.endswith(".csv"):
            try:
                df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
            except UnicodeDecodeError:
                df = pd.read_csv(io.StringIO(contents.decode("cp1252")))
        else:
            df = pd.read_excel(io.BytesIO(contents), engine="openpyxl")

        df = df.dropna(how="all").drop_duplicates()
        records = []
        inserted = 0

        for _, row in df.iterrows():
            combined = " ".join(str(val).strip() for val in row if pd.notna(val)).strip()
            if not combined or combined.lower() == "nan":
                continue

            try:
                embedding = generate_embedding(combined)
            except Exception as e:
                print(f"⚠️ Embedding error: {e}")
                continue

            records.append(UnifiedIndex(
                source_tag=source_tag,
                source_text=combined[:10000],
                embedding=embedding
            ))
            inserted += 1

        if records:
            db.bulk_save_objects(records)
            db.commit()

        upload_status[upload_id] = {"status": "completed", "inserted": inserted}

    except Exception as e:
        upload_status[upload_id] = {"status": f"failed: {str(e)}", "inserted": 0}


@router.post("/semantic-search/")
def semantic_search(query: str, db: Session = Depends(get_db)):
    cached = get_cached_result(query)
    if cached:
        return {"cached": True, "result": eval(cached)}

    try:
        query_embedding = as_pgvector(generate_embedding(query))
        all_results = []

        # Prepare ts_query for Postgres full-text search
        ts_query = query.replace("'", "''")  # basic escaping
        fts_query = func.plainto_tsquery('english', ts_query)

        for source_tag in ["db1", "db2", "db3", "db4"]:
            results = (
                db.query(
                    UnifiedIndex.id,
                    UnifiedIndex.source_tag,
                    UnifiedIndex.source_text,
                    func.cosine_distance(UnifiedIndex.embedding, query_embedding).label("cos_sim"),
                    func.ts_rank_cd(
                        func.to_tsvector('english', UnifiedIndex.source_text),
                        fts_query
                    ).label("fts_score")
                )
                .filter(UnifiedIndex.source_tag == source_tag)
                .filter(func.to_tsvector('english', UnifiedIndex.source_text).op('@@')(fts_query))
                .order_by(
                    desc(
                        0.6 * func.cosine_distance(UnifiedIndex.embedding, query_embedding) +
                        0.4 * func.ts_rank_cd(
                            func.to_tsvector('english', UnifiedIndex.source_text),
                            fts_query
                        )
                    )
                )
                .limit(10)
                .all()
            )

            for r in results:
                all_results.append({
                    "id": r.id,
                    "source_tag": r.source_tag,
                    "source_text": r.source_text,
                })

        # Deduplicate
        unique_results = {f"{r['source_tag']}_{r['id']}": r for r in all_results}.values()
        top_results = list(unique_results)[:5]

        # Format context
        source_index = {}
        deduped_sources = []
        numbered_chunks = []

        for doc in top_results:
            tag = doc['source_tag']
            if tag not in source_index:
                source_index[tag] = len(source_index) + 1
                deduped_sources.append(tag)
            source_num = source_index[tag]
            numbered_chunks.append(f"[{source_num}] {doc['source_text']}")

        retrieved_context = "\n\n".join(numbered_chunks)

        # Chain: Step 1 - Extract relevant info
        llm = ChatOpenAI(model_name="gpt-4o", temperature=0)

        extraction_messages = [
            SystemMessage(content=(
                "You are a data extraction expert.\n"
                "You will be given unstructured data rows extracted from Excel or CSV files. Your task is to extract rows that are semantically or contextually relevant to the user's query.\n"
                "A row is considered relevant if it:\n"
                "- Mentions related keywords, phrases, or entities from the query (even if worded differently)\n"
                "- Refers to the same location, organization, dates, values, or contract types\n"
                "- Involves similar activity or service types as the query\n\n"
                "Return only the relevant rows in full. DO NOT rephrase or summarize. Preserve the original formatting.\n"
                "If no match is found, return an empty response."
            )),
            HumanMessage(content=f"Query: {query}\n\nContext:\n{retrieved_context}")
        ]


        extracted_content = llm(extraction_messages).content.strip()

        # Chain: Step 2 - Format response
        formatting_messages = [
            SystemMessage(content=(
                "You are a formatter assistant. Take the extracted contract entries and structure them in clean markdown format."
                "Use tables where appropriate. Be clear, direct, and structured."
            )),
            HumanMessage(content=f"Query: {query}\n\nExtracted Entries:\n{extracted_content}")
        ]

        structured_output = llm(formatting_messages).content.strip()

        result = {
            "query": query,
            "gpt_response": structured_output,
            "retrieved_context": retrieved_context,
            "sources": deduped_sources
        }

        set_cached_result(query, result)
        return {"cached": False, **result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Semantic Search LLM failed: {str(e)}")
