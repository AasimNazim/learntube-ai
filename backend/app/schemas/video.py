from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class VideoMetadataRequest(BaseModel):
    url: str = Field(..., description="YouTube video or playlist URL")

class VideoMetadataResponse(BaseModel):
    youtube_id: str
    url: str
    title: str
    channel: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration_seconds: Optional[float] = None

class TranscriptSegment(BaseModel):
    text: str
    start_seconds: float
    duration_seconds: float

class TranscriptRequest(BaseModel):
    video_id: str = Field(..., description="YouTube Video ID")

class TranscriptResponse(BaseModel):
    video_id: str
    language: str
    total_segments: int
    segments: List[TranscriptSegment]
    full_text: str

class VideoProcessRequest(BaseModel):
    url: str = Field(..., description="YouTube Video URL")

class VideoProcessResponse(BaseModel):
    video_id: str
    youtube_id: str
    title: str
    status: str

class ConceptResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    timestamp_seconds: float
    timestamp_formatted: str
    difficulty: str

class ChapterResponse(BaseModel):
    id: str
    title: str
    summary: Optional[str] = None
    start_seconds: float
    end_seconds: Optional[float] = None
    timestamp_formatted: str

class VideoDetailResponse(BaseModel):
    id: str
    youtube_id: str
    url: str
    title: str
    channel: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration_seconds: Optional[float] = None
    duration_formatted: Optional[str] = None
    summary: Optional[str] = None
    key_takeaways: List[str] = []
