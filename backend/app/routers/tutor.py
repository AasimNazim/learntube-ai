from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.tutor import (
    AskQuestionRequest,
    AskQuestionResponse,
    SegmentTutorRequest,
    SegmentTutorResponse,
    TutorMessageSchema
)
from app.rag.pipeline import RAGPipeline
from app.services.tutor_service import TutorService

router = APIRouter(prefix="/api/videos", tags=["AI Tutor & Grounded Q&A"])

@router.post("/{video_id}/ask", response_model=AskQuestionResponse)
def ask_video(video_id: str, req: AskQuestionRequest, db: Session = Depends(get_db)):
    try:
        res = RAGPipeline.ask_video(db=db, video_id=video_id, question=req.question)
        return res
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Tutor error: {str(e)}"
        )

@router.post("/{video_id}/segment-tutor", response_model=SegmentTutorResponse)
def segment_tutor(video_id: str, req: SegmentTutorRequest, db: Session = Depends(get_db)):
    try:
        res = TutorService.explain_segment(
            db=db,
            video_id=video_id,
            start_seconds=req.start_seconds,
            end_seconds=req.end_seconds
        )
        return res
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Segment tutor error: {str(e)}"
        )

@router.get("/{video_id}/tutor-messages", response_model=List[TutorMessageSchema])
def get_tutor_messages(video_id: str, db: Session = Depends(get_db)):
    return TutorService.get_tutor_history(db=db, video_id=video_id)
