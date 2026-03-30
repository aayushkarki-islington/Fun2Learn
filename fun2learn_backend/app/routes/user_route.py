from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import select, func, distinct
import logging
import os
import uuid

from app.models.models import TokenUser
from app.models.request_models import UpdateProfileRequest
from app.models.response_models import (
    UserResponse, BadgeDetail,
    UserProfileDetail, TutorProfileCourse, GetMyProfileResponse, UpdateProfileResponse,
    UploadProfilePictureResponse, FollowResponse,
    GetFollowersResponse, GetFollowingResponse, SearchUsersResponse, UserSummaryDetail
)
from app.models.db_models import (
    User, UserInventory, LessonCompletion, Enrollment, UserAchievement,
    Following, Course, Badge, Feedback
)
from app.auth.dependencies import get_current_user
from app.utils.db_utils import get_db
from app.utils.boto3_utils import upload_file_to_s3, get_presigned_url_from_path

_SHOW_NAME = "user"
router = APIRouter(
    prefix=f"/{_SHOW_NAME}",
    tags=[_SHOW_NAME],
    responses={404: {"description": "Not found"}},
)

logger = logging.getLogger(__name__)

USERS_BUCKET = os.getenv("AWS_USERS_BUCKET_NAME", "")

# ─── /me ─────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: TokenUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the currently authenticated user's basic data."""
    user = db.query(User).filter(User.user_id == current_user.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserResponse(
        user_id=user.user_id,
        full_name=user.full_name,
        username=user.username,
        email=user.email,
        birthdate=str(user.birthdate) if user.birthdate else None,
        role=user.role,
        gender=user.gender,
        image_path=get_presigned_url_from_path(user.image_path, USERS_BUCKET)
    )


# ─── Profile helpers ──────────────────────────────────────

def _build_user_profile(target_user: User, viewer_user_id: str, db: Session) -> UserProfileDetail:
    """Build a UserProfileDetail for any user, from the perspective of viewer_user_id."""
    inventory = db.execute(
        select(UserInventory).where(UserInventory.user_id == target_user.user_id)
    ).scalar_one_or_none()

    lessons_completed = db.execute(
        select(func.count()).select_from(LessonCompletion).where(LessonCompletion.user_id == target_user.user_id)
    ).scalar_one()

    courses_enrolled = db.execute(
        select(func.count()).select_from(Enrollment).where(Enrollment.user_id == target_user.user_id)
    ).scalar_one()

    total_achievements = db.execute(
        select(func.count()).select_from(UserAchievement).where(
            UserAchievement.user_id == target_user.user_id,
            UserAchievement.achieved == True
        )
    ).scalar_one()

    followers_count = db.execute(
        select(func.count()).select_from(Following).where(Following.following_user_id == target_user.user_id)
    ).scalar_one()

    following_count = db.execute(
        select(func.count()).select_from(Following).where(Following.follower_user_id == target_user.user_id)
    ).scalar_one()

    is_following = False
    if viewer_user_id != target_user.user_id:
        follow_row = db.execute(
            select(Following).where(
                Following.follower_user_id == viewer_user_id,
                Following.following_user_id == target_user.user_id
            )
        ).scalar_one_or_none()
        is_following = follow_row is not None

    # Earned badges: one per completed course that has a badge
    completed_enrollments = db.execute(
        select(Enrollment).where(
            Enrollment.user_id == target_user.user_id,
            Enrollment.status == "completed"
        )
    ).scalars().all()

    earned_badges = []
    seen_badge_ids = set()
    for enrollment in completed_enrollments:
        course = db.execute(select(Course).where(Course.id == enrollment.course_id)).scalar_one_or_none()
        if course and course.badge and course.badge.id not in seen_badge_ids:
            seen_badge_ids.add(course.badge.id)
            earned_badges.append(BadgeDetail(
                id=course.badge.id,
                name=course.badge.name,
                badge_type=course.badge.badge_type,
                icon_name=course.badge.icon_name,
                image_url=course.badge.image_url,
                course_id=course.badge.course_id,
            ))

    image_url = get_presigned_url_from_path(target_user.image_path, USERS_BUCKET)

    # Tutor-specific stats
    courses_created = None
    avg_course_rating = None
    total_unique_students = None
    tutor_courses = None

    if target_user.role == "tutor":
        tutor_courses_db = db.execute(
            select(Course).where(
                Course.created_by == target_user.user_id,
                Course.status == "published"
            )
        ).scalars().all()

        courses_created = len(tutor_courses_db)
        course_ids = [c.id for c in tutor_courses_db]

        if course_ids:
            total_unique_students = db.execute(
                select(func.count(distinct(Enrollment.user_id))).where(
                    Enrollment.course_id.in_(course_ids)
                )
            ).scalar_one()

            overall_avg = db.execute(
                select(func.avg(Feedback.rating)).where(
                    Feedback.course_id.in_(course_ids)
                )
            ).scalar_one()
            avg_course_rating = round(float(overall_avg), 1) if overall_avg else None
        else:
            total_unique_students = 0
            avg_course_rating = None

        tutor_courses = []
        for course in tutor_courses_db:
            course_avg = db.execute(
                select(func.avg(Feedback.rating)).where(Feedback.course_id == course.id)
            ).scalar_one()
            course_review_count = db.execute(
                select(func.count()).select_from(Feedback).where(Feedback.course_id == course.id)
            ).scalar_one()
            course_enrollment_count = db.execute(
                select(func.count()).select_from(Enrollment).where(Enrollment.course_id == course.id)
            ).scalar_one()
            badge_detail = None
            if course.badge:
                badge_detail = BadgeDetail(
                    id=course.badge.id,
                    name=course.badge.name,
                    badge_type=course.badge.badge_type,
                    icon_name=course.badge.icon_name,
                    image_url=course.badge.image_url,
                    course_id=course.badge.course_id,
                )
            tutor_courses.append(TutorProfileCourse(
                id=course.id,
                name=course.name,
                description=course.description,
                avg_rating=round(float(course_avg), 1) if course_avg else None,
                review_count=course_review_count,
                enrollment_count=course_enrollment_count,
                badge=badge_detail,
                price_gems=course.price_gems,
                discount_percent=course.discount_percent,
            ))

    return UserProfileDetail(
        user_id=target_user.user_id,
        full_name=target_user.full_name,
        username=target_user.username,
        email=target_user.email if viewer_user_id == target_user.user_id else None,
        image_path=image_url,
        role=target_user.role,
        current_rank=inventory.current_rank if inventory else "bronze",
        daily_streak=inventory.daily_streak if inventory else 0,
        longest_streak=inventory.longest_streak if inventory else 0,
        experience_points=inventory.experience_points if inventory else 0,
        total_achievements=total_achievements,
        lessons_completed=lessons_completed,
        courses_enrolled=courses_enrolled,
        followers_count=followers_count,
        following_count=following_count,
        earned_badges=earned_badges,
        is_following=is_following,
        is_own_profile=(viewer_user_id == target_user.user_id),
        courses_created=courses_created,
        avg_course_rating=avg_course_rating,
        total_unique_students=total_unique_students,
        tutor_courses=tutor_courses,
    )


def _build_user_summary(u: User, viewer_user_id: str, db: Session) -> UserSummaryDetail:
    inv = db.execute(select(UserInventory).where(UserInventory.user_id == u.user_id)).scalar_one_or_none()
    am_following = db.execute(
        select(Following).where(
            Following.follower_user_id == viewer_user_id,
            Following.following_user_id == u.user_id
        )
    ).scalar_one_or_none() is not None
    return UserSummaryDetail(
        user_id=u.user_id,
        full_name=u.full_name,
        username=u.username,
        image_path=get_presigned_url_from_path(u.image_path, USERS_BUCKET),
        current_rank=inv.current_rank if inv else "bronze",
        is_following=am_following,
    )


# ─── Profile endpoints ────────────────────────────────────

@router.get("/profile")
async def get_my_profile(
    current_user: TokenUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the authenticated user's own profile with full stats."""
    try:
        user = db.execute(select(User).where(User.user_id == current_user.user_id)).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        profile = _build_user_profile(user, current_user.user_id, db)
        return GetMyProfileResponse(status="success", message="Profile retrieved", profile=profile)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting profile: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.put("/profile")
async def update_profile(
    request: UpdateProfileRequest,
    current_user: TokenUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update the authenticated user's name and/or username."""
    try:
        user = db.execute(select(User).where(User.user_id == current_user.user_id)).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        if request.username and request.username != user.username:
            existing = db.execute(
                select(User).where(User.username == request.username, User.user_id != current_user.user_id)
            ).scalar_one_or_none()
            if existing:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")
            user.username = request.username

        if request.full_name:
            user.full_name = request.full_name

        db.commit()
        return UpdateProfileResponse(status="success", message="Profile updated successfully")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error updating profile: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.post("/profile/picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: TokenUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload or replace the authenticated user's profile picture."""
    try:
        user = db.execute(select(User).where(User.user_id == current_user.user_id)).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        bucket_name = USERS_BUCKET
        _, s3_key = upload_file_to_s3(file, bucket_name, folder="profile_pictures")
        user.image_path = s3_key
        db.commit()

        presigned_url = get_presigned_url_from_path(s3_key, bucket_name)
        return UploadProfilePictureResponse(
            status="success",
            message="Profile picture updated",
            image_path=presigned_url or s3_key
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error uploading profile picture: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.get("/profile/{user_id}")
async def get_user_profile(
    user_id: str,
    current_user: TokenUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get any user's public profile."""
    try:
        target_user = db.execute(select(User).where(User.user_id == user_id)).scalar_one_or_none()
        if not target_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        profile = _build_user_profile(target_user, current_user.user_id, db)
        return GetMyProfileResponse(status="success", message="Profile retrieved", profile=profile)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting user profile: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


# ─── Follow endpoints ─────────────────────────────────────

@router.post("/follow/{target_user_id}")
async def follow_user(
    target_user_id: str,
    current_user: TokenUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Follow another user."""
    try:
        if target_user_id == current_user.user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot follow yourself")

        target = db.execute(select(User).where(User.user_id == target_user_id)).scalar_one_or_none()
        if not target:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        existing = db.execute(
            select(Following).where(
                Following.follower_user_id == current_user.user_id,
                Following.following_user_id == target_user_id
            )
        ).scalar_one_or_none()

        if existing:
            return FollowResponse(status="success", message="Already following this user")

        db.add(Following(
            following_id=str(uuid.uuid4()),
            follower_user_id=current_user.user_id,
            following_user_id=target_user_id,
        ))
        db.commit()
        return FollowResponse(status="success", message="Now following user")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error following user: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.delete("/follow/{target_user_id}")
async def unfollow_user(
    target_user_id: str,
    current_user: TokenUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unfollow a user."""
    try:
        existing = db.execute(
            select(Following).where(
                Following.follower_user_id == current_user.user_id,
                Following.following_user_id == target_user_id
            )
        ).scalar_one_or_none()

        if not existing:
            return FollowResponse(status="success", message="Not following this user")

        db.delete(existing)
        db.commit()
        return FollowResponse(status="success", message="Unfollowed user")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error unfollowing user: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.get("/followers")
async def get_followers(
    current_user: TokenUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the list of users who follow the authenticated user."""
    try:
        rows = db.execute(
            select(Following).where(Following.following_user_id == current_user.user_id)
            .order_by(Following.created_at.desc())
        ).scalars().all()

        users = []
        for row in rows:
            follower = row.follower_user
            inv = db.execute(select(UserInventory).where(UserInventory.user_id == follower.user_id)).scalar_one_or_none()
            am_following = db.execute(
                select(Following).where(
                    Following.follower_user_id == current_user.user_id,
                    Following.following_user_id == follower.user_id
                )
            ).scalar_one_or_none() is not None
            users.append(UserSummaryDetail(
                user_id=follower.user_id,
                full_name=follower.full_name,
                username=follower.username,
                image_path=get_presigned_url_from_path(follower.image_path, USERS_BUCKET),
                current_rank=inv.current_rank if inv else "bronze",
                is_following=am_following,
            ))

        return GetFollowersResponse(status="success", message="Followers retrieved", users=users, count=len(users))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting followers: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.get("/following")
async def get_following(
    current_user: TokenUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the list of users the authenticated user is following."""
    try:
        rows = db.execute(
            select(Following).where(Following.follower_user_id == current_user.user_id)
            .order_by(Following.created_at.desc())
        ).scalars().all()

        users = []
        for row in rows:
            target = row.following_user
            inv = db.execute(select(UserInventory).where(UserInventory.user_id == target.user_id)).scalar_one_or_none()
            users.append(UserSummaryDetail(
                user_id=target.user_id,
                full_name=target.full_name,
                username=target.username,
                image_path=get_presigned_url_from_path(target.image_path, USERS_BUCKET),
                current_rank=inv.current_rank if inv else "bronze",
                is_following=True,
            ))

        return GetFollowingResponse(status="success", message="Following retrieved", users=users, count=len(users))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting following: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.get("/search")
async def search_users(
    q: str = "",
    current_user: TokenUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search for users by name or username."""
    try:
        if not q or len(q) < 2:
            return SearchUsersResponse(status="success", message="Enter at least 2 characters", users=[])

        search_term = f"%{q.lower()}%"
        results = db.execute(
            select(User).where(
                (func.lower(User.full_name).like(search_term)) |
                (func.lower(User.username).like(search_term)),
                User.user_id != current_user.user_id,
                User.status == "active"
            ).limit(20)
        ).scalars().all()

        users = [_build_user_summary(u, current_user.user_id, db) for u in results]
        return SearchUsersResponse(status="success", message="Search results", users=users)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error searching users: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")
