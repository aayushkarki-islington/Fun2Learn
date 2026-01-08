from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.utils.logging_utils import setup_logging

#Importing all the routes that handle APIs
from app.routes import (
    authentication_route
)

def get_application():
    """Create a new FastAPI application."""

    setup_logging() 

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

    _app.include_router(authentication_route.router, prefix="/api")

    return _app

app = get_application()
    