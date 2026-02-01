from pydantic import BaseModel
from datetime import date
from typing import Literal

class SignUpRequest(BaseModel):
    email: str
    password: str
    full_name: str
    birthday: date
    gender: str
    role: Literal['learner', 'tutor']

class SignInRequest(BaseModel):
    email: str
    password: str

class CourseCreateRequest(BaseModel):
    name: str
    description: str

class AddUnitRequest(BaseModel):
    name: str
    description: str
    course_id: str