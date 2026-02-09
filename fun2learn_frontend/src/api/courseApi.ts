import config from "@/config";
import { getHeaders } from "./apiUtils";
import Cookies from "js-cookie";
import type {
    GetCoursesResponse, CourseCreationResponse, DeleteCourseResponse,
    GetCourseDetailResponse, AddUnitResponse, AddChapterResponse,
    AddLessonResponse, AddMCQQuestionResponse, AddTextQuestionResponse,
    GenericResponse, PublishCourseResponse,
    UploadLessonAttachmentResponse, GetLessonAttachmentsResponse,
    DeleteLessonAttachmentResponse,
    GetTagsResponse, SaveCourseTagsResponse, GetCourseTagsResponse,
    CreateBadgeResponse, GetCourseBadgeResponse
} from "@/models/responseModels";

const API_URL = config.API_URL;

// ─── Course CRUD ─────────────────────────────────────────

export const getCourses = async () => {
    try {
        const response = await fetch(`${API_URL}/course/courses`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to fetch courses");
        }

        const data = await response.json() as GetCoursesResponse;
        if (data.status === "success") {
            return { success: true, courses: data.courses };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to fetch courses" };
    }
};

export const createCourse = async (name: string, description: string) => {
    try {
        const response = await fetch(`${API_URL}/course/create_course`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ name, description })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to create course");
        }

        const data = await response.json() as CourseCreationResponse;
        if (data.status === "success" || data.status === "Success") {
            return { success: true, courseId: data.course_id };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to create course" };
    }
};

export const getCourseDetail = async (courseId: string) => {
    try {
        const response = await fetch(`${API_URL}/course/course/${courseId}`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to fetch course details");
        }

        const data = await response.json() as GetCourseDetailResponse;
        if (data.status === "success") {
            return { success: true, course: data.course };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to fetch course details" };
    }
};

export const editCourse = async (courseId: string, name: string, description: string) => {
    try {
        const response = await fetch(`${API_URL}/course/edit_course`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify({ course_id: courseId, name, description })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to edit course");
        }

        const data = await response.json() as GenericResponse;
        return { success: data.status === "success", errorMessage: data.status !== "success" ? data.message : undefined };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to edit course" };
    }
};

export const deleteCourse = async (courseId: string) => {
    try {
        const response = await fetch(`${API_URL}/course/delete_course`, {
            method: "DELETE",
            headers: getHeaders(),
            body: JSON.stringify({ course_id: courseId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to delete course");
        }

        const data = await response.json() as DeleteCourseResponse;
        return { success: data.status === "success", errorMessage: data.status !== "success" ? data.message : undefined };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to delete course" };
    }
};

export const publishCourse = async (courseId: string) => {
    try {
        const response = await fetch(`${API_URL}/course/publish_course`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ course_id: courseId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to publish course");
        }

        const data = await response.json() as PublishCourseResponse;
        return { success: data.status === "success", errorMessage: data.status !== "success" ? data.message : undefined };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to publish course" };
    }
};

// ─── Unit CRUD ───────────────────────────────────────────

export const addUnit = async (courseId: string, name: string, description: string) => {
    try {
        const response = await fetch(`${API_URL}/course/add_unit`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ course_id: courseId, name, description })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to add unit");
        }

        const data = await response.json() as AddUnitResponse;
        if (data.status === "success") {
            return { success: true, unitId: data.unit_id, unitIndex: data.unit_index };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to add unit" };
    }
};

export const editUnit = async (unitId: string, name: string, description: string) => {
    try {
        const response = await fetch(`${API_URL}/course/edit_unit`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify({ unit_id: unitId, name, description })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to edit unit");
        }

        const data = await response.json() as GenericResponse;
        return { success: data.status === "success", errorMessage: data.status !== "success" ? data.message : undefined };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to edit unit" };
    }
};

export const deleteUnit = async (unitId: string) => {
    try {
        const response = await fetch(`${API_URL}/course/delete_unit`, {
            method: "DELETE",
            headers: getHeaders(),
            body: JSON.stringify({ unit_id: unitId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to delete unit");
        }

        const data = await response.json() as GenericResponse;
        return { success: data.status === "success", errorMessage: data.status !== "success" ? data.message : undefined };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to delete unit" };
    }
};

// ─── Chapter CRUD ────────────────────────────────────────

export const addChapter = async (unitId: string, name: string) => {
    try {
        const response = await fetch(`${API_URL}/course/add_chapter`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ unit_id: unitId, name })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to add chapter");
        }

        const data = await response.json() as AddChapterResponse;
        if (data.status === "success") {
            return { success: true, chapterId: data.chapter_id, chapterIndex: data.chapter_index };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to add chapter" };
    }
};

export const editChapter = async (chapterId: string, name: string) => {
    try {
        const response = await fetch(`${API_URL}/course/edit_chapter`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify({ chapter_id: chapterId, name })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to edit chapter");
        }

        const data = await response.json() as GenericResponse;
        return { success: data.status === "success", errorMessage: data.status !== "success" ? data.message : undefined };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to edit chapter" };
    }
};

export const deleteChapter = async (chapterId: string) => {
    try {
        const response = await fetch(`${API_URL}/course/delete_chapter`, {
            method: "DELETE",
            headers: getHeaders(),
            body: JSON.stringify({ chapter_id: chapterId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to delete chapter");
        }

        const data = await response.json() as GenericResponse;
        return { success: data.status === "success", errorMessage: data.status !== "success" ? data.message : undefined };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to delete chapter" };
    }
};

// ─── Lesson CRUD ─────────────────────────────────────────

export const addLesson = async (chapterId: string, name: string) => {
    try {
        const response = await fetch(`${API_URL}/course/add_lesson`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ chapter_id: chapterId, name })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to add lesson");
        }

        const data = await response.json() as AddLessonResponse;
        if (data.status === "success") {
            return { success: true, lessonId: data.lesson_id, lessonIndex: data.lesson_index };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to add lesson" };
    }
};

export const editLesson = async (lessonId: string, name: string) => {
    try {
        const response = await fetch(`${API_URL}/course/edit_lesson`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify({ lesson_id: lessonId, name })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to edit lesson");
        }

        const data = await response.json() as GenericResponse;
        return { success: data.status === "success", errorMessage: data.status !== "success" ? data.message : undefined };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to edit lesson" };
    }
};

export const deleteLesson = async (lessonId: string) => {
    try {
        const response = await fetch(`${API_URL}/course/delete_lesson`, {
            method: "DELETE",
            headers: getHeaders(),
            body: JSON.stringify({ lesson_id: lessonId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to delete lesson");
        }

        const data = await response.json() as GenericResponse;
        return { success: data.status === "success", errorMessage: data.status !== "success" ? data.message : undefined };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to delete lesson" };
    }
};

// ─── Question CRUD ───────────────────────────────────────

export const addMCQQuestion = async (
    lessonId: string,
    questionText: string,
    options: { option_text: string; is_correct: boolean }[]
) => {
    try {
        const response = await fetch(`${API_URL}/course/add_mcq_question`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                lesson_id: lessonId,
                question_text: questionText,
                options
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to add MCQ question");
        }

        const data = await response.json() as AddMCQQuestionResponse;
        if (data.status === "success") {
            return { success: true, questionId: data.question_id };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to add MCQ question" };
    }
};

export const addTextQuestion = async (
    lessonId: string,
    questionText: string,
    correctAnswer: string,
    casingMatters: boolean = false
) => {
    try {
        const response = await fetch(`${API_URL}/course/add_text_question`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                lesson_id: lessonId,
                question_text: questionText,
                correct_answer: correctAnswer,
                casing_matters: casingMatters
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to add text question");
        }

        const data = await response.json() as AddTextQuestionResponse;
        if (data.status === "success") {
            return { success: true, questionId: data.question_id };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to add text question" };
    }
};

export const editMCQQuestion = async (
    questionId: string,
    questionText: string,
    options: { option_text: string; is_correct: boolean }[]
) => {
    try {
        const response = await fetch(`${API_URL}/course/edit_mcq_question`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify({
                question_id: questionId,
                question_text: questionText,
                options
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to edit MCQ question");
        }

        const data = await response.json() as GenericResponse;
        return { success: data.status === "success", errorMessage: data.status !== "success" ? data.message : undefined };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to edit MCQ question" };
    }
};

export const editTextQuestion = async (
    questionId: string,
    questionText: string,
    correctAnswer: string,
    casingMatters: boolean = false
) => {
    try {
        const response = await fetch(`${API_URL}/course/edit_text_question`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify({
                question_id: questionId,
                question_text: questionText,
                correct_answer: correctAnswer,
                casing_matters: casingMatters
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to edit text question");
        }

        const data = await response.json() as GenericResponse;
        return { success: data.status === "success", errorMessage: data.status !== "success" ? data.message : undefined };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to edit text question" };
    }
};

export const deleteQuestion = async (questionId: string) => {
    try {
        const response = await fetch(`${API_URL}/course/delete_question`, {
            method: "DELETE",
            headers: getHeaders(),
            body: JSON.stringify({ question_id: questionId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to delete question");
        }

        const data = await response.json() as GenericResponse;
        return { success: data.status === "success", errorMessage: data.status !== "success" ? data.message : undefined };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to delete question" };
    }
};

// ─── Lesson Questions (fetch) ────────────────────────────

export const getLessonQuestions = async (lessonId: string) => {
    try {
        const response = await fetch(`${API_URL}/course/lesson/${lessonId}/questions`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to fetch questions");
        }

        const data = await response.json();
        if (data.status === "success") {
            return { success: true, questions: data.questions || [] };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, questions: [], errorMessage: e instanceof Error ? e.message : "Failed to fetch questions" };
    }
};

// ─── Lesson Attachments ─────────────────────────────────

export const uploadLessonAttachment = async (lessonId: string, file: File) => {
    try {
        const accessToken = Cookies.get("accessToken");
        const formData = new FormData();
        formData.append("lesson_id", lessonId);
        formData.append("file", file);

        const response = await fetch(`${API_URL}/course/upload_lesson_attachment`, {
            method: "POST",
            headers: {
                ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {})
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to upload attachment");
        }

        const data = await response.json() as UploadLessonAttachmentResponse;
        if (data.status === "success") {
            return {
                success: true,
                attachmentId: data.attachment_id,
                fileName: data.file_name,
                s3Url: data.s3_url
            };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to upload attachment" };
    }
};

export const getLessonAttachments = async (lessonId: string) => {
    try {
        const response = await fetch(`${API_URL}/course/lesson/${lessonId}/attachments`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to fetch attachments");
        }

        const data = await response.json() as GetLessonAttachmentsResponse;
        if (data.status === "success") {
            return { success: true, attachments: data.attachments };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to fetch attachments" };
    }
};

export const deleteLessonAttachment = async (attachmentId: string) => {
    try {
        const response = await fetch(`${API_URL}/course/delete_lesson_attachment`, {
            method: "DELETE",
            headers: getHeaders(),
            body: JSON.stringify({ attachment_id: attachmentId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to delete attachment");
        }

        const data = await response.json() as DeleteLessonAttachmentResponse;
        return { success: data.status === "success", errorMessage: data.status !== "success" ? data.message : undefined };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to delete attachment" };
    }
};

// ─── Tags ────────────────────────────────────────────────

export const getTags = async () => {
    try {
        const response = await fetch(`${API_URL}/course/tags`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to fetch tags");
        }

        const data = await response.json() as GetTagsResponse;
        if (data.status === "success") {
            return { success: true, tags: data.tags };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to fetch tags" };
    }
};

export const getCourseTags = async (courseId: string) => {
    try {
        const response = await fetch(`${API_URL}/course/course/${courseId}/tags`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to fetch course tags");
        }

        const data = await response.json() as GetCourseTagsResponse;
        if (data.status === "success") {
            return { success: true, tags: data.tags };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to fetch course tags" };
    }
};

export const saveCourseTags = async (courseId: string, tagIds: string[]) => {
    try {
        const response = await fetch(`${API_URL}/course/save_course_tags`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ course_id: courseId, tag_ids: tagIds })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to save course tags");
        }

        const data = await response.json() as SaveCourseTagsResponse;
        return { success: data.status === "success", errorMessage: data.status !== "success" ? data.message : undefined };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to save course tags" };
    }
};

// ─── Badge ───────────────────────────────────────────────

export const getCourseBadge = async (courseId: string) => {
    try {
        const response = await fetch(`${API_URL}/course/course/${courseId}/badge`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to fetch course badge");
        }

        const data = await response.json() as GetCourseBadgeResponse;
        if (data.status === "success") {
            return { success: true, badge: data.badge };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to fetch course badge" };
    }
};

export const createBadgeIcon = async (courseId: string, name: string, iconName: string) => {
    try {
        const response = await fetch(`${API_URL}/course/create_badge_icon`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ course_id: courseId, name, icon_name: iconName })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to create badge");
        }

        const data = await response.json() as CreateBadgeResponse;
        if (data.status === "success") {
            return { success: true, badge: data.badge };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to create badge" };
    }
};

export const createBadgeImage = async (courseId: string, name: string, file: File) => {
    try {
        const accessToken = Cookies.get("accessToken");
        const formData = new FormData();
        formData.append("course_id", courseId);
        formData.append("name", name);
        formData.append("file", file);

        const response = await fetch(`${API_URL}/course/create_badge_image`, {
            method: "POST",
            headers: {
                ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {})
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to create badge");
        }

        const data = await response.json() as CreateBadgeResponse;
        if (data.status === "success") {
            return { success: true, badge: data.badge };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to create badge" };
    }
};
