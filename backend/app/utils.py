import openai
import os
import hashlib
import numpy as np
from typing import List
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI client
api_key = os.getenv("OPENAI_API_KEY", "")
client = openai.OpenAI(api_key=api_key) if api_key and api_key != "your_openai_api_key_here" else None

MAX_CHARS = 10000  # Safe truncation limit

def chunk_text(text: str, max_tokens=800):
    import tiktoken
    enc = tiktoken.encoding_for_model("text-embedding-3-small")
    tokens = enc.encode(text)

    chunks = []
    for i in range(0, len(tokens), max_tokens):
        chunk = enc.decode(tokens[i:i + max_tokens])
        chunks.append(chunk)

    return chunks

def generate_mock_embedding(text: str, dimension: int = 1536) -> List[float]:
    """
    Generate a deterministic mock embedding for demo purposes.
    This creates a consistent vector based on the text content.
    """
    # Create a hash of the text for consistency
    text_hash = hashlib.md5(text.encode()).hexdigest()
    
    # Use the hash to seed a random number generator for consistency
    np.random.seed(int(text_hash[:8], 16) % (2**32))
    
    # Generate a random vector and normalize it
    vector = np.random.normal(0, 1, dimension)
    vector = vector / np.linalg.norm(vector)
    
    return vector.tolist()

def check_openai_availability() -> bool:
    """Check if OpenAI API is available and properly configured."""
    if not client:
        return False
    
    try:
        # Test with a simple embedding request
        response = client.embeddings.create(
            model="text-embedding-ada-002",
            input="test"
        )
        return True
    except Exception:
        return False

def generate_embedding(text: str) -> List[float]:
    """
    Generate text embedding using OpenAI API or fallback to mock embedding.
    """
    # Clean and prepare text
    text = str(text).strip()
    if not text:
        text = "empty"
    
    # Try OpenAI API first if available
    if client:
        try:
            response = client.embeddings.create(
                model="text-embedding-ada-002",
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"⚠️ OpenAI API failed ({str(e)}), falling back to mock embedding")
            return generate_mock_embedding(text)
    else:
        print("ℹ️ Using mock embeddings (OpenAI API key not configured)")
        return generate_mock_embedding(text)

# async def generate_embedding_async(text: str) -> List[float]:
#     try:
#         response = await client.embeddings.create(
#             model="text-embedding-3-small",
#             input=text
#         )
#         return response.data[0].embedding
#     except Exception as e:
#         print(f"⚠️ OpenAI API async failed ({str(e)}), falling back to mock")
#         return generate_mock_embedding(text)
