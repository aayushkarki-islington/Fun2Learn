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

class ErrorResponse(BaseModel):
    status: str
    message: str
    detail: Optional[str] = None