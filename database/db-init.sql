-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop old table if needed (for dev environments only)
DROP TABLE IF EXISTS unified_index;

-- Create updated unified_index table
CREATE TABLE unified_index (
    id SERIAL PRIMARY KEY,
    source_tag TEXT NOT NULL,
    source_text TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create vector index
CREATE INDEX unified_idx_embedding
ON unified_index USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
