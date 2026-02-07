from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import logging
import uuid
from datetime import date

from app.models.request_models import SignUpRequest, SignInRequest
from app.models.response_models import SignUpResponse, SignInResponse, ErrorResponse
from app.models.db_models import User
from app.utils.auth_utils import hash_password, verify_password, create_access_token
from app.utils.db_utils import get_db

_SHOW_NAME = "auth"
router = APIRouter(
    prefix=f"/{_SHOW_NAME}",
    tags=[_SHOW_NAME],
    responses={404: {"description": "Not found"}},
)

logger = logging.getLogger(__name__)

def calculate_age(birthday: date) -> int:
    """Calculate age from birthday."""
    today = date.today()
    return today.year - birthday.year - ((today.month, today.day) < (birthday.month, birthday.day))

@router.post("/signup", response_model=SignUpResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    request: SignUpRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new user account.

    - **email**: Valid email address (must be unique)
    - **password**: User password (will be hashed)
    - **full_name**: User's full name
    - **birthday**: User's date of birth
    - **gender**: User's gender
    - **role**: User role ("student" | "tutor") (default: "student")
    """
    logger.info(f"Signup attempt for email: {request.email}")

    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            logger.warning(f"Signup failed: Email already registered - {request.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Hash the password
        hashed_password = hash_password(request.password)

        # Create new user
        user_id = str(uuid.uuid4())
        new_user = User(
            user_id=user_id,
            full_name=request.full_name,
            birthdate=request.birthday,
            email=request.email,
            password=hashed_password,
            role=request.role,
            gender=request.gender
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        logger.info(f"User created successfully: {request.email} with ID: {user_id}")

        return SignUpResponse(
            status="success",
            message="User registered successfully",
            user_id=user_id
        )
    except HTTPException:
        raise
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error during signup: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error during signup: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during registration"
        )

@router.post("/login", response_model=SignInResponse)
async def login(
    request: SignInRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return access token.

    - **email**: Registered email address
    - **password**: User password
    """
    logger.info(f"Login attempt for email: {request.email}")

    try:
        # Find user by email
        user = db.query(User).filter(User.email == request.email).first()

        if not user:
            logger.warning(f"Login failed: User not found - {request.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Verify password
        if not verify_password(request.password, user.password):
            logger.warning(f"Login failed: Invalid password - {request.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Create access token
        access_token = create_access_token(
            payload={
                "sub": user.user_id,
                "email": user.email,
                "role": user.role
            }
        )

        logger.info(f"Login successful for user: {request.email}")

        return SignInResponse(
            status="success",
            message="Login successful",
            access_token=access_token,
            token_type="bearer",
            user={
                "user_id": user.user_id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "birthdate": user.birthdate,
                "image_path": user.image_path
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login"
        )