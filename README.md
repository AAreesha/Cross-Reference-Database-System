# Cross-Reference-Database-System

**AI-Integrated Cross-Reference Database System**
Connect. Embed. Search.

---

## 📄 Overview

This project is an AI-accelerated cross-reference infrastructure that unifies four large datasets into a single searchable system.
It supports semantic search powered by OpenAI embeddings, ensuring fast, scalable, and intelligent retrieval.

Built using:

* **PostgreSQL** with **pgvector** extension (for vector storage and similarity search)
* **Redis** (for intelligent caching)
* **FastAPI** backend (Python)
* **React.js** frontend (JavaScript)
* **Docker Compose** (for full containerization)

The system enables:

* Cross-linking references between multiple databases
* AI-driven record embedding generation
* Fast semantic search using cosine similarity
* Intelligent query caching to boost performance
* Simple web UI for user-friendly access

---

## 🛠️ Step-by-Step Setup Guide

### ✅ STEP 1: Install Docker

#### 🔹 For Windows:

1. Visit [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
2. Download and install Docker Desktop.
3. Launch Docker Desktop and ensure it shows "Docker is running."
4. Confirm installation by running:

```bash
docker --version
```

Expected output:

```
Docker version XX.XX.X, build xxxxxxx
```

---

### ✅ STEP 2: Create `.env` File

Create a `.env` file at the project root with the following content. (.env.sample) template also present for your ease of use:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/unified_db
REDIS_URL=redis://redis:6379/0
REACT_APP_API_URL=http://localhost:8000
OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

This file securely stores config values used by Docker and FastAPI.

---

### ✅ STEP 3: Docker Setup for PostgreSQL + Redis

Docker Compose auto-pulls required containers:

#### 🐃 PostgreSQL with pgvector:

* Image: `ankane/pgvector`
* Initializes schema via `database/db-init.sql`
* Table: `unified_index`
* Extension: `pgvector`
* Index: cosine-based `ivfflat`

To manually pull:

```bash
docker pull ankane/pgvector
```

#### 🔄 Redis:

* Image: `redis:alpine`
* Default port: `6379`

To manually pull:

```bash
docker pull redis:alpine
```

---

### ✅ STEP 4: Run the Full Stack

From your terminal, run:

```bash
docker-compose up --build
```

Expected output includes:

* PostgreSQL initializing
* Redis starting
* FastAPI available at: `http://localhost:8000/docs`

To stop:

```bash
CTRL + C
```

Then:

```bash
docker-compose down
```

---

## 📂 Project Structure

```
project-root/
├── backend/
│   ├── Dockerfile              # Builds FastAPI container
│   └── app/
│       ├── main.py             # Entry point, includes route setup
│       ├── db.py               # PostgreSQL connection via SQLAlchemy
│       ├── models.py           # ORM definition of unified_index
│       ├── routes.py           # API endpoints
│       ├── utils.py            # OpenAI embedding generation
│       └── cache.py            # Redis caching utilities
│
├── database/
│   └── db-init.sql             # SQL to create table, extension, index
│
├── .env                        # Main env file
├── .env.sample                 # Sample env (exclude API keys)
├── docker-compose.yml          # Docker orchestration file
└── README.md                   # This documentation
```

---

## ✅ Backend Development Walkthrough (vs Client Requirements)

### 🗍️ Step 1: Database Initialization

* Created: `database/db-init.sql`
* Table: `unified_index`
* Columns: `id, db1_id, db2_id, db3_id, db4_id, embedding, created_at`
* Enabled: `pgvector`, cosine-based `ivfflat` index

### 🐘 Step 2: PostgreSQL Container

* Image: `ankane/pgvector`
* Port: `5432`
* Auto-runs `db-init.sql`

### ♻️ Step 3: Redis Container

* Image: `redis:alpine`
* Port: `6379`
* TTL: 3600 seconds for search cache

### ⚙️ Step 4: Backend App (FastAPI)

* Created: `backend/app/`
* Files: `main.py, db.py, models.py, routes.py, utils.py, cache.py`

### 📦 Step 5: PostgreSQL via SQLAlchemy

* File: `db.py`
* Reads: `DATABASE_URL` from `.env`

### 📏 Step 6: SQLAlchemy ORM

* File: `models.py`
* Model: `UnifiedIndex`
* Uses: `Vector(1536)` from `pgvector`

### ⚡ Step 7: Redis Caching Utility

* File: `cache.py`
* Functions: `get_cached_result()`, `set_cached_result()`
* TTL: 3600 seconds

### 🧐 Step 8: OpenAI Embedding

* File: `utils.py`
* Function: `generate_embedding(text)`
* API: `text-embedding-3-small`

### 🔗 Step 9: API Routes

* File: `routes.py`
* `/insert-record/`: generates + stores embedding
* `/semantic-search/`: searches via cosine similarity

  * Checks Redis first
  * If not cached, queries DB
  * Caches and returns top 5 results

### 🐫 Step 10: Dockerization

* File: `backend/Dockerfile`
* Exposes: `8000`
* Injects: `.env` config
* Added to: `docker-compose.yml`

---

## 📅 Final Test

Visit: `http://localhost:8000/docs`

* Try `/insert-record/`
* Try `/semantic-search/`
* Confirm:

  * Embeddings are generated via OpenAI
  * Caching logic via Redis
  * Fast vector similarity search via pgvector

---

## 📊 Client Delivery Checklist

| Requirement                  | Status | Notes                              |
| ---------------------------- | ------ | ---------------------------------- |
| pgvector + Postgres setup    | ✅ Done | Indexed, init script works         |
| Redis with TTL 3600s         | ✅ Done | Caching system integrated          |
| Insert/Search endpoints      | ✅ Done | Auto-generates embedding           |
| OpenAI embedding integration | ✅ Done | Uses text-embedding-3-small        |
| Dockerized backend           | ✅ Done | Clean build with .env support      |
| Modular Python code          | ✅ Done | All files organized in `/app/`     |
| .env.sample                  | ✅ Done | Provided (manual confirm contents) |
| Semantic cosine search       | ✅ Done | Top 5 matches using vector index   |

---

## 🔗 Useful Links

* OpenAI API Key: [https://platform.openai.com/account/api-keys](https://platform.openai.com/account/api-keys)
* Docker: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
* Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
