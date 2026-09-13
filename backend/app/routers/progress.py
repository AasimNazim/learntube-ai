from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.progress import DashboardResponse, UpdateProgressRequest, UpdateProgressResponse
from app.services.auth_service import get_current_user_optional
from app.services.progress_service import ProgressService

router = APIRouter(prefix="/api/user", tags=["User Progress & Learning Dashboard"])

@router.get("/learning", response_model=DashboardResponse)
def get_learning_dashboard(
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    return ProgressService.get_dashboard_data(db=db, user=user)

@router.post("/progress", response_model=UpdateProgressResponse)
def update_progress(
    req: UpdateProgressRequest,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    return ProgressService.update_video_progress(
        db=db,
        video_id=req.video_id,
        completion_percent=req.completion_percent,
        user=user
    )
