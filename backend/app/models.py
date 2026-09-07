import bcrypt
from datetime import datetime
from app.extensions import db


def now():
    return datetime.utcnow()


# ---------------------------------------------------------------------------
# USERS  (single table, role-discriminated: admin / owner / tenant)
# ---------------------------------------------------------------------------
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.Enum("admin", "owner", "tenant", name="user_role"), nullable=False, index=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(32))
    photo_url = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=now)
    updated_at = db.Column(db.DateTime, default=now, onupdate=now)

    # password reset
    reset_token = db.Column(db.String(128), index=True)
    reset_token_expires = db.Column(db.DateTime)

    # relationships
    owner_profile = db.relationship("OwnerProfile", backref="user", uselist=False, cascade="all, delete-orphan")
    tenant_profile = db.relationship("TenantProfile", backref="user", uselist=False, cascade="all, delete-orphan")

    def set_password(self, raw):
        self.password_hash = bcrypt.hashpw(raw.encode(), bcrypt.gensalt()).decode()

    def check_password(self, raw):
        return bcrypt.checkpw(raw.encode(), self.password_hash.encode())

    def to_dict(self):
        return {
            "id": self.id,
            "role": self.role,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "photo_url": self.photo_url,
            "is_active": self.is_active,
        }


class OwnerProfile(db.Model):
    __tablename__ = "owner_profiles"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    company_name = db.Column(db.String(150))
    gst_number = db.Column(db.String(30))
    plan_id = db.Column(db.Integer, db.ForeignKey("subscription_plans.id"))
    subscription_status = db.Column(
        db.Enum("trialing", "active", "past_due", "cancelled", name="sub_status"), default="trialing"
    )
    subscription_renews_at = db.Column(db.Date)
    telegram_chat_id = db.Column(db.String(64))  # for admin -> owner telegram alerts

    # Profile / business details (shown on Owner > Profile, printed on invoices & agreements)
    business_logo_url = db.Column(db.String(255))
    property_address = db.Column(db.Text)
    ownership_type = db.Column(db.Enum("single", "joint", name="ownership_type"), default="single")
    joint_level = db.Column(db.String(20))
    invoice_prefix = db.Column(db.String(30))
    pan_number = db.Column(db.String(20))
    pan_upload_url = db.Column(db.String(255))

    plan = db.relationship("SubscriptionPlan")
    properties = db.relationship("Property", backref="owner", cascade="all, delete-orphan")


class TenantProfile(db.Model):
    __tablename__ = "tenant_profiles"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    created_by_owner_id = db.Column(db.Integer, db.ForeignKey("owner_profiles.id"), index=True)
    age = db.Column(db.Integer)
    father_name = db.Column(db.String(120))
    occupation = db.Column(db.String(120))
    company_name = db.Column(db.String(150))
    gst_number = db.Column(db.String(30))
    pan_number = db.Column(db.String(20))
    pan_upload_url = db.Column(db.String(255))
    current_address = db.Column(db.Text)
    permanent_address = db.Column(db.Text)
    id_proof_type = db.Column(db.String(50))
    id_proof_number = db.Column(db.String(60))
    id_proof_upload_url = db.Column(db.String(255))
    police_verification = db.Column(db.Boolean, default=False)
    police_verification_upload_url = db.Column(db.String(255))
    emergency_contact_name = db.Column(db.String(120))
    emergency_contact_phone = db.Column(db.String(32))
    telegram_chat_id = db.Column(db.String(64))


# ---------------------------------------------------------------------------
# PROPERTY / ROOMS
# ---------------------------------------------------------------------------
class Property(db.Model):
    __tablename__ = "properties"
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("owner_profiles.id"), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    property_type = db.Column(db.String(50), default="Residential")
    location = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=now)

    rooms = db.relationship("Room", backref="property", cascade="all, delete-orphan")


class Room(db.Model):
    __tablename__ = "rooms"
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey("properties.id"), nullable=False)
    unit_number = db.Column(db.String(30), nullable=False)
    rent_type = db.Column(db.String(30), default="Rent")
    unit_type = db.Column(db.String(60))
    floor = db.Column(db.String(20))
    monthly_rent = db.Column(db.Numeric(10, 2), default=0)
    advance_amount = db.Column(db.Numeric(10, 2), default=0)
    electricity_charge = db.Column(db.Numeric(10, 2), default=0)
    water_charge = db.Column(db.Numeric(10, 2), default=0)
    maintenance_charge = db.Column(db.Numeric(10, 2), default=0)
    bhk_1 = db.Column(db.Numeric(10, 2), default=0)
    bhk_2 = db.Column(db.Numeric(10, 2), default=0)
    bhk_3 = db.Column(db.Numeric(10, 2), default=0)
    bhk_4 = db.Column(db.Numeric(10, 2), default=0)
    amenities = db.Column(db.JSON, default=dict)  # {fan, light, chimney, geyser, ups_battery, others:{}}
    status = db.Column(
        db.Enum("vacant", "occupied", "close_to_expire", "maintenance", name="room_status"),
        default="vacant",
        index=True,
    )
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=now)

    assignments = db.relationship("RoomAssignment", backref="room", cascade="all, delete-orphan")


class RoomAssignment(db.Model):
    __tablename__ = "room_assignments"
    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey("rooms.id"), nullable=False)
    tenant_id = db.Column(db.Integer, db.ForeignKey("tenant_profiles.id"), nullable=False)
    assigned_at = db.Column(db.Date, nullable=False)
    vacated_at = db.Column(db.Date)
    notes = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True, index=True)

    tenant = db.relationship("TenantProfile")


# ---------------------------------------------------------------------------
# AGREEMENTS
# ---------------------------------------------------------------------------
class Agreement(db.Model):
    __tablename__ = "agreements"
    id = db.Column(db.Integer, primary_key=True)
    agreement_number = db.Column(db.String(40), unique=True, nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey("rooms.id"), nullable=False)
    tenant_id = db.Column(db.Integer, db.ForeignKey("tenant_profiles.id"), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey("owner_profiles.id"), nullable=False)
    rent_type = db.Column(db.String(30), default="Rent")
    monthly_rent = db.Column(db.Numeric(10, 2))
    security_deposit = db.Column(db.Numeric(10, 2))
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    next_billing_date = db.Column(db.Date)
    status = db.Column(db.Enum("active", "expired", "terminated", name="agreement_status"), default="active")
    auto_renew_pct = db.Column(db.Numeric(5, 2), default=10.0)
    pdf_url = db.Column(db.String(255))
    is_uploaded = db.Column(db.Boolean, default=False)  # owner uploaded an existing signed agreement instead of generating one

    # e-signature
    tenant_signed_at = db.Column(db.DateTime)
    tenant_signature_name = db.Column(db.String(120))
    owner_signed_at = db.Column(db.DateTime)
    owner_signature_name = db.Column(db.String(120))

    created_at = db.Column(db.DateTime, default=now)

    room = db.relationship("Room")
    tenant = db.relationship("TenantProfile")


class LeaseRenewalRequest(db.Model):
    __tablename__ = "lease_renewal_requests"
    id = db.Column(db.Integer, primary_key=True)
    agreement_id = db.Column(db.Integer, db.ForeignKey("agreements.id"), nullable=False)
    proposed_rent = db.Column(db.Numeric(10, 2))
    proposed_start = db.Column(db.Date)
    proposed_end = db.Column(db.Date)
    status = db.Column(db.Enum("pending", "accepted", "declined", name="renewal_status"), default="pending")
    created_at = db.Column(db.DateTime, default=now)
    responded_at = db.Column(db.DateTime)

    agreement = db.relationship("Agreement")


# ---------------------------------------------------------------------------
# INVOICES / PAYMENTS
# ---------------------------------------------------------------------------
class Invoice(db.Model):
    __tablename__ = "invoices"
    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(40), unique=True, nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey("rooms.id"), nullable=False)
    tenant_id = db.Column(db.Integer, db.ForeignKey("tenant_profiles.id"), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey("owner_profiles.id"), nullable=False)
    billing_month = db.Column(db.String(20))
    due_date = db.Column(db.Date, nullable=False)
    paid_date = db.Column(db.Date)
    rent_type = db.Column(db.String(30), default="Rent")

    rent = db.Column(db.Numeric(10, 2), default=0)
    electricity = db.Column(db.Numeric(10, 2), default=0)
    water = db.Column(db.Numeric(10, 2), default=0)
    maintenance = db.Column(db.Numeric(10, 2), default=0)
    other_charges = db.Column(db.Numeric(10, 2), default=0)
    late_fee = db.Column(db.Numeric(10, 2), default=0)

    sgst_pct = db.Column(db.Numeric(5, 2), default=0)
    cgst_pct = db.Column(db.Numeric(5, 2), default=0)

    total = db.Column(db.Numeric(10, 2), default=0)
    paid_amount = db.Column(db.Numeric(10, 2), default=0)
    status = db.Column(
        db.Enum("pending", "paid", "partially_paid", "overdue", name="invoice_status"),
        default="pending",
        index=True,
    )
    pdf_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=now)

    room = db.relationship("Room")
    tenant = db.relationship("TenantProfile")
    payments = db.relationship("Payment", backref="invoice", cascade="all, delete-orphan")

    @property
    def balance(self):
        return float(self.total or 0) - float(self.paid_amount or 0)


class Payment(db.Model):
    __tablename__ = "payments"
    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey("invoices.id"), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    method = db.Column(db.String(40))  # cash, bank_transfer, upi, razorpay, card
    reference = db.Column(db.String(120))
    notes = db.Column(db.Text)
    paid_at = db.Column(db.DateTime, default=now)

    # online gateway fields
    gateway = db.Column(db.String(30))  # razorpay / stripe / manual
    gateway_order_id = db.Column(db.String(120))
    gateway_payment_id = db.Column(db.String(120))
    gateway_status = db.Column(db.String(30))


# ---------------------------------------------------------------------------
# MAINTENANCE TICKETS
# ---------------------------------------------------------------------------
class MaintenanceTicket(db.Model):
    __tablename__ = "maintenance_tickets"
    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey("rooms.id"), nullable=False)
    tenant_id = db.Column(db.Integer, db.ForeignKey("tenant_profiles.id"), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey("owner_profiles.id"), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50))  # electrical, plumbing, appliance, other
    priority = db.Column(db.Enum("low", "medium", "high", "urgent", name="ticket_priority"), default="medium")
    status = db.Column(
        db.Enum("open", "in_progress", "resolved", "closed", name="ticket_status"), default="open", index=True
    )
    photo_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=now)
    updated_at = db.Column(db.DateTime, default=now, onupdate=now)
    resolved_at = db.Column(db.DateTime)

    room = db.relationship("Room")
    tenant = db.relationship("TenantProfile")


# ---------------------------------------------------------------------------
# VACATE REQUESTS (tenant-initiated notice to vacate)
# ---------------------------------------------------------------------------
class VacateRequest(db.Model):
    __tablename__ = "vacate_requests"
    id = db.Column(db.Integer, primary_key=True)
    assignment_id = db.Column(db.Integer, db.ForeignKey("room_assignments.id"), nullable=False)
    tenant_id = db.Column(db.Integer, db.ForeignKey("tenant_profiles.id"), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey("owner_profiles.id"), nullable=False)
    requested_vacate_date = db.Column(db.Date, nullable=False)
    reason = db.Column(db.Text)
    status = db.Column(
        db.Enum("pending", "approved", "rejected", name="vacate_status"), default="pending", index=True
    )
    created_at = db.Column(db.DateTime, default=now)
    responded_at = db.Column(db.DateTime)

    assignment = db.relationship("RoomAssignment")


# ---------------------------------------------------------------------------
# MESSAGING (owner <-> tenant)
# ---------------------------------------------------------------------------
class MessageThread(db.Model):
    __tablename__ = "message_threads"
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("owner_profiles.id"), nullable=False)
    tenant_id = db.Column(db.Integer, db.ForeignKey("tenant_profiles.id"), nullable=False)
    subject = db.Column(db.String(150))
    created_at = db.Column(db.DateTime, default=now)
    last_message_at = db.Column(db.DateTime, default=now)

    messages = db.relationship("Message", backref="thread", cascade="all, delete-orphan")


class Message(db.Model):
    __tablename__ = "messages"
    id = db.Column(db.Integer, primary_key=True)
    thread_id = db.Column(db.Integer, db.ForeignKey("message_threads.id"), nullable=False)
    sender_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    body = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=now)


# ---------------------------------------------------------------------------
# NOTIFICATIONS (in-app, both owner & tenant)
# ---------------------------------------------------------------------------
class Notification(db.Model):
    __tablename__ = "notifications"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    type = db.Column(db.String(40))  # PAYMENT_OVERDUE, RENT_DUE, AGREEMENT_EXPIRING, TICKET_UPDATE, MESSAGE, VACATE...
    title = db.Column(db.String(150))
    body = db.Column(db.Text)
    is_read = db.Column(db.Boolean, default=False, index=True)
    created_at = db.Column(db.DateTime, default=now)

    # delivery channels attempted
    sent_sms = db.Column(db.Boolean, default=False)
    sent_whatsapp = db.Column(db.Boolean, default=False)
    sent_telegram = db.Column(db.Boolean, default=False)
    sent_email = db.Column(db.Boolean, default=False)


class ReminderRule(db.Model):
    """Owner-configurable: how many days before due date to remind, and via which channels."""
    __tablename__ = "reminder_rules"
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("owner_profiles.id"), nullable=False)
    days_before_due = db.Column(db.Integer, default=3)
    days_after_due_for_overdue = db.Column(db.Integer, default=1)
    channel_sms = db.Column(db.Boolean, default=False)
    channel_whatsapp = db.Column(db.Boolean, default=True)
    channel_telegram = db.Column(db.Boolean, default=False)
    channel_inapp = db.Column(db.Boolean, default=True)
    late_fee_flat = db.Column(db.Numeric(10, 2), default=0)
    late_fee_pct = db.Column(db.Numeric(5, 2), default=0)


# ---------------------------------------------------------------------------
# DOCUMENT REPOSITORY
# ---------------------------------------------------------------------------
class Document(db.Model):
    __tablename__ = "documents"
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("owner_profiles.id"))
    tenant_id = db.Column(db.Integer, db.ForeignKey("tenant_profiles.id"))
    category = db.Column(db.String(50))  # id_proof, police_verification, agreement, inspection, other
    title = db.Column(db.String(150))
    file_url = db.Column(db.String(255), nullable=False)
    uploaded_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=now)


# ---------------------------------------------------------------------------
# MOVE-IN / MOVE-OUT INSPECTION
# ---------------------------------------------------------------------------
class InspectionReport(db.Model):
    __tablename__ = "inspection_reports"
    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey("rooms.id"), nullable=False)
    assignment_id = db.Column(db.Integer, db.ForeignKey("room_assignments.id"))
    inspection_type = db.Column(db.Enum("move_in", "move_out", name="inspection_type"), nullable=False)
    checklist = db.Column(db.JSON, default=list)  # [{item, condition, notes}]
    photo_urls = db.Column(db.JSON, default=list)
    conducted_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=now)


# ---------------------------------------------------------------------------
# VISITOR / GUEST LOG
# ---------------------------------------------------------------------------
class VisitorLog(db.Model):
    __tablename__ = "visitor_logs"
    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey("rooms.id"), nullable=False)
    tenant_id = db.Column(db.Integer, db.ForeignKey("tenant_profiles.id"), nullable=False)
    visitor_name = db.Column(db.String(120), nullable=False)
    visitor_phone = db.Column(db.String(32))
    purpose = db.Column(db.String(150))
    expected_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=now)


# ---------------------------------------------------------------------------
# UTILITY METER READINGS (photo based)
# ---------------------------------------------------------------------------
class MeterReading(db.Model):
    __tablename__ = "meter_readings"
    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey("rooms.id"), nullable=False)
    tenant_id = db.Column(db.Integer, db.ForeignKey("tenant_profiles.id"), nullable=False)
    meter_type = db.Column(db.Enum("electricity", "water", name="meter_type"), nullable=False)
    reading_value = db.Column(db.Numeric(10, 2), nullable=False)
    photo_url = db.Column(db.String(255))
    reading_month = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=now)


# ---------------------------------------------------------------------------
# SUBSCRIPTION PLANS & BILLING (for owners, managed by Admin)
# ---------------------------------------------------------------------------
class SubscriptionPlan(db.Model):
    __tablename__ = "subscription_plans"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)  # Starter / Standard / Premium
    price_per_month = db.Column(db.Numeric(10, 2), nullable=False)
    room_limit = db.Column(db.Integer)  # null = unlimited
    multi_property = db.Column(db.Boolean, default=False)
    features = db.Column(db.JSON, default=list)  # list of feature strings for pricing page
    is_active = db.Column(db.Boolean, default=True)


class SubscriptionInvoice(db.Model):
    """Admin-side billing of the OWNER for their SaaS subscription (not tenant rent)."""
    __tablename__ = "subscription_invoices"
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("owner_profiles.id"), nullable=False)
    plan_id = db.Column(db.Integer, db.ForeignKey("subscription_plans.id"), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    period_start = db.Column(db.Date)
    period_end = db.Column(db.Date)
    status = db.Column(db.Enum("pending", "paid", "failed", name="sub_invoice_status"), default="pending")
    gateway_payment_id = db.Column(db.String(120))
    created_at = db.Column(db.DateTime, default=now)


# ---------------------------------------------------------------------------
# ADMIN — GLOBAL APP SETTINGS (Telegram / WhatsApp / Twilio / Payments)
# ---------------------------------------------------------------------------
class AppSetting(db.Model):
    """Generic encrypted-at-rest key/value settings store, managed only by Super Admin."""
    __tablename__ = "app_settings"
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(80), unique=True, nullable=False)
    value = db.Column(db.Text)
    category = db.Column(db.String(40))  # twilio, whatsapp, telegram, razorpay, general
    is_secret = db.Column(db.Boolean, default=False)
    updated_at = db.Column(db.DateTime, default=now, onupdate=now)
    updated_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"))


class AuditLog(db.Model):
    __tablename__ = "audit_logs"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    action = db.Column(db.String(120))
    entity = db.Column(db.String(60))
    entity_id = db.Column(db.Integer)
    meta = db.Column(db.JSON, default=dict)
    created_at = db.Column(db.DateTime, default=now)
