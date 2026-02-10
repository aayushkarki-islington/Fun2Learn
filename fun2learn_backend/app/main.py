from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.utils.logging_utils import setup_logging
import logging
from app.utils.db_utils import ensure_create_all

#Importing all the routes that handle APIs
from app.routes import (
    authentication_route,
    course_route,
    user_route,
    student_route
)

NON_GATED_ROUTES = [
    "/api/auth/login",
    "/api/auth/signup",
]

def get_application():
    """Create a new FastAPI application."""

    load_dotenv()
    setup_logging()

    logger = logging.getLogger(__name__)

    _app = FastAPI(
        debug=False,
        swagger_ui_parameters={
            "defaultModelsExpandDepth": -1,
            "tagsSorter": "alpha",
        },
        openapi_schema={
            "openapi": "3.0.2",
            "info": {
                "title": "Fun2Learn Backend",
                "version": "1.0.0"
            },
            "components": {
                "securitySchemes": {
                    "BearerAuth": {
                        "type": "http",
                        "scheme": "bearer",
                        "bearerFormat": "JWT"
                    }
                }
            }
        }
    )

    # Run this after creating a new table in db_models.py
    # logger.info("Ensuring all the tables are created")
    # ensure_create_all()

    # Add CORS middleware last so it executes first and adds headers to all responses
    origins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
    ]

    _app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @_app.middleware('http')
    async def auth_middleware(request: Request, call_next):
        """
        Middleware for the application. Intercepts all the requests made into the application and then checks whether it has appropriate access

        - **request**: The HTTP request made by any client to the application
        - **call_next**: Function that calls the actual request after validation
        """

        # ✅ Allow CORS preflight requests
        if request.method == "OPTIONS":
            return await call_next(request)

        # Check if route is non-gated (public)
        if any(request.url.path.startswith(route) for route in NON_GATED_ROUTES):
            logger.info(f"[MIDDLEWARE] Non-gated route accessed: {request.url.path}")
            return await call_next(request)

        # Check if it's an API route that requires authentication
        if request.url.path.startswith("/api"):
            authorization_header = request.headers.get('Authorization')
            
            if authorization_header:
                id_token = authorization_header.replace("Bearer ", '') if authorization_header.startswith("Bearer ") else authorization_header
                logger.info(f"[MIDDLEWARE] Authenticated request to: {request.url.path}")
                return await call_next(request)
            else:
                logger.warning(f"[MIDDLEWARE] Unauthorized access attempt to: {request.url.path}")
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Authorization Header is Missing"}
                )
        else:
            # Non-API routes (static files, etc.)
            return await call_next(request)


    @_app.get("/")
    async def root():
        """Root endpoint - health check"""
        return {
            "message": "Fun2Learn Backend API",
            "status": "running",
            "version": "1.0.0"
        }

    _app.include_router(authentication_route.router, prefix="/api")
    _app.include_router(course_route.router, prefix="/api")
    _app.include_router(user_route.router, prefix="/api")
    _app.include_router(student_route.router, prefix="/api")
    return _app

app = get_application()