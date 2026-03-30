export interface LoginRequest {
    email: string;
    password: string;
}

export interface SignUpRequest {
    email: string;
    password: string;
    fullName: string;
    username: string;
    birthday: string; // ISO date string (YYYY-MM-DD)
    gender: string;
    role: 'learner' | 'tutor';
}

export interface UpdateProfileRequest {
    full_name?: string;
    username?: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    email: string;
    verification_code: string;
    new_password: string;
}

export interface SetCoursePriceRequest {
    course_id: string;
    price_gems?: number | null;
}

export interface CreateRedeemRequestRequest {
    gems: number;
}

export interface UpdateRedeemStatusRequest {
    request_id: string;
    status: 'paid' | 'rejected';
    notes?: string;
}

export interface SubmitFeedbackRequest {
    rating: number;
    comment?: string;
}