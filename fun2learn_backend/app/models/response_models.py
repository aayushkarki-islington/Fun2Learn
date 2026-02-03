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
    unit_index: int

class AddChapterResponse(BaseModel):
    status: str
    message: str
    chapter_id: str
    chapter_index: int

class AddLessonResponse(BaseModel):
    status: str
    message: str
    lesson_id: str
    lesson_index: int

class AddMCQQuestionResponse(BaseModel):
    status: str
    message: str
    question_id: str

class AddTextQuestionResponse(BaseModel):
    status: str
    message: str
    question_id: str

class EditCourseResponse(BaseModel):
    status: str
    message: str
    course_id: str

class DeleteCourseResponse(BaseModel):
    status: str
    message: str

class EditUnitResponse(BaseModel):
    status: str
    message: str
    unit_id: str

class DeleteUnitResponse(BaseModel):
    status: str
    message: str

class EditChapterResponse(BaseModel):
    status: str
    message: str
    chapter_id: str

class DeleteChapterResponse(BaseModel):
    status: str
    message: str

class EditLessonResponse(BaseModel):
    status: str
    message: str
    lesson_id: str

class DeleteLessonResponse(BaseModel):
    status: str
    message: str

class EditMCQQuestionResponse(BaseModel):
    status: str
    message: str
    question_id: str

class EditTextQuestionResponse(BaseModel):
    status: str
    message: str
    question_id: str

class DeleteQuestionResponse(BaseModel):
    status: str
    message: str

class ErrorResponse(BaseModel):
    status: str
    message: str
    detail: Optional[str] = None