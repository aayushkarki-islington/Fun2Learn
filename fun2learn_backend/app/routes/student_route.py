from fastapi import APIRouter, Depends, HTTPException, status
from app.utils.db_utils import get_db
from app.auth.dependencies import get_current_user, require_role
from sqlalchemy.orm import Session
from app.models.models import TokenUser
from app.models.request_models import EnrollCourseRequest, SubmitAnswerRequest, CompleteLessonRequest, SubmitFeedbackRequest
from app.models.response_models import (
    GetBrowseCoursesResponse, BrowseCourseSummary,
    GetCoursePublicDetailResponse, CourseFeedbackItem, GetCourseFeedbackResponse,
    SubmitFeedbackResponse, MyFeedbackResponse,
    EnrollCourseResponse,
    GetMyCoursesResponse, EnrolledCourseSummary,
    GetStudentCourseDetailResponse, StudentCourseDetail, StudentUnitDetail, StudentChapterDetail, StudentLessonDetail,
    GetStudentLessonResponse, StudentQuestionDetail, StudentMCQOption, LessonAttachmentDetail,
    SubmitAnswerResponse, CompleteLessonResponse, NewlyUnlockedAchievement,
    TagDetail, BadgeDetail,
    GetStreakResponse,
    UserAchievementDetail, GetAchievementsResponse,
    CompletedQuestInfo, DailyQuestDetail, GetDailyQuestsResponse,
    LeaderboardMemberDetail, GetLeaderboardResponse
)
import logging
from sqlalchemy import select, func
from app.models.db_models import (
    Course, Unit, Chapter, Lesson, Question, MCQOption, TextAnswer,
    LessonAttachment, Enrollment, CourseProgress, LessonCompletion, Tag, CourseTag,
    UserInventory, StreakEntry, Achievement, UserAchievement, UserDailyQuestProgress,
    Leaderboard, LeaderboardEntry, Feedback
)
from app.utils.leaderboard_utils import RANKS, LEADERBOARD_MAX_SIZE, PROMOTION_COUNT, RELEGATION_COUNT, get_current_week_bounds
from app.utils.exceptions import NotFoundException
from datetime import date, timedelta, datetime, timezone
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


DAILY_QUEST_DEFINITIONS = [
    {
        "key": "streak_today",
        "title": "Flame Keeper",
        "description": "Keep your streak alive today",
        "icon": "flame",
        "quest_type": "streak_today",
        "goal": 1,
        "gems": 15,
    },
    {
        "key": "complete_3_lessons",
        "title": "On a Roll",
        "description": "Complete 3 new lessons today",
        "icon": "zap",
        "quest_type": "lessons_today",
        "goal": 3,
        "gems": 20,
    },
    {
        "key": "complete_5_lessons",
        "title": "Knowledge Seeker",
        "description": "Complete 5 new lessons today",
        "icon": "book-open",
        "quest_type": "lessons_today",
        "goal": 5,
        "gems": 30,
    },
]


def _get_or_create_quest_progress(
    user_id: str, quest_key: str, today: date, db: Session
) -> UserDailyQuestProgress:
    qp = db.execute(
        select(UserDailyQuestProgress).where(
            UserDailyQuestProgress.user_id == user_id,
            UserDailyQuestProgress.quest_key == quest_key,
            UserDailyQuestProgress.date == today,
        )
    ).scalar_one_or_none()
    if not qp:
        qp = UserDailyQuestProgress(
            id=str(uuid.uuid4()),
            user_id=user_id,
            quest_key=quest_key,
            date=today,
            progress=0,
            completed=False,
            gems_claimed=False,
        )
        db.add(qp)
    return qp


def _update_daily_quests(
    user_id: str,
    lessons_today: int,
    inventory: UserInventory,
    db: Session,
) -> tuple[list[CompletedQuestInfo], int, list[DailyQuestDetail]]:
    """
    Update daily quest progress based on today's lesson count and streak status.
    Returns (newly_completed_quests, gems_earned, all_quest_details).
    """
    today = date.today()
    newly_completed: list[CompletedQuestInfo] = []
    gems_earned = 0
    all_details: list[DailyQuestDetail] = []

    for qdef in DAILY_QUEST_DEFINITIONS:
        qp = _get_or_create_quest_progress(user_id, qdef["key"], today, db)

        if qdef["quest_type"] == "lessons_today":
            qp.progress = min(lessons_today, qdef["goal"])
        elif qdef["quest_type"] == "streak_today":
            if inventory.last_streak_recorded == today:
                qp.progress = 1

        # Award gems for newly completed quests
        was_completed = qp.completed
        if qp.progress >= qdef["goal"]:
            qp.completed = True
        if qp.completed and not qp.gems_claimed:
            qp.gems_claimed = True
            inventory.gems += qdef["gems"]
            gems_earned += qdef["gems"]
            if not was_completed:
                newly_completed.append(CompletedQuestInfo(
                    key=qdef["key"],
                    title=qdef["title"],
                    gems=qdef["gems"],
                ))

        all_details.append(DailyQuestDetail(
            key=qdef["key"],
            title=qdef["title"],
            description=qdef["description"],
            icon=qdef["icon"],
            quest_type=qdef["quest_type"],
            goal=qdef["goal"],
            gems=qdef["gems"],
            progress=qp.progress,
            completed=qp.completed,
        ))

    return newly_completed, gems_earned, all_details


def _update_achievement_progress(
    user_id: str, achievement_type: str, current_value: int, db: Session
) -> list[NewlyUnlockedAchievement]:
    """
    Upsert UserAchievement progress for all achievements of a given type.
    - Sets progress = current_value on every call.
    - If current_value >= goal and not yet achieved, marks as achieved.
    Returns a list of newly unlocked achievements (those that just crossed their goal).
    """
    achievements = db.execute(
        select(Achievement).where(Achievement.achievement_type == achievement_type)
    ).scalars().all()

    newly_unlocked = []

    for ach in achievements:
        ua = db.execute(
            select(UserAchievement).where(
                UserAchievement.user_id == user_id,
                UserAchievement.achievement_id == ach.id
            )
        ).scalar_one_or_none()

        if ua is None:
            ua = UserAchievement(
                id=str(uuid.uuid4()),
                user_id=user_id,
                achievement_id=ach.id,
                progress=0,
                achieved=False
            )
            db.add(ua)

        ua.progress = current_value

        if not ua.achieved and current_value >= ach.goal:
            ua.achieved = True
            ua.achieved_at = datetime.now(timezone.utc)
            newly_unlocked.append(NewlyUnlockedAchievement(
                name=ach.name,
                description=ach.description,
                achievement_type=ach.achievement_type
            ))

    return newly_unlocked


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
            streak_active_today=streak_active_today,
            gems=inventory.gems,
            total_xp=inventory.experience_points,
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

        # Batch-fetch feedback stats for all courses
        feedback_stats_rows = db.execute(
            select(
                Feedback.course_id,
                func.avg(Feedback.rating).label("avg_rating"),
                func.count(Feedback.id).label("review_count")
            ).group_by(Feedback.course_id)
        ).all()
        feedback_stats = {row.course_id: row for row in feedback_stats_rows}

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

            stats = feedback_stats.get(course.id)
            avg_rating = round(float(stats.avg_rating), 1) if stats else None
            review_count = stats.review_count if stats else 0

            course_list.append(BrowseCourseSummary(
                id=course.id,
                name=course.name,
                description=course.description,
                tutor_id=course.created_by,
                tutor_name=course.user.full_name,
                unit_count=unit_count,
                chapter_count=chapter_count,
                lesson_count=lesson_count,
                enrollment_count=enrollment_count,
                tags=tags,
                badge=badge_detail,
                price_gems=course.price_gems,
                discount_percent=course.discount_percent,
                avg_rating=avg_rating,
                review_count=review_count
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

        # Handle gem payment for paid courses
        gems_paid = 0
        if course.price_gems and course.price_gems > 0:
            # Apply discount if set
            if course.discount_percent and 1 <= course.discount_percent <= 99:
                effective_price = int(course.price_gems * (1 - course.discount_percent / 100))
            else:
                effective_price = course.price_gems

            student_inventory = _get_or_create_inventory(user_id, db)
            if student_inventory.gems < effective_price:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient gems. You need {effective_price} gems to enroll."
                )
            # Deduct gems from student
            student_inventory.gems -= effective_price
            gems_paid = effective_price

            # Credit 90% to tutor (app takes 10% commission)
            tutor_gems_earned = int(effective_price * 0.9)
            tutor_inventory = db.execute(
                select(UserInventory).where(UserInventory.user_id == course.created_by)
            ).scalar_one_or_none()
            if not tutor_inventory:
                tutor_inventory = UserInventory(
                    id=str(uuid.uuid4()),
                    user_id=course.created_by
                )
                db.add(tutor_inventory)
                db.flush()
            tutor_inventory.gems += tutor_gems_earned

        # Create enrollment
        enrollment_id = str(uuid.uuid4())
        new_enrollment = Enrollment(
            id=enrollment_id, user_id=user_id,
            course_id=course_id, status="active",
            gems_paid=gems_paid
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
        db.flush()

        # Track courses_enrolled achievement progress
        enrollment_count = db.execute(
            select(func.count()).select_from(Enrollment).where(Enrollment.user_id == user_id)
        ).scalar_one()
        _update_achievement_progress(user_id, "courses_enrolled", enrollment_count, db)

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

        is_new_completion = not already_completed
        if is_new_completion:
            # Create completion record
            completion = LessonCompletion(
                id=str(uuid.uuid4()),
                user_id=user_id,
                lesson_id=lesson_id,
                course_id=course_id
            )
            db.add(completion)
            db.flush()

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

        # Update streak and award XP
        inventory = _get_or_create_inventory(user_id, db)
        streak_updated = _update_streak(inventory, user_id, db)

        xp_earned = 0
        if is_new_completion:
            xp_earned = 30
            inventory.experience_points += xp_earned

            # Update leaderboard XP — auto-join if not yet assigned this week
            week_start, week_end = get_current_week_bounds()
            lb_entry = db.execute(
                select(LeaderboardEntry)
                .join(Leaderboard)
                .where(
                    LeaderboardEntry.user_id == user_id,
                    Leaderboard.status == "open",
                    Leaderboard.week_start >= week_start,
                    Leaderboard.week_start < week_end,
                )
            ).scalar_one_or_none()
            if not lb_entry:
                user_rank = inventory.current_rank if inventory.current_rank in RANKS else RANKS[0]
                candidates = db.execute(
                    select(Leaderboard).where(
                        Leaderboard.rank == user_rank,
                        Leaderboard.status == "open",
                        Leaderboard.week_start >= week_start,
                        Leaderboard.week_start < week_end,
                    )
                ).scalars().all()
                lb = None
                for candidate in candidates:
                    if len(candidate.entries) < LEADERBOARD_MAX_SIZE:
                        lb = candidate
                        break
                if not lb:
                    lb = Leaderboard(
                        id=str(uuid.uuid4()),
                        rank=user_rank,
                        status="open",
                        week_start=week_start,
                        week_end=week_end,
                    )
                    db.add(lb)
                    db.flush()
                lb_entry = LeaderboardEntry(
                    id=str(uuid.uuid4()),
                    leaderboard_id=lb.id,
                    user_id=user_id,
                    xp_earned=0,
                )
                db.add(lb_entry)
                db.flush()
            lb_entry.xp_earned += xp_earned

        # Track achievement progress (only on new completions)
        newly_unlocked: list[NewlyUnlockedAchievement] = []
        if is_new_completion:
            # lessons_completed: total lessons ever completed by this user
            total_lessons_completed = db.execute(
                select(func.count()).select_from(LessonCompletion).where(LessonCompletion.user_id == user_id)
            ).scalar_one()
            newly_unlocked.extend(
                _update_achievement_progress(user_id, "lessons_completed", total_lessons_completed, db)
            )

            # courses_completed: count of enrollments now marked completed
            if course_completed:
                completed_courses_count = db.execute(
                    select(func.count()).select_from(Enrollment)
                    .where(Enrollment.user_id == user_id, Enrollment.status == "completed")
                ).scalar_one()
                newly_unlocked.extend(
                    _update_achievement_progress(user_id, "courses_completed", completed_courses_count, db)
                )

            # streak_days: longest streak ever achieved
            if streak_updated:
                newly_unlocked.extend(
                    _update_achievement_progress(user_id, "streak_days", inventory.longest_streak, db)
                )

        # Update daily quests (completion record already flushed above, so count is accurate)
        today = date.today()
        lessons_today = db.execute(
            select(func.count()).select_from(LessonCompletion).where(
                LessonCompletion.user_id == user_id,
                func.date(LessonCompletion.completed_at) == today,
            )
        ).scalar_one()
        newly_completed_quests, gems_earned, quest_progress = _update_daily_quests(
            user_id, lessons_today, inventory, db
        )

        db.commit()

        return CompleteLessonResponse(
            status="success",
            message="Course completed!" if course_completed else "Lesson completed",
            next_lesson_id=next_lesson_id,
            course_completed=course_completed,
            streak_updated=streak_updated,
            daily_streak=inventory.daily_streak,
            newly_unlocked_achievements=newly_unlocked,
            newly_completed_quests=newly_completed_quests,
            gems_earned=gems_earned,
            total_gems=inventory.gems,
            daily_quest_progress=quest_progress,
            xp_earned=xp_earned,
            total_xp=inventory.experience_points,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error completing lesson: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.get("/achievements")
async def get_achievements(
    current_user: TokenUser = Depends(require_role("learner")),
    db: Session = Depends(get_db)
):
    """Get all achievements with the current user's progress."""
    try:
        user_id = current_user.user_id

        achievements = db.execute(
            select(Achievement).order_by(Achievement.achievement_type, Achievement.goal)
        ).scalars().all()

        user_ach_rows = db.execute(
            select(UserAchievement).where(UserAchievement.user_id == user_id)
        ).scalars().all()
        user_ach_map = {ua.achievement_id: ua for ua in user_ach_rows}

        result = []
        for ach in achievements:
            ua = user_ach_map.get(ach.id)
            result.append(UserAchievementDetail(
                achievement_id=ach.id,
                name=ach.name,
                description=ach.description,
                achievement_type=ach.achievement_type,
                goal=ach.goal,
                progress=ua.progress if ua else 0,
                achieved=ua.achieved if ua else False,
                achieved_at=ua.achieved_at if ua else None,
                image_url=ach.image_url
            ))

        return GetAchievementsResponse(
            status="success",
            message="Achievements retrieved successfully",
            achievements=result
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting achievements: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.get("/daily-quests")
async def get_daily_quests(
    current_user: TokenUser = Depends(require_role("learner")),
    db: Session = Depends(get_db)
):
    """Get today's daily quests with the current user's progress."""
    try:
        user_id = current_user.user_id
        today = date.today()

        inventory = _get_or_create_inventory(user_id, db)
        db.commit()

        quests: list[DailyQuestDetail] = []
        for qdef in DAILY_QUEST_DEFINITIONS:
            qp = db.execute(
                select(UserDailyQuestProgress).where(
                    UserDailyQuestProgress.user_id == user_id,
                    UserDailyQuestProgress.quest_key == qdef["key"],
                    UserDailyQuestProgress.date == today,
                )
            ).scalar_one_or_none()

            quests.append(DailyQuestDetail(
                key=qdef["key"],
                title=qdef["title"],
                description=qdef["description"],
                icon=qdef["icon"],
                quest_type=qdef["quest_type"],
                goal=qdef["goal"],
                gems=qdef["gems"],
                progress=qp.progress if qp else 0,
                completed=qp.completed if qp else False,
            ))

        return GetDailyQuestsResponse(
            status="success",
            message="Daily quests retrieved successfully",
            quests=quests,
            total_gems=inventory.gems,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting daily quests: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.get("/leaderboard")
async def get_leaderboard(
    current_user: TokenUser = Depends(require_role("learner")),
    db: Session = Depends(get_db)
):
    """Get or join the current week's leaderboard for the authenticated student."""
    try:
        user_id = current_user.user_id

        # Close any expired leaderboards and update ranks before assigning the user.
        # This is the reliable reset path — the APScheduler job is best-effort only.
        from app.utils.leaderboard_utils import process_leaderboard_resets
        process_leaderboard_resets(db)

        inventory = _get_or_create_inventory(user_id, db)
        user_rank = inventory.current_rank if inventory.current_rank in RANKS else RANKS[0]

        week_start, week_end = get_current_week_bounds()

        # Check if user already has an active entry this week
        existing_entry = db.execute(
            select(LeaderboardEntry)
            .join(Leaderboard)
            .where(
                LeaderboardEntry.user_id == user_id,
                Leaderboard.status == "open",
                Leaderboard.week_start >= week_start,
                Leaderboard.week_start < week_end,
            )
        ).scalar_one_or_none()

        if existing_entry:
            lb = existing_entry.leaderboard
            my_entry = existing_entry
        else:
            # Find an open leaderboard with room, or create one
            candidates = db.execute(
                select(Leaderboard).where(
                    Leaderboard.rank == user_rank,
                    Leaderboard.status == "open",
                    Leaderboard.week_start >= week_start,
                    Leaderboard.week_start < week_end,
                )
            ).scalars().all()

            lb = None
            for candidate in candidates:
                if len(candidate.entries) < LEADERBOARD_MAX_SIZE:
                    lb = candidate
                    break

            if not lb:
                lb = Leaderboard(
                    id=str(uuid.uuid4()),
                    rank=user_rank,
                    status="open",
                    week_start=week_start,
                    week_end=week_end,
                )
                db.add(lb)
                db.flush()

            my_entry = LeaderboardEntry(
                id=str(uuid.uuid4()),
                leaderboard_id=lb.id,
                user_id=user_id,
                xp_earned=0,
            )
            db.add(my_entry)
            db.flush()

        db.commit()
        db.refresh(lb)

        # Build sorted member list
        entries = sorted(lb.entries, key=lambda e: e.xp_earned, reverse=True)
        n = len(entries)

        members = []
        my_position = 1
        my_xp = my_entry.xp_earned

        for i, entry in enumerate(entries):
            members.append(LeaderboardMemberDetail(
                user_id=entry.user_id,
                full_name=entry.user.full_name,
                xp_earned=entry.xp_earned,
                rank_position=i + 1,
            ))
            if entry.user_id == user_id:
                my_position = i + 1
                my_xp = entry.xp_earned

        effective_relegation = RELEGATION_COUNT if n >= (PROMOTION_COUNT + RELEGATION_COUNT) else 0

        return GetLeaderboardResponse(
            status="success",
            message="Leaderboard retrieved",
            leaderboard_id=lb.id,
            rank=lb.rank,
            week_start=lb.week_start,
            week_end=lb.week_end,
            members=members,
            my_position=my_position,
            my_xp=my_xp,
            promotion_zone=PROMOTION_COUNT,
            relegation_zone=effective_relegation,
            total_members=n,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting leaderboard: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


def _build_browse_summary(course: Course, db: Session) -> BrowseCourseSummary:
    """Build a BrowseCourseSummary for a single course including feedback stats."""
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

    row = db.execute(
        select(func.avg(Feedback.rating).label("avg"), func.count(Feedback.id).label("cnt"))
        .where(Feedback.course_id == course.id)
    ).one()
    avg_rating = round(float(row.avg), 1) if row.avg else None
    review_count = row.cnt or 0

    return BrowseCourseSummary(
        id=course.id,
        name=course.name,
        description=course.description,
        tutor_id=course.created_by,
        tutor_name=course.user.full_name,
        unit_count=unit_count,
        chapter_count=chapter_count,
        lesson_count=lesson_count,
        enrollment_count=enrollment_count,
        tags=tags,
        badge=badge_detail,
        price_gems=course.price_gems,
        discount_percent=course.discount_percent,
        avg_rating=avg_rating,
        review_count=review_count,
    )


@router.get("/course/{course_id}/public")
async def get_course_public_detail(
    course_id: str,
    current_user: TokenUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Public course detail page — no enrollment required."""
    try:
        course = db.execute(
            select(Course).where(Course.id == course_id, Course.status == "published")
        ).scalar_one_or_none()
        if not course:
            raise NotFoundException("Course")

        return GetCoursePublicDetailResponse(
            status="success",
            message="Course retrieved",
            course=_build_browse_summary(course, db)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting public course detail: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.get("/course/{course_id}/reviews")
async def get_course_reviews(
    course_id: str,
    current_user: TokenUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all reviews for a course."""
    try:
        reviews_rows = db.execute(
            select(Feedback).where(Feedback.course_id == course_id).order_by(Feedback.created_at.desc())
        ).scalars().all()

        items = [
            CourseFeedbackItem(
                id=fb.id,
                user_name=fb.user.full_name,
                rating=fb.rating,
                comment=fb.comment,
                created_at=fb.created_at,
            )
            for fb in reviews_rows
        ]

        row = db.execute(
            select(func.avg(Feedback.rating).label("avg"), func.count(Feedback.id).label("cnt"))
            .where(Feedback.course_id == course_id)
        ).one()
        avg_rating = round(float(row.avg), 1) if row.avg else None

        return GetCourseFeedbackResponse(
            status="success",
            message="Reviews retrieved",
            reviews=items,
            avg_rating=avg_rating,
            review_count=row.cnt or 0,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting course reviews: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.get("/course/{course_id}/my-feedback")
async def get_my_feedback(
    course_id: str,
    current_user: TokenUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the current user's feedback for a course."""
    try:
        fb = db.execute(
            select(Feedback).where(Feedback.course_id == course_id, Feedback.user_id == current_user.user_id)
        ).scalar_one_or_none()

        if fb:
            return MyFeedbackResponse(status="success", message="Feedback found", has_feedback=True, rating=fb.rating, comment=fb.comment)
        return MyFeedbackResponse(status="success", message="No feedback yet", has_feedback=False)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting my feedback: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.post("/course/{course_id}/feedback")
async def submit_feedback(
    course_id: str,
    request: SubmitFeedbackRequest,
    current_user: TokenUser = Depends(require_role("learner")),
    db: Session = Depends(get_db)
):
    """Submit or update a rating/review for an enrolled course."""
    try:
        if not (1 <= request.rating <= 5):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rating must be between 1 and 5")

        enrollment = db.execute(
            select(Enrollment).where(Enrollment.user_id == current_user.user_id, Enrollment.course_id == course_id)
        ).scalar_one_or_none()
        if not enrollment:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You must be enrolled to leave a review")

        existing = db.execute(
            select(Feedback).where(Feedback.user_id == current_user.user_id, Feedback.course_id == course_id)
        ).scalar_one_or_none()

        if existing:
            existing.rating = request.rating
            existing.comment = request.comment
            existing.updated_at = datetime.now(timezone.utc)
            db.commit()
            return SubmitFeedbackResponse(status="success", message="Review updated", feedback_id=existing.id)
        else:
            fb = Feedback(
                id=str(uuid.uuid4()),
                user_id=current_user.user_id,
                course_id=course_id,
                rating=request.rating,
                comment=request.comment,
            )
            db.add(fb)
            db.commit()
            return SubmitFeedbackResponse(status="success", message="Review submitted", feedback_id=fb.id)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error submitting feedback: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")
