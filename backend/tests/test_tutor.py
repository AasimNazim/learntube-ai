import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.database import Base, get_db
from app.main import app
from app.models import Video, TranscriptChunk
from app.rag.pipeline import RAGPipeline
from app.services.tutor_service import TutorService

TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="module")
def tutor_db():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

from app.ai.embeddings import GeminiEmbeddingService

def test_rag_ask_video_and_tutor_history(tutor_db):
    video = Video(
        youtube_id="tutor_test_video",
        url="https://www.youtube.com/watch?v=tutor_test_video",
        title="Tutor Test Video"
    )
    tutor_db.add(video)
    tutor_db.commit()

    chunk_text = "Recursion is when a function calls itself to solve smaller subproblems."
    chunk1 = TranscriptChunk(
        video_id=video.id,
        chunk_index=0,
        text=chunk_text,
        start_seconds=9.42,
        end_seconds=25.0,
        embedding=GeminiEmbeddingService.generate_embedding(chunk_text)
    )
    tutor_db.add(chunk1)
    tutor_db.commit()

    # Ask relevant question
    res = RAGPipeline.ask_video(tutor_db, video.id, "Explain recursion in simple terms")
    assert res.answer != ""
    assert res.grounded is True
    assert res.source_timestamp is not None

    # Check tutor history
    history = TutorService.get_tutor_history(tutor_db, video.id)
    assert len(history) >= 2
    assert history[0].role == "user"
    assert history[1].role == "tutor"

def test_segment_tutor_service(tutor_db):
    video = tutor_db.query(Video).filter_by(youtube_id="tutor_test_video").first()
    res = TutorService.explain_segment(tutor_db, video.id, 0.0, 30.0)
    
    assert res.video_id == video.id
    assert res.explanation != ""
    assert len(res.key_concepts) > 0
    assert res.takeaway != ""

def test_tutor_api_endpoints(tutor_db):
    def override_get_db():
        try:
            yield tutor_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    video = tutor_db.query(Video).filter_by(youtube_id="tutor_test_video").first()

    # Ask endpoint
    res_ask = client.post(f"/api/videos/{video.id}/ask", json={"question": "What is recursion?"})
    assert res_ask.status_code == 200
    data_ask = res_ask.json()
    assert "answer" in data_ask
    assert data_ask["grounded"] is True

    # Segment tutor endpoint
    res_seg = client.post(
        f"/api/videos/{video.id}/segment-tutor",
        json={"start_seconds": 0.0, "end_seconds": 30.0}
    )
    assert res_seg.status_code == 200
    data_seg = res_seg.json()
    assert "explanation" in data_seg

    # History endpoint
    res_hist = client.get(f"/api/videos/{video.id}/tutor-messages")
    assert res_hist.status_code == 200
    data_hist = res_hist.json()
    assert len(data_hist) >= 4

    app.dependency_overrides.clear()
