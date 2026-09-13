from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.video import Video
from app.schemas.video import (
    VideoMetadataRequest,
    VideoMetadataResponse,
    TranscriptRequest,
    TranscriptResponse,
    VideoProcessRequest,
    VideoProcessResponse,
    VideoDetailResponse,
    ConceptResponse,
    ChapterResponse
)
from app.services.youtube_service import YouTubeService
from app.services.transcript_service import TranscriptService
from app.services.processing_service import ProcessingService
from app.utils.timestamp import format_timestamp

router = APIRouter(prefix="/api/videos", tags=["Videos & Transcripts"])

@router.post("/metadata", response_model=VideoMetadataResponse)
async def get_video_metadata(req: VideoMetadataRequest):
    try:
        metadata = await YouTubeService.get_video_metadata(req.url)
        return metadata
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch video metadata: {str(e)}"
        )

@router.post("/transcript", response_model=TranscriptResponse)
async def get_video_transcript(req: TranscriptRequest):
    try:
        transcript = await TranscriptService.get_transcript(req.video_id)
        return transcript
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve video transcript: {str(e)}"
        )

from app.models.user import User
from app.services.auth_service import get_current_user_optional

@router.post("/process", response_model=VideoProcessResponse)
async def process_video(
    req: VideoProcessRequest,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional)
):
    try:
        user_id = user.id if user else None
        video = await ProcessingService.process_video_url(db, req.url, user_id=user_id)
        return VideoProcessResponse(
            video_id=video.id,
            youtube_id=video.youtube_id,
            title=video.title,
            status="ready"
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process video: {str(e)}"
        )

async def _ensure_video_processed(db: Session, video_id: str) -> Video:
    video = db.query(Video).filter((Video.id == video_id) | (Video.youtube_id == video_id)).first()
    if not video or not video.concepts or len(video.concepts) == 0 or not video.chapters or len(video.chapters) == 0:
        url = video.url if video else f"https://www.youtube.com/watch?v={video_id}"
        try:
            video = await ProcessingService.process_video_url(db, url)
        except Exception:
            pass
        if not video:
            video = db.query(Video).filter((Video.id == video_id) | (Video.youtube_id == video_id)).first()
    return video

@router.get("/{video_id}", response_model=VideoDetailResponse)
async def get_video_detail(video_id: str, db: Session = Depends(get_db)):
    video = await _ensure_video_processed(db, video_id)
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")

    takeaways = []
    if video.key_takeaways and isinstance(video.key_takeaways, dict):
        takeaways = video.key_takeaways.get("takeaways", [])

    return VideoDetailResponse(
        id=video.id,
        youtube_id=video.youtube_id,
        url=video.url,
        title=video.title,
        channel=video.channel,
        thumbnail_url=video.thumbnail_url,
        duration_seconds=video.duration_seconds,
        duration_formatted=format_timestamp(video.duration_seconds or 0),
        summary=video.summary,
        key_takeaways=takeaways
    )

@router.get("/{video_id}/concepts", response_model=List[ConceptResponse])
async def get_video_concepts(video_id: str, db: Session = Depends(get_db)):
    video = await _ensure_video_processed(db, video_id)
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")

    return [
        ConceptResponse(
            id=c.id,
            name=c.name,
            description=c.description,
            timestamp_seconds=c.timestamp_seconds or 0.0,
            timestamp_formatted=format_timestamp(c.timestamp_seconds or 0.0),
            difficulty=c.difficulty or "Medium"
        )
        for c in video.concepts
    ]

@router.get("/{video_id}/chapters", response_model=List[ChapterResponse])
async def get_video_chapters(video_id: str, db: Session = Depends(get_db)):
    video = await _ensure_video_processed(db, video_id)
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")

    return [
        ChapterResponse(
            id=ch.id,
            title=ch.title,
            summary=ch.summary,
            start_seconds=ch.start_seconds,
            end_seconds=ch.end_seconds,
            timestamp_formatted=format_timestamp(ch.start_seconds)
        )
        for ch in video.chapters
    ]
