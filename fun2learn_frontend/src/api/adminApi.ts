import config from "@/config";
import { getHeaders } from "./apiUtils";
import type {
    GetAdminRedeemRequestsResponse,
    UpdateRedeemStatusResponse,
    AdminStatsResponse,
} from "@/models/responseModels";

const API_URL = config.API_URL;

export const getAdminRedeemRequests = async () => {
    try {
        const response = await fetch(`${API_URL}/admin/redeem-requests`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.detail || "Failed to fetch redeem requests");
        }

        const data = await response.json() as GetAdminRedeemRequestsResponse;
        if (data.status === "success") {
            return { success: true, requests: data.requests };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to fetch redeem requests" };
    }
};

export const updateRedeemStatus = async (requestId: string, status: 'paid' | 'rejected', notes?: string) => {
    try {
        const response = await fetch(`${API_URL}/admin/redeem-request/update`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify({ request_id: requestId, status, notes }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.detail || "Failed to update request");
        }

        const data = await response.json() as UpdateRedeemStatusResponse;
        if (data.status === "success") {
            return { success: true, requestId: data.request_id };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to update request" };
    }
};

export const getAdminStats = async () => {
    try {
        const response = await fetch(`${API_URL}/admin/stats`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.detail || "Failed to fetch stats");
        }

        const data = await response.json() as AdminStatsResponse;
        if (data.status === "success") {
            return {
                success: true,
                totalUsers: data.total_users,
                totalCourses: data.total_courses,
                totalEnrollments: data.total_enrollments,
                pendingRedeemRequests: data.pending_redeem_requests,
            };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to fetch stats" };
    }
};
