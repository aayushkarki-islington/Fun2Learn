from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.auth.dependencies import require_role
from app.utils.db_utils import get_db
from app.models.models import TokenUser
from app.models.request_models import UpdateRedeemStatusRequest
from app.models.response_models import (
    GetAdminRedeemRequestsResponse, RedeemRequestDetail,
    UpdateRedeemStatusResponse, AdminStatsResponse
)
from app.models.db_models import TutorRedeemRequest, UserInventory, User, Course, Enrollment
import logging
from datetime import datetime, timezone

_SHOW_NAME = "admin"
router = APIRouter(
    prefix=f"/{_SHOW_NAME}",
    tags=[_SHOW_NAME],
    responses={404: {"description": "Not found"}},
)

logger = logging.getLogger(__name__)


@router.get("/redeem-requests")
async def get_admin_redeem_requests(
    current_user: TokenUser = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Get all redeem requests across all tutors (admin only)."""
    try:
        requests = db.execute(
            select(TutorRedeemRequest, User)
            .outerjoin(User, User.user_id == TutorRedeemRequest.tutor_id)
            .order_by(TutorRedeemRequest.created_at.desc())
        ).all()

        request_details = []
        for r, tutor in requests:
            request_details.append(RedeemRequestDetail(
                id=r.id,
                tutor_id=r.tutor_id,
                tutor_name=tutor.full_name if tutor else "Unknown",
                gems_requested=r.gems_requested,
                amount_rs=r.amount_rs,
                status=r.status,
                notes=r.notes,
                created_at=r.created_at,
                processed_at=r.processed_at,
            ))

        return GetAdminRedeemRequestsResponse(
            status="success",
            message="Redeem requests retrieved successfully",
            requests=request_details,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting admin redeem requests: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.put("/redeem-request/update")
async def update_redeem_status(
    request: UpdateRedeemStatusRequest,
    current_user: TokenUser = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """
    Update a redeem request status. If rejected, gems are refunded to the tutor.
    Valid statuses: 'paid' | 'rejected'
    """
    try:
        if request.status not in ("paid", "rejected"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="status must be 'paid' or 'rejected'")

        redeem_req = db.execute(
            select(TutorRedeemRequest).where(TutorRedeemRequest.id == request.request_id)
        ).scalar_one_or_none()

        if not redeem_req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Redeem request not found")

        if redeem_req.status != "pending":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending requests can be updated")

        # If rejected, refund gems to tutor
        if request.status == "rejected":
            tutor_inventory = db.execute(
                select(UserInventory).where(UserInventory.user_id == redeem_req.tutor_id)
            ).scalar_one_or_none()
            if tutor_inventory:
                tutor_inventory.gems += redeem_req.gems_requested

        redeem_req.status = request.status
        redeem_req.notes = request.notes
        redeem_req.processed_at = datetime.now(timezone.utc)
        db.commit()

        return UpdateRedeemStatusResponse(
            status="success",
            message=f"Request {request.status} successfully",
            request_id=redeem_req.id,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error updating redeem status: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")


@router.get("/stats")
async def get_admin_stats(
    current_user: TokenUser = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Get platform overview statistics."""
    try:
        total_users = db.execute(select(func.count()).select_from(User)).scalar_one()
        total_courses = db.execute(select(func.count()).select_from(Course)).scalar_one()
        total_enrollments = db.execute(select(func.count()).select_from(Enrollment)).scalar_one()
        pending_redeem = db.execute(
            select(func.count()).select_from(TutorRedeemRequest)
            .where(TutorRedeemRequest.status == "pending")
        ).scalar_one()

        return AdminStatsResponse(
            status="success",
            message="Stats retrieved successfully",
            total_users=total_users,
            total_courses=total_courses,
            total_enrollments=total_enrollments,
            pending_redeem_requests=pending_redeem,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting admin stats: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal Server Error")
