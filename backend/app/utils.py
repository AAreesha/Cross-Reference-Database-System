from openai import OpenAI

client = OpenAI()  # Uses OPENAI_API_KEY from .env
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

def generate_embedding(text: str) -> list:
    from numpy import array, mean

    if not isinstance(text, str):
        raise ValueError("Embedding input must be a string")

    chunks = chunk_text(text, max_tokens=800)
    embeddings = []

    for chunk in chunks:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=chunk
        )
        embeddings.append(response.data[0].embedding)

    # Average embeddings (can use other strategies too)
    avg_embedding = mean(array(embeddings), axis=0)
    return avg_embedding.tolist()
