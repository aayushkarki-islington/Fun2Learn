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
