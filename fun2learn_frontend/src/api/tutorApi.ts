import config from "@/config";
import { getHeaders } from "./apiUtils";
import type {
    TutorInventoryResponse,
    CreateRedeemRequestResponse,
    GetTutorRedeemRequestsResponse,
} from "@/models/responseModels";

const API_URL = config.API_URL;

export const getTutorInventory = async () => {
    try {
        const response = await fetch(`${API_URL}/tutor/inventory`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.detail || "Failed to fetch inventory");
        }

        const data = await response.json() as TutorInventoryResponse;
        if (data.status === "success") {
            return { success: true, gems: data.gems, gemsValueRs: data.gems_value_rs };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to fetch inventory" };
    }
};

export const createRedeemRequest = async (gems: number) => {
    try {
        const response = await fetch(`${API_URL}/tutor/redeem`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ gems }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.detail || "Failed to create redeem request");
        }

        const data = await response.json() as CreateRedeemRequestResponse;
        if (data.status === "success") {
            return { success: true, requestId: data.request_id, message: data.message };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to create redeem request" };
    }
};

export const getTutorRedeemRequests = async () => {
    try {
        const response = await fetch(`${API_URL}/tutor/redeem-requests`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.detail || "Failed to fetch redeem requests");
        }

        const data = await response.json() as GetTutorRedeemRequestsResponse;
        if (data.status === "success") {
            return { success: true, requests: data.requests, currentGems: data.current_gems };
        }
        return { success: false, errorMessage: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to fetch redeem requests" };
    }
};
