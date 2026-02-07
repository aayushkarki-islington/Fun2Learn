from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

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

class PublishCourseResponse(BaseModel):
    status: str
    message: str
    course_id: str

class MCQOptionDetail(BaseModel):
    id: str
    option_text: str
    is_correct: bool

class TextAnswerDetail(BaseModel):
    id: str
    correct_answer: str
    casing_matters: bool

class QuestionDetail(BaseModel):
    id: str
    question_text: str
    question_type: str
    mcq_options: Optional[List[MCQOptionDetail]] = None
    text_answer: Optional[TextAnswerDetail] = None

class LessonDetail(BaseModel):
    id: str
    name: str
    lesson_index: int
    created_at: datetime
    question_count: int

class ChapterDetail(BaseModel):
    id: str
    name: str
    chapter_index: int
    created_at: datetime
    lessons: List[LessonDetail]

class UnitDetail(BaseModel):
    id: str
    name: str
    description: Optional[str]
    unit_index: int
    created_at: datetime
    chapters: List[ChapterDetail]

class CourseDetail(BaseModel):
    id: str
    name: str
    description: str
    status: str
    created_at: datetime
    units: List[UnitDetail]

class CourseSummary(BaseModel):
    id: str
    name: str
    description: str
    status: str
    created_at: datetime
    unit_count: int
    chapter_count: int
    lesson_count: int
    question_count: int

class GetCoursesResponse(BaseModel):
    status: str
    message: str
    courses: List[CourseSummary]

class GetCourseDetailResponse(BaseModel):
    status: str
    message: str
    course: CourseDetail

class ErrorResponse(BaseModel):
    status: str
    message: str
    detail: Optional[str] = None

class LessonAttachmentDetail(BaseModel):
    id: str
    file_name: str
    s3_url: str
    created_at: datetime

class UploadLessonAttachmentResponse(BaseModel):
    status: str
    message: str
    attachment_id: str
    file_name: str
    s3_url: str

class GetLessonAttachmentsResponse(BaseModel):
    status: str
    message: str
    attachments: List[LessonAttachmentDetail]

class DeleteLessonAttachmentResponse(BaseModel):
    status: str
    message: str

class GetLessonQuestionsResponse(BaseModel):
    status: str
    message: str
    questions: List[QuestionDetail]