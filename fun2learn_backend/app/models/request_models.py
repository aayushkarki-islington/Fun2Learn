from pydantic import BaseModel
from datetime import date
from typing import Literal, List

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

class AddChapterRequest(BaseModel):
    name: str
    unit_id: str

class AddLessonRequest(BaseModel):
    name: str
    chapter_id: str

class MCQOptionRequest(BaseModel):
    option_text: str
    is_correct: bool

class AddMCQQuestionRequest(BaseModel):
    question_text: str
    lesson_id: str
    options: List[MCQOptionRequest]

class AddTextQuestionRequest(BaseModel):
    question_text: str
    lesson_id: str
    correct_answer: str
    casing_matters: bool = False