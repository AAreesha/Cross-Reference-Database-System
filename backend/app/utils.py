from openai import OpenAI
from crewai import Agent, Crew, Task
# from crewai_tools import VectorSearchTool
from langchain.chat_models import ChatOpenAI
from crewai.tools import BaseTool
from db import SessionLocal
from models import UnifiedIndex
from dotenv import load_dotenv
from sqlalchemy import cast, text, func
from sqlalchemy import desc
from pgvector.sqlalchemy import Vector
from dotenv import load_dotenv

load_dotenv()

def get_openai_client():
    return OpenAI()

# client = OpenAI()  # Uses OPENAI_API_KEY from .env
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

    client = get_openai_client()
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

def as_pgvector(vec: list):
    # Convert Python list to Postgres vector literal like: '[0.1, 0.2, ...]'::vector
    vec_str = str(vec).replace('[', "'[").replace(']', "]'")
    return cast(text(vec_str), Vector)

vector_tool = PgVectorSearchTool()

retrieval_agent = Agent(
    role="Context-Aware Retriever",
    goal="Precisely extract all passages from the provided context that are highly relevant to the user's query.",
    backstory="You are highly skilled at searching structured and unstructured data to identify directly related information, avoiding irrelevant filler or vague references.",
    tools=[vector_tool],
    llm=ChatOpenAI(model_name="gpt-4o", temperature=0),
    verbose=True
)

formatter_agent = Agent(
    role="Response Structurer",
    goal="Format extracted content into a clear and well-structured answer that is easy to read and directly informative.",
    backstory="You format important data for business analysts. You never ask for more info—use only what is given to create helpful, markdown-formatted outputs.",
    llm=ChatOpenAI(model_name="gpt-4o", temperature=0),
    verbose=True
)

def run_dual_agent_rag(query: str, retrieved_context: str):
    if len(retrieved_context) > 10000:
        retrieved_context = retrieved_context[:10000]

    extract_task = Task(
        description=(
            "Extract all key parts from the context that are relevant to the query. Do NOT include generic or unrelated content. "
            "Avoid repeating the query. Be comprehensive but precise. Extract at least 3 concrete facts or excerpts. Do not ask for clarification."
        ),
        input=f"Query: {query}\n\nContext:\n{retrieved_context}",
        expected_output="Extracted text that directly answers the query, without extra commentary.",
        agent=retrieval_agent
    )

    format_task = Task(
        description=(
            "Take the extracted relevant information and format it into a structured, human-friendly output. "
            "Use markdown formatting (tables or lists) where applicable. Do not ask follow-up questions. Never say 'please provide'."
        ),
        expected_output=(
            "A clean, structured summary or table using the extracted content. No vague responses. "
            "If nothing is relevant, return: 'No relevant information found in the context.'"
        ),
        agent=formatter_agent,
        input_from=extract_task
    )

    crew = Crew(
        agents=[retrieval_agent, formatter_agent],
        tasks=[extract_task, format_task],
        verbose=True,
        process="sequential"
    )

    result = crew.kickoff()
    if not hasattr(result, "output") or not result.output.strip():
        return "⚠️ Retrieval agent returned no useful output."

    return result.output

def hybrid_score_sort(dense_results, sparse_results, boost=0.4):
    combined = {f"{r.id}_{r.source_tag}": {"dense": r, "score": 1.0} for r in dense_results}
    for r in sparse_results:
        key = f"{r.id}_{r.source_tag}"
        if key in combined:
            combined[key]["score"] += boost * r.score
        else:
            combined[key] = {"dense": r, "score": boost * r.score}
    return sorted([v["dense"] for v in combined.values()], key=lambda x: -v["score"])


def keyword_boost_query(query: str) -> str:
    tokens = [t.strip() for t in query.lower().split() if len(t.strip()) > 1]
    return " & ".join([f"{token}:*" for token in tokens])
