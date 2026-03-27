from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.auth.dependencies import require_role
from app.utils.db_utils import get_db
from app.models.models import TokenUser
from app.models.request_models import CreateRedeemRequestRequest
from app.models.response_models import (
    TutorInventoryResponse, CreateRedeemRequestResponse,
    GetTutorRedeemRequestsResponse, RedeemRequestDetail
)
from app.models.db_models import UserInventory, TutorRedeemRequest, User
import logging
import uuid
from datetime import datetime, timezone

_SHOW_NAME = "tutor"
router = APIRouter(
    prefix=f"/{_SHOW_NAME}",
    tags=[_SHOW_NAME],
    responses={404: {"description": "Not found"}},
)

logger = logging.getLogger(__name__)

GEM_TO_RS = 0.8


def _get_or_create_inventory(user_id: str, db: Session) -> UserInventory:
    inventory = db.execute(
        select(UserInventory).where(UserInventory.user_id == user_id)
    ).scalar_one_or_none()
    if not inventory:
        inventory = UserInventory(id=str(uuid.uuid4()), user_id=user_id)
        db.add(inventory)
        db.flush()
    return inventory


@router.get("/inventory")
async def get_tutor_inventory(
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db),
):
    """Return the tutor's redeemable gem balance."""
    try:
        inventory = _get_or_create_inventory(current_user.user_id, db)
        db.commit()
        return TutorInventoryResponse(
            status="success",
            message="Inventory retrieved successfully",
            gems=inventory.gems,
            gems_value_rs=round(inventory.gems * GEM_TO_RS, 2),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting tutor inventory: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.post("/redeem")
async def create_redeem_request(
    request: CreateRedeemRequestRequest,
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db),
):
    """Create a gem redemption request. Gems are deducted immediately and held pending admin approval."""
    try:
        if request.gems <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="gems must be a positive integer")
        if request.gems < 100:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Minimum redemption is 100 gems")

        inventory = _get_or_create_inventory(current_user.user_id, db)
        if inventory.gems < request.gems:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient gems. You have {inventory.gems} gems."
            )

        # Deduct gems immediately (held while pending)
        inventory.gems -= request.gems

        amount_rs = int(request.gems * GEM_TO_RS)
        redeem_request = TutorRedeemRequest(
            id=str(uuid.uuid4()),
            tutor_id=current_user.user_id,
            gems_requested=request.gems,
            amount_rs=amount_rs,
            status="pending",
        )
        db.add(redeem_request)
        db.commit()

        return CreateRedeemRequestResponse(
            status="success",
            message="Redeem request submitted successfully. Your gems have been held pending admin approval.",
            request_id=redeem_request.id,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error creating redeem request: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.get("/redeem-requests")
async def get_tutor_redeem_requests(
    current_user: TokenUser = Depends(require_role("tutor", "admin")),
    db: Session = Depends(get_db),
):
    """Get all redeem requests for the logged-in tutor."""
    try:
        requests = db.execute(
            select(TutorRedeemRequest)
            .where(TutorRedeemRequest.tutor_id == current_user.user_id)
            .order_by(TutorRedeemRequest.created_at.desc())
        ).scalars().all()

        inventory = _get_or_create_inventory(current_user.user_id, db)
        db.commit()

        tutor_name = db.execute(
            select(User).where(User.user_id == current_user.user_id)
        ).scalar_one().full_name

        request_details = [
            RedeemRequestDetail(
                id=r.id,
                tutor_id=r.tutor_id,
                tutor_name=tutor_name,
                gems_requested=r.gems_requested,
                amount_rs=r.amount_rs,
                status=r.status,
                notes=r.notes,
                created_at=r.created_at,
                processed_at=r.processed_at,
            )
            for r in requests
        ]

        return GetTutorRedeemRequestsResponse(
            status="success",
            message="Redeem requests retrieved successfully",
            requests=request_details,
            current_gems=inventory.gems,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting tutor redeem requests: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")
