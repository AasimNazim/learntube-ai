from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from app.database import get_db, engine
from app.schemas.health import HealthResponse, DBHealthResponse

router = APIRouter(prefix="/api/health", tags=["Health"])

@router.get("", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="healthy",
        service="LearnTube AI Backend",
        version="1.0.0"
    )

@router.get("/db", response_model=DBHealthResponse)
def db_health_check(db: Session = Depends(get_db)):
    try:
        # Execute raw ping
        db.execute(text("SELECT 1"))
        
        # Inspect tables
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        # Check pgvector extension support if postgresql
        vector_support = False
        if engine.dialect.name == "postgresql":
            res = db.execute(text("SELECT count(*) FROM pg_extension WHERE extname = 'vector'")).scalar()
            vector_support = bool(res and res > 0)
        else:
            vector_support = True  # Emulated via FlexibleVector in non-PostgreSQL/SQLite fallback

        return DBHealthResponse(
            status="healthy",
            database=engine.dialect.name,
            vector_support=vector_support,
            tables_count=len(tables)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection error: {str(e)}"
        )
