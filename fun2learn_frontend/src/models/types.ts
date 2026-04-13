export type Theme = 'light' | 'dark';

export type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

export type UserRole = 'learner' | 'tutor'

export type Gender = 'male' | 'female' | 'other'

export type CourseStatus = 'draft' | 'published'

export interface User {
    user_id: string,
    full_name: string;
    username?: string | null;
    email: string;
    birthdate: string;
    role: string;
    gender: string;
    image_path: string;
}

export interface TutorProfileCourse {
    id: string;
    name: string;
    description: string;
    avg_rating?: number | null;
    review_count: number;
    enrollment_count: number;
    badge?: Badge | null;
    price_gems?: number | null;
    discount_percent?: number | null;
}

export interface UserProfile {
    user_id: string;
    full_name: string;
    username?: string | null;
    email?: string | null;
    image_path?: string | null;
    role: string;
    gender: string;
    current_rank: string;
    daily_streak: number;
    longest_streak: number;
    experience_points: number;
    total_achievements: number;
    lessons_completed: number;
    courses_enrolled: number;
    followers_count: number;
    following_count: number;
    earned_badges: Badge[];
    is_following: boolean;
    is_own_profile: boolean;
    // Tutor-specific
    courses_created?: number | null;
    avg_course_rating?: number | null;
    total_unique_students?: number | null;
    tutor_courses?: TutorProfileCourse[] | null;
}

export interface UserSummary {
    user_id: string;
    full_name: string;
    username?: string | null;
    image_path?: string | null;
    current_rank?: string | null;
    is_following: boolean;
}

export interface CourseSummary {
    id: string;
    name: string;
    description: string;
    status: CourseStatus;
    created_at: string;
    unit_count: number;
    chapter_count: number;
    lesson_count: number;
    question_count: number;
    price_gems?: number | null;
    discount_percent?: number | null;
}

export interface LessonDetail {
    id: string;
    name: string;
    lesson_index: number;
    created_at: string;
    question_count: number;
}

export interface ChapterDetail {
    id: string;
    name: string;
    chapter_index: number;
    created_at: string;
    lessons: LessonDetail[];
}

export interface UnitDetail {
    id: string;
    name: string;
    description: string | null;
    unit_index: number;
    created_at: string;
    chapters: ChapterDetail[];
}

export interface CourseDetail {
    id: string;
    name: string;
    description: string;
    status: CourseStatus;
    created_at: string;
    units: UnitDetail[];
    price_gems?: number | null;
    discount_percent?: number | null;
}

export type QuestionType = 'mcq' | 'text'

export interface MCQOption {
    id: string;
    option_text: string;
    is_correct: boolean;
}

export interface TextAnswer {
    id: string;
    correct_answer: string;
    casing_matters: boolean;
}

export interface QuestionDetail {
    id: string;
    question_text: string;
    question_type: QuestionType;
    mcq_options?: MCQOption[];
    text_answer?: TextAnswer;
}

export interface LessonAttachment {
    id: string;
    file_name: string;
    s3_url: string;
    created_at: string;
}

export interface Tag {
    id: string;
    name: string;
}

export type BadgeType = 'icon' | 'image';

export interface Badge {
    id: string;
    name: string;
    badge_type: BadgeType;
    icon_name?: string;
    image_url?: string;
    course_id: string;
}

// ─── Student types ──────────────────────────────────────

export type LessonStatus = 'completed' | 'current' | 'locked';
export type ChapterStatus = 'completed' | 'in_progress' | 'locked';

export interface BrowseCourseSummary {
    id: string;
    name: string;
    description: string;
    tutor_id: string;
    tutor_name: string;
    unit_count: number;
    chapter_count: number;
    lesson_count: number;
    enrollment_count: number;
    tags: Tag[];
    badge: Badge | null;
    price_gems?: number | null;
    discount_percent?: number | null;
    avg_rating?: number | null;
    review_count?: number;
}

export interface CourseFeedback {
    id: string;
    user_name: string;
    rating: number;
    comment?: string | null;
    created_at: string;
}

export type RedeemRequestStatus = 'pending' | 'paid' | 'rejected';

export interface RedeemRequest {
    id: string;
    tutor_id: string;
    tutor_name: string;
    gems_requested: number;
    amount_rs: number;
    status: RedeemRequestStatus;
    notes?: string | null;
    created_at: string;
    processed_at?: string | null;
}

export interface AdminStats {
    total_users: number;
    total_courses: number;
    total_enrollments: number;
    pending_redeem_requests: number;
}

export interface EnrolledCourseSummary {
    id: string;
    name: string;
    description: string;
    tutor_name: string;
    total_lessons: number;
    completed_lessons: number;
    progress_percent: number;
    current_lesson_name: string | null;
    badge: Badge | null;
    enrolled_at: string;
}

export interface StudentLessonDetail {
    id: string;
    name: string;
    lesson_index: number;
    question_count: number;
    status: LessonStatus;
}

export interface StudentChapterDetail {
    id: string;
    name: string;
    chapter_index: number;
    lessons: StudentLessonDetail[];
    status: ChapterStatus;
}

export interface StudentUnitDetail {
    id: string;
    name: string;
    description: string | null;
    unit_index: number;
    chapters: StudentChapterDetail[];
    completed_lessons: number;
    total_lessons: number;
}

export interface StudentCourseDetail {
    id: string;
    name: string;
    description: string;
    tutor_name: string;
    total_lessons: number;
    completed_lessons: number;
    progress_percent: number;
    units: StudentUnitDetail[];
    badge: Badge | null;
}

export interface StudentMCQOption {
    id: string;
    option_text: string;
}

export interface StudentQuestion {
    id: string;
    question_text: string;
    question_type: QuestionType;
    mcq_options?: StudentMCQOption[];
}

// ─── Gamification types ─────────────────────────────────

export interface StreakData {
    daily_streak: number;
    longest_streak: number;
    streak_active_today: boolean;
}

export type AchievementType = 'lessons_completed' | 'streak_days' | 'courses_completed' | 'courses_enrolled';

export interface NewlyUnlockedAchievement {
    name: string;
    description: string;
    achievement_type: AchievementType;
}

export interface UserAchievementDetail {
    achievement_id: string;
    name: string;
    description: string;
    achievement_type: AchievementType;
    goal: number;
    progress: number;
    achieved: boolean;
    achieved_at: string | null;
    image_url: string | null;
}

// ─── Quest types ─────────────────────────────────────────

export type QuestType = 'lessons_today' | 'streak_today';

export interface DailyQuest {
    key: string;
    title: string;
    description: string;
    icon: string;
    quest_type: QuestType;
    goal: number;
    gems: number;
    xp?: number;
    progress: number;
    completed: boolean;
}

export interface CompletedQuestInfo {
    key: string;
    title: string;
    gems: number;
    xp?: number;
}

// ─── Leaderboard types ──────────────────────────────────

export type LeaderboardRank = 'bronze' | 'silver' | 'gold' | 'platinum' | 'ruby' | 'pearl' | 'diamond' | 'champions';

export interface LeaderboardMember {
    user_id: string;
    full_name: string;
    xp_earned: number;
    rank_position: number;
}

export interface LeaderboardData {
    leaderboard_id: string;
    rank: LeaderboardRank;
    week_start: string;
    week_end: string;
    members: LeaderboardMember[];
    my_position: number;
    my_xp: number;
    promotion_zone: number;
    relegation_zone: number;
    total_members: number;
}

// ─── Analytics types ──────────────────────────────────────────────

export interface TrendPoint {
    period: string;
    count: number;
}

export interface RevenueTrendPoint {
    period: string;
    gems: number;
}

export interface TopCourse {
    course_id: string;
    name: string;
    enrollments: number;
    avg_rating: number | null;
    gems_earned: number;
}

export interface LessonFunnelItem {
    lesson_id: string;
    lesson_name: string;
    unit_index: number;
    chapter_index: number;
    lesson_index: number;
    completions: number;
}

export interface ProgressBucket {
    label: string;
    count: number;
}

export interface RecentFeedbackItem {
    user_name: string;
    rating: number;
    comment: string | null;
    created_at: string;
}

export interface AnalyticsOverview {
    total_students: number;
    total_enrollments: number;
    avg_rating: number | null;
    total_gems_earned: number;
    enrollment_trend: TrendPoint[];
    revenue_trend: RevenueTrendPoint[];
    rating_distribution: Record<string, number>;
    top_courses: TopCourse[];
}

export interface CourseAnalytics {
    course_id: string;
    course_name: string;
    total_enrolled: number;
    completed_count: number;
    completion_rate: number;
    avg_rating: number | null;
    total_reviews: number;
    gems_earned: number;
    enrollment_trend: TrendPoint[];
    lesson_funnel: LessonFunnelItem[];
    progress_distribution: ProgressBucket[];
    rating_breakdown: Record<string, number>;
    recent_feedback: RecentFeedbackItem[];
}