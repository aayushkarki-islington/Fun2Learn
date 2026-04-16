from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SignUpResponse(BaseModel):
    status: str
    message: str
    user_id: Optional[str] = None

class SignInResponse(BaseModel):
    status: str
    message: str
    access_token: Optional[str] = None
    token_type: Optional[str] = "bearer"
    user: Optional[dict] = None

class CourseCreationResponse(BaseModel):
    status: str
    message: str
    course_id: str

class AddUnitResponse(BaseModel):
    status: str
    message: str
    unit_id: str
    unit_index: int

class AddChapterResponse(BaseModel):
    status: str
    message: str
    chapter_id: str
    chapter_index: int

class AddLessonResponse(BaseModel):
    status: str
    message: str
    lesson_id: str
    lesson_index: int

class AddMCQQuestionResponse(BaseModel):
    status: str
    message: str
    question_id: str

class AddTextQuestionResponse(BaseModel):
    status: str
    message: str
    question_id: str

class EditCourseResponse(BaseModel):
    status: str
    message: str
    course_id: str

class DeleteCourseResponse(BaseModel):
    status: str
    message: str

class EditUnitResponse(BaseModel):
    status: str
    message: str
    unit_id: str

class DeleteUnitResponse(BaseModel):
    status: str
    message: str

class EditChapterResponse(BaseModel):
    status: str
    message: str
    chapter_id: str

class DeleteChapterResponse(BaseModel):
    status: str
    message: str

class EditLessonResponse(BaseModel):
    status: str
    message: str
    lesson_id: str

class DeleteLessonResponse(BaseModel):
    status: str
    message: str

class EditMCQQuestionResponse(BaseModel):
    status: str
    message: str
    question_id: str

class EditTextQuestionResponse(BaseModel):
    status: str
    message: str
    question_id: str

class DeleteQuestionResponse(BaseModel):
    status: str
    message: str

class PublishCourseResponse(BaseModel):
    status: str
    message: str
    course_id: str

class MCQOptionDetail(BaseModel):
    id: str
    option_text: str
    is_correct: bool

class TextAnswerDetail(BaseModel):
    id: str
    correct_answer: str
    casing_matters: bool

class QuestionDetail(BaseModel):
    id: str
    question_text: str
    question_type: str
    mcq_options: Optional[List[MCQOptionDetail]] = None
    text_answer: Optional[TextAnswerDetail] = None

class LessonDetail(BaseModel):
    id: str
    name: str
    lesson_index: int
    created_at: datetime
    question_count: int

class ChapterDetail(BaseModel):
    id: str
    name: str
    chapter_index: int
    created_at: datetime
    lessons: List[LessonDetail]

class UnitDetail(BaseModel):
    id: str
    name: str
    description: Optional[str]
    unit_index: int
    created_at: datetime
    chapters: List[ChapterDetail]

class CourseDetail(BaseModel):
    id: str
    name: str
    description: str
    status: str
    created_at: datetime
    units: List[UnitDetail]
    price_gems: Optional[int] = None
    discount_percent: Optional[int] = None

class CourseSummary(BaseModel):
    id: str
    name: str
    description: str
    status: str
    created_at: datetime
    unit_count: int
    chapter_count: int
    lesson_count: int
    question_count: int
    price_gems: Optional[int] = None
    discount_percent: Optional[int] = None

class GetCoursesResponse(BaseModel):
    status: str
    message: str
    courses: List[CourseSummary]

class GetCourseDetailResponse(BaseModel):
    status: str
    message: str
    course: CourseDetail

class UserResponse(BaseModel):
    user_id: str
    full_name: str
    username: Optional[str] = None
    email: str
    birthdate: Optional[str] = None
    role: str
    gender: str
    image_path: Optional[str] = None


class UserSummaryDetail(BaseModel):
    user_id: str
    full_name: str
    username: Optional[str] = None
    image_path: Optional[str] = None
    current_rank: Optional[str] = None
    gender: str = 'male'
    role: str = 'learner'
    is_following: bool = False


class UserProfileDetail(BaseModel):
    user_id: str
    full_name: str
    username: Optional[str] = None
    email: Optional[str] = None
    image_path: Optional[str] = None
    role: str = "student"
    gender: str = "male"
    current_rank: str
    daily_streak: int
    longest_streak: int
    experience_points: int
    total_achievements: int
    lessons_completed: int
    courses_enrolled: int
    followers_count: int
    following_count: int
    earned_badges: List["BadgeDetail"] = []
    is_following: bool = False
    is_own_profile: bool = False
    # Tutor-specific fields (populated only when role == "tutor")
    courses_created: Optional[int] = None
    avg_course_rating: Optional[float] = None
    total_unique_students: Optional[int] = None
    tutor_courses: Optional[List["TutorProfileCourse"]] = None


class GetMyProfileResponse(BaseModel):
    status: str
    message: str
    profile: UserProfileDetail


class UpdateProfileResponse(BaseModel):
    status: str
    message: str


class UploadProfilePictureResponse(BaseModel):
    status: str
    message: str
    image_path: str


class FollowResponse(BaseModel):
    status: str
    message: str


class GetFollowersResponse(BaseModel):
    status: str
    message: str
    users: List[UserSummaryDetail]
    count: int


class GetFollowingResponse(BaseModel):
    status: str
    message: str
    users: List[UserSummaryDetail]
    count: int


class SearchUsersResponse(BaseModel):
    status: str
    message: str
    users: List[UserSummaryDetail]

class ErrorResponse(BaseModel):
    status: str
    message: str
    detail: Optional[str] = None

class LessonAttachmentDetail(BaseModel):
    id: str
    file_name: str
    s3_url: str
    created_at: datetime

class UploadLessonAttachmentResponse(BaseModel):
    status: str
    message: str
    attachment_id: str
    file_name: str
    s3_url: str

class GetLessonAttachmentsResponse(BaseModel):
    status: str
    message: str
    attachments: List[LessonAttachmentDetail]

class DeleteLessonAttachmentResponse(BaseModel):
    status: str
    message: str

class GetLessonQuestionsResponse(BaseModel):
    status: str
    message: str
    questions: List[QuestionDetail]

class TagDetail(BaseModel):
    id: str
    name: str

class GetTagsResponse(BaseModel):
    status: str
    message: str
    tags: List[TagDetail]

class SaveCourseTagsResponse(BaseModel):
    status: str
    message: str
    course_id: str
    tag_count: int

class GetCourseTagsResponse(BaseModel):
    status: str
    message: str
    tags: List[TagDetail]

class BadgeDetail(BaseModel):
    id: str
    name: str
    badge_type: str
    icon_name: Optional[str] = None
    image_url: Optional[str] = None
    course_id: str

class TutorProfileCourse(BaseModel):
    id: str
    name: str
    description: str
    avg_rating: Optional[float] = None
    review_count: int = 0
    enrollment_count: int = 0
    badge: Optional[BadgeDetail] = None
    price_gems: Optional[int] = None
    discount_percent: Optional[int] = None

class CreateBadgeResponse(BaseModel):
    status: str
    message: str
    badge: BadgeDetail

class GetCourseBadgeResponse(BaseModel):
    status: str
    message: str
    badge: Optional[BadgeDetail] = None

# ---- Student response models ----

class BrowseCourseSummary(BaseModel):
    id: str
    name: str
    description: str
    tutor_id: str
    tutor_name: str
    unit_count: int
    chapter_count: int
    lesson_count: int
    enrollment_count: int
    tags: List[TagDetail]
    badge: Optional[BadgeDetail] = None
    price_gems: Optional[int] = None
    discount_percent: Optional[int] = None
    avg_rating: Optional[float] = None
    review_count: int = 0

class GetBrowseCoursesResponse(BaseModel):
    status: str
    message: str
    courses: List[BrowseCourseSummary]

class GetCoursePublicDetailResponse(BaseModel):
    status: str
    message: str
    course: BrowseCourseSummary

class CourseFeedbackItem(BaseModel):
    id: str
    user_name: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime

class GetCourseFeedbackResponse(BaseModel):
    status: str
    message: str
    reviews: List[CourseFeedbackItem]
    avg_rating: Optional[float] = None
    review_count: int

class SubmitFeedbackResponse(BaseModel):
    status: str
    message: str
    feedback_id: str

class MyFeedbackResponse(BaseModel):
    status: str
    message: str
    has_feedback: bool
    rating: Optional[int] = None
    comment: Optional[str] = None

class EnrollCourseResponse(BaseModel):
    status: str
    message: str
    enrollment_id: str

class EnrolledCourseSummary(BaseModel):
    id: str
    name: str
    description: str
    tutor_name: str
    total_lessons: int
    completed_lessons: int
    progress_percent: float
    current_lesson_name: Optional[str] = None
    badge: Optional[BadgeDetail] = None
    enrolled_at: datetime

class GetMyCoursesResponse(BaseModel):
    status: str
    message: str
    courses: List[EnrolledCourseSummary]

class StudentLessonDetail(BaseModel):
    id: str
    name: str
    lesson_index: int
    question_count: int
    status: str

class StudentChapterDetail(BaseModel):
    id: str
    name: str
    chapter_index: int
    lessons: List[StudentLessonDetail]
    status: str

class StudentUnitDetail(BaseModel):
    id: str
    name: str
    description: Optional[str]
    unit_index: int
    chapters: List[StudentChapterDetail]
    completed_lessons: int
    total_lessons: int

class StudentCourseDetail(BaseModel):
    id: str
    name: str
    description: str
    tutor_name: str
    total_lessons: int
    completed_lessons: int
    progress_percent: float
    units: List[StudentUnitDetail]
    badge: Optional[BadgeDetail] = None

class GetStudentCourseDetailResponse(BaseModel):
    status: str
    message: str
    course: StudentCourseDetail

class StudentMCQOption(BaseModel):
    id: str
    option_text: str

class StudentQuestionDetail(BaseModel):
    id: str
    question_text: str
    question_type: str
    mcq_options: Optional[List[StudentMCQOption]] = None

class GetStudentLessonResponse(BaseModel):
    status: str
    message: str
    lesson_name: str
    questions: List[StudentQuestionDetail]
    attachments: List[LessonAttachmentDetail]

class SubmitAnswerResponse(BaseModel):
    status: str
    message: str
    is_correct: bool
    correct_answer: Optional[str] = None

class NewlyUnlockedAchievement(BaseModel):
    name: str
    description: str
    achievement_type: str


class CompletedQuestInfo(BaseModel):
    key: str
    title: str
    gems: int
    xp: int = 0


class DailyQuestDetail(BaseModel):
    key: str
    title: str
    description: str
    icon: str
    quest_type: str
    goal: int
    gems: int
    xp: int = 0
    progress: int
    completed: bool


class GetDailyQuestsResponse(BaseModel):
    status: str
    message: str
    quests: List[DailyQuestDetail]
    total_gems: int


class CompleteLessonResponse(BaseModel):
    status: str
    message: str
    next_lesson_id: Optional[str] = None
    course_completed: bool = False
    streak_updated: bool = False
    daily_streak: int = 0
    newly_unlocked_achievements: List[NewlyUnlockedAchievement] = []
    newly_completed_quests: List[CompletedQuestInfo] = []
    gems_earned: int = 0
    total_gems: int = 0
    daily_quest_progress: List[DailyQuestDetail] = []
    xp_earned: int = 0
    total_xp: int = 0

class GetStreakResponse(BaseModel):
    status: str
    message: str
    daily_streak: int
    longest_streak: int
    streak_active_today: bool
    gems: int = 0
    total_xp: int = 0


class UserAchievementDetail(BaseModel):
    achievement_id: str
    name: str
    description: str
    achievement_type: str
    goal: int
    progress: int
    achieved: bool
    achieved_at: Optional[datetime] = None
    image_url: Optional[str] = None


class GetAchievementsResponse(BaseModel):
    status: str
    message: str
    achievements: List[UserAchievementDetail]


class LeaderboardMemberDetail(BaseModel):
    user_id: str
    full_name: str
    xp_earned: int
    rank_position: int


class GetLeaderboardResponse(BaseModel):
    status: str
    message: str
    leaderboard_id: str
    rank: str
    week_start: datetime
    week_end: datetime
    members: List[LeaderboardMemberDetail]
    my_position: int
    my_xp: int
    promotion_zone: int
    relegation_zone: int
    total_members: int


class InitiatePaymentResponse(BaseModel):
    status: str
    message: str
    amount: str
    tax_amount: str
    total_amount: str
    transaction_uuid: str
    product_code: str
    product_service_charge: str
    product_delivery_charge: str
    success_url: str
    failure_url: str
    signed_field_names: str
    signature: str
    epay_url: str


# ─── Tutor Monetization response models ─────────────────

class SetCoursePriceResponse(BaseModel):
    status: str
    message: str
    course_id: str
    price_gems: Optional[int] = None

class SetCourseDiscountResponse(BaseModel):
    status: str
    message: str
    course_id: str
    discount_percent: Optional[int] = None
    effective_price_gems: Optional[int] = None

class TutorInventoryResponse(BaseModel):
    status: str
    message: str
    gems: int
    gems_value_rs: float  # gems * 0.8

class RedeemRequestDetail(BaseModel):
    id: str
    tutor_id: str
    tutor_name: str
    gems_requested: int
    amount_rs: float
    status: str
    notes: Optional[str] = None
    created_at: datetime
    processed_at: Optional[datetime] = None

class CreateRedeemRequestResponse(BaseModel):
    status: str
    message: str
    request_id: str

class GetTutorRedeemRequestsResponse(BaseModel):
    status: str
    message: str
    requests: List[RedeemRequestDetail]
    current_gems: int

class GetAdminRedeemRequestsResponse(BaseModel):
    status: str
    message: str
    requests: List[RedeemRequestDetail]

class UpdateRedeemStatusResponse(BaseModel):
    status: str
    message: str
    request_id: str

class AdminStatsResponse(BaseModel):
    status: str
    message: str
    total_users: int
    total_courses: int
    total_enrollments: int
    pending_redeem_requests: int


# ─── Tutor Analytics response models ─────────────────────────────

class TrendPoint(BaseModel):
    period: str  # "2026-01"
    count: int

class RevenueTrendPoint(BaseModel):
    period: str
    gems: int

class TopCourse(BaseModel):
    course_id: str
    name: str
    enrollments: int
    avg_rating: Optional[float]
    gems_earned: int

class TutorAnalyticsOverviewResponse(BaseModel):
    status: str
    message: str
    total_students: int
    total_enrollments: int
    avg_rating: Optional[float]
    total_gems_earned: int
    enrollment_trend: List[TrendPoint]
    revenue_trend: List[RevenueTrendPoint]
    rating_distribution: dict
    top_courses: List[TopCourse]

class LessonFunnelItem(BaseModel):
    lesson_id: str
    lesson_name: str
    unit_index: int
    chapter_index: int
    lesson_index: int
    completions: int

class ProgressBucket(BaseModel):
    label: str
    count: int

class RecentFeedbackItem(BaseModel):
    user_name: str
    rating: int
    comment: Optional[str]
    created_at: datetime

class TutorCourseAnalyticsResponse(BaseModel):
    status: str
    message: str
    course_id: str
    course_name: str
    total_enrolled: int
    completed_count: int
    completion_rate: float
    avg_rating: Optional[float]
    total_reviews: int
    gems_earned: int
    enrollment_trend: List[TrendPoint]
    lesson_funnel: List[LessonFunnelItem]
    progress_distribution: List[ProgressBucket]
    rating_breakdown: dict
    recent_feedback: List[RecentFeedbackItem]