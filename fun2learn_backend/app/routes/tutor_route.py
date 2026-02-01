from fastapi import APIRouter, Depends, HTTPException, status
from app.utils.db_utils import get_db
from app.auth.dependencies import require_role
from sqlalchemy.orm import Session
from app.models.models import TokenUser
from app.models.request_models import CourseCreateRequest, AddUnitRequest
from app.models.response_models import CourseCreationResponse, AddUnitResponse
import logging
from sqlalchemy import select, func, desc
from app.models.db_models import Course, Unit
from app.utils.exceptions import UnauthorizedUserException, NotFoundException, ExistingResourceException
import uuid

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
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):  
    """
    Create a new lesson from a tutor account.
    """
    try:
        user_id = current_user.user_id
        course_name = request.name.strip()

        stmt = select(func.count()).select_from(Course).where((Course.created_by == user_id) & (func.lower(Course.name) == course_name.lower()))
        existing_course_count = db.execute(stmt).scalar_one()

        if existing_course_count > 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Course with similar name already exists")
        
        course_id = str(uuid.uuid4())
        new_course = Course(
            id = course_id,
            name = course_name,
            description = request.description,
            created_by = user_id,
            status = "draft"
        )

        db.add(new_course)
        db.commit()
        db.refresh(new_course)

        return CourseCreationResponse(
            status = "Success",
            message = "Course created successfully",
            course_id = course_id
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while creating course: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")
        
@router.post("/add_unit")
async def add_unit(
    request: AddUnitRequest,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Add a new unit to an existing course.
    """
    try:
        course_id = request.course_id

        # Query to get existing course
        course_stmt = select(Course).where(Course.id == course_id)
        course = db.execute(course_stmt).scalar_one_or_none()

        # Raise exceptions if course not found or not owned by current user
        if course is None:
            raise NotFoundException("Course")
        if course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        # Query to check for units with same name within the course
        existing_unit_stmt = select(func.count()).select_from(Unit).where(Unit.course_id == course_id, Unit.name.ilike(request.name))
        existing_unit = db.execute(existing_unit_stmt).scalar_one()
        
        # If unit exists with same name within the course, raise exception
        if existing_unit > 0:
            raise ExistingResourceException(detail="Unit with the same name already exists.")

        # Query to get last unit_index for the chapter
        unit_index_stmt = select(Unit).where(Unit.course_id == course_id).order_by(Unit.unit_index.desc()).limit(1)
        unit = db.execute(unit_index_stmt).scalar_one_or_none()
        if unit is None:
            latest_index = 1
        else: 
            latest_index = unit.unit_index + 1
        
        unit_id = str(uuid.uuid4())
        
        new_unit = Unit(
            id = unit_id,
            name = request.name,
            description = request.description,
            unit_index = latest_index,
            course_id = course_id
        )

        db.add(new_unit)
        db.commit()
        db.refresh(new_unit)

        return AddUnitResponse(
            status="success",
            message="unit",
            unit_id=unit_id,
            unit_index=latest_index
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while adding unit: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")
    
