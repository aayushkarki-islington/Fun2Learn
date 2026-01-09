from pydantic import BaseModel
from datetime import date
from typing import Literal

class SignUpRequest(BaseModel):
    email: str
    password: str
    full_name: str
    birthday: date
    role: Literal['student', 'tutor']

class SignInRequest(BaseModel):
    email: str
    password: str