from pydantic import BaseModel, Field
from typing import List, Optional
from app.rag.vector_store import SearchResultChunk

class AskQuestionRequest(BaseModel):
    question: str = Field(..., description="User question about the video")

class AskQuestionResponse(BaseModel):
    answer: str
    source_timestamp: Optional[str] = None
    confidence: float
    grounded: bool
    sources: List[SearchResultChunk]

class SegmentTutorRequest(BaseModel):
    start_seconds: float = Field(..., description="Segment start timestamp in seconds")
    end_seconds: float = Field(..., description="Segment end timestamp in seconds")

class SegmentTutorResponse(BaseModel):
    video_id: str
    start_seconds: float
    end_seconds: float
    timestamp_range_formatted: str
    explanation: str
    key_concepts: List[str]
    takeaway: str

class TutorMessageSchema(BaseModel):
    id: str
    role: str
    content: str
    source_timestamp: Optional[str] = None
    created_at: str
