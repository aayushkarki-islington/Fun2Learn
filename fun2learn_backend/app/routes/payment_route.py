from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.auth.dependencies import get_current_user
from app.utils.db_utils import get_db
from app.models.models import TokenUser
from app.models.request_models import InitiatePaymentRequest
from app.models.response_models import InitiatePaymentResponse
from app.models.db_models import GemPurchaseOrder, UserInventory
import logging
import uuid
import hmac
import hashlib
import base64
import json
import os

_SHOW_NAME = "payment"
router = APIRouter(
    prefix=f"/{_SHOW_NAME}",
    tags=[_SHOW_NAME],
    responses={404: {"description": "Not found"}},
)

logger = logging.getLogger(__name__)

# Gem packages — must match the frontend GEM_PACKAGES
PACKAGE_MAP: dict[str, dict] = {
    "200":   {"gems": 200,   "price_rs": 200},
    "500":   {"gems": 500,   "price_rs": 480},
    "1000":  {"gems": 1000,  "price_rs": 920},
    "5000":  {"gems": 5000,  "price_rs": 4200},
    "10000": {"gems": 10000, "price_rs": 9000},
}


def _sign(secret_key: str, total_amount: str, transaction_uuid: str, product_code: str) -> str:
    """Generate eSewa HMAC-SHA256 signature, base64-encoded."""
    message = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}"
    digest = hmac.new(secret_key.encode(), message.encode(), hashlib.sha256).digest()
    return base64.b64encode(digest).decode()


@router.post("/initiate", response_model=InitiatePaymentResponse)
async def initiate_payment(
    request: InitiatePaymentRequest,
    current_user: TokenUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pkg = PACKAGE_MAP.get(request.package_id)
    if not pkg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Package not found")

    secret_key   = os.environ.get("ESEWA_SECRET_KEY", "")
    product_code = os.environ.get("ESEWA_PRODUCT_CODE", "EPAYTEST")
    epay_url     = os.environ.get("ESEWA_EPAY_URL", "https://rc-epay.esewa.com.np/api/epay/main/v2/form")
    success_url  = os.environ.get("ESEWA_SUCCESS_URL", "http://localhost:8000/api/payment/success")
    failure_url  = os.environ.get("ESEWA_FAILURE_URL", "http://localhost:3000/student/marketplace/failure")

    transaction_uuid = str(uuid.uuid4())
    total_amount = str(pkg["price_rs"])

    # Persist the pending order so we can credit gems on success callback
    order = GemPurchaseOrder(
        id=str(uuid.uuid4()),
        transaction_uuid=transaction_uuid,
        user_id=current_user.user_id,
        gems=pkg["gems"],
        amount_rs=pkg["price_rs"],
        status="pending",
    )
    db.add(order)
    db.commit()

    signature = _sign(secret_key, total_amount, transaction_uuid, product_code)

    return InitiatePaymentResponse(
        status="success",
        message="Payment initiated",
        amount=total_amount,
        tax_amount="0",
        total_amount=total_amount,
        transaction_uuid=transaction_uuid,
        product_code=product_code,
        product_service_charge="0",
        product_delivery_charge="0",
        success_url=success_url,
        failure_url=failure_url,
        signed_field_names="total_amount,transaction_uuid,product_code",
        signature=signature,
        epay_url=epay_url,
    )


@router.get("/success")
async def payment_success(data: str, db: Session = Depends(get_db)):
    """
    eSewa redirects the user's browser here after a successful payment.
    `data` is a base64-encoded JSON payload from eSewa.
    We verify the signature, credit gems, then redirect to the frontend.
    """
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")

    try:
        payload = json.loads(base64.b64decode(data).decode())
    except Exception:
        logger.warning("eSewa success callback: failed to decode data payload")
        return RedirectResponse(f"{frontend_url}/student/marketplace/failure?reason=invalid_payload")

    transaction_uuid = payload.get("transaction_uuid")
    total_amount     = payload.get("total_amount", "")
    esewa_status     = payload.get("status", "")

    if esewa_status != "COMPLETE":
        logger.warning(f"eSewa payment not COMPLETE for transaction {transaction_uuid}: {esewa_status}")
        return RedirectResponse(f"{frontend_url}/student/marketplace/failure?reason=not_complete")

    # Verify signature
    secret_key   = os.environ.get("ESEWA_SECRET_KEY", "")
    product_code = os.environ.get("ESEWA_PRODUCT_CODE", "EPAYTEST")
    signed_fields = payload.get("signed_field_names", "")
    received_sig  = payload.get("signature", "")

    # Build message from signed_field_names
    message = ",".join(f"{f}={payload.get(f, '')}" for f in signed_fields.split(","))
    expected_sig = base64.b64encode(
        hmac.new(secret_key.encode(), message.encode(), hashlib.sha256).digest()
    ).decode()

    if not hmac.compare_digest(expected_sig, received_sig):
        logger.error(f"eSewa signature mismatch for transaction {transaction_uuid}")
        return RedirectResponse(f"{frontend_url}/student/marketplace/failure?reason=signature_mismatch")

    # Find the pending order
    order = db.query(GemPurchaseOrder).filter_by(transaction_uuid=transaction_uuid).first()
    if not order:
        logger.error(f"No order found for transaction {transaction_uuid}")
        return RedirectResponse(f"{frontend_url}/student/marketplace/failure?reason=order_not_found")

    if order.status == "completed":
        # Already processed (duplicate callback) — just redirect to success
        return RedirectResponse(f"{frontend_url}/student/marketplace/success?gems={order.gems}")

    # Credit gems to the user's inventory
    inventory = db.query(UserInventory).filter_by(user_id=order.user_id).first()
    if inventory:
        inventory.gems += order.gems

    order.status = "completed"
    db.commit()

    logger.info(f"Credited {order.gems} gems to user {order.user_id} (transaction {transaction_uuid})")
    return RedirectResponse(f"{frontend_url}/student/marketplace/success?gems={order.gems}")


@router.get("/failure")
async def payment_failure(db: Session = Depends(get_db)):
    """eSewa redirects here on payment failure/cancellation."""
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    return RedirectResponse(f"{frontend_url}/student/marketplace/failure")
