import { NextRequest, NextResponse } from "next/server";
import { decodeJwt } from "jose";

interface JWTPayload {
    // Custom backend payload
    sub: string;
    email: string;
    role: string;

    // Default payload
    exp: number;
    iat?: number;
}

const NON_GATED_PATHS = [
    "/login",
    "/signup"
]

const STATIC_PATHS = [
    "/",
    ".",
    "/_next",
    "/favicon.ico"
]

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Bypass routes that don't need verification
    if(NON_GATED_PATHS.includes(pathname)){
        return NextResponse.next();
    }

    // Return static files path without blockers
    if(STATIC_PATHS.some((path) => pathname.startsWith(path))){
        return NextResponse.next();
    }

    // Get Id Token in Cookies
    const accessToken = request.cookies.get('accessToken');

    if(!accessToken) {
        return NextResponse.redirect(new URL("/login", request.nextUrl));
    }
}