import config from "@/config";
import { getHeaders } from "./apiUtils";
import { GetCoursesResponse, CourseCreationResponse, DeleteCourseResponse } from "@/models/responseModels";

const API_URL = config.API_URL;

/**
 * Get all courses for the logged-in tutor
 * @returns { success: boolean, courses?: CourseSummary[], errorMessage?: string }
 */
export const getCourses = async () => {
    try {
        const url = `${API_URL}/course/courses`;

        const response = await fetch(url, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to fetch courses");
        }

        const coursesResponse = await response.json() as GetCoursesResponse;

        if (coursesResponse.status === "success") {
            return {
                success: true,
                courses: coursesResponse.courses
            };
        } else {
            return {
                success: false,
                errorMessage: coursesResponse.message
            };
        }
    } catch (e) {
        console.error("Get courses error:", e);

        let errorMessage = "";

        if (e instanceof Error) {
            errorMessage = e.message;
        } else {
            errorMessage = "Failed to fetch courses";
        }

        return {
            success: false,
            errorMessage
        };
    }
};

/**
 * Create a new course
 * @param name Course name
 * @param description Course description
 * @returns { success: boolean, courseId?: string, errorMessage?: string }
 */
export const createCourse = async (name: string, description: string) => {
    try {
        const url = `${API_URL}/course/create_course`;

        const response = await fetch(url, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                name,
                description
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to create course");
        }

        const createResponse = await response.json() as CourseCreationResponse;

        if (createResponse.status === "success" || createResponse.status === "Success") {
            return {
                success: true,
                courseId: createResponse.course_id
            };
        } else {
            return {
                success: false,
                errorMessage: createResponse.message
            };
        }
    } catch (e) {
        console.error("Create course error:", e);

        let errorMessage = "";

        if (e instanceof Error) {
            errorMessage = e.message;
        } else {
            errorMessage = "Failed to create course";
        }

        return {
            success: false,
            errorMessage
        };
    }
};

/**
 * Delete a course
 * @param courseId Course ID to delete
 * @returns { success: boolean, errorMessage?: string }
 */
export const deleteCourse = async (courseId: string) => {
    try {
        const url = `${API_URL}/course/delete_course`;

        const response = await fetch(url, {
            method: "DELETE",
            headers: getHeaders(),
            body: JSON.stringify({
                course_id: courseId
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to delete course");
        }

        const deleteResponse = await response.json() as DeleteCourseResponse;

        if (deleteResponse.status === "success") {
            return {
                success: true
            };
        } else {
            return {
                success: false,
                errorMessage: deleteResponse.message
            };
        }
    } catch (e) {
        console.error("Delete course error:", e);

        let errorMessage = "";

        if (e instanceof Error) {
            errorMessage = e.message;
        } else {
            errorMessage = "Failed to delete course";
        }

        return {
            success: false,
            errorMessage
        };
    }
};
