import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT

STYLES = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=STYLES["Heading1"], fontSize=16, spaceAfter=10)
BODY = ParagraphStyle("Body", parent=STYLES["Normal"], fontSize=10, leading=15)

INK = colors.HexColor("#1F2937")
BRAND = colors.HexColor("#4F46E5")
GREY = colors.HexColor("#6B7280")
LINE = colors.HexColor("#D1D5DB")


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


# ---------------------------------------------------------------------------
# Number to words (Indian numbering system: Crore / Lakh / Thousand)
# ---------------------------------------------------------------------------
_ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
         "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
         "Seventeen", "Eighteen", "Nineteen"]
_TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]


def _two_digit_words(n):
    if n < 20:
        return _ONES[n]
    return (_TENS[n // 10] + (" " + _ONES[n % 10] if n % 10 else "")).strip()


def _three_digit_words(n):
    if n >= 100:
        rest = n % 100
        return _ONES[n // 100] + " Hundred" + (" " + _two_digit_words(rest) if rest else "")
    return _two_digit_words(n)


def number_to_words_indian(n):
    """e.g. 34250 -> 'Thirty Four Thousand Two Hundred Fifty'"""
    n = int(round(n))
    if n == 0:
        return "Zero"
    parts = []
    crore, n = divmod(n, 10000000)
    lakh, n = divmod(n, 100000)
    thousand, n = divmod(n, 1000)
    hundred = n
    if crore:
        parts.append(_three_digit_words(crore) + " Crore")
    if lakh:
        parts.append(_three_digit_words(lakh) + " Lakh")
    if thousand:
        parts.append(_three_digit_words(thousand) + " Thousand")
    if hundred:
        parts.append(_three_digit_words(hundred))
    return " ".join(parts)


def render_invoice_pdf(invoice, owner_user, tenant_user, room, folder, owner_profile=None, agreement_number=None):
    """Generates a GST-style tax invoice matching a standard Indian rental
    tax-invoice layout: itemised charges with HSN/SAC, SGST+CGST on the rent
    line, amount-in-words, and a signature block. The in-app ledger (total /
    paid / balance shown elsewhere) is unaffected -- GST here is presentational,
    computed at print time only, for owners who want a formal tax document."""
    path = _out_path(folder, f"{invoice.invoice_number}.pdf")
    doc = SimpleDocTemplate(path, pagesize=A4, topMargin=14 * mm, bottomMargin=14 * mm,
                             leftMargin=16 * mm, rightMargin=16 * mm)

    label_style = ParagraphStyle("label", fontName="Helvetica", fontSize=8.3, textColor=GREY, leading=11)
    value_style = ParagraphStyle("value", fontName="Helvetica-Bold", fontSize=9.3, textColor=INK, leading=12)
    small = ParagraphStyle("small", fontName="Helvetica", fontSize=8.3, textColor=INK, leading=12)
    title_style = ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=15, textColor=INK, alignment=TA_CENTER)
    section_style = ParagraphStyle("section", fontName="Helvetica-Bold", fontSize=9, textColor=INK)

    property_address = (owner_profile.property_address if owner_profile else None) or "Property Address"
    owner_gst_pan = (owner_profile.gst_number if owner_profile else None) or (owner_profile.pan_number if owner_profile else None) or "\u2014"
    tenant_gst_pan = "\u2014"

    story = []
    story.append(Paragraph("Tax Invoice", title_style))
    story.append(Spacer(1, 6))

    header_tbl = Table(
        [
            [Paragraph(f"<b>{owner_user.full_name}</b>", value_style), Paragraph("Invoice No.", label_style), Paragraph(invoice.invoice_number, value_style)],
            [Paragraph(property_address, small), Paragraph("Dated", label_style), Paragraph(invoice.created_at.strftime("%d-%b-%y"), value_style)],
            [Paragraph(f"E-Mail : {owner_user.email}", small), Paragraph("Billing Month", label_style), Paragraph(invoice.billing_month or "\u2014", value_style)],
            [Paragraph("", small), Paragraph("Due Date", label_style), Paragraph(invoice.due_date.strftime("%d-%b-%y"), value_style)],
            [Paragraph("", small), Paragraph("Status", label_style), Paragraph(invoice.status.replace("_", " ").title(), value_style)],
            [Paragraph(f"Owner GST / PAN&nbsp;&nbsp;{owner_gst_pan}", small), Paragraph("", label_style), Paragraph("", value_style)],
        ],
        colWidths=[85 * mm, 35 * mm, 48 * mm],
    )
    header_tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ("LINEBELOW", (0, -1), (-1, -1), 0.75, LINE),
    ]))
    story.append(header_tbl)
    story.append(Spacer(1, 8))

    story.append(Paragraph("Buyer (Bill to)", section_style))
    buyer_lines = [
        tenant_user.full_name,
        f"{room.property.name}, {room.property.location or ''}".strip(", "),
        f"Room No. {room.unit_number}",
    ]
    buyer_tbl = Table(
        [
            [Paragraph("<br/>".join(buyer_lines), small),
             Table([
                 ["Property Name", room.property.name],
                 ["Property Location", room.property.location or "\u2014"],
                 ["Tenant Name", tenant_user.full_name],
                 ["Tenant GST / PAN", tenant_gst_pan],
             ], colWidths=[32 * mm, 55 * mm], style=TableStyle([
                 ("FONTSIZE", (0, 0), (-1, -1), 8.3),
                 ("TEXTCOLOR", (0, 0), (0, -1), GREY),
                 ("FONTNAME", (1, 0), (1, -1), "Helvetica-Bold"),
                 ("TOPPADDING", (0, 0), (-1, -1), 1.5),
                 ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5),
             ]))],
        ],
        colWidths=[80 * mm, 88 * mm],
    )
    buyer_tbl.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LINEBELOW", (0, 0), (-1, -1), 0.75, LINE), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    story.append(buyer_tbl)
    story.append(Spacer(1, 8))

    # ---- line items ----
    story.append(Paragraph("Terms of Delivery", section_style))
    story.append(Spacer(1, 3))

    line_items = []
    sl = 1
    if float(invoice.rent or 0):
        line_items.append((sl, f"RENTING OF IMMOVABLE PROPERTY SERVICES<br/>RENT FOR {(invoice.billing_month or '').upper()}", "997212", float(invoice.rent)))
        sl += 1
    if float(invoice.electricity or 0):
        line_items.append((sl, f"ELECTRICITY<br/>{invoice.billing_month or ''}", "\u2014", float(invoice.electricity)))
        sl += 1
    if float(invoice.water or 0):
        line_items.append((sl, f"WATER<br/>{invoice.billing_month or ''}", "\u2014", float(invoice.water)))
        sl += 1
    if float(invoice.maintenance or 0):
        line_items.append((sl, f"MAINTENANCE<br/>{invoice.billing_month or ''}", "\u2014", float(invoice.maintenance)))
        sl += 1
    if float(invoice.other_charges or 0):
        line_items.append((sl, f"OTHER CHARGES<br/>{invoice.billing_month or ''}", "\u2014", float(invoice.other_charges)))
        sl += 1
    if float(invoice.late_fee or 0):
        line_items.append((sl, f"LATE PAYMENT FEE<br/>{invoice.billing_month or ''}", "\u2014", float(invoice.late_fee)))
        sl += 1

    item_cell_style = ParagraphStyle("item", fontName="Helvetica", fontSize=8.3, leading=11)
    items_head = ["Sl No.", "Description of Services", "HSN/SAC", "Quantity", "Rate per", "Amount"]
    items_rows = [items_head]
    for sl_no, desc, hsn, amt in line_items:
        items_rows.append([str(sl_no), Paragraph(desc, item_cell_style), hsn, "1 NOS", f"{amt:,.2f} NOS", f"{amt:,.2f}"])

    rent_amount = float(invoice.rent or 0)
    sgst_rate, cgst_rate = 9, 9
    sgst_amt = round(rent_amount * sgst_rate / 100, 2)
    cgst_amt = round(rent_amount * cgst_rate / 100, 2)
    if rent_amount:
        items_rows.append(["", "SGST @ 9%", "", "", "", f"{sgst_amt:,.2f}"])
        items_rows.append(["", "CGST @ 9%", "", "", "", f"{cgst_amt:,.2f}"])

    base_total = sum(a for _, _, _, a in line_items)
    pdf_total = base_total + sgst_amt + cgst_amt
    items_rows.append([f"{len(line_items)} NOS", "", "", "", "Total", f"Rs. {pdf_total:,.2f}"])

    items_tbl = Table(items_rows, colWidths=[13 * mm, 62 * mm, 22 * mm, 22 * mm, 27 * mm, 22 * mm])
    items_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.3),
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (3, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(items_tbl)
    story.append(Spacer(1, 6))

    story.append(Paragraph(f"Amount Chargeable (in words)", section_style))
    story.append(Paragraph(f"INR {number_to_words_indian(pdf_total)} Only", small))
    story.append(Paragraph("E. & O.E", ParagraphStyle("eoe", fontName="Helvetica-Oblique", fontSize=7.5, textColor=GREY, alignment=TA_RIGHT)))
    story.append(Spacer(1, 8))

    # ---- tax summary ----
    tax_rows = [["HSN/SAC", "Taxable Value", "CGST Rate", "CGST Amt", "SGST Rate", "SGST Amt", "Total Tax"]]
    if rent_amount:
        tax_rows.append(["997212", f"{rent_amount:,.2f}", "9%", f"{cgst_amt:,.2f}", "9%", f"{sgst_amt:,.2f}", f"{cgst_amt+sgst_amt:,.2f}"])
        tax_rows.append(["Total", f"{rent_amount:,.2f}", "", f"{cgst_amt:,.2f}", "", f"{sgst_amt:,.2f}", f"{cgst_amt+sgst_amt:,.2f}"])
    tax_tbl = Table(tax_rows, colWidths=[22 * mm, 28 * mm, 18 * mm, 22 * mm, 18 * mm, 22 * mm, 24 * mm])
    tax_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F3F4F6")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 7.8),
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
    ]))
    story.append(tax_tbl)
    story.append(Spacer(1, 6))
    story.append(Paragraph("Tax Amount (in words) :", section_style))
    story.append(Paragraph(f"INR {number_to_words_indian(cgst_amt + sgst_amt)} Only", small))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"Company's PAN : {(owner_profile.pan_number if owner_profile else None) or '\u2014'}", small))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Declaration", section_style))
    story.append(Paragraph(
        "We declare that this invoice shows the actual price of the services described and that all "
        "particulars are true and correct.", small))
    story.append(Spacer(1, 26))

    sig_tbl = Table(
        [[Paragraph(f"Customer's Seal and Signature", small), Paragraph(f"for {owner_user.full_name}", small)],
         [Paragraph("", small), Paragraph("Authorised Signatory", value_style)]],
        colWidths=[90 * mm, 78 * mm],
    )
    sig_tbl.setStyle(TableStyle([("ALIGN", (1, 0), (1, -1), "RIGHT")]))
    story.append(sig_tbl)
    story.append(Spacer(1, 10))
    story.append(Paragraph("This is a Computer Generated Invoice",
                            ParagraphStyle("footer", fontName="Helvetica-Oblique", fontSize=7.5, textColor=GREY, alignment=TA_CENTER)))

    doc.build(story)
    return path
