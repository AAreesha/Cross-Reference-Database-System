-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the unified_index table
CREATE TABLE IF NOT EXISTS unified_index (
    id SERIAL PRIMARY KEY,
    db1_id VARCHAR(255),
    db2_id VARCHAR(255),
    db3_id VARCHAR(255),
    db4_id VARCHAR(255),
    embedding vector(1536),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create a vector index for fast semantic search
CREATE INDEX IF NOT EXISTS unified_idx_embedding 
ON unified_index USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);
