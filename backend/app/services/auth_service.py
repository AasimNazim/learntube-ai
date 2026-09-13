import hashlib
import uuid
from datetime import datetime
from typing import Optional
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import SignUpRequest, LoginRequest, UserProfileResponse, AuthTokenResponse

class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        """Simple deterministic hash for hackathon auth."""
        return hashlib.sha256(password.encode("utf-8")).hexdigest()

    @classmethod
    def register_user(cls, db: Session, req: SignUpRequest) -> AuthTokenResponse:
        existing = db.query(User).filter(User.email == req.email.strip().lower()).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )

        user = User(
            email=req.email.strip().lower(),
            full_name=req.full_name or req.email.split("@")[0]
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        user_profile = UserProfileResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            created_at=user.created_at.isoformat()
        )

        return AuthTokenResponse(
            access_token=f"demo-token-{user.id}",
            token_type="bearer",
            user=user_profile
        )

    @classmethod
    def authenticate_user(cls, db: Session, req: LoginRequest) -> AuthTokenResponse:
        user = db.query(User).filter(User.email == req.email.strip().lower()).first()
        if not user:
            # Auto-create for seamless demo flow if logging in for first time
            user = User(
                email=req.email.strip().lower(),
                full_name=req.email.split("@")[0].capitalize()
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        user_profile = UserProfileResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            created_at=user.created_at.isoformat()
        )

        return AuthTokenResponse(
            access_token=f"demo-token-{user.id}",
            token_type="bearer",
            user=user_profile
        )

def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Extracts user from Authorization header if present."""
    try:
        if authorization and authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "").strip()
            if token.startswith("demo-token-"):
                user_id = token.replace("demo-token-", "")
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    return user
        return None
    except Exception:
        return None
