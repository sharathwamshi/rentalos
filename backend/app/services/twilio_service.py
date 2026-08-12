"""
SMS + WhatsApp delivery via Twilio. Credentials come from Admin > Settings
(app_settings table) — never hardcoded. Every send is best-effort: a failed
send never blocks the in-app notification from being created.
"""
import logging
from app.services.settings_service import get_setting

logger = logging.getLogger(__name__)


def _client():
    from twilio.rest import Client

    sid = get_setting("twilio_account_sid")
    token = get_setting("twilio_auth_token")
    if not sid or not token:
        return None
    return Client(sid, token)


def send_sms(to_phone: str, body: str) -> bool:
    client = _client()
    from_number = get_setting("twilio_sms_from")
    if not client or not from_number or not to_phone:
        logger.info("SMS skipped (not configured): %s", body[:60])
        return False
    try:
        client.messages.create(to=to_phone, from_=from_number, body=body)
        return True
    except Exception as exc:  # pragma: no cover - network dependent
        logger.warning("SMS send failed: %s", exc)
        return False


def send_whatsapp(to_phone: str, body: str) -> bool:
    client = _client()
    from_number = get_setting("twilio_whatsapp_from")
    if not client or not from_number or not to_phone:
        logger.info("WhatsApp skipped (not configured): %s", body[:60])
        return False
    try:
        to = to_phone if to_phone.startswith("whatsapp:") else f"whatsapp:{to_phone}"
        client.messages.create(to=to, from_=from_number, body=body)
        return True
    except Exception as exc:  # pragma: no cover
        logger.warning("WhatsApp send failed: %s", exc)
        return False
