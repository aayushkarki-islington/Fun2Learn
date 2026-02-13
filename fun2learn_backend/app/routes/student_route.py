from fastapi import APIRouter, Depends, HTTPException, status
from app.utils.db_utils import get_db
from app.auth.dependencies import get_current_user, require_role
from sqlalchemy.orm import Session
from app.models.models import TokenUser
from app.models.request_models import EnrollCourseRequest, SubmitAnswerRequest, CompleteLessonRequest
from app.models.response_models import (
    GetBrowseCoursesResponse, BrowseCourseSummary,
    EnrollCourseResponse,
    GetMyCoursesResponse, EnrolledCourseSummary,
    GetStudentCourseDetailResponse, StudentCourseDetail, StudentUnitDetail, StudentChapterDetail, StudentLessonDetail,
    GetStudentLessonResponse, StudentQuestionDetail, StudentMCQOption, LessonAttachmentDetail,
    SubmitAnswerResponse, CompleteLessonResponse,
    TagDetail, BadgeDetail,
    GetStreakResponse
)
import logging
from sqlalchemy import select, func
from app.models.db_models import (
    Course, Unit, Chapter, Lesson, Question, MCQOption, TextAnswer,
    LessonAttachment, Enrollment, CourseProgress, LessonCompletion, Tag, CourseTag,
    UserInventory, StreakEntry
)
from app.utils.exceptions import NotFoundException
from datetime import date, timedelta
import uuid

_SHOW_NAME = "student"
router = APIRouter(
    prefix=f"/{_SHOW_NAME}",
    tags=[_SHOW_NAME],
    responses={404: {"description": "Not found"}},
)

logger = logging.getLogger(__name__)


def _get_first_lesson(course: Course):
    """Get the first unit, chapter, and lesson of a course (by index order)."""
    units = sorted(course.units, key=lambda u: u.unit_index)
    for unit in units:
        chapters = sorted(unit.chapters, key=lambda c: c.chapter_index)
        for chapter in chapters:
            lessons = sorted(chapter.lessons, key=lambda l: l.lesson_index)
            if lessons:
                return unit, chapter, lessons[0]
    return None, None, None


def _get_all_lessons_ordered(course: Course):
    """Get all lessons in course order as a flat list of (unit, chapter, lesson) tuples."""
    result = []
    for unit in sorted(course.units, key=lambda u: u.unit_index):
        for chapter in sorted(unit.chapters, key=lambda c: c.chapter_index):
            for lesson in sorted(chapter.lessons, key=lambda l: l.lesson_index):
                result.append((unit, chapter, lesson))
    return result


def _count_lessons(course: Course):
    """Count total lessons in a course."""
    return sum(
        len(chapter.lessons)
        for unit in course.units
        for chapter in unit.chapters
    )


def _get_or_create_inventory(user_id: str, db: Session) -> UserInventory:
    """Get or create UserInventory for a user."""
    inventory = db.execute(
        select(UserInventory).where(UserInventory.user_id == user_id)
    ).scalar_one_or_none()

    if not inventory:
        inventory = UserInventory(
            id=str(uuid.uuid4()),
            user_id=user_id
        )
        db.add(inventory)
        db.flush()

    return inventory


def _update_streak(inventory: UserInventory, user_id: str, db: Session) -> bool:
    """
    Update daily streak. Returns True if streak was updated (first completion today).
    Logic:
    - If last_streak_recorded is today: already counted, no update
    - If last_streak_recorded is yesterday: increment streak
    - Otherwise: reset streak to 1
    Also records a StreakEntry for calendar tracking.
    """
    today = date.today()

    if inventory.last_streak_recorded == today:
        return False

    if inventory.last_streak_recorded == today - timedelta(days=1):
        inventory.daily_streak += 1
    else:
        inventory.daily_streak = 1

    inventory.last_streak_recorded = today

    if inventory.daily_streak > inventory.longest_streak:
        inventory.longest_streak = inventory.daily_streak

    # Record streak entry for calendar
    entry = StreakEntry(
        id=str(uuid.uuid4()),
        user_id=user_id,
        date=today
    )
    db.add(entry)

    return True


@router.get("/streak")
async def get_streak(
    current_user: TokenUser = Depends(require_role("learner")),
    db: Session = Depends(get_db)
):
    """Get current user's streak data."""
    try:
        inventory = _get_or_create_inventory(current_user.user_id, db)
        db.commit()

        today = date.today()
        streak_active_today = inventory.last_streak_recorded == today

        # Check if streak is still valid (not broken)
        # If last recorded is not today or yesterday, streak is broken
        daily_streak = inventory.daily_streak
        if (inventory.last_streak_recorded is not None
                and inventory.last_streak_recorded != today
                and inventory.last_streak_recorded != today - timedelta(days=1)):
            daily_streak = 0

        return GetStreakResponse(
            status="success",
            message="Streak data retrieved",
            daily_streak=daily_streak,
            longest_streak=inventory.longest_streak,
            streak_active_today=streak_active_today
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting streak: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.get("/browse")
async def browse_courses(
    current_user: TokenUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all published courses for browsing."""
    try:
        courses_stmt = select(Course).where(Course.status == "published").order_by(Course.created_at.desc())
        courses = db.execute(courses_stmt).scalars().all()

        course_list = []
        for course in courses:
            unit_count = len(course.units)
            chapter_count = sum(len(u.chapters) for u in course.units)
            lesson_count = _count_lessons(course)
            enrollment_count = len(course.enrollments)

            tags = [TagDetail(id=ct.tag.id, name=ct.tag.name) for ct in course.course_tags]

            badge_detail = None
            if course.badge:
                badge_detail = BadgeDetail(
                    id=course.badge.id, name=course.badge.name,
                    badge_type=course.badge.badge_type, icon_name=course.badge.icon_name,
                    image_url=course.badge.image_url, course_id=course.badge.course_id
                )

            course_list.append(BrowseCourseSummary(
                id=course.id,
                name=course.name,
                description=course.description,
                tutor_name=course.user.full_name,
                unit_count=unit_count,
                chapter_count=chapter_count,
                lesson_count=lesson_count,
                enrollment_count=enrollment_count,
                tags=tags,
                badge=badge_detail
            ))

        return GetBrowseCoursesResponse(
            status="success",
            message="Courses retrieved successfully",
            courses=course_list
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error browsing courses: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.post("/enroll")
async def enroll_in_course(
    request: EnrollCourseRequest,
    current_user: TokenUser = Depends(require_role("learner")),
    db: Session = Depends(get_db)
):
    """Enroll in a published course."""
    try:
        course_id = request.course_id
        user_id = current_user.user_id

        # Verify course exists and is published
        course = db.execute(select(Course).where(Course.id == course_id)).scalar_one_or_none()
        if course is None:
            raise NotFoundException("Course")
        if course.status != "published":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Course is not published")

        # Check if already enrolled
        existing = db.execute(
            select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already enrolled in this course")

        # Create enrollment
        enrollment_id = str(uuid.uuid4())
        new_enrollment = Enrollment(
            id=enrollment_id, user_id=user_id,
            course_id=course_id, status="active"
        )
        db.add(new_enrollment)

        # Create progress record initialized to first lesson
        first_unit, first_chapter, first_lesson = _get_first_lesson(course)
        progress_id = str(uuid.uuid4())
        new_progress = CourseProgress(
            id=progress_id, user_id=user_id, course_id=course_id,
            current_unit_id=first_unit.id if first_unit else None,
            current_chapter_id=first_chapter.id if first_chapter else None,
            current_lesson_id=first_lesson.id if first_lesson else None
        )
        db.add(new_progress)

        db.commit()

        return EnrollCourseResponse(
            status="success",
            message="Enrolled successfully",
            enrollment_id=enrollment_id
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error enrolling in course: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.get("/my-courses")
async def get_my_courses(
    current_user: TokenUser = Depends(require_role("learner")),
    db: Session = Depends(get_db)
):
    """Get all enrolled courses with progress summary."""
    try:
        user_id = current_user.user_id

        enrollments = db.execute(
            select(Enrollment).where(Enrollment.user_id == user_id).order_by(Enrollment.enrolled_at.desc())
        ).scalars().all()

        course_list = []
        for enrollment in enrollments:
            course = enrollment.course
            total_lessons = _count_lessons(course)

            completed_count = db.execute(
                select(func.count()).select_from(LessonCompletion)
                .where(LessonCompletion.user_id == user_id, LessonCompletion.course_id == course.id)
            ).scalar_one()

            progress_percent = (completed_count / total_lessons * 100) if total_lessons > 0 else 0

            # Get current lesson name
            progress = db.execute(
                select(CourseProgress).where(CourseProgress.user_id == user_id, CourseProgress.course_id == course.id)
            ).scalar_one_or_none()

            current_lesson_name = None
            if progress and progress.current_lesson:
                current_lesson_name = progress.current_lesson.name

            badge_detail = None
            if course.badge:
                badge_detail = BadgeDetail(
                    id=course.badge.id, name=course.badge.name,
                    badge_type=course.badge.badge_type, icon_name=course.badge.icon_name,
                    image_url=course.badge.image_url, course_id=course.badge.course_id
                )

            course_list.append(EnrolledCourseSummary(
                id=course.id,
                name=course.name,
                description=course.description,
                tutor_name=course.user.full_name,
                total_lessons=total_lessons,
                completed_lessons=completed_count,
                progress_percent=round(progress_percent, 1),
                current_lesson_name=current_lesson_name,
                badge=badge_detail,
                enrolled_at=enrollment.enrolled_at
            ))

        return GetMyCoursesResponse(
            status="success",
            message="Enrolled courses retrieved successfully",
            courses=course_list
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting enrolled courses: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.get("/course/{course_id}")
async def get_student_course_detail(
    course_id: str,
    current_user: TokenUser = Depends(require_role("learner")),
    db: Session = Depends(get_db)
):
    """Get full course detail with per-lesson progress status."""
    try:
        user_id = current_user.user_id

        # Verify enrollment
        enrollment = db.execute(
            select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
        ).scalar_one_or_none()
        if not enrollment:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enrolled in this course")

        course = db.execute(select(Course).where(Course.id == course_id)).scalar_one_or_none()
        if not course:
            raise NotFoundException("Course")

        # Get progress
        progress = db.execute(
            select(CourseProgress).where(CourseProgress.user_id == user_id, CourseProgress.course_id == course_id)
        ).scalar_one_or_none()

        # Get completed lesson ids
        completed_rows = db.execute(
            select(LessonCompletion.lesson_id)
            .where(LessonCompletion.user_id == user_id, LessonCompletion.course_id == course_id)
        ).scalars().all()
        completed_ids = set(completed_rows)

        # Resolve current lesson if NULL (content was deleted)
        current_lesson_id = progress.current_lesson_id if progress else None
        if progress and current_lesson_id is None:
            all_lessons = _get_all_lessons_ordered(course)
            for unit, chapter, lesson in all_lessons:
                if lesson.id not in completed_ids:
                    current_lesson_id = lesson.id
                    progress.current_unit_id = unit.id
                    progress.current_chapter_id = chapter.id
                    progress.current_lesson_id = lesson.id
                    db.commit()
                    break

        # Build response structure
        total_lessons = 0
        total_completed = 0
        units_detail = []

        for unit in sorted(course.units, key=lambda u: u.unit_index):
            unit_completed = 0
            unit_total = 0
            chapters_detail = []

            for chapter in sorted(unit.chapters, key=lambda c: c.chapter_index):
                lessons_detail = []
                chapter_has_current = False
                chapter_all_completed = True

                for lesson in sorted(chapter.lessons, key=lambda l: l.lesson_index):
                    unit_total += 1
                    total_lessons += 1

                    if lesson.id in completed_ids:
                        lesson_status = "completed"
                        unit_completed += 1
                        total_completed += 1
                    elif lesson.id == current_lesson_id:
                        lesson_status = "current"
                        chapter_has_current = True
                        chapter_all_completed = False
                    else:
                        lesson_status = "locked"
                        chapter_all_completed = False

                    lessons_detail.append(StudentLessonDetail(
                        id=lesson.id, name=lesson.name,
                        lesson_index=lesson.lesson_index,
                        question_count=len(lesson.questions),
                        status=lesson_status
                    ))

                # Determine chapter status
                if not lessons_detail:
                    chapter_status = "locked"
                elif chapter_all_completed:
                    chapter_status = "completed"
                elif chapter_has_current or any(l.status == "completed" for l in lessons_detail):
                    chapter_status = "in_progress"
                else:
                    chapter_status = "locked"

                chapters_detail.append(StudentChapterDetail(
                    id=chapter.id, name=chapter.name,
                    chapter_index=chapter.chapter_index,
                    lessons=lessons_detail, status=chapter_status
                ))

            units_detail.append(StudentUnitDetail(
                id=unit.id, name=unit.name, description=unit.description,
                unit_index=unit.unit_index, chapters=chapters_detail,
                completed_lessons=unit_completed, total_lessons=unit_total
            ))

        progress_percent = (total_completed / total_lessons * 100) if total_lessons > 0 else 0

        badge_detail = None
        if course.badge:
            badge_detail = BadgeDetail(
                id=course.badge.id, name=course.badge.name,
                badge_type=course.badge.badge_type, icon_name=course.badge.icon_name,
                image_url=course.badge.image_url, course_id=course.badge.course_id
            )

        course_detail = StudentCourseDetail(
            id=course.id, name=course.name, description=course.description,
            tutor_name=course.user.full_name,
            total_lessons=total_lessons, completed_lessons=total_completed,
            progress_percent=round(progress_percent, 1),
            units=units_detail, badge=badge_detail
        )

        return GetStudentCourseDetailResponse(
            status="success",
            message="Course detail retrieved successfully",
            course=course_detail
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting student course detail: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.get("/course/{course_id}/lesson/{lesson_id}")
async def get_student_lesson(
    course_id: str,
    lesson_id: str,
    current_user: TokenUser = Depends(require_role("learner")),
    db: Session = Depends(get_db)
):
    """Get lesson questions for answering (no correct answers exposed)."""
    try:
        user_id = current_user.user_id

        # Verify enrollment
        enrollment = db.execute(
            select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
        ).scalar_one_or_none()
        if not enrollment:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enrolled in this course")

        # Verify lesson exists and belongs to course
        lesson = db.execute(select(Lesson).where(Lesson.id == lesson_id)).scalar_one_or_none()
        if not lesson:
            raise NotFoundException("Lesson")
        if lesson.chapter.unit.course_id != course_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Lesson does not belong to this course")

        # Verify lesson is accessible (completed or current, not locked)
        progress = db.execute(
            select(CourseProgress).where(CourseProgress.user_id == user_id, CourseProgress.course_id == course_id)
        ).scalar_one_or_none()

        is_completed = db.execute(
            select(LessonCompletion).where(
                LessonCompletion.user_id == user_id, LessonCompletion.lesson_id == lesson_id
            )
        ).scalar_one_or_none()

        is_current = progress and progress.current_lesson_id == lesson_id

        if not is_completed and not is_current:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Lesson is locked")

        # Build questions (without answers)
        questions = []
        for q in lesson.questions:
            q_detail = StudentQuestionDetail(
                id=q.id, question_text=q.question_text, question_type=q.question_type
            )
            if q.question_type == "mcq":
                q_detail.mcq_options = [
                    StudentMCQOption(id=opt.id, option_text=opt.option_text)
                    for opt in q.mcq_options
                ]
            questions.append(q_detail)

        # Build attachments
        attachments = [
            LessonAttachmentDetail(
                id=att.id, file_name=att.file_name,
                s3_url=att.s3_url, created_at=att.created_at
            )
            for att in lesson.lesson_attachments
        ]

        return GetStudentLessonResponse(
            status="success",
            message="Lesson retrieved successfully",
            lesson_name=lesson.name,
            questions=questions,
            attachments=attachments
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting student lesson: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.post("/submit-answer")
async def submit_answer(
    request: SubmitAnswerRequest,
    current_user: TokenUser = Depends(require_role("learner")),
    db: Session = Depends(get_db)
):
    """Check if an answer is correct (stateless check)."""
    try:
        question = db.execute(select(Question).where(Question.id == request.question_id)).scalar_one_or_none()
        if not question:
            raise NotFoundException("Question")

        is_correct = False
        correct_answer = None

        if question.question_type == "mcq":
            # answer is the option_id the student selected
            selected_option = db.execute(
                select(MCQOption).where(MCQOption.id == request.answer, MCQOption.question_id == question.id)
            ).scalar_one_or_none()

            if not selected_option:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid option selected")

            is_correct = selected_option.is_correct

            # Get correct answer text(s) for feedback
            correct_options = [opt for opt in question.mcq_options if opt.is_correct]
            correct_answer = ", ".join(opt.option_text for opt in correct_options)

        elif question.question_type == "text":
            if not question.text_answers:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Question has no answer configured")

            text_answer = question.text_answers[0]
            correct_answer = text_answer.correct_answer

            if text_answer.casing_matters:
                is_correct = request.answer.strip() == text_answer.correct_answer.strip()
            else:
                is_correct = request.answer.strip().lower() == text_answer.correct_answer.strip().lower()

        return SubmitAnswerResponse(
            status="success",
            message="Correct!" if is_correct else "Incorrect",
            is_correct=is_correct,
            correct_answer=correct_answer
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error submitting answer: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.post("/complete-lesson")
async def complete_lesson(
    request: CompleteLessonRequest,
    current_user: TokenUser = Depends(require_role("learner")),
    db: Session = Depends(get_db)
):
    """Mark a lesson as complete and advance progress to the next lesson."""
    try:
        user_id = current_user.user_id
        course_id = request.course_id
        lesson_id = request.lesson_id

        # Verify enrollment
        enrollment = db.execute(
            select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
        ).scalar_one_or_none()
        if not enrollment:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enrolled in this course")

        # Get progress
        progress = db.execute(
            select(CourseProgress).where(CourseProgress.user_id == user_id, CourseProgress.course_id == course_id)
        ).scalar_one_or_none()
        if not progress:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No progress record found")

        # Check if already completed (idempotent)
        already_completed = db.execute(
            select(LessonCompletion).where(
                LessonCompletion.user_id == user_id, LessonCompletion.lesson_id == lesson_id
            )
        ).scalar_one_or_none()

        if not already_completed:
            # Create completion record
            completion = LessonCompletion(
                id=str(uuid.uuid4()),
                user_id=user_id,
                lesson_id=lesson_id,
                course_id=course_id
            )
            db.add(completion)

        # Find next lesson
        course = db.execute(select(Course).where(Course.id == course_id)).scalar_one_or_none()
        all_lessons = _get_all_lessons_ordered(course)

        # Find index of current lesson
        current_idx = None
        for i, (unit, chapter, lesson) in enumerate(all_lessons):
            if lesson.id == lesson_id:
                current_idx = i
                break

        next_lesson_id = None
        course_completed = False

        if current_idx is not None and current_idx + 1 < len(all_lessons):
            next_unit, next_chapter, next_lesson = all_lessons[current_idx + 1]
            next_lesson_id = next_lesson.id
            progress.current_unit_id = next_unit.id
            progress.current_chapter_id = next_chapter.id
            progress.current_lesson_id = next_lesson.id
        else:
            # No more lessons — course complete
            course_completed = True
            progress.current_lesson_id = None
            progress.current_chapter_id = None
            progress.current_unit_id = None
            enrollment.status = "completed"

        # Update streak
        inventory = _get_or_create_inventory(user_id, db)
        streak_updated = _update_streak(inventory, user_id, db)

        db.commit()

        return CompleteLessonResponse(
            status="success",
            message="Course completed!" if course_completed else "Lesson completed",
            next_lesson_id=next_lesson_id,
            course_completed=course_completed,
            streak_updated=streak_updated,
            daily_streak=inventory.daily_streak
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error completing lesson: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")
