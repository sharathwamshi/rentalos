"""
Telegram delivery. Owners/tenants link their Telegram account by starting a
chat with the app's bot and sending /start <link-code>; the resulting
chat_id is stored on OwnerProfile.telegram_chat_id / TenantProfile.telegram_chat_id.
"""
import logging
import requests
from app.services.settings_service import get_setting

logger = logging.getLogger(__name__)
API_BASE = "https://api.telegram.org/bot{token}/{method}"


def send_telegram_message(chat_id: str, body: str) -> bool:
    token = get_setting("telegram_bot_token")
    if not token or not chat_id:
        logger.info("Telegram skipped (not configured): %s", body[:60])
        return False
    try:
        url = API_BASE.format(token=token, method="sendMessage")
        resp = requests.post(url, json={"chat_id": chat_id, "text": body}, timeout=8)
        return resp.status_code == 200
    except Exception as exc:  # pragma: no cover
        logger.warning("Telegram send failed: %s", exc)
        return False


def get_webhook_info():
    token = get_setting("telegram_bot_token")
    if not token:
        return None
    url = API_BASE.format(token=token, method="getWebhookInfo")
    return requests.get(url, timeout=8).json()


def set_webhook(callback_url: str):
    token = get_setting("telegram_bot_token")
    if not token:
        return None
    url = API_BASE.format(token=token, method="setWebhook")
    return requests.post(url, json={"url": callback_url}, timeout=8).json()
