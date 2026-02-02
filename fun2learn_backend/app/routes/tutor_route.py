from fastapi import APIRouter, Depends, HTTPException, status
from app.utils.db_utils import get_db
from app.auth.dependencies import require_role
from sqlalchemy.orm import Session
from app.models.models import TokenUser
from app.models.request_models import CourseCreateRequest, AddUnitRequest, AddChapterRequest, AddLessonRequest, AddMCQQuestionRequest, AddTextQuestionRequest
from app.models.response_models import CourseCreationResponse, AddUnitResponse, AddChapterResponse, AddLessonResponse, AddMCQQuestionResponse, AddTextQuestionResponse
import logging
from sqlalchemy import select, func, desc
from app.models.db_models import Course, Unit, Chapter, Lesson, Question, MCQOption, TextAnswer
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
        unit = db.execute(unit_index_stmt).scalars().one_or_none()
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

@router.post("/add_chapter")
async def add_chapter(
    request: AddChapterRequest,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Add a new chapter to an existing unit.
    """
    try:
        unit_id = request.unit_id

        # Query to get course details
        unit_stmt = select(Unit).where(Unit.id == unit_id)
        unit = db.execute(unit_stmt).scalar_one_or_none()

        # Raise exceptions if course not found or not owned by current user
        if unit is None:
            raise NotFoundException("Course")
        if unit.course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        # Query to check chapters with the same name within the unit
        existing_chapter_stmt = select(func.count()).select_from(Chapter).where(Chapter.unit_id == unit_id, Chapter.name.ilike(request.name))
        existing_chapter = db.execute(existing_chapter_stmt).scalar_one()

        # If chapter exists with same name within the unit, raise exception
        if existing_chapter > 0:
            raise ExistingResourceException(detail="Chapter with same name already exists within the unit")

        # Query to get last chapter_index for the chapter
        chapter_index_stmt = select(Chapter).where(Chapter.unit_id == unit_id).order_by(Chapter.chapter_index.desc()).limit(1)
        latest_chapter = db.execute(chapter_index_stmt).scalars().one_or_none()

        if latest_chapter is None:
            latest_chapter_index = 1
        else:
            latest_chapter_index = latest_chapter.chapter_index + 1
        
        chapter_id = str(uuid.uuid4())

        new_chapter = Chapter(
            id = chapter_id,
            name = request.name,
            chapter_index = latest_chapter_index,
            unit_id = unit_id
        )

        db.add(new_chapter)
        db.commit()
        db.refresh(new_chapter)

        return AddChapterResponse(
            status="success",
            message="Chapter added successfully",
            chapter_id=chapter_id,
            chapter_index=latest_chapter_index
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while adding unit: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")

@router.post("/add_lesson")
async def add_lesson(
    request: AddLessonRequest,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Add a new lesson to an existing chapter.
    """
    try:
        chapter_id = request.chapter_id

        # Query to get course details through chapter -> unit -> course relationship
        course_stmt = select(Chapter).where(Chapter.id == chapter_id)
        chapter = db.execute(course_stmt).scalar_one_or_none()

        # Raise exceptions if chapter not found or not owned by current user
        if chapter is None:
            raise NotFoundException("Chapter")
        if chapter.unit.course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        # Query to check lessons with the same name within the chapter
        existing_lesson_stmt = select(func.count()).select_from(Lesson).where(Lesson.chapter_id == chapter_id, Lesson.name.ilike(request.name))
        existing_lesson = db.execute(existing_lesson_stmt).scalar_one()

        # If lesson exists with same name within the chapter, raise exception
        if existing_lesson > 0:
            raise ExistingResourceException(detail="Lesson with same name already exists within the chapter")

        # Query to get last lesson_index for the chapter
        lesson_index_stmt = select(Lesson).where(Lesson.chapter_id == chapter_id).order_by(Lesson.lesson_index.desc()).limit(1)
        latest_lesson = db.execute(lesson_index_stmt).scalars().one_or_none()

        if latest_lesson is None:
            latest_lesson_index = 1
        else:
            latest_lesson_index = latest_lesson.lesson_index + 1

        lesson_id = str(uuid.uuid4())

        new_lesson = Lesson(
            id = lesson_id,
            name = request.name,
            lesson_index = latest_lesson_index,
            chapter_id = chapter_id
        )

        db.add(new_lesson)
        db.commit()
        db.refresh(new_lesson)

        return AddLessonResponse(
            status="success",
            message="Lesson added successfully",
            lesson_id=lesson_id,
            lesson_index=latest_lesson_index
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while adding lesson: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")

@router.post("/add_mcq_question")
async def add_mcq_question(
    request: AddMCQQuestionRequest,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Add a new MCQ question to an existing lesson.
    """
    try:
        lesson_id = request.lesson_id

        # Query to get lesson details through lesson -> chapter -> unit -> course relationship
        lesson_stmt = select(Lesson).where(Lesson.id == lesson_id)
        lesson = db.execute(lesson_stmt).scalar_one_or_none()

        # Raise exceptions if lesson not found or not owned by current user
        if lesson is None:
            raise NotFoundException("Lesson")
        if lesson.chapter.unit.course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        # Validate that at least one option is correct
        correct_options = [opt for opt in request.options if opt.is_correct]
        if len(correct_options) == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one option must be marked as correct")

        # Create question
        question_id = str(uuid.uuid4())

        new_question = Question(
            id = question_id,
            question_text = request.question_text,
            question_type = "mcq",
            lesson_id = lesson_id
        )

        db.add(new_question)

        # Create MCQ options
        for option in request.options:
            option_id = str(uuid.uuid4())
            new_option = MCQOption(
                id = option_id,
                option_text = option.option_text,
                is_correct = option.is_correct,
                question_id = question_id
            )
            db.add(new_option)

        db.commit()
        db.refresh(new_question)

        return AddMCQQuestionResponse(
            status="success",
            message="MCQ question added successfully",
            question_id=question_id
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while adding MCQ question: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")

@router.post("/add_text_question")
async def add_text_question(
    request: AddTextQuestionRequest,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Add a new text question to an existing lesson.
    """
    try:
        lesson_id = request.lesson_id

        # Query to get lesson details through lesson -> chapter -> unit -> course relationship
        lesson_stmt = select(Lesson).where(Lesson.id == lesson_id)
        lesson = db.execute(lesson_stmt).scalar_one_or_none()

        # Raise exceptions if lesson not found or not owned by current user
        if lesson is None:
            raise NotFoundException("Lesson")
        if lesson.chapter.unit.course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        # Create question
        question_id = str(uuid.uuid4())

        new_question = Question(
            id = question_id,
            question_text = request.question_text,
            question_type = "text",
            lesson_id = lesson_id
        )

        db.add(new_question)

        # Create text answer
        answer_id = str(uuid.uuid4())
        new_answer = TextAnswer(
            id = answer_id,
            correct_answer = request.correct_answer,
            casing_matters = request.casing_matters,
            question_id = question_id
        )
        db.add(new_answer)

        db.commit()
        db.refresh(new_question)

        return AddTextQuestionResponse(
            status="success",
            message="Text question added successfully",
            question_id=question_id
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while adding text question: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")
