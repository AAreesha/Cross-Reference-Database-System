from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import SessionLocal
from models import UnifiedIndex
from utils import generate_embedding
from cache import get_cached_result, set_cached_result

router = APIRouter()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/insert-record/")
def insert_record(db1_id: str, db2_id: str, db3_id: str, db4_id: str, db: Session = Depends(get_db)):
    combined_text = " ".join([db1_id, db2_id, db3_id, db4_id])
    embedding = generate_embedding(combined_text)
    record = UnifiedIndex(
        db1_id=db1_id,
        db2_id=db2_id,
        db3_id=db3_id,
        db4_id=db4_id,
        embedding=embedding
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"status": "success", "id": record.id}

@router.post("/semantic-search/")
def semantic_search(query: str, db: Session = Depends(get_db)):
    cached = get_cached_result(query)
    if cached:
        return {"cached": True, "results": eval(cached)}

    query_embedding = generate_embedding(query)
    results = db.query(UnifiedIndex).order_by(
        UnifiedIndex.embedding.cosine_distance(query_embedding)
    ).limit(5).all()

    output = [
        {
            "id": r.id,
            "db1_id": r.db1_id,
            "db2_id": r.db2_id,
            "db3_id": r.db3_id,
            "db4_id": r.db4_id
        }
        for r in results
    ]

    set_cached_result(query, output)
    return {"cached": False, "results": output}
