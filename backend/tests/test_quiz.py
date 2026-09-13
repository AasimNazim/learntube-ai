import app.models  # MANDATORY: Register all ORM models on Base.metadata first
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from app.database import Base, get_db
from app.main import app
from app.models import Video, Concept
from app.services.teachme_service import TeachMeService
from app.services.quiz_service import QuizService

TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="module")
def quiz_db():
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    try:
        # Create test video entity
        video = Video(
            youtube_id="quiz_test_video",
            url="https://www.youtube.com/watch?v=quiz_test_video",
            title="Quiz Test Video"
        )
        session.add(video)
        session.commit()
        session.refresh(video)

        concept = Concept(video_id=video.id, name="Recursion", description="Function calling itself", timestamp_seconds=9.42)
        session.add(concept)
        session.commit()

        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

def test_teachme_service_lesson_generation(quiz_db):
    video = quiz_db.query(Video).filter_by(youtube_id="quiz_test_video").first()
    lesson = TeachMeService.generate_lesson(quiz_db, video.id, "Recursion")
    assert lesson.concept == "Recursion"
    assert len(lesson.steps) == 3
    assert lesson.quick_check is not None
    assert len(lesson.quick_check.options) == 4

def test_quiz_service_generation_grading_and_gaps(quiz_db):
    video = quiz_db.query(Video).filter_by(youtube_id="quiz_test_video").first()
    
    # Generate quiz
    quiz = QuizService.get_or_create_quiz(quiz_db, video.id)
    assert quiz.id is not None
    assert len(quiz.questions) == 5

    # Submit quiz answers (mixing correct and incorrect answers)
    user_answers = [q.correct_option_index for q in quiz.questions]
    # Intentionally fail the second question to trigger learning gap
    user_answers[1] = (user_answers[1] + 1) % 4

    res = QuizService.evaluate_quiz_submission(quiz_db, video.id, quiz.id, user_answers)
    assert res.total_questions == 5
    assert res.correct_count == 4
    assert res.score_percent == 80.0
    assert len(res.results_breakdown) == 5
    assert len(res.weak_concepts) >= 1

def test_quiz_api_routes(quiz_db):
    def override_get_db():
        try:
            yield quiz_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    video = quiz_db.query(Video).filter_by(youtube_id="quiz_test_video").first()

    # Teach Me route
    res_tm = client.post(f"/api/videos/{video.id}/teach-me", json={"concept": "Recursion"})
    assert res_tm.status_code == 200
    assert "steps" in res_tm.json()

    # Get Quiz route
    res_q = client.get(f"/api/videos/{video.id}/quiz")
    assert res_q.status_code == 200
    quiz_data = res_q.json()
    quiz_id = quiz_data["id"]
    assert len(quiz_data["questions"]) > 0

    # Submit Quiz route
    answers = [q.get("correct_option_index", 0) for q in quiz_data["questions"]]
    res_sub = client.post(f"/api/videos/{video.id}/quiz/submit", json={"quiz_id": quiz_id, "answers": answers})
    assert res_sub.status_code == 200, res_sub.text
    assert res_sub.json()["score_percent"] == 100.0

    # Adaptive Quiz route
    res_adapt = client.post(f"/api/videos/{video.id}/quiz/adaptive", json={"concept_name": "Base Case"})
    assert res_adapt.status_code == 200
    assert len(res_adapt.json()) == 3

    app.dependency_overrides.clear()
