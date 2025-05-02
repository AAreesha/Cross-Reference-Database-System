from sqlalchemy import Column, Integer, String, TIMESTAMP
from sqlalchemy.dialects.postgresql import TIMESTAMP as PG_TIMESTAMP
from sqlalchemy.dialects.postgresql import VARCHAR
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from db import Base

class UnifiedIndex(Base):
    __tablename__ = "unified_index"

    id = Column(Integer, primary_key=True, index=True)
    db1_id = Column(VARCHAR(255))
    db2_id = Column(VARCHAR(255))
    db3_id = Column(VARCHAR(255))
    db4_id = Column(VARCHAR(255))
    embedding = Column(Vector(1536))
    created_at = Column(PG_TIMESTAMP, server_default=func.now())
