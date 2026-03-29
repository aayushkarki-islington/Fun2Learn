import type {
    CourseSummary, CourseDetail, LessonAttachment, Tag, Badge,
    BrowseCourseSummary, EnrolledCourseSummary, StudentCourseDetail,
    StudentQuestion, UserAchievementDetail, NewlyUnlockedAchievement,
    DailyQuest, CompletedQuestInfo, LeaderboardMember, LeaderboardData,
    RedeemRequest, AdminStats, CourseFeedback
} from './types';

export interface InitiatePaymentResponse {
    status: string;
    message: string;
    amount: string;
    tax_amount: string;
    total_amount: string;
    transaction_uuid: string;
    product_code: string;
    product_service_charge: string;
    product_delivery_charge: string;
    success_url: string;
    failure_url: string;
    signed_field_names: string;
    signature: string;
    epay_url: string;
}

export interface LoginResponse {
    status: string;
    message: string;
    access_token?: string;
    token_type?: string;
    user?: Record<string, any>;
}

export interface SignUpResponse {
    status: string;
    message: string;
    user_id?: string;
}

export interface GetCoursesResponse {
    status: string;
    message: string;
    courses: CourseSummary[];
}

export interface CourseCreationResponse {
    status: string;
    message: string;
    course_id: string;
}

export interface DeleteCourseResponse {
    status: string;
    message: string;
}

export interface GetCourseDetailResponse {
    status: string;
    message: string;
    course: CourseDetail;
}

export interface AddUnitResponse {
    status: string;
    message: string;
    unit_id: string;
    unit_index: number;
}

export interface AddChapterResponse {
    status: string;
    message: string;
    chapter_id: string;
    chapter_index: number;
}

export interface AddLessonResponse {
    status: string;
    message: string;
    lesson_id: string;
    lesson_index: number;
}

export interface AddMCQQuestionResponse {
    status: string;
    message: string;
    question_id: string;
}

export interface AddTextQuestionResponse {
    status: string;
    message: string;
    question_id: string;
}

export interface GenericResponse {
    status: string;
    message: string;
}

export interface PublishCourseResponse {
    status: string;
    message: string;
    course_id: string;
}

export interface UploadLessonAttachmentResponse {
    status: string;
    message: string;
    attachment_id: string;
    file_name: string;
    s3_url: string;
}

export interface GetLessonAttachmentsResponse {
    status: string;
    message: string;
    attachments: LessonAttachment[];
}

export interface DeleteLessonAttachmentResponse {
    status: string;
    message: string;
}

export interface GetTagsResponse {
    status: string;
    message: string;
    tags: Tag[];
}

export interface SaveCourseTagsResponse {
    status: string;
    message: string;
    course_id: string;
    tag_count: number;
}

export interface GetCourseTagsResponse {
    status: string;
    message: string;
    tags: Tag[];
}

export interface CreateBadgeResponse {
    status: string;
    message: string;
    badge: Badge;
}

export interface GetCourseBadgeResponse {
    status: string;
    message: string;
    badge: Badge | null;
}

// ─── Student response models ────────────────────────────

export interface GetBrowseCoursesResponse {
    status: string;
    message: string;
    courses: BrowseCourseSummary[];
}

export interface EnrollCourseResponse {
    status: string;
    message: string;
    enrollment_id: string;
}

export interface GetMyCoursesResponse {
    status: string;
    message: string;
    courses: EnrolledCourseSummary[];
}

export interface GetStudentCourseDetailResponse {
    status: string;
    message: string;
    course: StudentCourseDetail;
}

export interface GetStudentLessonResponse {
    status: string;
    message: string;
    lesson_name: string;
    questions: StudentQuestion[];
    attachments: LessonAttachment[];
}

export interface SubmitAnswerResponse {
    status: string;
    message: string;
    is_correct: boolean;
    correct_answer?: string;
}

export interface CompleteLessonResponse {
    status: string;
    message: string;
    next_lesson_id?: string;
    course_completed: boolean;
    streak_updated: boolean;
    daily_streak: number;
    newly_unlocked_achievements: NewlyUnlockedAchievement[];
    newly_completed_quests: CompletedQuestInfo[];
    gems_earned: number;
    total_gems: number;
    daily_quest_progress: DailyQuest[];
    xp_earned: number;
    total_xp: number;
}

export interface GetStreakResponse {
    status: string;
    message: string;
    daily_streak: number;
    longest_streak: number;
    streak_active_today: boolean;
    gems: number;
    total_xp: number;
}

export interface GetDailyQuestsResponse {
    status: string;
    message: string;
    quests: DailyQuest[];
    total_gems: number;
}

export interface GetAchievementsResponse {
    status: string;
    message: string;
    achievements: UserAchievementDetail[];
}

export interface GetLeaderboardResponse {
    status: string;
    message: string;
    leaderboard_id: string;
    rank: string;
    week_start: string;
    week_end: string;
    members: LeaderboardMember[];
    my_position: number;
    my_xp: number;
    promotion_zone: number;
    relegation_zone: number;
    total_members: number;
}

// ─── Tutor Monetization response models ─────────────────

export interface SetCoursePriceResponse {
    status: string;
    message: string;
    course_id: string;
    price_gems?: number | null;
}

export interface SetCourseDiscountResponse {
    status: string;
    message: string;
    course_id: string;
    discount_percent?: number | null;
    effective_price_gems?: number | null;
}

export interface TutorInventoryResponse {
    status: string;
    message: string;
    gems: number;
    gems_value_rs: number;
}

export interface CreateRedeemRequestResponse {
    status: string;
    message: string;
    request_id: string;
}

export interface GetTutorRedeemRequestsResponse {
    status: string;
    message: string;
    requests: RedeemRequest[];
    current_gems: number;
}

export interface GetAdminRedeemRequestsResponse {
    status: string;
    message: string;
    requests: RedeemRequest[];
}

export interface UpdateRedeemStatusResponse {
    status: string;
    message: string;
    request_id: string;
}

export interface AdminStatsResponse {
    status: string;
    message: string;
    total_users: number;
    total_courses: number;
    total_enrollments: number;
    pending_redeem_requests: number;
}

// ─── Course detail / feedback response models ────────────

export interface GetCoursePublicDetailResponse {
    status: string;
    message: string;
    course: BrowseCourseSummary;
}

export interface GetCourseFeedbackResponse {
    status: string;
    message: string;
    reviews: CourseFeedback[];
    avg_rating?: number | null;
    review_count: number;
}

export interface SubmitFeedbackResponse {
    status: string;
    message: string;
    feedback_id: string;
}

export interface MyFeedbackResponse {
    status: string;
    message: string;
    has_feedback: boolean;
    rating?: number | null;
    comment?: string | null;
}
