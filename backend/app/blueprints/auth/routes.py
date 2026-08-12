import secrets
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)

from app.extensions import db
from app.models import User, OwnerProfile, TenantProfile, SubscriptionPlan
from app.services.twilio_service import send_sms

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.post("/register")
def register():
    data = request.get_json(force=True)
    role = data.get("role", "owner")
    if role not in ("owner", "tenant"):
        return jsonify({"error": "Invalid role for self-registration."}), 400
    if User.query.filter_by(email=data.get("email", "").lower()).first():
        return jsonify({"error": "An account with that email already exists."}), 409

    user = User(
        role=role,
        full_name=data["full_name"],
        email=data["email"].lower(),
        phone=data.get("phone"),
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.flush()

    if role == "owner":
        starter = SubscriptionPlan.query.filter_by(name="Starter").first()
        db.session.add(OwnerProfile(user_id=user.id, plan_id=starter.id if starter else None))
    else:
        db.session.add(TenantProfile(user_id=user.id))

    db.session.commit()
    return jsonify({"message": "Account created. Please sign in.", "user": user.to_dict()}), 201


@bp.post("/login")
def login():
    data = request.get_json(force=True)
    user = User.query.filter_by(email=data.get("email", "").lower()).first()
    if not user or not user.check_password(data.get("password", "")):
        return jsonify({"error": "Incorrect email or password."}), 401
    if not user.is_active:
        return jsonify({"error": "This account has been disabled. Contact support."}), 403

    claims = {"role": user.role, "full_name": user.full_name}
    access = create_access_token(identity=str(user.id), additional_claims=claims)
    refresh = create_refresh_token(identity=str(user.id), additional_claims=claims)
    return jsonify({"access_token": access, "refresh_token": refresh, "user": user.to_dict()})


@bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    claims = get_jwt()
    access = create_access_token(
        identity=identity, additional_claims={"role": claims.get("role"), "full_name": claims.get("full_name")}
    )
    return jsonify({"access_token": access})


@bp.get("/me")
@jwt_required()
def me():
    user = User.query.get(int(get_jwt_identity()))
    return jsonify(user.to_dict())


@bp.post("/forgot-password")
def forgot_password():
    """Issues a reset token. In production this is emailed/SMS'd; for now it
    is returned in dev mode only, and always sent via SMS if the user has a phone
    on file and Twilio is configured."""
    data = request.get_json(force=True)
    user = User.query.filter_by(email=data.get("email", "").lower()).first()
    generic = {"message": "If that email exists, a reset link has been sent."}
    if not user:
        return jsonify(generic)

    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.session.commit()

    reset_link = f"{current_app.config['APP_BASE_URL']}/reset-password?token={token}"
    if user.phone:
        send_sms(user.phone, f"Reset your password: {reset_link} (valid 1 hour)")

    response = dict(generic)
    if current_app.config.get("FLASK_ENV") != "production":
        response["dev_reset_link"] = reset_link  # convenience for local testing only
    return jsonify(response)


@bp.post("/reset-password")
def reset_password():
    data = request.get_json(force=True)
    token = data.get("token")
    user = User.query.filter_by(reset_token=token).first()
    if not user or not user.reset_token_expires or user.reset_token_expires < datetime.utcnow():
        return jsonify({"error": "This reset link is invalid or has expired."}), 400

    user.set_password(data["new_password"])
    user.reset_token = None
    user.reset_token_expires = None
    db.session.commit()
    return jsonify({"message": "Password updated. You can now sign in."})


@bp.post("/change-password")
@jwt_required()
def change_password():
    data = request.get_json(force=True)
    user = User.query.get(int(get_jwt_identity()))
    if not user.check_password(data.get("current_password", "")):
        return jsonify({"error": "Current password is incorrect."}), 400
    user.set_password(data["new_password"])
    db.session.commit()
    return jsonify({"message": "Password updated successfully."})
