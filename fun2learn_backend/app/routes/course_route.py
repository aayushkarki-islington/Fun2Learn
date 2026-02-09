from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
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
    EditMCQQuestionRequest, EditTextQuestionRequest, DeleteQuestionRequest,
    PublishCourseRequest, DeleteLessonAttachmentRequest,
    SaveCourseTagsRequest, CreateBadgeIconRequest
)
from app.models.response_models import (
    CourseCreationResponse, AddUnitResponse, AddChapterResponse, AddLessonResponse,
    AddMCQQuestionResponse, AddTextQuestionResponse,
    EditCourseResponse, DeleteCourseResponse,
    EditUnitResponse, DeleteUnitResponse,
    EditChapterResponse, DeleteChapterResponse,
    EditLessonResponse, DeleteLessonResponse,
    EditMCQQuestionResponse, EditTextQuestionResponse, DeleteQuestionResponse,
    PublishCourseResponse, GetCoursesResponse, GetCourseDetailResponse,
    CourseSummary, CourseDetail, UnitDetail, ChapterDetail, LessonDetail,
    UploadLessonAttachmentResponse, GetLessonAttachmentsResponse, DeleteLessonAttachmentResponse,
    LessonAttachmentDetail, GetLessonQuestionsResponse, QuestionDetail, MCQOptionDetail, TextAnswerDetail,
    GetTagsResponse, TagDetail, SaveCourseTagsResponse, GetCourseTagsResponse,
    CreateBadgeResponse, BadgeDetail, GetCourseBadgeResponse
)
import logging
from sqlalchemy import select, func, desc
from app.models.db_models import Course, Unit, Chapter, Lesson, Question, MCQOption, TextAnswer, LessonAttachment, Tag, CourseTag, Badge
from app.utils.exceptions import UnauthorizedUserException, NotFoundException, ExistingResourceException
from app.utils.boto3_utils import upload_file_to_s3, delete_file_from_s3
import uuid
import os

_SHOW_NAME = "course"
router = APIRouter(
    prefix=f"/{_SHOW_NAME}",
    tags=[_SHOW_NAME],
    responses={404: {"description": "Not found"}},
)

logger = logging.getLogger(__name__)

@router.post("/create_course")
async def create_course(
    request: CourseCreateRequest,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Create a new course from a tutor account.
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

@router.get("/courses")
async def get_courses(
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Get all courses for the logged-in tutor with summary statistics.
    """
    try:
        user_id = current_user.user_id

        # Query to get all courses for the user
        courses_stmt = select(Course).where(Course.created_by == user_id).order_by(Course.created_at.desc())
        courses = db.execute(courses_stmt).scalars().all()

        course_summaries = []
        for course in courses:
            # Count units
            unit_count = len(course.units)

            # Count chapters
            chapter_count = sum(len(unit.chapters) for unit in course.units)

            # Count lessons
            lesson_count = sum(
                len(chapter.lessons)
                for unit in course.units
                for chapter in unit.chapters
            )

            # Count questions
            question_count = sum(
                len(lesson.questions)
                for unit in course.units
                for chapter in unit.chapters
                for lesson in chapter.lessons
            )

            course_summaries.append(CourseSummary(
                id=course.id,
                name=course.name,
                description=course.description,
                status=course.status,
                created_at=course.created_at,
                unit_count=unit_count,
                chapter_count=chapter_count,
                lesson_count=lesson_count,
                question_count=question_count
            ))

        return GetCoursesResponse(
            status="success",
            message="Courses retrieved successfully",
            courses=course_summaries
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while retrieving courses: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")

@router.get("/course/{course_id}")
async def get_course_detail(
    course_id: str,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific course including all units, chapters, and lessons.
    """
    try:
        # Query to get course with all nested data
        course_stmt = select(Course).where(Course.id == course_id)
        course = db.execute(course_stmt).scalar_one_or_none()

        # Raise exceptions if course not found or not owned by current user
        if course is None:
            raise NotFoundException("Course")
        if course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        # Build nested structure
        units = []
        for unit in sorted(course.units, key=lambda u: u.unit_index):
            chapters = []
            for chapter in sorted(unit.chapters, key=lambda c: c.chapter_index):
                lessons = []
                for lesson in sorted(chapter.lessons, key=lambda l: l.lesson_index):
                    lessons.append(LessonDetail(
                        id=lesson.id,
                        name=lesson.name,
                        lesson_index=lesson.lesson_index,
                        created_at=lesson.created_at,
                        question_count=len(lesson.questions)
                    ))

                chapters.append(ChapterDetail(
                    id=chapter.id,
                    name=chapter.name,
                    chapter_index=chapter.chapter_index,
                    created_at=chapter.created_at,
                    lessons=lessons
                ))

            units.append(UnitDetail(
                id=unit.id,
                name=unit.name,
                description=unit.description,
                unit_index=unit.unit_index,
                created_at=unit.created_at,
                chapters=chapters
            ))

        course_detail = CourseDetail(
            id=course.id,
            name=course.name,
            description=course.description,
            status=course.status,
            created_at=course.created_at,
            units=units
        )

        return GetCourseDetailResponse(
            status="success",
            message="Course details retrieved successfully",
            course=course_detail
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while retrieving course details: {str(e)}")
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

@router.post("/publish_course")
async def publish_course(
    request: PublishCourseRequest,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Publish a course, making it available to students.
    Course must have at least one unit with content to be published.
    """
    try:
        course_id = request.course_id

        # Query to get existing course with units
        course_stmt = select(Course).where(Course.id == course_id)
        course = db.execute(course_stmt).scalar_one_or_none()

        # Raise exceptions if course not found or not owned by current user
        if course is None:
            raise NotFoundException("Course")
        if course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        # Check if course is already published
        if course.status == "published":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Course is already published"
            )

        # Validate course has at least one unit
        unit_count_stmt = select(func.count()).select_from(Unit).where(Unit.course_id == course_id)
        unit_count = db.execute(unit_count_stmt).scalar_one()

        if unit_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Course must have at least one unit before publishing"
            )

        # Validate that at least one unit has chapters
        chapter_count_stmt = select(func.count()).select_from(Chapter).join(
            Unit, Chapter.unit_id == Unit.id
        ).where(Unit.course_id == course_id)
        chapter_count = db.execute(chapter_count_stmt).scalar_one()

        if chapter_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Course must have at least one chapter before publishing"
            )

        # Validate that at least one chapter has lessons
        lesson_count_stmt = select(func.count()).select_from(Lesson).join(
            Chapter, Lesson.chapter_id == Chapter.id
        ).join(
            Unit, Chapter.unit_id == Unit.id
        ).where(Unit.course_id == course_id)
        lesson_count = db.execute(lesson_count_stmt).scalar_one()

        if lesson_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Course must have at least one lesson before publishing"
            )

        # Validate that at least one lesson has questions
        question_count_stmt = select(func.count()).select_from(Question).join(
            Lesson, Question.lesson_id == Lesson.id
        ).join(
            Chapter, Lesson.chapter_id == Chapter.id
        ).join(
            Unit, Chapter.unit_id == Unit.id
        ).where(Unit.course_id == course_id)
        question_count = db.execute(question_count_stmt).scalar_one()

        if question_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Course must have at least one question before publishing"
            )

        # Update course status to published
        course.status = "published"
        db.commit()
        db.refresh(course)

        return PublishCourseResponse(
            status="success",
            message="Course published successfully",
            course_id=course_id
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while publishing course: {str(e)}")
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

@router.get("/lesson/{lesson_id}/questions")
async def get_lesson_questions(
    lesson_id: str,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Get all questions for a specific lesson with their options/answers.
    """
    try:
        # Query to get lesson details
        lesson_stmt = select(Lesson).where(Lesson.id == lesson_id)
        lesson = db.execute(lesson_stmt).scalar_one_or_none()

        if lesson is None:
            raise NotFoundException("Lesson")
        if lesson.chapter.unit.course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        # Build question details
        question_details = []
        for question in lesson.questions:
            q_detail = QuestionDetail(
                id=question.id,
                question_text=question.question_text,
                question_type=question.question_type,
            )

            if question.question_type == "mcq":
                q_detail.mcq_options = [
                    MCQOptionDetail(
                        id=opt.id,
                        option_text=opt.option_text,
                        is_correct=opt.is_correct
                    )
                    for opt in question.mcq_options
                ]
            elif question.question_type == "text" and len(question.text_answers) > 0:
                answer = question.text_answers[0]
                q_detail.text_answer = TextAnswerDetail(
                    id=answer.id,
                    correct_answer=answer.correct_answer,
                    casing_matters=answer.casing_matters
                )

            question_details.append(q_detail)

        return GetLessonQuestionsResponse(
            status="success",
            message="Questions retrieved successfully",
            questions=question_details
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while retrieving lesson questions: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")

@router.post("/upload_lesson_attachment")
async def upload_lesson_attachment(
    lesson_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Upload an attachment file for a lesson. Maximum 2 attachments per lesson.
    Supported file types: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, JPEG, PNG, GIF, SVG, MP4, MP3, WAV, AVI, MOV, ZIP, TXT, CSV
    Maximum file size: 50MB
    """
    try:
        # Query to get lesson details
        lesson_stmt = select(Lesson).where(Lesson.id == lesson_id)
        lesson = db.execute(lesson_stmt).scalar_one_or_none()

        # Raise exceptions if lesson not found or not owned by current user
        if lesson is None:
            raise NotFoundException("Lesson")
        if lesson.chapter.unit.course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        # Check current attachment count for this lesson
        attachment_count_stmt = select(func.count()).select_from(LessonAttachment).where(
            LessonAttachment.lesson_id == lesson_id
        )
        attachment_count = db.execute(attachment_count_stmt).scalar_one()

        if attachment_count >= 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 2 attachments allowed per lesson. Please delete an existing attachment first."
            )

        # Get S3 bucket name from environment
        s3_bucket = os.getenv('AWS_S3_BUCKET_NAME', 'fun2learn-attachments')

        # Upload file to S3
        s3_url, s3_key = upload_file_to_s3(
            file=file,
            bucket_name=s3_bucket,
            folder=f"lessons/{lesson_id}"
        )

        # Create attachment record in database
        attachment_id = str(uuid.uuid4())
        new_attachment = LessonAttachment(
            id=attachment_id,
            file_name=file.filename,
            s3_url=s3_url,
            lesson_id=lesson_id
        )

        db.add(new_attachment)
        db.commit()
        db.refresh(new_attachment)

        return UploadLessonAttachmentResponse(
            status="success",
            message="Attachment uploaded successfully",
            attachment_id=attachment_id,
            file_name=file.filename,
            s3_url=s3_url
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while uploading lesson attachment: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")

@router.get("/lesson/{lesson_id}/attachments")
async def get_lesson_attachments(
    lesson_id: str,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Get all attachments for a specific lesson.
    """
    try:
        # Query to get lesson details
        lesson_stmt = select(Lesson).where(Lesson.id == lesson_id)
        lesson = db.execute(lesson_stmt).scalar_one_or_none()

        # Raise exceptions if lesson not found or not owned by current user
        if lesson is None:
            raise NotFoundException("Lesson")
        if lesson.chapter.unit.course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        # Query to get all attachments for the lesson
        attachments_stmt = select(LessonAttachment).where(LessonAttachment.lesson_id == lesson_id).order_by(LessonAttachment.created_at)
        attachments = db.execute(attachments_stmt).scalars().all()

        attachment_details = [
            LessonAttachmentDetail(
                id=attachment.id,
                file_name=attachment.file_name,
                s3_url=attachment.s3_url,
                created_at=attachment.created_at
            )
            for attachment in attachments
        ]

        return GetLessonAttachmentsResponse(
            status="success",
            message="Attachments retrieved successfully",
            attachments=attachment_details
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while retrieving lesson attachments: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")

@router.delete("/delete_lesson_attachment")
async def delete_lesson_attachment(
    request: DeleteLessonAttachmentRequest,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Delete a lesson attachment. This will remove the file from S3 and the database record.
    """
    try:
        attachment_id = request.attachment_id

        # Query to get the attachment
        attachment_stmt = select(LessonAttachment).where(LessonAttachment.id == attachment_id)
        attachment = db.execute(attachment_stmt).scalar_one_or_none()

        # Raise exceptions if attachment not found or not owned by current user
        if attachment is None:
            raise NotFoundException("Attachment")
        if attachment.lesson.chapter.unit.course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        # Extract S3 key from URL
        # URL format: https://{bucket}.s3.amazonaws.com/{key}
        s3_url = attachment.s3_url
        s3_bucket = os.getenv('AWS_S3_BUCKET_NAME', 'fun2learn-attachments')

        # Extract the key from the S3 URL
        if s3_url:
            # Parse the S3 key from the URL
            s3_key = s3_url.split('.amazonaws.com/')[-1]

            # Delete file from S3
            try:
                delete_file_from_s3(s3_key=s3_key, bucket_name=s3_bucket)
            except Exception as s3_error:
                logger.warning(f"Failed to delete file from S3: {str(s3_error)}")
                # Continue with database deletion even if S3 deletion fails

        # Delete attachment record from database
        db.delete(attachment)
        db.commit()

        return DeleteLessonAttachmentResponse(
            status="success",
            message="Attachment deleted successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while deleting lesson attachment: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal Server Error")

# ─── Tags & Badge Endpoints ──────────────────────────────

@router.get("/tags")
async def get_tags(
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Get all available tags.
    """
    try:
        tags_stmt = select(Tag).order_by(Tag.name)
        tags = db.execute(tags_stmt).scalars().all()

        tag_details = [TagDetail(id=tag.id, name=tag.name) for tag in tags]

        return GetTagsResponse(
            status="success",
            message="Tags retrieved successfully",
            tags=tag_details
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while retrieving tags: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")

@router.get("/course/{course_id}/tags")
async def get_course_tags(
    course_id: str,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Get tags assigned to a specific course.
    """
    try:
        course_stmt = select(Course).where(Course.id == course_id)
        course = db.execute(course_stmt).scalar_one_or_none()

        if course is None:
            raise NotFoundException("Course")
        if course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        tag_details = [
            TagDetail(id=ct.tag.id, name=ct.tag.name)
            for ct in course.course_tags
        ]

        return GetCourseTagsResponse(
            status="success",
            message="Course tags retrieved successfully",
            tags=tag_details
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while retrieving course tags: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")

@router.post("/save_course_tags")
async def save_course_tags(
    request: SaveCourseTagsRequest,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Replace all tags for a course with the provided tag IDs.
    """
    try:
        course_id = request.course_id

        course_stmt = select(Course).where(Course.id == course_id)
        course = db.execute(course_stmt).scalar_one_or_none()

        if course is None:
            raise NotFoundException("Course")
        if course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        # Delete existing course tags
        existing_tags_stmt = select(CourseTag).where(CourseTag.course_id == course_id)
        existing_tags = db.execute(existing_tags_stmt).scalars().all()
        for ct in existing_tags:
            db.delete(ct)

        # Add new course tags
        for tag_id in request.tag_ids:
            # Verify tag exists
            tag_stmt = select(Tag).where(Tag.id == tag_id)
            tag = db.execute(tag_stmt).scalar_one_or_none()
            if tag is None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Tag with id '{tag_id}' not found")

            new_ct = CourseTag(
                id=str(uuid.uuid4()),
                course_id=course_id,
                tag_id=tag_id
            )
            db.add(new_ct)

        db.commit()

        return SaveCourseTagsResponse(
            status="success",
            message="Course tags saved successfully",
            course_id=course_id,
            tag_count=len(request.tag_ids)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while saving course tags: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")

@router.get("/course/{course_id}/badge")
async def get_course_badge(
    course_id: str,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Get the badge for a specific course.
    """
    try:
        course_stmt = select(Course).where(Course.id == course_id)
        course = db.execute(course_stmt).scalar_one_or_none()

        if course is None:
            raise NotFoundException("Course")
        if course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        badge = course.badge
        badge_detail = None
        if badge:
            badge_detail = BadgeDetail(
                id=badge.id,
                name=badge.name,
                badge_type=badge.badge_type,
                icon_name=badge.icon_name,
                image_url=badge.image_url,
                course_id=badge.course_id
            )

        return GetCourseBadgeResponse(
            status="success",
            message="Course badge retrieved successfully",
            badge=badge_detail
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while retrieving course badge: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")

@router.post("/create_badge_icon")
async def create_badge_icon(
    request: CreateBadgeIconRequest,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Create or replace a badge with a Lucide icon for a course.
    """
    try:
        course_id = request.course_id

        course_stmt = select(Course).where(Course.id == course_id)
        course = db.execute(course_stmt).scalar_one_or_none()

        if course is None:
            raise NotFoundException("Course")
        if course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        # Delete existing badge if any (including S3 cleanup for image badges)
        existing_badge = course.badge
        if existing_badge:
            if existing_badge.badge_type == "image" and existing_badge.image_url:
                s3_bucket = os.getenv('AWS_S3_BUCKET_NAME', 'fun2learn-attachments')
                s3_key = existing_badge.image_url.split('.amazonaws.com/')[-1]
                try:
                    delete_file_from_s3(s3_key=s3_key, bucket_name=s3_bucket)
                except Exception as s3_error:
                    logger.warning(f"Failed to delete badge image from S3: {str(s3_error)}")
            db.delete(existing_badge)
            db.flush()

        badge_id = str(uuid.uuid4())
        new_badge = Badge(
            id=badge_id,
            name=request.name,
            badge_type="icon",
            icon_name=request.icon_name,
            course_id=course_id
        )

        db.add(new_badge)
        db.commit()
        db.refresh(new_badge)

        badge_detail = BadgeDetail(
            id=new_badge.id,
            name=new_badge.name,
            badge_type=new_badge.badge_type,
            icon_name=new_badge.icon_name,
            image_url=new_badge.image_url,
            course_id=new_badge.course_id
        )

        return CreateBadgeResponse(
            status="success",
            message="Icon badge created successfully",
            badge=badge_detail
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while creating badge icon: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")

@router.post("/create_badge_image")
async def create_badge_image(
    course_id: str = Form(...),
    name: str = Form(...),
    file: UploadFile = File(...),
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db)
):
    """
    Create or replace a badge with an uploaded image for a course.
    """
    try:
        course_stmt = select(Course).where(Course.id == course_id)
        course = db.execute(course_stmt).scalar_one_or_none()

        if course is None:
            raise NotFoundException("Course")
        if course.created_by != current_user.user_id:
            raise UnauthorizedUserException()

        s3_bucket = os.getenv('AWS_S3_BUCKET_NAME', 'fun2learn-attachments')

        # Delete existing badge if any (including S3 cleanup for image badges)
        existing_badge = course.badge
        if existing_badge:
            if existing_badge.badge_type == "image" and existing_badge.image_url:
                s3_key = existing_badge.image_url.split('.amazonaws.com/')[-1]
                try:
                    delete_file_from_s3(s3_key=s3_key, bucket_name=s3_bucket)
                except Exception as s3_error:
                    logger.warning(f"Failed to delete old badge image from S3: {str(s3_error)}")
            db.delete(existing_badge)
            db.flush()

        # Upload new image to S3
        s3_url, s3_key = upload_file_to_s3(
            file=file,
            bucket_name=s3_bucket,
            folder=f"badges/{course_id}"
        )

        badge_id = str(uuid.uuid4())
        new_badge = Badge(
            id=badge_id,
            name=name,
            badge_type="image",
            image_url=s3_url,
            course_id=course_id
        )

        db.add(new_badge)
        db.commit()
        db.refresh(new_badge)

        badge_detail = BadgeDetail(
            id=new_badge.id,
            name=new_badge.name,
            badge_type=new_badge.badge_type,
            icon_name=new_badge.icon_name,
            image_url=new_badge.image_url,
            course_id=new_badge.course_id
        )

        return CreateBadgeResponse(
            status="success",
            message="Image badge created successfully",
            badge=badge_detail
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"An error occurred while creating badge image: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")
