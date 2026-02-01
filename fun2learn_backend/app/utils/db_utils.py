from app.connection.postgres_connection import SessionLocal
from typing import Generator
from sqlalchemy import inspect
from app.connection.postgres_connection import engine, Base
import app.models.db_models
from sqlalchemy.orm import configure_mappers
import logging

logger = logging.getLogger(__name__)

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

def ensure_create_all():
    configure_mappers()

    logger.info(f"METADATA TABLES = {list(Base.metadata.tables.keys())}")

    inspector = inspect(engine)
    logger.info(f"DB TABLES BEFORE = {inspector.get_table_names()}")

    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    logger.info(f"DB TABLES AFTER = {inspector.get_table_names()}")

