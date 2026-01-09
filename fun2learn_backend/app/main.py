from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.utils.logging_utils import setup_logging
import logging

#Importing all the routes that handle APIs
from app.routes import (
    authentication_route
)

NON_GATED_ROUTES = [
    "/api/auth/login",
    "/api/auth/signup"
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

        if any(request.url.path.startswith(route) for route in NON_GATED_ROUTES):
            logger.info("[MIDDLEWARE] Found non gated route. Allowing request to bypass")
            return await call_next(request)
        
        authorization_header = request.headers.get('Authorization')
        if(request.url.path.startswith("/api")):
            if authorization_header:
                id_token = authorization_header.replace("Bearer ", '') if authorization_header.startswith("Bearer ") else authorization_header
                return await call_next(request)
            else: 
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authorization Header is Missing"
                )
        else:
            return await call_next(request)


    _app.include_router(authentication_route.router, prefix="/api")
    return _app

app = get_application()