from pydantic import BaseModel, Field
from typing import List, Optional

class StatCardSchema(BaseModel):
    label: str
    value: str
    icon: str
    color: str

class CourseItemSchema(BaseModel):
    video_id: str
    title: str
    topic: str
    progress: float
    last_studied: str
    chapters_completed: int
    total_chapters: int
    color: str

class StrengthItemSchema(BaseModel):
    concept: str
    score: float

class GapItemSchema(BaseModel):
    concept: str
    score: float
    video_title: str
    timestamp_formatted: str

class ReviewItemSchema(BaseModel):
    video_id: Optional[str] = None
    concept: str
    video_title: str
    timestamp_formatted: str
    reason: str

class DashboardResponse(BaseModel):
    stats: List[StatCardSchema]
    courses: List[CourseItemSchema]
    strengths: List[StrengthItemSchema]
    gaps: List[GapItemSchema]
    reviews: List[ReviewItemSchema]

class UpdateProgressRequest(BaseModel):
    video_id: str
    completion_percent: float = Field(..., ge=0.0, le=100.0)

class UpdateProgressResponse(BaseModel):
    video_id: str
    completion_percent: float
    status: str
