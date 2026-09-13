import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from app.database import Base, get_db
from app.main import app
from app.models import Video
from app.rag.vector_store import RAGVectorStore

TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="module")
def rag_db():
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

def test_rag_vector_store_save_and_search(rag_db):
    video = Video(
        youtube_id="demo_rag_123",
        url="https://www.youtube.com/watch?v=demo_rag_123",
        title="RAG Test Video"
    )
    rag_db.add(video)
    rag_db.commit()

    chunks_data = [
        {"chunk_index": 0, "text": "Recursion calls itself to solve smaller problems.", "start_seconds": 0.0, "end_seconds": 15.0},
        {"chunk_index": 1, "text": "A base case stops infinite recursion and unwinds call stack.", "start_seconds": 15.5, "end_seconds": 30.0},
        {"chunk_index": 2, "text": "Memoization caches recursive results for fast performance.", "start_seconds": 30.5, "end_seconds": 45.0},
    ]

    saved_chunks = RAGVectorStore.save_transcript_chunks(rag_db, video.id, chunks_data)
    assert len(saved_chunks) == 3

    # Search for recursion
    results = RAGVectorStore.similarity_search(rag_db, video.id, query="What is recursion?", top_k=2)
    assert len(results) > 0
    assert results[0].start_seconds >= 0.0
    text_lower = results[0].text.lower()
    assert "recurs" in text_lower or "base case" in text_lower or "memoization" in text_lower

def test_rag_api_endpoint(rag_db):
    def override_get_db():
        try:
            yield rag_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    video = rag_db.query(Video).filter_by(youtube_id="demo_rag_123").first()
    client = TestClient(app)

    response = client.post(
        "/api/rag/search",
        json={"video_id": video.id, "query": "base case condition", "top_k": 2}
    )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["video_id"] == video.id
    assert data["results_count"] > 0
    assert len(data["results"]) <= 2
    assert "start_seconds" in data["results"][0]
