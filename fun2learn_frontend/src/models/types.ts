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