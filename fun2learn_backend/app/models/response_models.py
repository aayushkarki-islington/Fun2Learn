from pydantic import BaseModel
from typing import Optional

class SignUpResponse(BaseModel):
    status: str
    message: str
    user_id: Optional[str] = None

class SignInResponse(BaseModel):
    status: str
    message: str
    access_token: Optional[str] = None
    token_type: Optional[str] = "bearer"
    user: Optional[dict] = None

class CourseCreationResponse(BaseModel):
    status: str
    message: str
    course_id: str

class AddUnitResponse(BaseModel):
    status: str
    message: str
    unit_id: str
    unit_index: str

class ErrorResponse(BaseModel):
    status: str
    message: str
    detail: Optional[str] = None