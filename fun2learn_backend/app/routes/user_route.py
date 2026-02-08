from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.models.models import TokenUser
from app.models.response_models import UserResponse
from app.models.db_models import User
from app.auth.dependencies import get_current_user
from app.utils.db_utils import get_db

_SHOW_NAME = "user"
router = APIRouter(
    prefix=f"/{_SHOW_NAME}",
    tags=[_SHOW_NAME],
    responses={404: {"description": "Not found"}},
)

logger = logging.getLogger(__name__)

@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: TokenUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the currently authenticated user's profile data.
    """
    logger.info(f"Fetching user data for user_id: {current_user.user_id}")

    user = db.query(User).filter(User.user_id == current_user.user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserResponse(
        user_id=user.user_id,
        full_name=user.full_name,
        email=user.email,
        birthdate=str(user.birthdate) if user.birthdate else None,
        role=user.role,
        gender=user.gender,
        image_path=user.image_path
    )
