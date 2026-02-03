from fastapi import APIRouter, Depends, HTTPException, status
from app.utils.db_utils import get_db
from app.auth.dependencies import require_role
from sqlalchemy.orm import Session
from app.models.models import TokenUser
from app.models.request_models import (
    CourseCreateRequest, AddUnitRequest, AddChapterRequest, AddLessonRequest,
    AddMCQQuestionRequest, AddTextQuestionRequest,
    EditCourseRequest, DeleteCourseRequest,
    EditUnitRequest, DeleteUnitRequest,
    EditChapterRequest, DeleteChapterRequest,
    EditLessonRequest, DeleteLessonRequest,
    EditMCQQuestionRequest, EditTextQuestionRequest, DeleteQuestionRequest
)
from app.models.response_models import (
    CourseCreationResponse, AddUnitResponse, AddChapterResponse, AddLessonResponse,
    AddMCQQuestionResponse, AddTextQuestionResponse,
    EditCourseResponse, DeleteCourseResponse,
    EditUnitResponse, DeleteUnitResponse,
    EditChapterResponse, DeleteChapterResponse,
    EditLessonResponse, DeleteLessonResponse,
    EditMCQQuestionResponse, EditTextQuestionResponse, DeleteQuestionResponse
)
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

@router.put("/edit_course")
async def edit_course(
    request: EditCourseRequest,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Edit an existing course.
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

        # Check for duplicate name (excluding current course)
        course_name = request.name.strip()
        duplicate_stmt = select(func.count()).select_from(Course).where(
            (Course.created_by == current_user.user_id) &
            (func.lower(Course.name) == course_name.lower()) &
            (Course.id != course_id)
        )
        duplicate_count = db.execute(duplicate_stmt).scalar_one()

        if duplicate_count > 0:
            raise ExistingResourceException(detail="Course with similar name already exists")

        # Update course
        course.name = course_name
        course.description = request.description

        db.commit()
        db.refresh(course)

        return EditCourseResponse(
            status="success",
            message="Course updated successfully",
            course_id=course_id
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while editing course: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")

@router.delete("/delete_course")
async def delete_course(
    request: DeleteCourseRequest,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Delete an existing course.
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

        # Delete course (cascade will handle related records)
        db.delete(course)
        db.commit()

        return DeleteCourseResponse(
            status="success",
            message="Course deleted successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while deleting course: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")

@router.put("/edit_unit")
async def edit_unit(
    request: EditUnitRequest,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Edit an existing unit.
    """
    try:
        unit_id = request.unit_id

        # Query to get existing unit
        unit_stmt = select(Unit).where(Unit.id == unit_id)
        unit = db.execute(unit_stmt).scalar_one_or_none()

        # Raise exceptions if unit not found or not owned by current user
        if unit is None:
            raise NotFoundException("Unit")
        if unit.course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        # Check for duplicate name within the same course (excluding current unit)
        duplicate_stmt = select(func.count()).select_from(Unit).where(
            (Unit.course_id == unit.course_id) &
            (Unit.name.ilike(request.name)) &
            (Unit.id != unit_id)
        )
        duplicate_count = db.execute(duplicate_stmt).scalar_one()

        if duplicate_count > 0:
            raise ExistingResourceException(detail="Unit with the same name already exists in this course")

        # Update unit
        unit.name = request.name
        unit.description = request.description

        db.commit()
        db.refresh(unit)

        return EditUnitResponse(
            status="success",
            message="Unit updated successfully",
            unit_id=unit_id
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while editing unit: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")

@router.delete("/delete_unit")
async def delete_unit(
    request: DeleteUnitRequest,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Delete an existing unit.
    """
    try:
        unit_id = request.unit_id

        # Query to get existing unit
        unit_stmt = select(Unit).where(Unit.id == unit_id)
        unit = db.execute(unit_stmt).scalar_one_or_none()

        # Raise exceptions if unit not found or not owned by current user
        if unit is None:
            raise NotFoundException("Unit")
        if unit.course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        # Delete unit (cascade will handle related records)
        db.delete(unit)
        db.commit()

        return DeleteUnitResponse(
            status="success",
            message="Unit deleted successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while deleting unit: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")

@router.put("/edit_chapter")
async def edit_chapter(
    request: EditChapterRequest,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Edit an existing chapter.
    """
    try:
        chapter_id = request.chapter_id

        # Query to get existing chapter
        chapter_stmt = select(Chapter).where(Chapter.id == chapter_id)
        chapter = db.execute(chapter_stmt).scalar_one_or_none()

        # Raise exceptions if chapter not found or not owned by current user
        if chapter is None:
            raise NotFoundException("Chapter")
        if chapter.unit.course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        # Check for duplicate name within the same unit (excluding current chapter)
        duplicate_stmt = select(func.count()).select_from(Chapter).where(
            (Chapter.unit_id == chapter.unit_id) &
            (Chapter.name.ilike(request.name)) &
            (Chapter.id != chapter_id)
        )
        duplicate_count = db.execute(duplicate_stmt).scalar_one()

        if duplicate_count > 0:
            raise ExistingResourceException(detail="Chapter with the same name already exists in this unit")

        # Update chapter
        chapter.name = request.name

        db.commit()
        db.refresh(chapter)

        return EditChapterResponse(
            status="success",
            message="Chapter updated successfully",
            chapter_id=chapter_id
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while editing chapter: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")

@router.delete("/delete_chapter")
async def delete_chapter(
    request: DeleteChapterRequest,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Delete an existing chapter.
    """
    try:
        chapter_id = request.chapter_id

        # Query to get existing chapter
        chapter_stmt = select(Chapter).where(Chapter.id == chapter_id)
        chapter = db.execute(chapter_stmt).scalar_one_or_none()

        # Raise exceptions if chapter not found or not owned by current user
        if chapter is None:
            raise NotFoundException("Chapter")
        if chapter.unit.course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        # Delete chapter (cascade will handle related records)
        db.delete(chapter)
        db.commit()

        return DeleteChapterResponse(
            status="success",
            message="Chapter deleted successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while deleting chapter: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")

@router.put("/edit_lesson")
async def edit_lesson(
    request: EditLessonRequest,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Edit an existing lesson.
    """
    try:
        lesson_id = request.lesson_id

        # Query to get existing lesson
        lesson_stmt = select(Lesson).where(Lesson.id == lesson_id)
        lesson = db.execute(lesson_stmt).scalar_one_or_none()

        # Raise exceptions if lesson not found or not owned by current user
        if lesson is None:
            raise NotFoundException("Lesson")
        if lesson.chapter.unit.course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        # Check for duplicate name within the same chapter (excluding current lesson)
        duplicate_stmt = select(func.count()).select_from(Lesson).where(
            (Lesson.chapter_id == lesson.chapter_id) &
            (Lesson.name.ilike(request.name)) &
            (Lesson.id != lesson_id)
        )
        duplicate_count = db.execute(duplicate_stmt).scalar_one()

        if duplicate_count > 0:
            raise ExistingResourceException(detail="Lesson with the same name already exists in this chapter")

        # Update lesson
        lesson.name = request.name

        db.commit()
        db.refresh(lesson)

        return EditLessonResponse(
            status="success",
            message="Lesson updated successfully",
            lesson_id=lesson_id
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while editing lesson: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")

@router.delete("/delete_lesson")
async def delete_lesson(
    request: DeleteLessonRequest,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Delete an existing lesson.
    """
    try:
        lesson_id = request.lesson_id

        # Query to get existing lesson
        lesson_stmt = select(Lesson).where(Lesson.id == lesson_id)
        lesson = db.execute(lesson_stmt).scalar_one_or_none()

        # Raise exceptions if lesson not found or not owned by current user
        if lesson is None:
            raise NotFoundException("Lesson")
        if lesson.chapter.unit.course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        # Delete lesson (cascade will handle related records)
        db.delete(lesson)
        db.commit()

        return DeleteLessonResponse(
            status="success",
            message="Lesson deleted successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while deleting lesson: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")

@router.put("/edit_mcq_question")
async def edit_mcq_question(
    request: EditMCQQuestionRequest,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Edit an existing MCQ question.
    """
    try:
        question_id = request.question_id

        # Query to get existing question
        question_stmt = select(Question).where(Question.id == question_id)
        question = db.execute(question_stmt).scalar_one_or_none()

        # Raise exceptions if question not found or not owned by current user
        if question is None:
            raise NotFoundException("Question")
        if question.question_type != "mcq":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question is not an MCQ question")
        if question.lesson.chapter.unit.course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        # Validate that at least one option is correct
        correct_options = [opt for opt in request.options if opt.is_correct]
        if len(correct_options) == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one option must be marked as correct")

        # Update question text
        question.question_text = request.question_text

        # Delete existing options
        for option in question.mcq_options:
            db.delete(option)

        # Create new options
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
        db.refresh(question)

        return EditMCQQuestionResponse(
            status="success",
            message="MCQ question updated successfully",
            question_id=question_id
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while editing MCQ question: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")

@router.put("/edit_text_question")
async def edit_text_question(
    request: EditTextQuestionRequest,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Edit an existing text question.
    """
    try:
        question_id = request.question_id

        # Query to get existing question
        question_stmt = select(Question).where(Question.id == question_id)
        question = db.execute(question_stmt).scalar_one_or_none()

        # Raise exceptions if question not found or not owned by current user
        if question is None:
            raise NotFoundException("Question")
        if question.question_type != "text":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question is not a text question")
        if question.lesson.chapter.unit.course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        # Update question text
        question.question_text = request.question_text

        # Update text answer
        if len(question.text_answers) > 0:
            text_answer = question.text_answers[0]
            text_answer.correct_answer = request.correct_answer
            text_answer.casing_matters = request.casing_matters
        else:
            # Create new answer if none exists
            answer_id = str(uuid.uuid4())
            new_answer = TextAnswer(
                id = answer_id,
                correct_answer = request.correct_answer,
                casing_matters = request.casing_matters,
                question_id = question_id
            )
            db.add(new_answer)

        db.commit()
        db.refresh(question)

        return EditTextQuestionResponse(
            status="success",
            message="Text question updated successfully",
            question_id=question_id
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while editing text question: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")

@router.delete("/delete_question")
async def delete_question(
    request: DeleteQuestionRequest,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Delete an existing question (MCQ or Text).
    """
    try:
        question_id = request.question_id

        # Query to get existing question
        question_stmt = select(Question).where(Question.id == question_id)
        question = db.execute(question_stmt).scalar_one_or_none()

        # Raise exceptions if question not found or not owned by current user
        if question is None:
            raise NotFoundException("Question")
        if question.lesson.chapter.unit.course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        # Delete question (cascade will handle related MCQ options or text answers)
        db.delete(question)
        db.commit()

        return DeleteQuestionResponse(
            status="success",
            message="Question deleted successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while deleting question: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")
