import app.models
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from app.database import Base, get_db
from app.main import app
from app.models import Video, User
from app.services.progress_service import ProgressService

TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="module")
def progress_db():
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    try:
        user = User(email="learner@example.com", full_name="Learner")
        session.add(user)
        session.commit()

        video = Video(
            youtube_id="prog_video_123",
            url="https://www.youtube.com/watch?v=prog_video_123",
            title="Python Progress Video",
            user_id=user.id
        )
        session.add(video)
        session.commit()

        from app.models import Concept, LearningGap
        concept = Concept(video_id=video.id, name="Variables & Data Types", description="Basic syntax", timestamp_seconds=12.0)
        session.add(concept)

        gap = LearningGap(video_id=video.id, user_id=user.id, concept_name="Variables & Data Types", missed_count=1, severity="medium")
        session.add(gap)
        session.commit()

        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

def test_progress_dashboard_and_update(progress_db):
    user = progress_db.query(User).filter_by(email="learner@example.com").first()
    video = progress_db.query(Video).filter_by(youtube_id="prog_video_123").first()

    # Update progress
    res_up = ProgressService.update_video_progress(progress_db, video.id, 75.0, user)
    assert res_up.completion_percent == 75.0

    # Get Dashboard
    dash = ProgressService.get_dashboard_data(progress_db, user)
    assert len(dash.stats) == 4
    assert len(dash.courses) > 0
    assert len(dash.strengths) > 0
    assert len(dash.gaps) > 0
    assert len(dash.reviews) > 0

def test_progress_api_routes(progress_db):
    def override_get_db():
        try:
            yield progress_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    video = progress_db.query(Video).filter_by(youtube_id="prog_video_123").first()

    # Learning dashboard endpoint
    res_dash = client.get("/api/user/learning")
    assert res_dash.status_code == 200
    dash_data = res_dash.json()
    assert "stats" in dash_data
    assert "courses" in dash_data

    # Update progress endpoint
    res_up = client.post("/api/user/progress", json={"video_id": video.id, "completion_percent": 85.0})
    assert res_up.status_code == 200
    assert res_up.json()["completion_percent"] == 85.0

    app.dependency_overrides.clear()
