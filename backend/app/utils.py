# import openai
# import os

# openai.api_key = os.getenv("OPENAI_API_KEY")

# EMBEDDING_MODEL = "text-embedding-3-small"

# def generate_embedding(text: str) -> list:
#     response = openai.embeddings.create(
#         input=text,
#         model=EMBEDDING_MODEL
#     )
#     return response.data[0].embedding


from openai import OpenAI

client = OpenAI()  # Uses OPENAI_API_KEY from .env
MAX_CHARS = 10000  # Safe truncation limit

def generate_embedding(text: str) -> list:
    if not isinstance(text, str):
        raise ValueError("Embedding input must be a string")

    text = text.strip()[:MAX_CHARS]  # Truncate for OpenAI limit

    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )

    embedding = response.data[0].embedding

    # Convert to native list
    if not isinstance(embedding, list):
        embedding = list(embedding)

    # Validate list of floats
    if not all(isinstance(x, (float, int)) for x in embedding):
        raise ValueError("Embedding must be a list of floats")

    return embedding
