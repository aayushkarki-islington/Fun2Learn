import config from "@/config";
import { getHeaders } from "./apiUtils";
import { LoginRequest, SignUpRequest } from "@/models/requestModels";
import { LoginResponse, SignUpResponse } from "@/models/responseModels";
import Cookies from "js-cookie";
import { User } from "@/models/types";

const API_URL = config.API_URL;

/**
 * Login API function. Used to log a user into the application.
 * @param payload Payload for the request. Check LoginRequest Model for values needed
 * @returns \{ success: boolean, errorMessage?: string }
 */
export const login = async (payload: LoginRequest) => {
    try {
        const url = `${API_URL}/auth/login`;

        const response = await fetch(url, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                "email": payload.email,
                "password": payload.password
            })
        })

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Login failed");
        }

        const loginResponse = await response.json() as LoginResponse;
        if(loginResponse.status == "success") {
            // Add access tokens to cookies
            loginResponse.access_token && Cookies.set("accessToken", loginResponse.access_token);

            return {
                success: true
            }
        }
        else {
            return {
                success: false,
                errorMessage: loginResponse.message
            }
        }
    }
    catch (e) {
        console.error("Login error:", e);

        let errorMessage = "";

        if (e instanceof Error) {
            errorMessage = e.message;
        } else {
            errorMessage = "Login failed"
        }

        return {
            success: false,
            errorMessage
        }
    }
}

/**
 * Signup API function. Used to register a new user in the application.
 * @param payload Payload for the request. Check SignUpRequest Model for values needed
 * @returns { success: boolean, errorMessage?: string, userId?: string }
 */
export const signup = async (payload: SignUpRequest) => {
    try {
        const url = `${API_URL}/auth/signup`;

        const response = await fetch(url, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                "email": payload.email,
                "password": payload.password,
                "full_name": payload.fullName,
                "birthday": payload.birthday,
                "gender": payload.gender,
                "role": payload.role
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Signup failed");
        }

        const signupResponse = await response.json() as SignUpResponse;
        
        if (signupResponse.status === "success") {
            return {
                success: true,
                userId: signupResponse.user_id
            };
        } else {
            return {
                success: false,
                errorMessage: signupResponse.message
            };
        }
    } catch (e) {
        console.error("Signup error:", e);

        let errorMessage = "";

        if (e instanceof Error) {
            errorMessage = e.message;
        } else {
            errorMessage = "Signup failed";
        }

        return {
            success: false,
            errorMessage
        };
    }
};

export const getUserData = async () => {
    try {
        const url = `${API_URL}/user/me`;

        const response = await fetch(url, {
            method: "GET", 
            headers: getHeaders()
        })

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || error?.detail || "Failed to create course");
        }

        const user_data = await response.json() as User;
        return user_data;
    }
    catch (e) {
        console.error("Failed to get user data");
        return null;
    }
}