from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("POSTGRES_CONNECTION_URL")
print("URL:", DATABASE_URL)

engine = create_engine(DATABASE_URL, echo=True, future=True)

with engine.connect() as conn:
    # wrap raw SQL in text()
    result = conn.execute(text("SELECT NOW();"))
    print(result.fetchone())