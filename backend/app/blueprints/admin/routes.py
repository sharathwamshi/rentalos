from datetime import datetime, date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import (
    User, OwnerProfile, TenantProfile, SubscriptionPlan, SubscriptionInvoice,
    Property, Room, Invoice, Payment, AppSetting,
)
from app.utils.decorators import roles_required
from app.services.settings_service import get_all_settings, set_setting
from app.services.telegram_service import set_webhook, get_webhook_info

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


# --------------------------- PLATFORM DASHBOARD ------------------------------
@bp.get("/dashboard")
@roles_required("admin")
def dashboard():
    total_owners = OwnerProfile.query.count()
    total_tenants = TenantProfile.query.count()
    total_properties = Property.query.count()
    total_rooms = Room.query.count()
    mrr = db.session.query(db.func.sum(SubscriptionPlan.price_per_month)).join(
        OwnerProfile, OwnerProfile.plan_id == SubscriptionPlan.id
    ).filter(OwnerProfile.subscription_status == "active").scalar() or 0
    total_rent_collected = db.session.query(db.func.sum(Payment.amount)).scalar() or 0
    plan_breakdown = (
        db.session.query(SubscriptionPlan.name, db.func.count(OwnerProfile.id))
        .outerjoin(OwnerProfile, OwnerProfile.plan_id == SubscriptionPlan.id)
        .group_by(SubscriptionPlan.name).all()
    )
    return jsonify(
        {
            "total_owners": total_owners,
            "total_tenants": total_tenants,
            "total_properties": total_properties,
            "total_rooms": total_rooms,
            "mrr": float(mrr),
            "total_rent_collected_platform_wide": float(total_rent_collected),
            "plan_breakdown": [{"plan": p, "owners": c} for p, c in plan_breakdown],
        }
    )


# --------------------------- OWNER MANAGEMENT --------------------------------
@bp.get("/owners")
@roles_required("admin")
def list_owners():
    owners = OwnerProfile.query.all()
    return jsonify(
        [
            {
                "id": o.id, "full_name": o.user.full_name, "email": o.user.email, "phone": o.user.phone,
                "company_name": o.company_name, "plan": o.plan.name if o.plan else None,
                "subscription_status": o.subscription_status, "is_active": o.user.is_active,
                "properties_count": len(o.properties),
                "created_at": o.user.created_at.isoformat(),
            }
            for o in owners
        ]
    )


@bp.post("/owners/<int:owner_id>/toggle-active")
@roles_required("admin")
def toggle_owner_active(owner_id):
    owner = OwnerProfile.query.get_or_404(owner_id)
    owner.user.is_active = not owner.user.is_active
    db.session.commit()
    return jsonify({"message": "Owner status updated.", "is_active": owner.user.is_active})


@bp.post("/owners/<int:owner_id>/set-plan")
@roles_required("admin")
def admin_set_plan(owner_id):
    owner = OwnerProfile.query.get_or_404(owner_id)
    data = request.get_json(force=True)
    owner.plan_id = data["plan_id"]
    owner.subscription_status = data.get("status", "active")
    db.session.commit()
    return jsonify({"message": "Owner plan updated."})


# --------------------------- SUBSCRIPTION PLANS -------------------------------
@bp.get("/plans")
@roles_required("admin")
def list_plans():
    plans = SubscriptionPlan.query.all()
    return jsonify(
        [
            {"id": p.id, "name": p.name, "price_per_month": float(p.price_per_month), "room_limit": p.room_limit,
             "multi_property": p.multi_property, "features": p.features, "is_active": p.is_active}
            for p in plans
        ]
    )


@bp.post("/plans")
@roles_required("admin")
def create_plan():
    data = request.get_json(force=True)
    plan = SubscriptionPlan(
        name=data["name"], price_per_month=data["price_per_month"], room_limit=data.get("room_limit"),
        multi_property=data.get("multi_property", False), features=data.get("features", []),
    )
    db.session.add(plan)
    db.session.commit()
    return jsonify({"message": "Plan created.", "id": plan.id}), 201


@bp.put("/plans/<int:plan_id>")
@roles_required("admin")
def update_plan(plan_id):
    plan = SubscriptionPlan.query.get_or_404(plan_id)
    data = request.get_json(force=True)
    for f in ["name", "price_per_month", "room_limit", "multi_property", "features", "is_active"]:
        if f in data:
            setattr(plan, f, data[f])
    db.session.commit()
    return jsonify({"message": "Plan updated."})


@bp.get("/subscription-invoices")
@roles_required("admin")
def subscription_invoices():
    rows = SubscriptionInvoice.query.order_by(SubscriptionInvoice.created_at.desc()).limit(200).all()
    return jsonify(
        [
            {"id": s.id, "owner_name": s.owner.user.full_name, "plan": s.plan.name, "amount": float(s.amount),
             "status": s.status, "period_start": s.period_start.isoformat() if s.period_start else None,
             "period_end": s.period_end.isoformat() if s.period_end else None}
            for s in rows
        ]
    )


# --------------------------- INTEGRATION SETTINGS -----------------------------
@bp.get("/settings")
@roles_required("admin")
def get_settings():
    return jsonify(get_all_settings())


@bp.put("/settings")
@roles_required("admin")
def update_settings():
    """Body: { "twilio_account_sid": "AC...", "twilio_auth_token": "...", ... }
    Only keys with a non-empty value are written, so leaving a masked secret
    field untouched in the UI never overwrites the stored value."""
    data = request.get_json(force=True)
    user_id = int(get_jwt_identity())
    updated = []
    for key, value in data.items():
        if value is None or value == "" or set(value) == {"•"}:
            continue
        set_setting(key, value, user_id=user_id)
        updated.append(key)
    return jsonify({"message": "Settings saved.", "updated": updated})


@bp.post("/settings/telegram/set-webhook")
@roles_required("admin")
def telegram_webhook():
    data = request.get_json(force=True)
    result = set_webhook(data["callback_url"])
    return jsonify(result or {"error": "Telegram bot token not configured."})


@bp.get("/settings/telegram/webhook-info")
@roles_required("admin")
def telegram_webhook_info():
    result = get_webhook_info()
    return jsonify(result or {"error": "Telegram bot token not configured."})


# --------------------------- PLATFORM-WIDE REPORTS -----------------------------
@bp.get("/reports/revenue-trend")
@roles_required("admin")
def revenue_trend():
    rows = (
        db.session.query(db.func.date_format(Payment.paid_at, "%Y-%m").label("month"), db.func.sum(Payment.amount))
        .group_by("month").order_by("month").limit(12).all()
    )
    return jsonify([{"month": m, "amount": float(a)} for m, a in rows])
