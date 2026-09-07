import os
from datetime import datetime, date
from flask import Blueprint, request, jsonify, current_app, send_file, redirect
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import (
    User, OwnerProfile, TenantProfile, Property, Room, RoomAssignment,
    Agreement, Invoice, Payment, MaintenanceTicket, VacateRequest,
    MessageThread, Message, ReminderRule, Notification, Document, SubscriptionPlan,
    LeaseRenewalRequest,
)
from app.utils.decorators import roles_required
from app.utils.pdf import render_agreement_pdf, render_invoice_pdf
from app.services.notification_service import notify_tenant

bp = Blueprint("owner", __name__, url_prefix="/api/owner")


def _owner_profile():
    return OwnerProfile.query.filter_by(user_id=int(get_jwt_identity())).first()


def _room_limit_ok(owner):
    if not owner.plan or owner.plan.room_limit is None:
        return True
    total_rooms = (
        db.session.query(Room).join(Property).filter(Property.owner_id == owner.id).count()
    )
    return total_rooms < owner.plan.room_limit


# --------------------------- PROFILE ----------------------------------------
@bp.get("/profile")
@roles_required("owner")
def get_profile():
    owner = _owner_profile()
    u = owner.user
    return jsonify(
        {
            "full_name": u.full_name,
            "email": u.email,
            "phone": u.phone,
            "business_logo_url": owner.business_logo_url,
            "property_address": owner.property_address,
            "gst_number": owner.gst_number,
            "ownership_type": owner.ownership_type,
            "joint_level": owner.joint_level,
            "invoice_prefix": owner.invoice_prefix,
            "pan_number": owner.pan_number,
            "pan_upload_url": owner.pan_upload_url,
            "plan_name": owner.plan.name if owner.plan else None,
            "subscription_status": owner.subscription_status,
            "member_since": u.created_at.isoformat(),
        }
    )


@bp.put("/profile")
@roles_required("owner")
def update_profile():
    owner = _owner_profile()
    data = request.get_json(force=True)
    u = owner.user
    for f in ["full_name", "phone"]:
        if f in data:
            setattr(u, f, data[f])
    for f in ["business_logo_url", "property_address", "gst_number", "ownership_type", "joint_level",
              "invoice_prefix", "pan_number", "pan_upload_url"]:
        if f in data:
            setattr(owner, f, data[f])
    db.session.commit()
    return jsonify({"message": "Profile updated."})


# --------------------------- DASHBOARD ------------------------------------
@bp.get("/dashboard")
@roles_required("owner")
def dashboard():
    owner = _owner_profile()
    rooms = Room.query.join(Property).filter(Property.owner_id == owner.id).all()
    total = len(rooms)
    occupied = sum(1 for r in rooms if r.status == "occupied")
    vacant = sum(1 for r in rooms if r.status == "vacant")
    close_to_expire = sum(1 for r in rooms if r.status == "close_to_expire")
    maintenance = sum(1 for r in rooms if r.status == "maintenance")
    properties = Property.query.filter_by(owner_id=owner.id).all()

    room_ids_by_prop = {}
    for r in rooms:
        room_ids_by_prop.setdefault(r.property_id, []).append(r)

    # -------- attention needed --------
    overdue_invoices = Invoice.query.filter_by(owner_id=owner.id, status="overdue").count()
    pending_invoices_amount = (
        db.session.query(db.func.coalesce(db.func.sum(Invoice.total - Invoice.paid_amount), 0))
        .filter(Invoice.owner_id == owner.id, Invoice.status.in_(["pending", "overdue", "partially_paid"]))
        .scalar()
    )
    open_tickets = MaintenanceTicket.query.filter(
        MaintenanceTicket.owner_id == owner.id, MaintenanceTicket.status.in_(["open", "in_progress"])
    ).count()
    pending_vacate_requests = VacateRequest.query.filter_by(owner_id=owner.id, status="pending").count()
    unsigned_agreements = Agreement.query.filter(
        Agreement.owner_id == owner.id, Agreement.status == "active", Agreement.tenant_signed_at.is_(None)
    ).count()
    unread_notifications = Notification.query.filter_by(user_id=int(get_jwt_identity()), is_read=False).count()

    # -------- recent activity (last 6 payments) --------
    recent_payments = (
        db.session.query(Payment).join(Invoice).filter(Invoice.owner_id == owner.id)
        .order_by(Payment.paid_at.desc()).limit(6).all()
    )

    # -------- this month's collected revenue --------
    month_start = date.today().replace(day=1)
    revenue_this_month = (
        db.session.query(db.func.coalesce(db.func.sum(Payment.amount), 0))
        .join(Invoice).filter(Invoice.owner_id == owner.id, Payment.paid_at >= month_start)
        .scalar()
    )

    registered_tenants = (
        db.session.query(RoomAssignment.tenant_id).join(Room).join(Property)
        .filter(Property.owner_id == owner.id, RoomAssignment.is_active.is_(True)).distinct().count()
    )

    return jsonify(
        {
            "owner_name": owner.user.full_name,
            "plan_name": owner.plan.name if owner.plan else None,
            "total_properties": len(properties),
            "total_rooms": total,
            "occupied": occupied,
            "vacant": vacant,
            "close_to_expire": close_to_expire,
            "maintenance": maintenance,
            "occupancy_pct": round((occupied / total) * 100) if total else 0,
            "active_tenants": registered_tenants,
            "revenue_this_month": float(revenue_this_month or 0),
            "pending_receivables": float(pending_invoices_amount or 0),
            "attention": {
                "overdue_invoices": overdue_invoices,
                "open_tickets": open_tickets,
                "pending_vacate_requests": pending_vacate_requests,
                "unsigned_agreements": unsigned_agreements,
                "unread_notifications": unread_notifications,
            },
            "recent_payments": [
                {
                    "tenant_name": p.invoice.tenant.user.full_name,
                    "unit": f"{p.invoice.room.property.name} - {p.invoice.room.unit_number}",
                    "amount": float(p.amount),
                    "method": p.method,
                    "paid_at": p.paid_at.isoformat(),
                }
                for p in recent_payments
            ],
            "properties": [
                {
                    "id": p.id,
                    "name": p.name,
                    "location": p.location,
                    "total_rooms": len(room_ids_by_prop.get(p.id, [])),
                    "occupied_rooms": sum(1 for r in room_ids_by_prop.get(p.id, []) if r.status == "occupied"),
                }
                for p in properties
            ],
        }
    )


# --------------------------- PROPERTIES & ROOMS ----------------------------
@bp.get("/properties")
@roles_required("owner")
def list_properties():
    owner = _owner_profile()
    props = Property.query.filter_by(owner_id=owner.id).all()
    out = []
    for p in props:
        out.append(
            {
                "id": p.id,
                "name": p.name,
                "property_type": p.property_type,
                "location": p.location,
                "rooms": [_room_dict(r) for r in p.rooms],
            }
        )
    return jsonify(out)


def _room_dict(r):
    return {
        "id": r.id,
        "unit_number": r.unit_number,
        "rent_type": r.rent_type,
        "unit_type": r.unit_type,
        "floor": r.floor,
        "monthly_rent": float(r.monthly_rent or 0),
        "advance_amount": float(r.advance_amount or 0),
        "electricity_charge": float(r.electricity_charge or 0),
        "water_charge": float(r.water_charge or 0),
        "maintenance_charge": float(r.maintenance_charge or 0),
        "bhk": {"1": float(r.bhk_1 or 0), "2": float(r.bhk_2 or 0), "3": float(r.bhk_3 or 0), "4": float(r.bhk_4 or 0)},
        "amenities": r.amenities or {},
        "status": r.status,
        "notes": r.notes,
    }


@bp.post("/properties")
@roles_required("owner")
def create_property():
    owner = _owner_profile()
    data = request.get_json(force=True)
    prop = Property(
        owner_id=owner.id,
        name=data["name"],
        property_type=data.get("property_type", "Residential"),
        location=data.get("location"),
    )
    db.session.add(prop)
    db.session.flush()

    for room_data in data.get("rooms", []):
        if not _room_limit_ok(owner):
            db.session.rollback()
            return jsonify({"error": f"Your {owner.plan.name if owner.plan else 'current'} plan room limit is reached. Upgrade to add more rooms."}), 402
        db.session.add(_build_room(prop.id, room_data))

    db.session.commit()
    return jsonify({"message": "Property saved.", "id": prop.id}), 201


def _build_room(property_id, data):
    bhk = data.get("bhk", {})
    return Room(
        property_id=property_id,
        unit_number=data["unit_number"],
        rent_type=data.get("rent_type", "Rent"),
        unit_type=data.get("unit_type"),
        floor=data.get("floor"),
        monthly_rent=data.get("monthly_rent", 0),
        advance_amount=data.get("advance_amount", 0),
        electricity_charge=data.get("electricity_charge", 0),
        water_charge=data.get("water_charge", 0),
        maintenance_charge=data.get("maintenance_charge", 0),
        bhk_1=bhk.get("1", 0), bhk_2=bhk.get("2", 0), bhk_3=bhk.get("3", 0), bhk_4=bhk.get("4", 0),
        amenities=data.get("amenities", {}),
        status=data.get("status", "vacant"),
        notes=data.get("notes"),
    )


@bp.put("/rooms/<int:room_id>")
@roles_required("owner")
def update_room(room_id):
    owner = _owner_profile()
    room = Room.query.join(Property).filter(Room.id == room_id, Property.owner_id == owner.id).first_or_404()
    data = request.get_json(force=True)
    for field in ["unit_number", "rent_type", "unit_type", "floor", "monthly_rent", "advance_amount",
                  "electricity_charge", "water_charge", "maintenance_charge", "status", "notes", "amenities"]:
        if field in data:
            setattr(room, field, data[field])
    if "bhk" in data:
        room.bhk_1 = data["bhk"].get("1", room.bhk_1)
        room.bhk_2 = data["bhk"].get("2", room.bhk_2)
        room.bhk_3 = data["bhk"].get("3", room.bhk_3)
        room.bhk_4 = data["bhk"].get("4", room.bhk_4)
    db.session.commit()
    return jsonify({"message": "Room updated."})


@bp.get("/rooms/vacant")
@roles_required("owner")
def vacant_rooms():
    owner = _owner_profile()
    rooms = Room.query.join(Property).filter(Property.owner_id == owner.id, Room.status == "vacant").all()
    return jsonify([{"id": r.id, "label": f"{r.property.name} - {r.unit_number}"} for r in rooms])


# --------------------------- TENANTS ---------------------------------------
@bp.get("/tenants")
@roles_required("owner")
def list_tenants():
    owner = _owner_profile()
    # tenants this owner created, OR who have ever been assigned to one of this owner's rooms
    assigned_ids = (
        db.session.query(RoomAssignment.tenant_id)
        .join(Room).join(Property)
        .filter(Property.owner_id == owner.id)
    )
    created_ids = db.session.query(TenantProfile.id).filter(TenantProfile.created_by_owner_id == owner.id)
    tenant_ids = assigned_ids.union(created_ids)
    tenants = TenantProfile.query.filter(TenantProfile.id.in_(tenant_ids)).all()
    return jsonify([_tenant_dict(t) for t in tenants])


def _tenant_dict(t):
    active_assignment = RoomAssignment.query.filter_by(tenant_id=t.id, is_active=True).first()
    return {
        "id": t.id,
        "full_name": t.user.full_name,
        "email": t.user.email,
        "phone": t.user.phone,
        "photo_url": t.user.photo_url,
        "occupation": t.occupation,
        "company_name": t.company_name,
        "current_address": t.current_address,
        "permanent_address": t.permanent_address,
        "id_proof_type": t.id_proof_type,
        "police_verification": t.police_verification,
        "emergency_contact_name": t.emergency_contact_name,
        "emergency_contact_phone": t.emergency_contact_phone,
        "is_assigned": bool(active_assignment),
        "current_unit": f"{active_assignment.room.property.name} - {active_assignment.room.unit_number}" if active_assignment else None,
    }


@bp.post("/tenants")
@roles_required("owner")
def create_tenant():
    owner = _owner_profile()
    data = request.get_json(force=True)
    if User.query.filter_by(email=data["email"].lower()).first():
        return jsonify({"error": "A user with that email already exists."}), 409
    user = User(role="tenant", full_name=data["full_name"], email=data["email"].lower(), phone=data.get("phone"))
    user.set_password(data.get("password") or os.urandom(6).hex())
    db.session.add(user)
    db.session.flush()

    profile = TenantProfile(
        user_id=user.id,
        created_by_owner_id=owner.id,
        age=data.get("age"),
        father_name=data.get("father_name"),
        occupation=data.get("occupation"),
        company_name=data.get("company_name"),
        gst_number=data.get("gst_number"),
        current_address=data.get("current_address"),
        permanent_address=data.get("permanent_address"),
        id_proof_type=data.get("id_proof_type"),
        id_proof_number=data.get("id_proof_number"),
        police_verification=data.get("police_verification", False),
        emergency_contact_name=data.get("emergency_contact_name"),
        emergency_contact_phone=data.get("emergency_contact_phone"),
    )
    db.session.add(profile)
    db.session.commit()
    return jsonify({"message": "Tenant created.", "id": profile.id, "full_name": user.full_name}), 201


@bp.delete("/tenants/<int:tenant_id>")
@roles_required("owner")
def delete_tenant(tenant_id):
    t = TenantProfile.query.get_or_404(tenant_id)
    db.session.delete(t.user)
    db.session.commit()
    return jsonify({"message": "Tenant removed."})


# --------------------------- ROOM ASSIGNMENTS ------------------------------
@bp.get("/assignments")
@roles_required("owner")
def list_assignments():
    owner = _owner_profile()
    active_only = request.args.get("active_only", "true") == "true"
    q = RoomAssignment.query.join(Room).join(Property).filter(Property.owner_id == owner.id)
    if active_only:
        q = q.filter(RoomAssignment.is_active.is_(True))
    rows = q.order_by(RoomAssignment.assigned_at.desc()).all()
    return jsonify(
        [
            {
                "id": a.id,
                "unit": f"{a.room.property.name} - {a.room.unit_number}",
                "room_id": a.room_id,
                "tenant_name": a.tenant.user.full_name,
                "tenant_id": a.tenant_id,
                "assigned_at": a.assigned_at.isoformat(),
                "vacated_at": a.vacated_at.isoformat() if a.vacated_at else None,
                "is_active": a.is_active,
            }
            for a in rows
        ]
    )


@bp.post("/assignments")
@roles_required("owner")
def create_assignment():
    data = request.get_json(force=True)
    room = Room.query.get_or_404(data["room_id"])
    assignment = RoomAssignment(
        room_id=room.id,
        tenant_id=data["tenant_id"],
        assigned_at=datetime.strptime(data["assigned_at"], "%Y-%m-%d").date(),
        notes=data.get("notes"),
    )
    room.status = "occupied"
    db.session.add(assignment)
    db.session.commit()
    return jsonify({"message": "Tenant assigned.", "id": assignment.id}), 201


@bp.post("/assignments/<int:assignment_id>/vacate")
@roles_required("owner")
def vacate_assignment(assignment_id):
    assignment = RoomAssignment.query.get_or_404(assignment_id)
    assignment.is_active = False
    assignment.vacated_at = date.today()
    assignment.room.status = "vacant"
    db.session.commit()
    return jsonify({"message": "Unit marked vacant."})


# --------------------------- VACATE REQUESTS (tenant-initiated) -----------
@bp.get("/vacate-requests")
@roles_required("owner")
def vacate_requests():
    owner = _owner_profile()
    rows = VacateRequest.query.filter_by(owner_id=owner.id).order_by(VacateRequest.created_at.desc()).all()
    return jsonify(
        [
            {
                "id": v.id,
                "tenant_name": v.assignment.tenant.user.full_name,
                "unit": f"{v.assignment.room.property.name} - {v.assignment.room.unit_number}",
                "requested_vacate_date": v.requested_vacate_date.isoformat(),
                "reason": v.reason,
                "status": v.status,
                "created_at": v.created_at.isoformat(),
            }
            for v in rows
        ]
    )


@bp.post("/vacate-requests/<int:req_id>/respond")
@roles_required("owner")
def respond_vacate(req_id):
    data = request.get_json(force=True)
    vr = VacateRequest.query.get_or_404(req_id)
    vr.status = data["status"]  # approved / rejected
    vr.responded_at = datetime.utcnow()
    if vr.status == "approved":
        vr.assignment.is_active = False
        vr.assignment.vacated_at = vr.requested_vacate_date
        vr.assignment.room.status = "vacant"
    db.session.commit()
    notify_tenant(
        vr.tenant_id, "VACATE_UPDATE", "Vacate request update",
        f"Your vacate request has been {vr.status}.",
        {"whatsapp": True, "sms": False},
    )
    return jsonify({"message": f"Request {vr.status}."})


# --------------------------- AGREEMENTS -------------------------------------
@bp.get("/agreements")
@roles_required("owner")
def list_agreements():
    owner = _owner_profile()
    rows = Agreement.query.filter_by(owner_id=owner.id).order_by(Agreement.created_at.desc()).all()
    return jsonify([_agreement_dict(a) for a in rows])


def _agreement_dict(a):
    return {
        "id": a.id,
        "agreement_number": a.agreement_number,
        "tenant_name": a.tenant.user.full_name,
        "unit": f"{a.room.property.name} - {a.room.unit_number}",
        "start_date": a.start_date.isoformat(),
        "end_date": a.end_date.isoformat(),
        "status": a.status,
        "monthly_rent": float(a.monthly_rent or 0),
        "security_deposit": float(a.security_deposit or 0),
        "owner_signed": bool(a.owner_signed_at),
        "tenant_signed": bool(a.tenant_signed_at),
        "is_uploaded": a.is_uploaded,
    }


@bp.post("/agreements")
@roles_required("owner")
def create_agreement():
    owner = _owner_profile()
    data = request.get_json(force=True)
    room = Room.query.get_or_404(data["room_id"])
    number = data.get("agreement_number") or f"AGM-{datetime.utcnow().strftime('%Y%m%d')}-{Agreement.query.count()+1:04d}"
    if Agreement.query.filter_by(agreement_number=number).first():
        return jsonify({"error": f"Agreement number {number} is already in use."}), 409

    is_uploaded = bool(data.get("is_uploaded"))
    agreement = Agreement(
        agreement_number=number,
        room_id=room.id,
        tenant_id=data["tenant_id"],
        owner_id=owner.id,
        rent_type=data.get("rent_type", "Rent"),
        monthly_rent=data["monthly_rent"],
        security_deposit=data.get("security_deposit", 0),
        start_date=datetime.strptime(data["start_date"], "%Y-%m-%d").date(),
        end_date=datetime.strptime(data["end_date"], "%Y-%m-%d").date(),
        is_uploaded=is_uploaded,
    )
    if is_uploaded:
        # Owner already has a signed agreement on file -- store it as-is,
        # skip the generated-PDF / e-signature flow entirely.
        if not data.get("pdf_url"):
            return jsonify({"error": "Please upload the agreement file first."}), 400
        agreement.pdf_url = data["pdf_url"]
        agreement.owner_signed_at = datetime.utcnow()
        agreement.owner_signature_name = owner.user.full_name
        agreement.tenant_signed_at = datetime.utcnow()
        agreement.tenant_signature_name = "Uploaded document (signed outside RentalOS)"
    else:
        agreement.owner_signed_at = datetime.utcnow()
        agreement.owner_signature_name = owner.user.full_name

    db.session.add(agreement)
    db.session.commit()
    return jsonify({"message": "Agreement created.", "id": agreement.id, "agreement_number": number}), 201


@bp.get("/agreements/<int:agreement_id>/pdf")
@roles_required("owner", "tenant")
def agreement_pdf(agreement_id):
    agreement = Agreement.query.get_or_404(agreement_id)
    if agreement.is_uploaded and agreement.pdf_url:
        return redirect(agreement.pdf_url)
    folder = os.path.join(current_app.config["UPLOAD_FOLDER"], "agreements")
    path = render_agreement_pdf(agreement, agreement.room.property.owner.user, agreement.tenant.user, folder)
    return send_file(path, as_attachment=True)


@bp.post("/agreements/<int:agreement_id>/renewal")
@roles_required("owner")
def propose_renewal(agreement_id):
    data = request.get_json(force=True)
    agreement = Agreement.query.get_or_404(agreement_id)
    renewal = LeaseRenewalRequest(
        agreement_id=agreement.id,
        proposed_rent=data["proposed_rent"],
        proposed_start=datetime.strptime(data["proposed_start"], "%Y-%m-%d").date(),
        proposed_end=datetime.strptime(data["proposed_end"], "%Y-%m-%d").date(),
    )
    db.session.add(renewal)
    db.session.commit()
    notify_tenant(
        agreement.tenant_id, "AGREEMENT_RENEWAL", "Lease renewal proposed",
        f"Your owner proposed a renewal at Rs.{data['proposed_rent']}/month. Please review and respond.",
        {"whatsapp": True},
    )
    return jsonify({"message": "Renewal proposal sent to tenant."}), 201


# --------------------------- INVOICES & PAYMENTS ----------------------------
@bp.get("/invoices")
@roles_required("owner")
def list_invoices():
    owner = _owner_profile()
    status = request.args.get("status")
    tenant_id = request.args.get("tenant_id")
    q = Invoice.query.filter_by(owner_id=owner.id)
    if status and status != "all":
        q = q.filter_by(status=status)
    if tenant_id and tenant_id != "all":
        q = q.filter_by(tenant_id=tenant_id)
    rows = q.order_by(Invoice.created_at.desc()).all()
    return jsonify([_invoice_dict(i) for i in rows])


def _invoice_dict(i):
    return {
        "id": i.id,
        "invoice_number": i.invoice_number,
        "billing_month": i.billing_month,
        "tenant_name": i.tenant.user.full_name,
        "unit": f"{i.room.property.name} - {i.room.unit_number}",
        "total": float(i.total or 0),
        "paid_amount": float(i.paid_amount or 0),
        "balance": i.balance,
        "status": i.status,
        "due_date": i.due_date.isoformat(),
    }


@bp.post("/invoices")
@roles_required("owner")
def create_invoice():
    owner = _owner_profile()
    data = request.get_json(force=True)
    room = Room.query.get_or_404(data["room_id"])
    charges = ["rent", "electricity", "water", "maintenance", "other_charges", "late_fee"]
    total = sum(float(data.get(c, 0) or 0) for c in charges)
    prefix = owner.invoice_prefix or f"INV-{datetime.utcnow().year}"
    existing_count = Invoice.query.filter_by(owner_id=owner.id).count()
    number = f"{prefix}-{existing_count + 1:04d}"
    invoice = Invoice(
        invoice_number=number,
        room_id=room.id,
        tenant_id=data["tenant_id"],
        owner_id=owner.id,
        billing_month=data.get("billing_month"),
        due_date=datetime.strptime(data["due_date"], "%Y-%m-%d").date(),
        rent=data.get("rent", 0), electricity=data.get("electricity", 0), water=data.get("water", 0),
        maintenance=data.get("maintenance", 0), other_charges=data.get("other_charges", 0),
        total=total,
    )
    db.session.add(invoice)
    db.session.commit()
    return jsonify({"message": "Invoice created.", "id": invoice.id}), 201


@bp.get("/invoices/<int:invoice_id>")
@roles_required("owner", "tenant")
def invoice_detail(invoice_id):
    i = Invoice.query.get_or_404(invoice_id)
    owner = i.room.property.owner
    agreement = (
        Agreement.query.filter_by(room_id=i.room_id, tenant_id=i.tenant_id, status="active")
        .order_by(Agreement.created_at.desc()).first()
    )
    return jsonify(
        {
            **_invoice_dict(i),
            "rent": float(i.rent or 0), "electricity": float(i.electricity or 0),
            "water": float(i.water or 0), "maintenance": float(i.maintenance or 0),
            "other_charges": float(i.other_charges or 0), "late_fee": float(i.late_fee or 0),
            "rent_type": i.rent_type,
            "created_at": i.created_at.isoformat(),
            "paid_date": i.paid_date.isoformat() if i.paid_date else None,
            "tenant_email": i.tenant.user.email,
            "tenant_phone": i.tenant.user.phone,
            "property_name": i.room.property.name,
            "property_location": i.room.property.location,
            "unit_number": i.room.unit_number,
            "agreement_number": agreement.agreement_number if agreement else None,
            "agreement_id": agreement.id if agreement else None,
            "owner_name": owner.user.full_name,
            "owner_email": owner.user.email,
            "owner_gst_pan": owner.gst_number or owner.pan_number,
            "owner_property_address": owner.property_address,
            "payments": [
                {"amount": float(p.amount), "method": p.method, "paid_at": p.paid_at.isoformat(), "reference": p.reference}
                for p in i.payments
            ],
        }
    )


@bp.post("/invoices/<int:invoice_id>/payments")
@roles_required("owner")
def add_payment(invoice_id):
    invoice = Invoice.query.get_or_404(invoice_id)
    data = request.get_json(force=True)
    payment = Payment(
        invoice_id=invoice.id,
        amount=data["amount"],
        method=data.get("method", "cash"),
        reference=data.get("reference"),
        notes=data.get("notes"),
        gateway="manual",
    )
    db.session.add(payment)
    invoice.paid_amount = float(invoice.paid_amount or 0) + float(data["amount"])
    invoice.status = "paid" if invoice.paid_amount >= float(invoice.total) else "partially_paid"
    if invoice.status == "paid":
        invoice.paid_date = date.today()
    db.session.commit()
    return jsonify({"message": "Payment recorded."}), 201


@bp.post("/invoices/<int:invoice_id>/mark-paid")
@roles_required("owner")
def mark_paid(invoice_id):
    invoice = Invoice.query.get_or_404(invoice_id)
    invoice.paid_amount = invoice.total
    invoice.status = "paid"
    invoice.paid_date = date.today()
    db.session.commit()
    return jsonify({"message": "Invoice marked as paid."})


@bp.get("/invoices/<int:invoice_id>/pdf")
@roles_required("owner", "tenant")
def invoice_pdf(invoice_id):
    invoice = Invoice.query.get_or_404(invoice_id)
    folder = os.path.join(current_app.config["UPLOAD_FOLDER"], "invoices")
    path = render_invoice_pdf(invoice, invoice.room.property.owner.user, invoice.tenant.user, invoice.room, folder,
                               owner_profile=invoice.room.property.owner)
    return send_file(path, as_attachment=True)


# --------------------------- MAINTENANCE TICKETS ----------------------------
@bp.get("/maintenance")
@roles_required("owner")
def list_tickets():
    owner = _owner_profile()
    rows = MaintenanceTicket.query.filter_by(owner_id=owner.id).order_by(MaintenanceTicket.created_at.desc()).all()
    return jsonify(
        [
            {
                "id": t.id, "title": t.title, "description": t.description, "category": t.category,
                "priority": t.priority, "status": t.status,
                "tenant_name": t.tenant.user.full_name,
                "unit": f"{t.room.property.name} - {t.room.unit_number}",
                "created_at": t.created_at.isoformat(),
            }
            for t in rows
        ]
    )


@bp.put("/maintenance/<int:ticket_id>")
@roles_required("owner")
def update_ticket(ticket_id):
    ticket = MaintenanceTicket.query.get_or_404(ticket_id)
    data = request.get_json(force=True)
    ticket.status = data.get("status", ticket.status)
    if ticket.status == "resolved":
        ticket.resolved_at = datetime.utcnow()
    db.session.commit()
    notify_tenant(
        ticket.tenant_id, "TICKET_UPDATE", f"Maintenance update: {ticket.title}",
        f"Your request is now marked '{ticket.status}'.", {"whatsapp": True},
    )
    return jsonify({"message": "Ticket updated."})


# --------------------------- REPORTS ----------------------------------------
@bp.get("/reports")
@roles_required("owner")
def reports():
    owner = _owner_profile()
    from_ = request.args.get("from")
    to_ = request.args.get("to")
    payments_q = (
        db.session.query(Payment).join(Invoice).filter(Invoice.owner_id == owner.id)
    )
    if from_:
        payments_q = payments_q.filter(Payment.paid_at >= from_)
    if to_:
        payments_q = payments_q.filter(Payment.paid_at <= to_)
    payments = payments_q.all()
    revenue = sum(float(p.amount) for p in payments)

    pending_invoices = Invoice.query.filter(
        Invoice.owner_id == owner.id, Invoice.status.in_(["pending", "overdue", "partially_paid"])
    ).count()
    tenant_ids = (
        db.session.query(RoomAssignment.tenant_id).join(Room).join(Property)
        .filter(Property.owner_id == owner.id).distinct().count()
    )
    rooms = Room.query.join(Property).filter(Property.owner_id == owner.id).all()
    return jsonify(
        {
            "revenue": revenue,
            "payments_counted": len(payments),
            "pending_invoices": pending_invoices,
            "registered_tenants": tenant_ids,
            "total_rooms": len(rooms),
            "vacant": sum(1 for r in rooms if r.status == "vacant"),
            "occupied": sum(1 for r in rooms if r.status == "occupied"),
            "maintenance": sum(1 for r in rooms if r.status == "maintenance"),
        }
    )


@bp.get("/reports/export")
@roles_required("owner")
def export_report():
    """CSV export of invoices for the owner's records (Excel-openable)."""
    import csv
    import io

    owner = _owner_profile()
    rows = Invoice.query.filter_by(owner_id=owner.id).all()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["Invoice", "Tenant", "Unit", "Month", "Total", "Paid", "Balance", "Status", "Due Date"])
    for i in rows:
        writer.writerow(
            [i.invoice_number, i.tenant.user.full_name, f"{i.room.property.name}-{i.room.unit_number}",
             i.billing_month, i.total, i.paid_amount, i.balance, i.status, i.due_date]
        )
    buf.seek(0)
    from flask import Response
    return Response(
        buf.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=invoices_export.csv"},
    )


# --------------------------- REMINDER RULES ---------------------------------
@bp.get("/reminder-rules")
@roles_required("owner")
def get_reminder_rules():
    owner = _owner_profile()
    rule = ReminderRule.query.filter_by(owner_id=owner.id).first()
    if not rule:
        rule = ReminderRule(owner_id=owner.id)
        db.session.add(rule)
        db.session.commit()
    return jsonify(
        {
            "days_before_due": rule.days_before_due,
            "days_after_due_for_overdue": rule.days_after_due_for_overdue,
            "channel_sms": rule.channel_sms, "channel_whatsapp": rule.channel_whatsapp,
            "channel_telegram": rule.channel_telegram, "channel_inapp": rule.channel_inapp,
            "late_fee_flat": float(rule.late_fee_flat or 0), "late_fee_pct": float(rule.late_fee_pct or 0),
        }
    )


@bp.put("/reminder-rules")
@roles_required("owner")
def update_reminder_rules():
    owner = _owner_profile()
    rule = ReminderRule.query.filter_by(owner_id=owner.id).first()
    data = request.get_json(force=True)
    for field in ["days_before_due", "days_after_due_for_overdue", "channel_sms", "channel_whatsapp",
                  "channel_telegram", "channel_inapp", "late_fee_flat", "late_fee_pct"]:
        if field in data:
            setattr(rule, field, data[field])
    db.session.commit()
    return jsonify({"message": "Reminder settings saved."})


# --------------------------- SUBSCRIPTION -----------------------------------
@bp.get("/subscription")
@roles_required("owner")
def my_subscription():
    owner = _owner_profile()
    plans = SubscriptionPlan.query.filter_by(is_active=True).all()
    return jsonify(
        {
            "current_plan": owner.plan.name if owner.plan else None,
            "status": owner.subscription_status,
            "renews_at": owner.subscription_renews_at.isoformat() if owner.subscription_renews_at else None,
            "plans": [
                {
                    "id": p.id, "name": p.name, "price_per_month": float(p.price_per_month),
                    "room_limit": p.room_limit, "multi_property": p.multi_property, "features": p.features,
                }
                for p in plans
            ],
        }
    )


@bp.post("/subscription/change-plan")
@roles_required("owner")
def change_plan():
    owner = _owner_profile()
    data = request.get_json(force=True)
    plan = SubscriptionPlan.query.get_or_404(data["plan_id"])
    owner.plan_id = plan.id
    db.session.commit()
    return jsonify({"message": f"Switched to the {plan.name} plan."})


# --------------------------- MESSAGES ----------------------------------------
@bp.get("/messages")
@roles_required("owner")
def list_threads():
    owner = _owner_profile()
    threads = MessageThread.query.filter_by(owner_id=owner.id).order_by(MessageThread.last_message_at.desc()).all()
    return jsonify(
        [{"id": t.id, "tenant_name": t.tenant.user.full_name, "subject": t.subject,
          "last_message_at": t.last_message_at.isoformat()} for t in threads]
    )


@bp.get("/messages/<int:thread_id>")
@roles_required("owner")
def thread_messages(thread_id):
    thread = MessageThread.query.get_or_404(thread_id)
    return jsonify(
        [{"id": m.id, "body": m.body, "sender_user_id": m.sender_user_id, "created_at": m.created_at.isoformat()}
         for m in thread.messages]
    )


@bp.post("/messages/<int:thread_id>")
@roles_required("owner")
def reply_thread(thread_id):
    thread = MessageThread.query.get_or_404(thread_id)
    data = request.get_json(force=True)
    msg = Message(thread_id=thread.id, sender_user_id=int(get_jwt_identity()), body=data["body"])
    thread.last_message_at = datetime.utcnow()
    db.session.add(msg)
    db.session.commit()
    notify_tenant(thread.tenant_id, "MESSAGE", "New message from your owner", data["body"][:120], {"whatsapp": True})
    return jsonify({"message": "Sent."}), 201


# --------------------------- DOCUMENT REPOSITORY -----------------------------
@bp.get("/documents")
@roles_required("owner")
def list_documents():
    owner = _owner_profile()
    docs = Document.query.filter_by(owner_id=owner.id).order_by(Document.created_at.desc()).all()
    return jsonify(
        [{"id": d.id, "title": d.title, "category": d.category, "file_url": d.file_url,
          "created_at": d.created_at.isoformat()} for d in docs]
    )
