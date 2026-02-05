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
    courses: import('./types').CourseSummary[];
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
