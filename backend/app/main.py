from fastapi import FastAPI
from routes import router

app = FastAPI(
    title="AI-Integrated Cross-Reference Database API",
    description="Supports insertion and semantic search of multi-dataset records.",
    version="1.0.0"
)

app.include_router(router)

