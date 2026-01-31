"""
Import: fun2learn_backend.app.auth.dependencies
Auth Dependencies for the application. Any auth dependencies required by the application is handled here. 
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.models.models import TokenUser
from app.utils.auth_utils import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(
    token: str = Depends(oauth2_scheme)
) -> TokenUser:
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenUser(
        user_id = payload.get("sub"),
        email = payload.get("email"),
        role = payload.get("role")
    )

def require_role(*roles: str) -> TokenUser:
    """
    Check if an authenticated user meets the required role.
    Blocks the user with a 403 Forbidden response otherwise.
    """
    def checker(user: TokenUser = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return checker
