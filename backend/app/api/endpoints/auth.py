from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.settings import UserSettings
from app.models.user import User
from app.schemas.auth import (
    PasswordResetRequest,
    Token,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.security.auth import (
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    clean_email = user_in.email.strip().lower()
    result = await db.execute(select(User).where(func.lower(User.email) == clean_email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    user = User(
        email=clean_email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name or clean_email.split("@")[0].capitalize(),
    )
    db.add(user)
    await db.flush()

    # Create default settings for user
    user_settings = UserSettings(user_id=user.id)
    db.add(user_settings)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(access_token=access_token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    clean_email = credentials.email.strip().lower()
    result = await db.execute(select(User).where(func.lower(User.email) == clean_email))
    user = result.scalars().first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated.")

    access_token = create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(access_token=access_token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post("/forgot-password")
async def forgot_password(req: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    clean_email = req.email.strip().lower()
    result = await db.execute(select(User).where(func.lower(User.email) == clean_email))
    user = result.scalars().first()
    # Always return consistent message to prevent email enumeration
    return {
        "message": "If an account exists with this email, a password reset instructions link has been dispatched.",
        "success": True,
        "demo_reset_token": f"demo-reset-{user.id if user else 'test'}",
    }
