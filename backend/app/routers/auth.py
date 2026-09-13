from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import SignUpRequest, LoginRequest, AuthTokenResponse, UserProfileResponse
from app.services.auth_service import AuthService, get_current_user_optional

router = APIRouter(prefix="/api/auth", tags=["User Authentication"])

@router.post("/signup", response_model=AuthTokenResponse)
def signup(req: SignUpRequest, db: Session = Depends(get_db)):
    return AuthService.register_user(db, req)

@router.post("/login", response_model=AuthTokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    return AuthService.authenticate_user(db, req)

@router.get("/me", response_model=UserProfileResponse)
def get_me(user: User = Depends(get_current_user_optional)):
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return UserProfileResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        created_at=user.created_at.isoformat()
    )
