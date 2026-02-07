from sqlalchemy import Column, String, Date, TIMESTAMP, Text, Integer, Boolean, ForeignKey, text
from sqlalchemy.orm import relationship
from app.connection.postgres_connection import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(String(40), primary_key=True)
    full_name = Column(String(255), nullable=False)
    birthdate = Column(Date)
    email = Column(String(255), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    role = Column(String(40), nullable=False, server_default="student")
    gender = Column(String(20), nullable=False)
    image_path = Column(String(255))
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    status = Column(String(20), server_default="active")
    courses = relationship("Course", back_populates="user", cascade="all, delete-orphan")

class Course(Base):
    __tablename__ = "courses"

    id = Column(String(40), primary_key=True)
    name = Column(String(255), nullable = False)
    description = Column(Text, nullable=False)
    created_by = Column(String(40), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    status = Column(String(20), nullable=False)
    user = relationship("User", back_populates="courses")
    units = relationship("Unit", back_populates="course", cascade="all, delete-orphan")
    course_tags = relationship("CourseTag", back_populates="course", cascade="all, delete-orphan")

class Unit(Base):
    __tablename__ = "units"

    id = Column(String(40), primary_key=True)
    name = Column(String(255), nullable = False)
    description = Column(Text)
    unit_index = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    course_id = Column(String(40), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    course = relationship("Course", back_populates="units")
    chapters = relationship("Chapter", back_populates="unit", cascade="all, delete-orphan")

class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(String(40), primary_key=True)
    name = Column(String(255), nullable=False)
    chapter_index = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    unit_id = Column(String(40), ForeignKey("units.id", ondelete="CASCADE"), nullable=False)
    unit = relationship("Unit", back_populates="chapters")
    lessons = relationship("Lesson", back_populates="chapter", cascade="all, delete-orphan")

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(String(40), primary_key=True)
    name = Column(String(255), nullable=False)
    lesson_index = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    chapter_id = Column(String(40), ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False)
    chapter = relationship("Chapter", back_populates="lessons")
    questions = relationship("Question", back_populates="lesson", cascade="all, delete-orphan")
    lesson_attachments = relationship("LessonAttachment", back_populates="lesson", cascade="all, delete-orphan")

class LessonAttachment(Base):
    __tablename__ = "lesson_attachments"
    id = Column(String(40), primary_key=True)
    file_name = Column(Text, nullable=False)
    s3_url = Column(String(100))
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    lesson_id = Column(String(40), ForeignKey("lessons.id", ondelete="CASCADE"))
    lesson = relationship("Lesson", back_populates="lesson_attachments")

class Question(Base):
    __tablename__ = "lesson_questions"

    id = Column(String(40), primary_key=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(100), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    lesson_id = Column(String(40), ForeignKey("lessons.id"), nullable=False)
    lesson = relationship("Lesson", back_populates="questions")
    mcq_options = relationship("MCQOption", back_populates="question", cascade="all, delete-orphan")
    text_answers = relationship("TextAnswer", back_populates="question", cascade="all, delete-orphan")

class MCQOption(Base):
    __tablename__ = "lesson_mcq_options"

    id = Column(String(40), primary_key=True)
    option_text = Column(Text)
    is_correct = Column(Boolean, server_default="false")
    question_id = Column(String(40), ForeignKey("lesson_questions.id"))
    question = relationship("Question", back_populates="mcq_options")

class TextAnswer(Base):
    __tablename__ = "lesson_text_answer"
    
    id = Column(String(40), primary_key=True)
    correct_answer = Column(Text, nullable=False)
    casing_matters = Column(Boolean, server_default="false")
    question_id = Column(String(40), ForeignKey("lesson_questions.id"))
    question = relationship("Question", back_populates="text_answers")

class Badge(Base):
    __tablename__ = "badge"

    id = Column(String(40), primary_key=True)
    name = Column(String(100), nullable=False)
    # badgetype can be 'icon' | 'image' differentiating whether user uses one of available (Lucide) icons, or custom images for badge
    badge_type = Column(String(20), nullable=False)
    icon_name = Column(String(100))
    image_url = Column(String(100))
    course_id = Column(String(20), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))

class Tag(Base):
    __tablename__ = "tags"
    id = Column(String(40), primary_key=True)
    name = Column(String(100), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    course_tags = relationship("CourseTag", back_populates="tag", cascade="all, delete-orphan")

class CourseTag(Base):
    __tablename__ = "course_tags"
    id = Column(String(40), primary_key=True)
    course_id = Column(String(40), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    tag_id = Column(String(40), ForeignKey("tags.id", ondelete="CASCADE"), nullable=False)
    course = relationship("Course", back_populates="course_tags")
    tag = relationship("Tag", back_populates="course_tags")


