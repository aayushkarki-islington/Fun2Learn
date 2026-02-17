import config from "@/config";
import { getHeaders } from "./apiUtils";
import type {
    GetBrowseCoursesResponse, EnrollCourseResponse,
    GetMyCoursesResponse, GetStudentCourseDetailResponse,
    GetStudentLessonResponse, SubmitAnswerResponse, CompleteLessonResponse,
    GetStreakResponse, GetAchievementsResponse
} from "@/models/responseModels";

const API_URL = config.API_URL;

export const getBrowseCourses = async () => {
    try {
        const response = await fetch(`${API_URL}/student/browse`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to fetch courses");
        }

        const data = await response.json() as GetBrowseCoursesResponse;
        if (data.status === "success") {
            return { success: true, courses: data.courses };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to fetch courses" };
    }
};

export const enrollInCourse = async (courseId: string) => {
    try {
        const response = await fetch(`${API_URL}/student/enroll`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ course_id: courseId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to enroll");
        }

        const data = await response.json() as EnrollCourseResponse;
        if (data.status === "success") {
            return { success: true, enrollmentId: data.enrollment_id };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to enroll" };
    }
};

export const getMyEnrolledCourses = async () => {
    try {
        const response = await fetch(`${API_URL}/student/my-courses`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to fetch enrolled courses");
        }

        const data = await response.json() as GetMyCoursesResponse;
        if (data.status === "success") {
            return { success: true, courses: data.courses };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to fetch enrolled courses" };
    }
};

export const getStudentCourseDetail = async (courseId: string) => {
    try {
        const response = await fetch(`${API_URL}/student/course/${courseId}`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to fetch course detail");
        }

        const data = await response.json() as GetStudentCourseDetailResponse;
        if (data.status === "success") {
            return { success: true, course: data.course };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to fetch course detail" };
    }
};

export const getStudentLesson = async (courseId: string, lessonId: string) => {
    try {
        const response = await fetch(`${API_URL}/student/course/${courseId}/lesson/${lessonId}`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to fetch lesson");
        }

        const data = await response.json() as GetStudentLessonResponse;
        if (data.status === "success") {
            return { success: true, lessonName: data.lesson_name, questions: data.questions, attachments: data.attachments };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to fetch lesson" };
    }
};

export const submitAnswer = async (questionId: string, answer: string) => {
    try {
        const response = await fetch(`${API_URL}/student/submit-answer`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ question_id: questionId, answer })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to submit answer");
        }

        const data = await response.json() as SubmitAnswerResponse;
        return { success: true, isCorrect: data.is_correct, correctAnswer: data.correct_answer };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to submit answer" };
    }
};

export const completeLesson = async (lessonId: string, courseId: string) => {
    try {
        const response = await fetch(`${API_URL}/student/complete-lesson`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ lesson_id: lessonId, course_id: courseId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to complete lesson");
        }

        const data = await response.json() as CompleteLessonResponse;
        if (data.status === "success") {
            return {
                success: true,
                nextLessonId: data.next_lesson_id,
                courseCompleted: data.course_completed,
                streakUpdated: data.streak_updated,
                dailyStreak: data.daily_streak
            };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to complete lesson" };
    }
};

export const getAchievements = async () => {
    try {
        const response = await fetch(`${API_URL}/student/achievements`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to fetch achievements");
        }

        const data = await response.json() as GetAchievementsResponse;
        if (data.status === "success") {
            return { success: true, achievements: data.achievements };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to fetch achievements" };
    }
};

export const getStreak = async () => {
    try {
        const response = await fetch(`${API_URL}/student/streak`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to fetch streak");
        }

        const data = await response.json() as GetStreakResponse;
        if (data.status === "success") {
            return {
                success: true,
                dailyStreak: data.daily_streak,
                longestStreak: data.longest_streak,
                streakActiveToday: data.streak_active_today
            };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to fetch streak" };
    }
};
