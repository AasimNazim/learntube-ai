# LearnTube AI — Grounded AI Learning Agent Backend

LearnTube AI is an AI-powered learning agent that transforms educational YouTube videos and playlists into interactive, evidence-grounded learning experiences.

Unlike generic chatbots or video summarizers, LearnTube AI builds a semantic timestamped RAG pipeline over video transcripts using **Google Gemini 2.5 Flash**, **Gemini Embeddings (`gemini-embedding-001`)**, and **Supabase PostgreSQL (`pgvector`)**.

---

## 🏗 Architecture Overview

```text
YouTube Video / Playlist URL
       │
       ▼
YouTube Data API v3 / Free oEmbed ──► Metadata (Title, Channel, Thumbnail, Duration)
       │
       ▼
Supadata API ──► Timestamped Transcript Lines
       │
       ▼
Timestamp-Aware Chunking Engine ──► Semantic Paragraph Chunks (start_seconds, end_seconds)
       │
       ▼
Google GenAI SDK (gemini-embedding-001) ──► 768-dim Vector Embeddings
       │
       ▼
Supabase PostgreSQL (pgvector) ──► Vector Indexing & Cosine Distance Search (<=>)
       │
       ▼
Ask Video RAG / AI Tutor ──► Gemini 2.5 Flash ──► Grounded Answers + Timestamp Evidence
       │
       ▼
Teach Me / Adaptive Quizzes / Learning Gap Detection ──► Progress Tracking Dashboard
```

---

## 🚀 Fixed Technology Stack

* **Backend**: Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, httpx
* **Database**: Supabase PostgreSQL with `pgvector` extension
* **AI & Embeddings**: Official Google GenAI SDK (`google-genai`):
  * Reasoning & Generation: `gemini-2.5-flash`
  * Vector Embeddings: `gemini-embedding-001` (768 dimensions)
* **Metadata & Transcripts**: YouTube Data API v3 (with free oEmbed fallback), Supadata API

---

## 🔑 Environment Variables Setup

Create a `.env` file in the `backend/` directory:

```env
PORT=8000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres

# Supabase Auth & Project Keys
SUPABASE_URL=https://[REF].supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key
GENERATION_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=gemini-embedding-001
EMBEDDING_DIMENSION=768

# External Services
YOUTUBE_API_KEY=your-youtube-api-key
SUPADATA_API_KEY=your-supadata-api-key
```

---

## ⚡ Quick Start (Local Development)

### 1. Install Python Dependencies
```bash
cd backend
python -m pip install -r requirements.txt
```

### 2. Run Database Migrations
```bash
alembic upgrade head
```

### 3. Start Development Server
```bash
python -m uvicorn app.main:app --reload --port 8000
```
* API Documentation: `http://localhost:8000/docs`
* Health Check: `http://localhost:8000/api/health`

---

## 🧪 Automated Testing Suite

Execute the complete test suite covering unit tests, database ORM, RAG vector retrieval, and FastAPI routes:

```bash
python -m pytest -v
```

---

## 📌 API Endpoints Overview

| Group | Endpoint | Method | Purpose |
| :--- | :--- | :--- | :--- |
| **Health** | `/api/health` | `GET` | Service & DB status check |
| **Auth** | `/api/auth/signup` | `POST` | User registration |
| **Auth** | `/api/auth/login` | `POST` | User login & token issuance |
| **Auth** | `/api/auth/me` | `GET` | Authenticated user profile |
| **Videos** | `/api/videos/process` | `POST` | End-to-end processing pipeline |
| **Videos** | `/api/videos/{video_id}` | `GET` | Summary & key takeaways |
| **Videos** | `/api/videos/{video_id}/concepts` | `GET` | Key concepts with timestamps & difficulty |
| **Videos** | `/api/videos/{video_id}/chapters` | `GET` | Chapter timeline with timestamps |
| **RAG** | `/api/rag/search` | `POST` | Vector similarity search in transcript chunks |
| **Tutor** | `/api/videos/{video_id}/ask` | `POST` | Grounded Q&A with timestamp evidence |
| **Tutor** | `/api/videos/{video_id}/segment-tutor` | `POST` | Timestamp range explanation |
| **Tutor** | `/api/videos/{video_id}/tutor-messages`| `GET` | Past tutor conversation history |
| **Quiz** | `/api/videos/{video_id}/teach-me` | `POST` | Progressive 3-step teaching session |
| **Quiz** | `/api/videos/{video_id}/quiz` | `GET` | Generate/retrieve video quiz |
| **Quiz** | `/api/videos/{video_id}/quiz/submit` | `POST` | Grade quiz, update gaps & recommendations |
| **Quiz** | `/api/videos/{video_id}/quiz/adaptive` | `POST` | Targeted practice on weak concepts |
| **Dashboard**| `/api/user/learning` | `GET` | Complete learning progress dashboard |
| **Dashboard**| `/api/user/progress` | `POST` | Update video completion percentage |

---

## 📊 Implementation Status Summary

* ✅ **Phase 0**: Architecture Inspection, DB Schema Design & Planning
* ✅ **Phase 1**: Backend Foundation, Database Schemas & Health Endpoints
* ✅ **Phase 2**: YouTube Metadata & Supadata Timestamped Transcript Integration
* ✅ **Phase 3**: Timestamped Chunking, Gemini Embeddings & RAG Vector Engine
* ✅ **Phase 4**: Automated Content Extraction (Summary, Concepts, Chapters via Gemini 2.5 Flash)
* ✅ **Phase 5**: Ask the Video & AI Segment Tutor (Grounded Q&A + Timestamp Evidence)
* ✅ **Phase 6**: Teach Me Mode & Adaptive Quiz System (Gap Detection & Practice Generation)
* ✅ **Phase 7**: User Auth, Progress Tracking & Learning Dashboard APIs
* ✅ **Phase 8**: Frontend API Integration & Full End-to-End System Testing
