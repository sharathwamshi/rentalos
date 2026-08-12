"""
Central place every integration reads its credentials from.
Admin > Settings writes to app_settings; everything else reads through here,
so keys can be rotated at runtime with no redeploy and no secrets in git.
"""
import os
from app.extensions import db
from app.models import AppSetting

DEFAULTS = {
    "twilio_account_sid": ("twilio", True, os.getenv("TWILIO_ACCOUNT_SID", "")),
    "twilio_auth_token": ("twilio", True, os.getenv("TWILIO_AUTH_TOKEN", "")),
    "twilio_sms_from": ("twilio", False, os.getenv("TWILIO_SMS_FROM", "")),
    "twilio_whatsapp_from": ("whatsapp", False, os.getenv("TWILIO_WHATSAPP_FROM", "")),
    "telegram_bot_token": ("telegram", True, os.getenv("TELEGRAM_BOT_TOKEN", "")),
    "razorpay_key_id": ("razorpay", False, os.getenv("RAZORPAY_KEY_ID", "")),
    "razorpay_key_secret": ("razorpay", True, os.getenv("RAZORPAY_KEY_SECRET", "")),
    "app_name": ("general", False, "RentalOS"),
    "support_email": ("general", False, "support@rentalos.app"),
    "reminders_enabled": ("general", False, "true"),
}


def get_setting(key, default=None):
    row = AppSetting.query.filter_by(key=key).first()
    if row:
        return row.value
    if key in DEFAULTS:
        return DEFAULTS[key][2]
    return default


def get_all_settings(category=None):
    q = AppSetting.query
    if category:
        q = q.filter_by(category=category)
    rows = {r.key: r for r in q.all()}
    result = {}
    for key, (cat, is_secret, default) in DEFAULTS.items():
        if category and cat != category:
            continue
        row = rows.get(key)
        value = row.value if row else default
        result[key] = {
            "value": ("•" * 8 if (is_secret and value) else value),
            "category": cat,
            "is_secret": is_secret,
            "configured": bool(value),
        }
    return result


def set_setting(key, value, user_id=None):
    cat, is_secret, _default = DEFAULTS.get(key, ("general", False, ""))
    row = AppSetting.query.filter_by(key=key).first()
    if not row:
        row = AppSetting(key=key, category=cat, is_secret=is_secret)
        db.session.add(row)
    row.value = value
    row.updated_by_user_id = user_id
    db.session.commit()
    return row
