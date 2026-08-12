import click
from datetime import date, timedelta
from app.extensions import db


def register_cli(app):
    @app.cli.command("seed")
    def seed():
        """Seed subscription plans + a default super admin account."""
        from app.models import SubscriptionPlan, User

        if not SubscriptionPlan.query.filter_by(name="Starter").first():
            db.session.add_all(
                [
                    SubscriptionPlan(
                        name="Starter", price_per_month=20, room_limit=5, multi_property=False,
                        features=["Up to 5 rooms", "Tenant management", "Basic invoicing", "Email support"],
                    ),
                    SubscriptionPlan(
                        name="Standard", price_per_month=50, room_limit=25, multi_property=False,
                        features=["Up to 25 rooms", "Rental agreements & PDF", "Automated reminders",
                                  "Reports & analytics", "Priority email support"],
                    ),
                    SubscriptionPlan(
                        name="Premium", price_per_month=100, room_limit=None, multi_property=True,
                        features=["Unlimited rooms", "Multi-property dashboard", "Advanced reports",
                                  "Tenant announcements", "Dedicated support", "Online payments", "WhatsApp/Telegram alerts"],
                    ),
                ]
            )

        if not User.query.filter_by(role="admin").first():
            admin = User(role="admin", full_name="Super Admin", email="admin@rentalos.app", phone="")
            admin.set_password("Admin@12345")
            db.session.add(admin)
            click.echo("Created default super admin: admin@rentalos.app / Admin@12345  (change this immediately)")

        db.session.commit()
        click.echo("Seed complete.")

    @app.cli.command("run-reminders")
    def run_reminders():
        """Run daily (via cron / systemd timer) to send due-date reminders, mark
        invoices overdue, apply late fees, and notify owners of expiring agreements."""
        from app.models import Invoice, Agreement, Room, Property, OwnerProfile, ReminderRule
        from app.services.notification_service import notify_tenant, notify_owner_of_tenant_event

        today = date.today()
        sent = 0

        for invoice in Invoice.query.filter(Invoice.status.in_(["pending", "partially_paid"])).all():
            owner_id = invoice.owner_id
            rule = ReminderRule.query.filter_by(owner_id=owner_id).first()
            channels = {
                "sms": rule.channel_sms if rule else False,
                "whatsapp": rule.channel_whatsapp if rule else True,
                "telegram": rule.channel_telegram if rule else False,
            }
            days_before = rule.days_before_due if rule else 3
            days_after = rule.days_after_due_for_overdue if rule else 1

            if invoice.due_date - timedelta(days=days_before) == today:
                notify_tenant(invoice.tenant_id, "RENT_DUE", "Rent due reminder",
                              f"Invoice {invoice.invoice_number} is due on {invoice.due_date}.", channels)
                sent += 1

            if today >= invoice.due_date + timedelta(days=days_after) and invoice.status != "overdue":
                invoice.status = "overdue"
                if rule and (rule.late_fee_flat or rule.late_fee_pct):
                    fee = float(rule.late_fee_flat or 0) + float(invoice.total or 0) * float(rule.late_fee_pct or 0) / 100
                    invoice.late_fee = fee
                    invoice.total = float(invoice.total or 0) + fee
                notify_tenant(invoice.tenant_id, "PAYMENT_OVERDUE", "Payment overdue alert",
                              f"Invoice {invoice.invoice_number} is overdue. Please clear payment at the earliest.", channels)
                sent += 1

        # Agreements expiring within 30 days -> flag room + notify owner
        soon = today + timedelta(days=30)
        for agreement in Agreement.query.filter(Agreement.status == "active", Agreement.end_date <= soon).all():
            agreement.room.status = "close_to_expire"
            notify_owner_of_tenant_event(
                agreement.owner_id, "AGREEMENT_EXPIRING", "Agreement expiring soon",
                f"Agreement {agreement.agreement_number} for unit {agreement.room.unit_number} expires on {agreement.end_date}.",
                {"whatsapp": True},
            )
            sent += 1

        db.session.commit()
        click.echo(f"Reminder sweep complete. {sent} notifications sent/updated.")
