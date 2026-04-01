from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_
from app.auth.dependencies import require_role
from app.utils.db_utils import get_db
from app.utils.analytics_utils import monthly_periods, parse_date_bounds
from app.models.models import TokenUser
from app.models.request_models import CreateRedeemRequestRequest
from app.models.response_models import (
    TutorInventoryResponse, CreateRedeemRequestResponse,
    GetTutorRedeemRequestsResponse, RedeemRequestDetail,
    TutorAnalyticsOverviewResponse, TutorCourseAnalyticsResponse,
    TrendPoint, RevenueTrendPoint, TopCourse,
    LessonFunnelItem, ProgressBucket, RecentFeedbackItem,
)
from app.models.db_models import (
    UserInventory, TutorRedeemRequest, User,
    Course, Enrollment, LessonCompletion, Feedback,
    Unit, Chapter, Lesson,
)
import logging
import uuid
from datetime import datetime, timezone, date
from typing import Optional

_SHOW_NAME = "tutor"
router = APIRouter(
    prefix=f"/{_SHOW_NAME}",
    tags=[_SHOW_NAME],
    responses={404: {"description": "Not found"}},
)

logger = logging.getLogger(__name__)

GEM_TO_RS = 0.8


def _get_or_create_inventory(user_id: str, db: Session) -> UserInventory:
    inventory = db.execute(
        select(UserInventory).where(UserInventory.user_id == user_id)
    ).scalar_one_or_none()
    if not inventory:
        inventory = UserInventory(id=str(uuid.uuid4()), user_id=user_id)
        db.add(inventory)
        db.flush()
    return inventory


@router.get("/inventory")
async def get_tutor_inventory(
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db),
):
    """Return the tutor's redeemable gem balance."""
    try:
        inventory = _get_or_create_inventory(current_user.user_id, db)
        db.commit()
        return TutorInventoryResponse(
            status="success",
            message="Inventory retrieved successfully",
            gems=inventory.gems,
            gems_value_rs=round(inventory.gems * GEM_TO_RS, 2),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting tutor inventory: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.post("/redeem")
async def create_redeem_request(
    request: CreateRedeemRequestRequest,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db),
):
    """Create a gem redemption request. Gems are deducted immediately and held pending admin approval."""
    try:
        if request.gems <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="gems must be a positive integer")
        if request.gems < 100:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Minimum redemption is 100 gems")

        inventory = _get_or_create_inventory(current_user.user_id, db)
        if inventory.gems < request.gems:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient gems. You have {inventory.gems} gems."
            )

        # Deduct gems immediately (held while pending)
        inventory.gems -= request.gems

        amount_rs = int(request.gems * GEM_TO_RS)
        redeem_request = TutorRedeemRequest(
            id=str(uuid.uuid4()),
            tutor_id=current_user.user_id,
            gems_requested=request.gems,
            amount_rs=amount_rs,
            status="pending",
        )
        db.add(redeem_request)
        db.commit()

        return CreateRedeemRequestResponse(
            status="success",
            message="Redeem request submitted successfully. Your gems have been held pending admin approval.",
            request_id=redeem_request.id,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error creating redeem request: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.get("/redeem-requests")
async def get_tutor_redeem_requests(
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db),
):
    """Get all redeem requests for the logged-in tutor."""
    try:
        requests = db.execute(
            select(TutorRedeemRequest)
            .where(TutorRedeemRequest.tutor_id == current_user.user_id)
            .order_by(TutorRedeemRequest.created_at.desc())
        ).scalars().all()

        inventory = _get_or_create_inventory(current_user.user_id, db)
        db.commit()

        tutor_name = db.execute(
            select(User).where(User.user_id == current_user.user_id)
        ).scalar_one().full_name

        request_details = [
            RedeemRequestDetail(
                id=r.id,
                tutor_id=r.tutor_id,
                tutor_name=tutor_name,
                gems_requested=r.gems_requested,
                amount_rs=r.amount_rs,
                status=r.status,
                notes=r.notes,
                created_at=r.created_at,
                processed_at=r.processed_at,
            )
            for r in requests
        ]

        return GetTutorRedeemRequestsResponse(
            status="success",
            message="Redeem requests retrieved successfully",
            requests=request_details,
            current_gems=inventory.gems,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting tutor redeem requests: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


# ─── Analytics ────────────────────────────────────────────────────

@router.get("/analytics/overview", response_model=TutorAnalyticsOverviewResponse)
async def get_analytics_overview(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db),
):
    """Overall analytics for all of the tutor's courses."""
    try:
        tutor_id = current_user.user_id
        start_dt, end_dt = parse_date_bounds(start_date, end_date)

        course_ids = db.execute(
            select(Course.id).where(Course.created_by == tutor_id)
        ).scalars().all()

        periods = monthly_periods(start_dt, end_dt)

        if not course_ids:
            return TutorAnalyticsOverviewResponse(
                status="success", message="No courses found",
                total_students=0, total_enrollments=0, avg_rating=None,
                total_gems_earned=0,
                enrollment_trend=[TrendPoint(period=p, count=0) for p in periods],
                revenue_trend=[RevenueTrendPoint(period=p, gems=0) for p in periods],
                rating_distribution={"1": 0, "2": 0, "3": 0, "4": 0, "5": 0},
                top_courses=[],
            )

        enroll_filter = and_(
            Enrollment.course_id.in_(course_ids),
            Enrollment.enrolled_at >= start_dt,
            Enrollment.enrolled_at <= end_dt,
        )
        enrollments = db.execute(select(Enrollment).where(enroll_filter)).scalars().all()

        total_enrollments = len(enrollments)
        total_students = len({e.user_id for e in enrollments})
        total_gems_earned = int(sum(e.gems_paid * 0.9 for e in enrollments))

        period_counts: dict[str, int] = {}
        period_gems: dict[str, int] = {}
        for e in enrollments:
            p = e.enrolled_at.strftime("%Y-%m")
            period_counts[p] = period_counts.get(p, 0) + 1
            period_gems[p] = period_gems.get(p, 0) + int(e.gems_paid * 0.9)

        enrollment_trend = [TrendPoint(period=p, count=period_counts.get(p, 0)) for p in periods]
        revenue_trend = [RevenueTrendPoint(period=p, gems=period_gems.get(p, 0)) for p in periods]

        feedback_filter = and_(
            Feedback.course_id.in_(course_ids),
            Feedback.created_at >= start_dt,
            Feedback.created_at <= end_dt,
        )
        feedbacks = db.execute(select(Feedback).where(feedback_filter)).scalars().all()
        rating_dist = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
        for f in feedbacks:
            rating_dist[str(f.rating)] = rating_dist.get(str(f.rating), 0) + 1
        avg_rating = round(sum(f.rating for f in feedbacks) / len(feedbacks), 2) if feedbacks else None

        top_courses = []
        for cid in course_ids:
            course = db.execute(select(Course).where(Course.id == cid)).scalar_one_or_none()
            if not course:
                continue
            c_count = db.execute(
                select(func.count()).select_from(Enrollment).where(Enrollment.course_id == cid)
            ).scalar_one()
            c_gems = db.execute(
                select(func.coalesce(func.sum(Enrollment.gems_paid), 0)).where(Enrollment.course_id == cid)
            ).scalar_one()
            c_fbs = db.execute(select(Feedback).where(Feedback.course_id == cid)).scalars().all()
            c_avg = round(sum(f.rating for f in c_fbs) / len(c_fbs), 2) if c_fbs else None
            top_courses.append(TopCourse(
                course_id=cid, name=course.name,
                enrollments=c_count, avg_rating=c_avg,
                gems_earned=int(c_gems * 0.9),
            ))
        top_courses.sort(key=lambda c: c.enrollments, reverse=True)

        return TutorAnalyticsOverviewResponse(
            status="success", message="Analytics retrieved successfully",
            total_students=total_students,
            total_enrollments=total_enrollments,
            avg_rating=avg_rating,
            total_gems_earned=total_gems_earned,
            enrollment_trend=enrollment_trend,
            revenue_trend=revenue_trend,
            rating_distribution=rating_dist,
            top_courses=top_courses,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting analytics overview: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.get("/analytics/course/{course_id}", response_model=TutorCourseAnalyticsResponse)
async def get_course_analytics(
    course_id: str,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db),
):
    """Per-course analytics."""
    try:
        tutor_id = current_user.user_id
        start_dt, end_dt = parse_date_bounds(start_date, end_date)

        course = db.execute(select(Course).where(Course.id == course_id)).scalar_one_or_none()
        if not course or course.created_by != tutor_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

        enroll_filter = and_(
            Enrollment.course_id == course_id,
            Enrollment.enrolled_at >= start_dt,
            Enrollment.enrolled_at <= end_dt,
        )
        enrollments = db.execute(select(Enrollment).where(enroll_filter)).scalars().all()
        total_enrolled = len(enrollments)
        completed_count = sum(1 for e in enrollments if e.completed_at is not None)
        completion_rate = round(completed_count / total_enrolled * 100, 1) if total_enrolled else 0.0
        gems_earned = int(sum(e.gems_paid * 0.9 for e in enrollments))

        periods = monthly_periods(start_dt, end_dt)
        period_counts: dict[str, int] = {}
        for e in enrollments:
            p = e.enrolled_at.strftime("%Y-%m")
            period_counts[p] = period_counts.get(p, 0) + 1
        enrollment_trend = [TrendPoint(period=p, count=period_counts.get(p, 0)) for p in periods]

        feedback_filter = and_(
            Feedback.course_id == course_id,
            Feedback.created_at >= start_dt,
            Feedback.created_at <= end_dt,
        )
        feedbacks = db.execute(
            select(Feedback).where(feedback_filter).order_by(Feedback.created_at.desc())
        ).scalars().all()
        total_reviews = len(feedbacks)
        avg_rating = round(sum(f.rating for f in feedbacks) / total_reviews, 2) if feedbacks else None
        rating_breakdown = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
        for f in feedbacks:
            rating_breakdown[str(f.rating)] = rating_breakdown.get(str(f.rating), 0) + 1

        recent_feedback = []
        for f in feedbacks[:5]:
            user = db.execute(select(User).where(User.user_id == f.user_id)).scalar_one_or_none()
            recent_feedback.append(RecentFeedbackItem(
                user_name=user.full_name if user else "Unknown",
                rating=f.rating,
                comment=f.comment,
                created_at=f.created_at,
            ))

        # Lesson funnel — all-time completions, ordered by indices
        units = db.execute(
            select(Unit).where(Unit.course_id == course_id).order_by(Unit.unit_index)
        ).scalars().all()
        funnel: list[LessonFunnelItem] = []
        for unit in units:
            chapters = db.execute(
                select(Chapter).where(Chapter.unit_id == unit.id).order_by(Chapter.chapter_index)
            ).scalars().all()
            for chapter in chapters:
                lessons = db.execute(
                    select(Lesson).where(Lesson.chapter_id == chapter.id).order_by(Lesson.lesson_index)
                ).scalars().all()
                for lesson in lessons:
                    completions = db.execute(
                        select(func.count()).select_from(LessonCompletion).where(
                            LessonCompletion.lesson_id == lesson.id,
                            LessonCompletion.course_id == course_id,
                        )
                    ).scalar_one()
                    funnel.append(LessonFunnelItem(
                        lesson_id=lesson.id,
                        lesson_name=lesson.name,
                        unit_index=unit.unit_index,
                        chapter_index=chapter.chapter_index,
                        lesson_index=lesson.lesson_index,
                        completions=completions,
                    ))

        # Progress distribution — all enrolled students, all-time
        all_enrollments = db.execute(
            select(Enrollment).where(Enrollment.course_id == course_id)
        ).scalars().all()
        total_lessons = len(funnel)
        buckets = {"0-25%": 0, "25-50%": 0, "50-75%": 0, "75-99%": 0, "100%": 0}
        if total_lessons > 0:
            for e in all_enrollments:
                done = db.execute(
                    select(func.count()).select_from(LessonCompletion).where(
                        LessonCompletion.user_id == e.user_id,
                        LessonCompletion.course_id == course_id,
                    )
                ).scalar_one()
                pct = done / total_lessons * 100
                if pct >= 100:
                    buckets["100%"] += 1
                elif pct >= 75:
                    buckets["75-99%"] += 1
                elif pct >= 50:
                    buckets["50-75%"] += 1
                elif pct >= 25:
                    buckets["25-50%"] += 1
                else:
                    buckets["0-25%"] += 1
        progress_distribution = [ProgressBucket(label=k, count=v) for k, v in buckets.items()]

        return TutorCourseAnalyticsResponse(
            status="success", message="Course analytics retrieved successfully",
            course_id=course_id, course_name=course.name,
            total_enrolled=total_enrolled,
            completed_count=completed_count,
            completion_rate=completion_rate,
            avg_rating=avg_rating,
            total_reviews=total_reviews,
            gems_earned=gems_earned,
            enrollment_trend=enrollment_trend,
            lesson_funnel=funnel,
            progress_distribution=progress_distribution,
            rating_breakdown=rating_breakdown,
            recent_feedback=recent_feedback,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting course analytics: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")
