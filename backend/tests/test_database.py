import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import (
    User, Video, Transcript, TranscriptChunk,
    Chapter, Concept, Quiz, QuizQuestion,
    QuizAttempt, TutorMessage, LearningGap, LearningProgress
)

TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="module")
def db_session():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

def test_user_creation_and_retrieval(db_session):
    user = User(email="test_phase2@learntube.ai", full_name="Test Student Phase 2")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.id is not None
    assert user.email == "test_phase2@learntube.ai"

    fetched = db_session.query(User).filter_by(email="test_phase2@learntube.ai").first()
    assert fetched is not None
    assert fetched.full_name == "Test Student Phase 2"

def test_video_and_entities_cascade(db_session):
    user = db_session.query(User).filter_by(email="test_phase2@learntube.ai").first()
    video = Video(
        youtube_id="dQw4w9WgXcQ",
        url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        title="Python Recursion Tutorial",
        channel="Tech with Tim",
        duration_seconds=2732.0,
        summary="A comprehensive guide to recursion.",
        key_takeaways={"takeaways": ["Base cases are vital", "Call stack unwinds"]},
        user_id=user.id
    )
    db_session.add(video)
    db_session.commit()
    db_session.refresh(video)

    assert video.id is not None
    assert video.title == "Python Recursion Tutorial"

    # Add Transcript and Chunk
    transcript = Transcript(video_id=video.id, full_text="Welcome to recursion tutorial.")
    chunk = TranscriptChunk(
        video_id=video.id,
        chunk_index=0,
        text="Welcome to recursion tutorial.",
        start_seconds=0.0,
        end_seconds=10.0,
        embedding=[0.1] * 768
    )
    db_session.add_all([transcript, chunk])

    # Add Chapter and Concept
    chapter = Chapter(video_id=video.id, title="Introduction", start_seconds=0.0, end_seconds=60.0)
    concept = Concept(video_id=video.id, name="Recursion", description="Function calling itself", timestamp_seconds=9.7, difficulty="Medium")
    db_session.add_all([chapter, concept])

    # Add Quiz and Question
    quiz = Quiz(video_id=video.id, title="Recursion Quiz")
    db_session.add(quiz)
    db_session.commit()
    db_session.refresh(quiz)

    question = QuizQuestion(
        quiz_id=quiz.id,
        concept_name="Recursion",
        prompt="What is recursion?",
        options=["Loop", "Function calling itself", "Variable", "Class"],
        correct_option_index=1,
        explanation="Recursion means a function calls itself.",
        source_timestamp="09:42"
    )
    db_session.add(question)

    # Add TutorMessage, LearningGap, LearningProgress
    tutor_msg = TutorMessage(video_id=video.id, user_id=user.id, role="tutor", content="Hello! How can I help?")
    gap = LearningGap(video_id=video.id, user_id=user.id, concept_name="Base Case", severity="high", missed_count=2)
    progress = LearningProgress(video_id=video.id, user_id=user.id, completion_percent=65.0)
    db_session.add_all([tutor_msg, gap, progress])

    db_session.commit()

    # Verify counts
    assert len(video.transcripts) == 1
    assert len(video.transcript_chunks) == 1
    assert len(video.chapters) == 1
    assert len(video.concepts) == 1
    assert len(video.quizzes) == 1
    assert len(video.quizzes[0].questions) == 1
    assert len(video.tutor_messages) == 1
    assert len(video.learning_gaps) == 1
    assert len(video.learning_progress) == 1
