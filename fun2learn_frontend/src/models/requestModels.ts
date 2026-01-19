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