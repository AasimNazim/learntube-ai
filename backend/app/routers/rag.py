from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.rag import VectorSearchRequest, VectorSearchResponse
from app.rag.vector_store import RAGVectorStore

router = APIRouter(prefix="/api/rag", tags=["RAG & Vector Store"])

@router.post("/search", response_model=VectorSearchResponse)
def vector_search(req: VectorSearchRequest, db: Session = Depends(get_db)):
    try:
        results = RAGVectorStore.similarity_search(
            db=db,
            video_id=req.video_id,
            query=req.query,
            top_k=req.top_k or 5
        )
        return VectorSearchResponse(
            video_id=req.video_id,
            query=req.query,
            results_count=len(results),
            results=results
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Vector search failed: {str(e)}"
        )
