from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.quiz import (
    TeachMeRequest,
    TeachMeResponse,
    QuizSchema,
    QuizSubmitRequest,
    QuizSubmitResponse,
    AdaptiveQuizRequest,
    QuizQuestionSchema
)
from app.services.teachme_service import TeachMeService
from app.services.quiz_service import QuizService

router = APIRouter(prefix="/api/videos", tags=["Teach Me & Adaptive Quiz System"])

@router.post("/{video_id}/teach-me", response_model=TeachMeResponse)
def teach_me(video_id: str, req: TeachMeRequest, db: Session = Depends(get_db)):
    try:
        return TeachMeService.generate_lesson(db=db, video_id=video_id, concept_name=req.concept)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Teach Me error: {str(e)}"
        )

@router.get("/{video_id}/quiz", response_model=QuizSchema)
def get_quiz(video_id: str, db: Session = Depends(get_db)):
    try:
        return QuizService.get_or_create_quiz(db=db, video_id=video_id)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quiz error: {str(e)}"
        )

from app.models.user import User
from app.services.auth_service import get_current_user_optional

@router.post("/{video_id}/quiz/submit", response_model=QuizSubmitResponse)
def submit_quiz(
    video_id: str,
    req: QuizSubmitRequest,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    try:
        user_id = user.id if user else None
        return QuizService.evaluate_quiz_submission(
            db=db,
            video_id=video_id,
            quiz_id=req.quiz_id,
            user_answers=req.answers,
            user_id=user_id
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quiz grading error: {str(e)}"
        )

@router.post("/{video_id}/quiz/adaptive", response_model=List[QuizQuestionSchema])
def adaptive_quiz(video_id: str, req: AdaptiveQuizRequest, db: Session = Depends(get_db)):
    try:
        return QuizService.generate_adaptive_practice(
            db=db,
            video_id=video_id,
            concept_name=req.concept_name
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Adaptive quiz error: {str(e)}"
        )
