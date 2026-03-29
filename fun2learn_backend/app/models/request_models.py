from pydantic import BaseModel
from datetime import date
from typing import Literal, List, Optional

class SignUpRequest(BaseModel):
    email: str
    password: str
    full_name: str
    username: str
    birthday: date
    gender: str
    role: Literal['learner', 'tutor']


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None

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

class EditCourseRequest(BaseModel):
    course_id: str
    name: str
    description: str

class DeleteCourseRequest(BaseModel):
    course_id: str

class EditUnitRequest(BaseModel):
    unit_id: str
    name: str
    description: str

class DeleteUnitRequest(BaseModel):
    unit_id: str

class EditChapterRequest(BaseModel):
    chapter_id: str
    name: str

class DeleteChapterRequest(BaseModel):
    chapter_id: str

class EditLessonRequest(BaseModel):
    lesson_id: str
    name: str

class DeleteLessonRequest(BaseModel):
    lesson_id: str

class EditMCQQuestionRequest(BaseModel):
    question_id: str
    question_text: str
    options: List[MCQOptionRequest]

class DeleteQuestionRequest(BaseModel):
    question_id: str

class EditTextQuestionRequest(BaseModel):
    question_id: str
    question_text: str
    correct_answer: str
    casing_matters: bool = False

class PublishCourseRequest(BaseModel):
    course_id: str

class DeleteLessonAttachmentRequest(BaseModel):
    attachment_id: str

class SaveCourseTagsRequest(BaseModel):
    course_id: str
    tag_ids: List[str]

class CreateBadgeIconRequest(BaseModel):
    course_id: str
    name: str
    icon_name: str

class DeleteBadgeRequest(BaseModel):
    badge_id: str

# Student request models

class EnrollCourseRequest(BaseModel):
    course_id: str

class SubmitAnswerRequest(BaseModel):
    question_id: str
    answer: str

class CompleteLessonRequest(BaseModel):
    lesson_id: str
    course_id: str

class InitiatePaymentRequest(BaseModel):
    package_id: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    verification_code: str
    new_password: str

class SetCoursePriceRequest(BaseModel):
    course_id: str
    # price_gems: None = free; positive int = gems students pay to enroll
    price_gems: Optional[int] = None

class SetCourseDiscountRequest(BaseModel):
    course_id: str
    # discount_percent: None = remove discount; 1-99 = percentage off
    discount_percent: Optional[int] = None

class CreateRedeemRequestRequest(BaseModel):
    gems: int

class UpdateRedeemStatusRequest(BaseModel):
    request_id: str
    # "pending" | "paid" | "rejected"
    status: str
    notes: Optional[str] = None

class SubmitFeedbackRequest(BaseModel):
    rating: int  # 1–5
    comment: Optional[str] = None