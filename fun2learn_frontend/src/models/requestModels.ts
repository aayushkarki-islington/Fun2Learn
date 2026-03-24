export interface LoginRequest {
    email: string;
    password: string;
}

export interface SignUpRequest {
    email: string;
    password: string;
    fullName: string;
    birthday: string; // ISO date string (YYYY-MM-DD)
    gender: string;
    role: 'learner' | 'tutor';
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    email: string;
    verification_code: string;
    new_password: string;
}