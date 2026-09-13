from app.routers.health import router as health_router
from app.routers.videos import router as videos_router
from app.routers.rag import router as rag_router
from app.routers.tutor import router as tutor_router
from app.routers.quiz import router as quiz_router
from app.routers.auth import router as auth_router
from app.routers.progress import router as progress_router

__all__ = [
    "health_router",
    "videos_router",
    "rag_router",
    "tutor_router",
    "quiz_router",
    "auth_router",
    "progress_router"
]
