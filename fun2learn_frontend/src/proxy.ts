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

// Non gated paths. Add any paths that should be accessible no matter the state of authentication
const NON_GATED_PATHS: string[] = []

// Paths that only show when the user is not logged in. If logged in, redirect to different page
const NO_AUTH_ONLY_PATHS = [
    "/login",
    "/signup"
]

const STATIC_PATHS = [
    "/_next",
    "/favicon.ico",
]

export async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Bypass routes that don't need verification
    if(NON_GATED_PATHS.includes(pathname)){
        return NextResponse.next();
    }

    // Return static files path without blockers
    if(
        STATIC_PATHS.some((path) => pathname.startsWith(path) ||
        pathname.includes(".")
    )){
        return NextResponse.next();
    }

    // Get Id Token in Cookies
    const accessToken = request.cookies.get('accessToken');

    if(!accessToken) {
        if(NO_AUTH_ONLY_PATHS.includes(pathname)){
            return NextResponse.next();
        }
        
        return NextResponse.redirect(new URL("/login", request.nextUrl));
    } else {
        if(NO_AUTH_ONLY_PATHS.includes(pathname)){
            return NextResponse.redirect(new URL("/home", request.nextUrl));
        }
    }
}