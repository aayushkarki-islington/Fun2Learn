import type { CourseSummary, CourseDetail, LessonAttachment, Tag, Badge } from './types';

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
