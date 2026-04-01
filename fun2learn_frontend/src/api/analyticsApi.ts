import config from "@/config";
import { getHeaders } from "./apiUtils";
import type { TutorAnalyticsOverviewResponse, TutorCourseAnalyticsResponse } from "@/models/responseModels";

const API_URL = config.API_URL;

function buildDateParams(startDate?: string, endDate?: string): string {
    const params = new URLSearchParams();
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
}

export const getAnalyticsOverview = async (startDate?: string, endDate?: string) => {
    try {
        const response = await fetch(
            `${API_URL}/tutor/analytics/overview${buildDateParams(startDate, endDate)}`,
            { method: "GET", headers: getHeaders() }
        );
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.detail || "Failed to fetch analytics");
        }
        const data = await response.json() as TutorAnalyticsOverviewResponse;
        return { success: true, data };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to fetch analytics" };
    }
};

export const getCourseAnalytics = async (courseId: string, startDate?: string, endDate?: string) => {
    try {
        const response = await fetch(
            `${API_URL}/tutor/analytics/course/${courseId}${buildDateParams(startDate, endDate)}`,
            { method: "GET", headers: getHeaders() }
        );
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.detail || "Failed to fetch course analytics");
        }
        const data = await response.json() as TutorCourseAnalyticsResponse;
        return { success: true, data };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to fetch course analytics" };
    }
};
