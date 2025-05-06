from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
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
    # Check cache first
    cached = get_cached_result(query)
    if cached:
        return {"cached": True, "results": eval(cached)}

    # Generate the query embedding
    query_embedding = generate_embedding(query)

    # Initialize an empty dictionary to store the top 5 results for each source_tag
    results_per_db = {}

    # List of source_tags (db1, db2, db3, db4)
    source_tags = ["db1", "db2", "db3", "db4"]

    # Perform the search for each source_tag
    for source_tag in source_tags:
        # Perform the vector similarity search for the current source_tag
        results = db.query(UnifiedIndex).filter(UnifiedIndex.source_tag == source_tag).order_by(
            UnifiedIndex.embedding.cosine_distance(query_embedding)
        ).limit(5).all()

        # Store the results for this source_tag
        results_per_db[source_tag] = [
            {
                "id": r.id,
                "source_tag": r.source_tag,
                "source_text": r.source_text,
            }
            for r in results
        ]

    # Prepare the final output
    output = [{"source_tag": tag, "results": results} for tag, results in results_per_db.items()]

    # Cache the results for future reuse
    set_cached_result(query, output)

    return {"cached": False, "results": output}
