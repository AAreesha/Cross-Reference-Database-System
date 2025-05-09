from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from langchain.schema import HumanMessage, SystemMessage
from langchain.chat_models import ChatOpenAI
from db import SessionLocal
from models import UnifiedIndex
from utils import generate_embedding
from cache import get_cached_result, set_cached_result
import pandas as pd
import io


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


@router.post("/semantic-search/")
def semantic_search(query: str, db: Session = Depends(get_db)):
    query_embedding = generate_embedding(query)

    # Search top 20 results from all dbs, then keep top 5 globally
    all_results = []

    for source_tag in ["db1", "db2", "db3", "db4"]:
        results = db.query(UnifiedIndex).filter(UnifiedIndex.source_tag == source_tag).order_by(
            UnifiedIndex.embedding.cosine_distance(query_embedding)
        ).limit(10).all()

        for r in results:
            all_results.append({
                "id": r.id,
                "source_tag": r.source_tag,
                "source_text": r.source_text,
            })

    # Deduplicate and score top 5 globally
    unique_results = {f"{r['source_tag']}_{r['id']}": r for r in all_results}.values()
    top_results = list(unique_results)[:5]

    # Format context like RAG
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

    # LLM prompt
    messages = [
        SystemMessage(content=(
            "You are a helpful assistant. Use the context below to answer the user query. "
            "Reference the sources as [1], [2], etc. If unsure, ask for clarification."
        )),
        HumanMessage(content=f"Context:\n{retrieved_context}"),
        HumanMessage(content=f"Query:\n{query}")
    ]

    llm = ChatOpenAI(model_name="gpt-4o", temperature=0)
    response = llm(messages)

    return {
        "query": query,
        "retrieved_context": retrieved_context,
        "gpt_response": response.content.strip(),
        "sources": deduped_sources
    }