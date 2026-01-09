from app.connection.postgres_connection import SessionLocal
from typing import Generator

def get_db() -> Generator:
    """
    Database dependency for FastAPI endpoints.
    Yields a database session and ensures it's closed after the request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
