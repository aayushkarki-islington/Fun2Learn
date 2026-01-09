from sqlalchemy import Column, String, Integer, TIMESTAMP, text
from app.connection.postgres_connection import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(String(40), primary_key=True)
    full_name = Column(String(255), nullable=False)
    age = Column(Integer)
    email = Column(String(255), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    role = Column(String(40), nullable=False, server_default="student")
    image_path = Column(String(255))
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))