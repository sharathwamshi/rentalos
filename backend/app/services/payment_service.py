"""
Payment gateway integration (Razorpay). Handles both:
  1) Tenant "Pay Now" for a rent invoice
  2) Owner subscription billing
Keys come from Admin > Settings, never hardcoded.
"""
import hmac
import hashlib
import logging
from app.services.settings_service import get_setting

logger = logging.getLogger(__name__)


def _client():
    import razorpay

    key_id = get_setting("razorpay_key_id")
    key_secret = get_setting("razorpay_key_secret")
    if not key_id or not key_secret:
        return None
    return razorpay.Client(auth=(key_id, key_secret))


def create_order(amount_rupees: float, receipt: str, notes: dict | None = None):
    client = _client()
    if not client:
        raise RuntimeError("Payment gateway is not configured yet. Ask your admin to add Razorpay keys.")
    order = client.order.create(
        {
            "amount": int(round(amount_rupees * 100)),  # paise
            "currency": "INR",
            "receipt": receipt,
            "notes": notes or {},
            "payment_capture": 1,
        }
    )
    return order


def verify_payment_signature(order_id: str, payment_id: str, signature: str) -> bool:
    key_secret = get_setting("razorpay_key_secret")
    if not key_secret:
        return False
    payload = f"{order_id}|{payment_id}".encode()
    expected = hmac.new(key_secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def is_configured() -> bool:
    return bool(get_setting("razorpay_key_id") and get_setting("razorpay_key_secret"))
