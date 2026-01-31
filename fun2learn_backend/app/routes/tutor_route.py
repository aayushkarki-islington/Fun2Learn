from fastapi import APIRouter, Depends
from app.utils.db_utils import get_db
from app.auth.dependencies import require_role
from sqlalchemy.orm import Session
from app.models.models import TokenUser
from app.models.request_models import CourseCreateRequest
import logging

_SHOW_NAME = "course"
router = APIRouter(
    prefix=f"/{_SHOW_NAME}",
    tags=[_SHOW_NAME],
    responses={404: {"description": "Not found"}},
)

logger = logging.getLogger(__name__)

@router.post("/create_lesson")
async def create_course(
    request: CourseCreateRequest,
    current_user: TokenUser = Depends(require_role("tutor")),
    db: Session = Depends(get_db)
):
    """
    Create a new lesson from a tutor account.
    """
    
