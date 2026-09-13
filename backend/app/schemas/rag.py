from pydantic import BaseModel, Field
from typing import List, Optional
from app.rag.vector_store import SearchResultChunk

class VectorSearchRequest(BaseModel):
    video_id: str = Field(..., description="Target Video ID")
    query: str = Field(..., description="User question or query string")
    top_k: Optional[int] = Field(5, description="Number of relevant chunks to retrieve")

class VectorSearchResponse(BaseModel):
    video_id: str
    query: str
    results_count: int
    results: List[SearchResultChunk]
