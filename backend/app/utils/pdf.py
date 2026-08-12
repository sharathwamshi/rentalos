import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

STYLES = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=STYLES["Heading1"], fontSize=16, spaceAfter=10)
BODY = ParagraphStyle("Body", parent=STYLES["Normal"], fontSize=10, leading=15)


def _out_path(folder, filename):
    os.makedirs(folder, exist_ok=True)
    return os.path.join(folder, filename)


def render_agreement_pdf(agreement, owner_user, tenant_user, folder):
    path = _out_path(folder, f"{agreement.agreement_number}.pdf")
    doc = SimpleDocTemplate(path, pagesize=A4, topMargin=20 * mm, bottomMargin=20 * mm)
    story = [
        Paragraph("RENTAL AGREEMENT", H1),
        Paragraph(f"Agreement No: {agreement.agreement_number}", BODY),
        Spacer(1, 10),
        Paragraph(
            f"This Rental Agreement is made between <b>{owner_user.full_name}</b> "
            f"(LESSOR/OWNER) and <b>{tenant_user.full_name}</b> (LESSEE/TENANT).",
            BODY,
        ),
        Spacer(1, 10),
        Paragraph(
            f"1. DURATION: From {agreement.start_date} to {agreement.end_date}, "
            f"subject to renewal with an enhancement of {agreement.auto_renew_pct}% in monthly rent.",
            BODY,
        ),
        Paragraph(f"2. RENT: Rs. {agreement.monthly_rent}/- payable monthly.", BODY),
        Paragraph(f"3. SECURITY DEPOSIT: Rs. {agreement.security_deposit}/- interest free, refundable on vacating.", BODY),
        Paragraph("4. The Lessee shall maintain the premises in good condition, not sublet without permission, "
                   "and use the premises only for residential purposes.", BODY),
        Paragraph("5. TERMINATION: Either party may terminate by giving two (2) months prior written notice.", BODY),
        Spacer(1, 20),
        Paragraph(f"Status: {agreement.status.upper()}", BODY),
    ]
    doc.build(story)
    return path


def render_invoice_pdf(invoice, owner_user, tenant_user, room, folder):
    path = _out_path(folder, f"{invoice.invoice_number}.pdf")
    doc = SimpleDocTemplate(path, pagesize=A4, topMargin=20 * mm, bottomMargin=20 * mm)
    data = [
        ["Description", "Amount (INR)"],
        ["Rent", f"{invoice.rent}"],
        ["Electricity", f"{invoice.electricity}"],
        ["Water", f"{invoice.water}"],
        ["Maintenance", f"{invoice.maintenance}"],
        ["Other charges", f"{invoice.other_charges}"],
        ["Late fee", f"{invoice.late_fee}"],
        ["Total", f"{invoice.total}"],
        ["Paid", f"{invoice.paid_amount}"],
        ["Balance", f"{invoice.balance}"],
    ]
    table = Table(data, colWidths=[300, 150])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4f46e5")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, -3), (-1, -1), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story = [
        Paragraph("TAX INVOICE", H1),
        Paragraph(f"Invoice No: {invoice.invoice_number} | Billing Month: {invoice.billing_month}", BODY),
        Paragraph(f"Owner: {owner_user.full_name} ({owner_user.email})", BODY),
        Paragraph(f"Tenant: {tenant_user.full_name} | Unit: {room.unit_number}", BODY),
        Paragraph(f"Due date: {invoice.due_date} | Status: {invoice.status.upper()}", BODY),
        Spacer(1, 14),
        table,
    ]
    doc.build(story)
    return path
