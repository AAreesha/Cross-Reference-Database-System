from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from langchain.schema import HumanMessage, SystemMessage
from langchain.chat_models import ChatOpenAI
from datetime import timedelta
from db import SessionLocal
from models import UnifiedIndex
from utils import generate_embedding
from cache import get_cached_result, set_cached_result
from auth import authenticate_admin, create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
import pandas as pd
import io
from cache import redis_client

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    if not authenticate_admin(form_data.username, form_data.password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/upload-file/")
async def upload_file(
    file: UploadFile = File(...),
    source_tag: str = Form(...),
    current_user: str = Depends(get_current_user),
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
    
@router.get("/suggestions/")
def get_cached_queries():
    suggestions = list(redis_client.smembers("cached_queries"))
    return {"suggestions": sorted(suggestions, key=str.lower)}
    
    

@router.post("/semantic-search/")
def semantic_search(query: str, db: Session = Depends(get_db)):
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    # Check cache first
    cached = get_cached_result(query)
    if cached:
        try:
            return {"cached": True, "results": eval(cached)}
        except:
            # If cached result is corrupted, continue with fresh search
            pass
    
    try:
        query_embedding = generate_embedding(query)
    except Exception as e:
        print(f"❌ Embedding generation failed: {e}")
        return {
            "query": query,
            "gpt_response": "Sorry, the search service is currently unavailable. This might be due to missing API keys or service configuration. Please check the server logs for more details.",
            "sources": [],
            "error": "Embedding generation failed"
        }

    # Search top results from all databases
    all_results = []
    total_records = 0

    for source_tag in ["db1", "db2", "db3", "db4"]:
        try:
            results = db.query(UnifiedIndex).filter(UnifiedIndex.source_tag == source_tag).order_by(
                UnifiedIndex.embedding.cosine_distance(query_embedding)
            ).limit(10).all()

            total_records += db.query(UnifiedIndex).filter(UnifiedIndex.source_tag == source_tag).count()

            for r in results:
                all_results.append({
                    "id": r.id,
                    "source_tag": r.source_tag,
                    "source_text": r.source_text,
                })
        except Exception as e:
            print(f"⚠️ Database query failed for {source_tag}: {e}")
            continue

    # Check if database is empty
    if total_records == 0:
        return {
            "query": query,
            "gpt_response": "No data found in the database. Please upload some CSV files first using the Upload page to populate the databases with searchable content.",
            "sources": [],
            "retrieved_context": "",
            "note": "Database is empty - please upload data first"
        }

    # If no results found
    if not all_results:
        return {
            "query": query,
            "gpt_response": f"No relevant results found for your query: '{query}'. Try using different keywords or upload more data to search through.",
            "sources": [],
            "retrieved_context": "",
            "note": f"No matches found in {total_records} records"
        }

    # Process results
    unique_results = {f"{r['source_tag']}_{r['id']}": r for r in all_results}.values()
    top_results = list(unique_results)[:5]

    # Format context for LLM
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

    # Generate response using LLM
    try:
        messages = [
            SystemMessage(content=(
                "You are a data analysis assistant with access to structured data. "
                "Use the provided context to answer the user's query accurately and concisely. "
                "If the context is insufficient, clearly state that. "
                "Format results in tables or lists when helpful. "
                "Do not mention that your answer is based on provided context."
            )),
            HumanMessage(content=f"Context:\n{retrieved_context}"),
            HumanMessage(content=f"Query:\n{query}")
        ]

        llm = ChatOpenAI(model_name="gpt-4o", temperature=0)
        response = llm(messages)
        gpt_response = response.content.strip()
    except Exception as e:
        print(f"⚠️ LLM generation failed: {e}")
        # Fallback response without LLM
        gpt_response = f"Based on your query '{query}', I found {len(top_results)} relevant results:\n\n"
        for i, doc in enumerate(top_results, 1):
            gpt_response += f"{i}. From {doc['source_tag'].upper()}: {doc['source_text'][:200]}...\n\n"
        
        gpt_response += "\nNote: AI analysis unavailable - showing raw results. This might be due to missing API configuration."

    output = {
        "query": query,
        "retrieved_context": retrieved_context,
        "gpt_response": gpt_response,
        "sources": deduped_sources,
        "results_count": len(top_results),
        "total_records": total_records
    }

    # Save to cache
    try:
        set_cached_result(query, output)
    except Exception as e:
        print(f"⚠️ Cache save failed: {e}")

    return {"cached": False, **output}
