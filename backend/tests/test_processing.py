import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.database import Base, get_db
from app.main import app
from app.services.processing_service import ProcessingService

from sqlalchemy.pool import StaticPool

TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="module")
def process_db():
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

@pytest.mark.asyncio
async def test_processing_service_end_to_end(process_db):
    url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    video = await ProcessingService.process_video_url(process_db, url)

    assert video.id is not None
    assert video.youtube_id == "dQw4w9WgXcQ"
    assert video.summary is not None
    assert len(video.chapters) > 0
    assert len(video.concepts) > 0
    assert len(video.transcript_chunks) > 0

def test_processing_api_routes(process_db):
    def override_get_db():
        try:
            yield process_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    # Process video route
    res_proc = client.post("/api/videos/process", json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"})
    assert res_proc.status_code == 200
    proc_data = res_proc.json()
    video_id = proc_data["video_id"]
    assert proc_data["status"] == "ready"

    # Detail route
    res_detail = client.get(f"/api/videos/{video_id}")
    assert res_detail.status_code == 200
    detail_data = res_detail.json()
    assert detail_data["id"] == video_id
    assert detail_data["summary"] is not None
    assert len(detail_data["key_takeaways"]) > 0

    # Concepts route
    res_concepts = client.get(f"/api/videos/{video_id}/concepts")
    assert res_concepts.status_code == 200
    concepts_data = res_concepts.json()
    assert len(concepts_data) > 0
    assert "timestamp_formatted" in concepts_data[0]

    # Chapters route
    res_chapters = client.get(f"/api/videos/{video_id}/chapters")
    assert res_chapters.status_code == 200
    chapters_data = res_chapters.json()
    assert len(chapters_data) > 0
    assert "timestamp_formatted" in chapters_data[0]

    app.dependency_overrides.clear()
