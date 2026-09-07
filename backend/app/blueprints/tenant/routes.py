import os
from datetime import datetime, date, timedelta
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import (
    User, TenantProfile, RoomAssignment, Room, Agreement, Invoice, Payment,
    MaintenanceTicket, VacateRequest, Notification, MessageThread, Message,
    VisitorLog, MeterReading, LeaseRenewalRequest,
)
from app.utils.decorators import roles_required
from app.utils.pdf import render_invoice_pdf
from app.services.notification_service import notify_owner_of_tenant_event
from app.services.payment_service import create_order, verify_payment_signature, is_configured

bp = Blueprint("tenant", __name__, url_prefix="/api/tenant")


def _tenant_profile():
    return TenantProfile.query.filter_by(user_id=int(get_jwt_identity())).first()


def _active_assignment(tenant):
    return RoomAssignment.query.filter_by(tenant_id=tenant.id, is_active=True).first()


# --------------------------- DASHBOARD --------------------------------------
@bp.get("/dashboard")
@roles_required("tenant")
def dashboard():
    tenant = _tenant_profile()
    assignment = _active_assignment(tenant)
    upcoming_invoice = (
        Invoice.query.filter_by(tenant_id=tenant.id).filter(Invoice.status != "paid")
        .order_by(Invoice.due_date.asc()).first()
    )
    pending_count = Invoice.query.filter_by(tenant_id=tenant.id).filter(Invoice.status != "paid").count()
    overdue_exists = Invoice.query.filter_by(tenant_id=tenant.id, status="overdue").count() > 0

    agreement = None
    if assignment:
        agreement = Agreement.query.filter_by(room_id=assignment.room_id, tenant_id=tenant.id, status="active").first()

    recent_payments = (
        db.session.query(Payment).join(Invoice).filter(Invoice.tenant_id == tenant.id)
        .order_by(Payment.paid_at.desc()).limit(5).all()
    )

    return jsonify(
        {
            "current_rent_status": "Overdue" if overdue_exists else ("Up to date" if pending_count == 0 else "Due"),
            "upcoming_due_amount": float(upcoming_invoice.balance) if upcoming_invoice else 0,
            "agreement_validity": agreement.end_date.isoformat() if agreement else None,
            "pending_payments": pending_count,
            "current_room": (
                {
                    "unit": assignment.room.unit_number,
                    "unit_type": assignment.room.unit_type,
                    "rent_due_date": upcoming_invoice.due_date.isoformat() if upcoming_invoice else None,
                    "agreement_expiry": agreement.end_date.isoformat() if agreement else None,
                }
                if assignment
                else None
            ),
            "recent_payments": [
                {"invoice": p.invoice.invoice_number, "paid_date": p.paid_at.isoformat(), "amount": float(p.amount)}
                for p in recent_payments
            ],
        }
    )


# --------------------------- PROFILE ------------------------------------------
@bp.get("/profile")
@roles_required("tenant")
def get_profile():
    tenant = _tenant_profile()
    u = tenant.user
    return jsonify(
        {
            "full_name": u.full_name, "email": u.email, "phone": u.phone, "photo_url": u.photo_url,
            "age": tenant.age, "father_name": tenant.father_name, "occupation": tenant.occupation,
            "company_name": tenant.company_name, "gst_number": tenant.gst_number, "pan_number": tenant.pan_number,
            "current_address": tenant.current_address, "permanent_address": tenant.permanent_address,
            "id_proof_type": tenant.id_proof_type, "id_proof_number": tenant.id_proof_number,
            "police_verification": tenant.police_verification,
            "emergency_contact_name": tenant.emergency_contact_name,
            "emergency_contact_phone": tenant.emergency_contact_phone,
        }
    )


@bp.put("/profile")
@roles_required("tenant")
def update_profile():
    tenant = _tenant_profile()
    data = request.get_json(force=True)
    u = tenant.user
    for f in ["full_name", "phone"]:
        if f in data:
            setattr(u, f, data[f])
    for f in ["age", "father_name", "occupation", "company_name", "gst_number", "pan_number",
              "current_address", "permanent_address", "id_proof_type", "id_proof_number",
              "police_verification", "emergency_contact_name", "emergency_contact_phone"]:
        if f in data:
            setattr(tenant, f, data[f])
    db.session.commit()
    return jsonify({"message": "Profile updated."})


# --------------------------- MY ROOM -------------------------------------------
@bp.get("/my-room")
@roles_required("tenant")
def my_room():
    tenant = _tenant_profile()
    assignment = _active_assignment(tenant)
    if not assignment:
        return jsonify({"error": "No room currently assigned."}), 404
    r = assignment.room
    return jsonify(
        {
            "property_name": r.property.name, "location": r.property.location, "property_type": r.property.property_type,
            "unit_number": r.unit_number, "unit_type": r.unit_type, "floor": r.floor,
            "occupied_since": assignment.assigned_at.isoformat(), "status": r.status,
            "monthly_rent": float(r.monthly_rent or 0), "advance": float(r.advance_amount or 0),
            "electricity": float(r.electricity_charge or 0), "water": float(r.water_charge or 0),
            "maintenance": float(r.maintenance_charge or 0),
            "bhk": {"1": float(r.bhk_1 or 0), "2": float(r.bhk_2 or 0), "3": float(r.bhk_3 or 0), "4": float(r.bhk_4 or 0)},
            "amenities": r.amenities or {},
        }
    )


# --------------------------- AGREEMENTS -----------------------------------------
@bp.get("/agreements")
@roles_required("tenant")
def list_agreements():
    tenant = _tenant_profile()
    rows = Agreement.query.filter_by(tenant_id=tenant.id).order_by(Agreement.created_at.desc()).all()
    return jsonify(
        [
            {"id": a.id, "agreement_number": a.agreement_number, "unit": a.room.unit_number,
             "start_date": a.start_date.isoformat(), "end_date": a.end_date.isoformat(), "status": a.status,
             "tenant_signed": bool(a.tenant_signed_at), "is_uploaded": a.is_uploaded}
            for a in rows
        ]
    )


@bp.get("/agreements/<int:agreement_id>")
@roles_required("tenant")
def agreement_detail(agreement_id):
    a = Agreement.query.get_or_404(agreement_id)
    return jsonify(
        {
            "agreement_number": a.agreement_number, "rent_type": a.rent_type, "start_date": a.start_date.isoformat(),
            "end_date": a.end_date.isoformat(), "status": a.status, "monthly_rent": float(a.monthly_rent or 0),
            "security_deposit": float(a.security_deposit or 0),
            "property": a.room.property.name, "unit_number": a.room.unit_number, "location": a.room.property.location,
            "tenant_signed": bool(a.tenant_signed_at), "owner_signed": bool(a.owner_signed_at),
            "is_uploaded": a.is_uploaded,
        }
    )


@bp.post("/agreements/<int:agreement_id>/sign")
@roles_required("tenant")
def sign_agreement(agreement_id):
    """E-signature: tenant types their full legal name to accept."""
    tenant = _tenant_profile()
    agreement = Agreement.query.filter_by(id=agreement_id, tenant_id=tenant.id).first_or_404()
    data = request.get_json(force=True)
    if data.get("signature_name", "").strip().lower() != tenant.user.full_name.strip().lower():
        return jsonify({"error": "Typed name must match your full name on file to sign."}), 400
    agreement.tenant_signed_at = datetime.utcnow()
    agreement.tenant_signature_name = data["signature_name"]
    db.session.commit()
    return jsonify({"message": "Agreement signed."})


@bp.get("/renewals")
@roles_required("tenant")
def my_renewals():
    tenant = _tenant_profile()
    rows = (
        db.session.query(LeaseRenewalRequest).join(Agreement)
        .filter(Agreement.tenant_id == tenant.id).order_by(LeaseRenewalRequest.created_at.desc()).all()
    )
    return jsonify(
        [{"id": r.id, "proposed_rent": float(r.proposed_rent or 0), "proposed_start": r.proposed_start.isoformat(),
          "proposed_end": r.proposed_end.isoformat(), "status": r.status} for r in rows]
    )


@bp.post("/renewals/<int:renewal_id>/respond")
@roles_required("tenant")
def respond_renewal(renewal_id):
    renewal = LeaseRenewalRequest.query.get_or_404(renewal_id)
    data = request.get_json(force=True)
    renewal.status = data["status"]  # accepted / declined
    renewal.responded_at = datetime.utcnow()
    if renewal.status == "accepted":
        agreement = renewal.agreement
        agreement.monthly_rent = renewal.proposed_rent
        agreement.start_date = renewal.proposed_start
        agreement.end_date = renewal.proposed_end
    db.session.commit()
    return jsonify({"message": f"Renewal {renewal.status}."})


# --------------------------- INVOICES & BILLING ---------------------------------
@bp.get("/invoices")
@roles_required("tenant")
def list_invoices():
    tenant = _tenant_profile()
    status = request.args.get("status")
    q = Invoice.query.filter_by(tenant_id=tenant.id)
    if status and status != "all":
        q = q.filter_by(status=status)
    rows = q.order_by(Invoice.due_date.desc()).all()
    return jsonify(
        [{"id": i.id, "invoice_number": i.invoice_number, "billing_month": i.billing_month,
          "unit": i.room.unit_number, "due_date": i.due_date.isoformat(), "total": float(i.total or 0),
          "status": i.status} for i in rows]
    )


@bp.get("/invoices/<int:invoice_id>")
@roles_required("tenant")
def invoice_detail(invoice_id):
    tenant = _tenant_profile()
    i = Invoice.query.filter_by(id=invoice_id, tenant_id=tenant.id).first_or_404()
    return jsonify(
        {
            "invoice_number": i.invoice_number, "billing_month": i.billing_month, "due_date": i.due_date.isoformat(),
            "paid_date": i.paid_date.isoformat() if i.paid_date else None, "rent_type": i.rent_type,
            "status": i.status, "rent": float(i.rent or 0), "electricity": float(i.electricity or 0),
            "water": float(i.water or 0), "maintenance": float(i.maintenance or 0),
            "other_charges": float(i.other_charges or 0), "late_fee": float(i.late_fee or 0),
            "total": float(i.total or 0), "paid_amount": float(i.paid_amount or 0), "balance": i.balance,
            "property": i.room.property.name, "unit_number": i.room.unit_number,
            "payments": [{"amount": float(p.amount), "paid_at": p.paid_at.isoformat(), "method": p.method} for p in i.payments],
        }
    )


@bp.get("/invoices/<int:invoice_id>/pdf")
@roles_required("tenant")
def invoice_pdf(invoice_id):
    tenant = _tenant_profile()
    invoice = Invoice.query.filter_by(id=invoice_id, tenant_id=tenant.id).first_or_404()
    folder = os.path.join(current_app.config["UPLOAD_FOLDER"], "invoices")
    path = render_invoice_pdf(invoice, invoice.room.property.owner.user, invoice.tenant.user, invoice.room, folder,
                               owner_profile=invoice.room.property.owner)
    return send_file(path, as_attachment=True)


# --------------------------- PAY NOW (Razorpay) ----------------------------------
@bp.post("/invoices/<int:invoice_id>/pay/create-order")
@roles_required("tenant")
def create_pay_order(invoice_id):
    tenant = _tenant_profile()
    invoice = Invoice.query.filter_by(id=invoice_id, tenant_id=tenant.id).first_or_404()
    if not is_configured():
        return jsonify({"error": "Online payments aren't set up yet. Please pay via the methods your owner shared, or ask them to enable online payments."}), 503
    order = create_order(invoice.balance, receipt=invoice.invoice_number, notes={"invoice_id": invoice.id})
    return jsonify({"order": order})


@bp.post("/invoices/<int:invoice_id>/pay/verify")
@roles_required("tenant")
def verify_pay_order(invoice_id):
    tenant = _tenant_profile()
    invoice = Invoice.query.filter_by(id=invoice_id, tenant_id=tenant.id).first_or_404()
    data = request.get_json(force=True)
    ok = verify_payment_signature(data["order_id"], data["payment_id"], data["signature"])
    if not ok:
        return jsonify({"error": "Payment verification failed."}), 400

    payment = Payment(
        invoice_id=invoice.id, amount=data["amount"], method="razorpay", gateway="razorpay",
        gateway_order_id=data["order_id"], gateway_payment_id=data["payment_id"], gateway_status="captured",
    )
    db.session.add(payment)
    invoice.paid_amount = float(invoice.paid_amount or 0) + float(data["amount"])
    invoice.status = "paid" if invoice.paid_amount >= float(invoice.total) else "partially_paid"
    if invoice.status == "paid":
        invoice.paid_date = date.today()
    db.session.commit()
    notify_owner_of_tenant_event(
        invoice.owner_id, "PAYMENT_RECEIVED", "Rent received online",
        f"{tenant.user.full_name} paid Rs.{data['amount']} for {invoice.invoice_number} via Razorpay.",
        {"whatsapp": True},
    )
    return jsonify({"message": "Payment successful."})


# --------------------------- NOTIFICATIONS ------------------------------------
@bp.get("/notifications")
@roles_required("tenant", "owner")
def list_notifications():
    rows = Notification.query.filter_by(user_id=int(get_jwt_identity())).order_by(Notification.created_at.desc()).limit(50).all()
    return jsonify(
        [{"id": n.id, "type": n.type, "title": n.title, "body": n.body, "is_read": n.is_read,
          "created_at": n.created_at.isoformat()} for n in rows]
    )


@bp.get("/notifications/unread-count")
@roles_required("tenant", "owner")
def unread_count():
    count = Notification.query.filter_by(user_id=int(get_jwt_identity()), is_read=False).count()
    return jsonify({"count": count})


@bp.post("/notifications/<int:notif_id>/read")
@roles_required("tenant", "owner")
def mark_read(notif_id):
    n = Notification.query.filter_by(id=notif_id, user_id=int(get_jwt_identity())).first_or_404()
    n.is_read = True
    db.session.commit()
    return jsonify({"message": "Marked read."})


@bp.post("/notifications/read-all")
@roles_required("tenant", "owner")
def mark_all_read():
    Notification.query.filter_by(user_id=int(get_jwt_identity()), is_read=False).update({"is_read": True})
    db.session.commit()
    return jsonify({"message": "All marked read."})


# --------------------------- MAINTENANCE TICKETS ----------------------------------
@bp.get("/maintenance")
@roles_required("tenant")
def my_tickets():
    tenant = _tenant_profile()
    rows = MaintenanceTicket.query.filter_by(tenant_id=tenant.id).order_by(MaintenanceTicket.created_at.desc()).all()
    return jsonify(
        [{"id": t.id, "title": t.title, "description": t.description, "category": t.category,
          "priority": t.priority, "status": t.status, "created_at": t.created_at.isoformat()} for t in rows]
    )


@bp.post("/maintenance")
@roles_required("tenant")
def raise_ticket():
    tenant = _tenant_profile()
    assignment = _active_assignment(tenant)
    if not assignment:
        return jsonify({"error": "No active room assignment found."}), 400
    data = request.get_json(force=True)
    ticket = MaintenanceTicket(
        room_id=assignment.room_id, tenant_id=tenant.id, owner_id=assignment.room.property.owner_id,
        title=data["title"], description=data.get("description"), category=data.get("category", "other"),
        priority=data.get("priority", "medium"), photo_url=data.get("photo_url"),
    )
    db.session.add(ticket)
    db.session.commit()
    notify_owner_of_tenant_event(
        ticket.owner_id, "MAINTENANCE_TICKET", f"New maintenance request: {ticket.title}",
        f"{tenant.user.full_name} raised a {ticket.priority} priority ticket for {assignment.room.unit_number}.",
        {"whatsapp": True},
    )
    return jsonify({"message": "Request submitted.", "id": ticket.id}), 201


# --------------------------- VACATE REQUEST ------------------------------------
@bp.post("/vacate-request")
@roles_required("tenant")
def request_vacate():
    tenant = _tenant_profile()
    assignment = _active_assignment(tenant)
    if not assignment:
        return jsonify({"error": "No active room assignment found."}), 400
    data = request.get_json(force=True)
    vr = VacateRequest(
        assignment_id=assignment.id, tenant_id=tenant.id, owner_id=assignment.room.property.owner_id,
        requested_vacate_date=datetime.strptime(data["requested_vacate_date"], "%Y-%m-%d").date(),
        reason=data.get("reason"),
    )
    db.session.add(vr)
    db.session.commit()
    notify_owner_of_tenant_event(
        vr.owner_id, "VACATE_REQUEST", "Vacate notice received",
        f"{tenant.user.full_name} intends to vacate {assignment.room.unit_number} on {vr.requested_vacate_date}.",
        {"whatsapp": True},
    )
    return jsonify({"message": "Vacate notice sent to your owner."}), 201


@bp.get("/vacate-request")
@roles_required("tenant")
def my_vacate_requests():
    tenant = _tenant_profile()
    rows = VacateRequest.query.filter_by(tenant_id=tenant.id).order_by(VacateRequest.created_at.desc()).all()
    return jsonify(
        [{"id": v.id, "requested_vacate_date": v.requested_vacate_date.isoformat(), "reason": v.reason,
          "status": v.status} for v in rows]
    )


# --------------------------- VISITOR LOG ----------------------------------------
@bp.get("/visitors")
@roles_required("tenant")
def list_visitors():
    tenant = _tenant_profile()
    rows = VisitorLog.query.filter_by(tenant_id=tenant.id).order_by(VisitorLog.created_at.desc()).all()
    return jsonify(
        [{"id": v.id, "visitor_name": v.visitor_name, "visitor_phone": v.visitor_phone, "purpose": v.purpose,
          "expected_date": v.expected_date.isoformat() if v.expected_date else None} for v in rows]
    )


@bp.post("/visitors")
@roles_required("tenant")
def add_visitor():
    tenant = _tenant_profile()
    assignment = _active_assignment(tenant)
    data = request.get_json(force=True)
    v = VisitorLog(
        room_id=assignment.room_id, tenant_id=tenant.id, visitor_name=data["visitor_name"],
        visitor_phone=data.get("visitor_phone"), purpose=data.get("purpose"),
        expected_date=datetime.strptime(data["expected_date"], "%Y-%m-%d").date() if data.get("expected_date") else None,
    )
    db.session.add(v)
    db.session.commit()
    return jsonify({"message": "Visitor logged."}), 201


# --------------------------- METER READINGS -------------------------------------
@bp.post("/meter-readings")
@roles_required("tenant")
def submit_meter_reading():
    tenant = _tenant_profile()
    assignment = _active_assignment(tenant)
    data = request.get_json(force=True)
    reading = MeterReading(
        room_id=assignment.room_id, tenant_id=tenant.id, meter_type=data["meter_type"],
        reading_value=data["reading_value"], photo_url=data.get("photo_url"), reading_month=data.get("reading_month"),
    )
    db.session.add(reading)
    db.session.commit()
    return jsonify({"message": "Meter reading submitted."}), 201


# --------------------------- MESSAGES ----------------------------------------
@bp.get("/messages")
@roles_required("tenant")
def my_threads():
    tenant = _tenant_profile()
    threads = MessageThread.query.filter_by(tenant_id=tenant.id).order_by(MessageThread.last_message_at.desc()).all()
    return jsonify([{"id": t.id, "subject": t.subject, "last_message_at": t.last_message_at.isoformat()} for t in threads])


@bp.post("/messages/new")
@roles_required("tenant")
def start_thread():
    tenant = _tenant_profile()
    assignment = _active_assignment(tenant)
    data = request.get_json(force=True)
    thread = MessageThread(owner_id=assignment.room.property.owner_id, tenant_id=tenant.id, subject=data.get("subject", "General"))
    db.session.add(thread)
    db.session.flush()
    msg = Message(thread_id=thread.id, sender_user_id=int(get_jwt_identity()), body=data["body"])
    db.session.add(msg)
    db.session.commit()
    notify_owner_of_tenant_event(thread.owner_id, "MESSAGE", "New message from tenant", data["body"][:120], {"whatsapp": True})
    return jsonify({"message": "Sent.", "thread_id": thread.id}), 201


@bp.get("/messages/<int:thread_id>")
@roles_required("tenant")
def thread_messages(thread_id):
    thread = MessageThread.query.get_or_404(thread_id)
    return jsonify(
        [{"id": m.id, "body": m.body, "sender_user_id": m.sender_user_id, "created_at": m.created_at.isoformat()} for m in thread.messages]
    )


@bp.post("/messages/<int:thread_id>/reply")
@roles_required("tenant")
def reply_thread(thread_id):
    thread = MessageThread.query.get_or_404(thread_id)
    data = request.get_json(force=True)
    msg = Message(thread_id=thread.id, sender_user_id=int(get_jwt_identity()), body=data["body"])
    thread.last_message_at = datetime.utcnow()
    db.session.add(msg)
    db.session.commit()
    return jsonify({"message": "Sent."}), 201
