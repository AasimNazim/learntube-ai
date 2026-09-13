from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
from app.routers import (
    health_router,
    videos_router,
    rag_router,
    tutor_router,
    quiz_router,
    auth_router,
    progress_router
)
import app.models  # Ensure models are registered

# Initialize database tables on app startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LearnTube AI Backend",
    description="Grounded AI Learning Agent API for YouTube Videos & Playlists",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list + ["http://localhost:8443", "http://127.0.0.1:8443"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(videos_router)
app.include_router(rag_router)
app.include_router(tutor_router)
app.include_router(quiz_router)
app.include_router(progress_router)

@app.get("/")
def root():
    return {
        "name": "LearnTube AI API",
        "status": "running",
        "docs": "/docs"
    }
