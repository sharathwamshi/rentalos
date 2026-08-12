from app.extensions import db
from app.models import Notification, User, TenantProfile, OwnerProfile
from app.services.twilio_service import send_sms, send_whatsapp
from app.services.telegram_service import send_telegram_message


def notify_user(user_id: int, type_: str, title: str, body: str, channels: dict | None = None):
    """
    Create an in-app notification for user_id and best-effort fan it out to
    the requested external channels. `channels` example:
        {"sms": True, "whatsapp": True, "telegram": False}
    """
    channels = channels or {}
    user = User.query.get(user_id)
    if not user:
        return None

    notif = Notification(user_id=user_id, type=type_, title=title, body=body)

    if channels.get("sms") and user.phone:
        notif.sent_sms = send_sms(user.phone, f"{title}: {body}")

    if channels.get("whatsapp") and user.phone:
        notif.sent_whatsapp = send_whatsapp(user.phone, f"*{title}*\n{body}")

    if channels.get("telegram"):
        chat_id = None
        if user.role == "owner" and user.owner_profile:
            chat_id = user.owner_profile.telegram_chat_id
        elif user.role == "tenant" and user.tenant_profile:
            chat_id = user.tenant_profile.telegram_chat_id
        if chat_id:
            notif.sent_telegram = send_telegram_message(chat_id, f"{title}\n{body}")

    db.session.add(notif)
    db.session.commit()
    return notif


def notify_owner_of_tenant_event(owner_profile_id: int, type_: str, title: str, body: str, channels=None):
    owner = OwnerProfile.query.get(owner_profile_id)
    if owner:
        return notify_user(owner.user_id, type_, title, body, channels)


def notify_tenant(tenant_profile_id: int, type_: str, title: str, body: str, channels=None):
    tenant = TenantProfile.query.get(tenant_profile_id)
    if tenant:
        return notify_user(tenant.user_id, type_, title, body, channels)
