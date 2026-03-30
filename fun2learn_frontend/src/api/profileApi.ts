import config from "@/config";
import { getHeaders } from "./apiUtils";
import Cookies from "js-cookie";
import type {
    GetUserProfileResponse, UpdateProfileResponse, UploadProfilePictureResponse,
    FollowResponse, GetFollowersResponse, GetFollowingResponse, SearchUsersResponse
} from "@/models/responseModels";
import type { UpdateProfileRequest } from "@/models/requestModels";

const API_URL = config.API_URL;

function getAuthHeaders(): Headers {
    const accessToken = Cookies.get("accessToken");
    const headers = new Headers();
    if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }
    return headers;
}

export const getMyProfile = async () => {
    try {
        const response = await fetch(`${API_URL}/user/profile`, {
            method: "GET",
            headers: getHeaders(),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.detail || "Failed to get profile");
        }
        const data = await response.json() as GetUserProfileResponse;
        return { success: true, profile: data.profile };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to get profile" };
    }
};

export const getUserProfile = async (userId: string) => {
    try {
        const response = await fetch(`${API_URL}/user/profile/${userId}`, {
            method: "GET",
            headers: getHeaders(),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.detail || "Failed to get profile");
        }
        const data = await response.json() as GetUserProfileResponse;
        return { success: true, profile: data.profile };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to get profile" };
    }
};

export const updateProfile = async (payload: UpdateProfileRequest) => {
    try {
        const response = await fetch(`${API_URL}/user/profile`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.detail || "Failed to update profile");
        }
        const data = await response.json() as UpdateProfileResponse;
        return { success: true, message: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to update profile" };
    }
};

export const uploadProfilePicture = async (file: File) => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch(`${API_URL}/user/profile/picture`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: formData,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.detail || "Failed to upload picture");
        }
        const data = await response.json() as UploadProfilePictureResponse;
        return { success: true, imagePath: data.image_path };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to upload picture" };
    }
};

export const followUser = async (targetUserId: string) => {
    try {
        const response = await fetch(`${API_URL}/user/follow/${targetUserId}`, {
            method: "POST",
            headers: getHeaders(),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.detail || "Failed to follow user");
        }
        const data = await response.json() as FollowResponse;
        return { success: true, message: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to follow user" };
    }
};

export const unfollowUser = async (targetUserId: string) => {
    try {
        const response = await fetch(`${API_URL}/user/follow/${targetUserId}`, {
            method: "DELETE",
            headers: getHeaders(),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.detail || "Failed to unfollow user");
        }
        const data = await response.json() as FollowResponse;
        return { success: true, message: data.message };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to unfollow user" };
    }
};

export const getFollowers = async () => {
    try {
        const response = await fetch(`${API_URL}/user/followers`, {
            method: "GET",
            headers: getHeaders(),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.detail || "Failed to get followers");
        }
        const data = await response.json() as GetFollowersResponse;
        return { success: true, users: data.users, count: data.count };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to get followers" };
    }
};

export const getFollowing = async () => {
    try {
        const response = await fetch(`${API_URL}/user/following`, {
            method: "GET",
            headers: getHeaders(),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.detail || "Failed to get following");
        }
        const data = await response.json() as GetFollowingResponse;
        return { success: true, users: data.users, count: data.count };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to get following" };
    }
};

export const searchUsers = async (query: string) => {
    try {
        const response = await fetch(`${API_URL}/user/search?q=${encodeURIComponent(query)}`, {
            method: "GET",
            headers: getHeaders(),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.detail || "Failed to search users");
        }
        const data = await response.json() as SearchUsersResponse;
        return { success: true, users: data.users };
    } catch (e) {
        return { success: false, errorMessage: e instanceof Error ? e.message : "Failed to search users" };
    }
};
