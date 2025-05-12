from openai import OpenAI
from crewai import Agent, Crew, Task
# from crewai_tools import VectorSearchTool
from langchain.chat_models import ChatOpenAI
from crewai.tools import BaseTool
from db import SessionLocal
from models import UnifiedIndex

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


class PgVectorSearchTool(BaseTool):
    name: str = "pgvector_search"
    description: str = "Searches pgvector for semantically similar contract records."

    def _run(self, query: str) -> str:
        db = SessionLocal()
        try:
            embedding = generate_embedding(query)
            results = db.query(UnifiedIndex).order_by(
                UnifiedIndex.embedding.cosine_distance(embedding)
            ).limit(5).all()

            return "\n\n".join([r.source_text for r in results])
        except Exception as e:
            return f"Search error: {str(e)}"
        finally:
            db.close()

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



vector_tool = PgVectorSearchTool()


semantic_agent = Agent(
    role="RAG Retrieval Planner",
    goal="Answer user questions accurately using semantic search over structured contracts.",
    tools=[vector_tool],
    backstory="You are an intelligent agent with access to a vector search tool, capable of iterating, planning and deciding which data sources to consult and how to synthesize answers.",
    verbose=True,
    llm=ChatOpenAI(model_name="gpt-4o", temperature=0)
)

# def run_agentic_rag(query):
#     task = Task(
#         description=f"Answer the following question: '{query}' using vector retrieval and reasoning.",
#         expected_output="Concise, context-based answer with structured format (e.g., table/list) if possible.",
#         agent=semantic_agent
#     )

#     crew = Crew(
#         agents=[semantic_agent],
#         tasks=[task],
#         verbose=True
#     )

#     return crew.kickoff()

def run_agentic_rag(query: str, retrieved_context: str):
    from langchain.chat_models import ChatOpenAI

    context_prompt = (
        "You are a data analysis assistant with access to structured contract data. "
        "Use the provided context—containing contract opportunities, set-aside types, vendors, agencies, and response deadlines—to answer the user's query accurately. "
        "Your responses should be concise, relevant, and based strictly on the context. If the context is insufficient, clearly state that. "
        "Format results in tables or lists when helpful."
    )

    full_input = f"Context:\n{retrieved_context}\n\nQuery:\n{query}"

    task = Task(
        description=context_prompt,
        expected_output="A well-structured answer with no hallucinations.",
        agent=semantic_agent,
        input=full_input
    )

    crew = Crew(
        agents=[semantic_agent],
        tasks=[task],
        verbose=True
    )

    return crew.kickoff()
