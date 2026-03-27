export type Theme = 'light' | 'dark';

export type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

export type UserRole = 'learner' | 'tutor'

export type Gender = 'male' | 'female' | 'other'

export type CourseStatus = 'draft' | 'published'

export interface User {
    user_id: string,
    full_name: string;
    email: string;
    birthdate: string;
    role: string;
    gender: string;
    image_path: string;
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
    tutor_name: string;
    unit_count: number;
    chapter_count: number;
    lesson_count: number;
    enrollment_count: number;
    tags: Tag[];
    badge: Badge | null;
    price_gems?: number | null;
    discount_percent?: number | null;
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
    progress: number;
    completed: boolean;
}

export interface CompletedQuestInfo {
    key: string;
    title: string;
    gems: number;
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