from pydantic import BaseModel

class TokenUser(BaseModel):
    user_id: str
    email: str | None = None
    role: str