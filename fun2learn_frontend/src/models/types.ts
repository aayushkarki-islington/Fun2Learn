export type Theme = 'light' | 'dark';

export type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

export type UserRole = 'learner' | 'tutor'

export type Gender = 'male' | 'female' | 'other'

export type CourseStatus = 'draft' | 'published'

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