from sqlalchemy import Column, Integer, String, TIMESTAMP,Text
from sqlalchemy.dialects.postgresql import TIMESTAMP as PG_TIMESTAMP
from sqlalchemy.dialects.postgresql import VARCHAR
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from db import Base

class UnifiedIndex(Base):
    __tablename__ = "unified_index"

    id = Column(Integer, primary_key=True, index=True)
    source_tag = Column(String, nullable=False)      # e.g., db1, db2
    source_text = Column(Text, nullable=False)       # combined row
    embedding = Column(Vector(1536), nullable=False) # pgvector