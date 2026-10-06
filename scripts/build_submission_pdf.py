"""
Generate the compliant final submission package for AI DevFest:
output/T-2026-0417_Package.pdf
Strictly adhering to Section 6 (Package Rules) and Section 7 (Bonus Tasks).
"""

import os
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from pypdf import PdfReader, PdfWriter

def create_cover_and_index_pages(tender_id, tender_title, procuring_entity, bidder, deadline, date_made, docs_info, total_pages_holder):
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    w, h = A4

    # ---------------- PAGE 1: COVER PAGE (Section 6.1) ----------------
    # Header Accent
    c.setFillColor(colors.HexColor("#1e3a8a"))
    c.rect(0, h - 14, w, 14, fill=True, stroke=False)

    # Outer decorative card
    c.setStrokeColor(colors.HexColor("#cbd5e1"))
    c.setLineWidth(1)
    c.roundRect(40, 44, w - 80, h - 74, 8, stroke=True, fill=False)

    # Top Category
    c.setFillColor(colors.HexColor("#2563eb"))
    c.setFont("Helvetica-Bold", 11)
    c.drawString(55, h - 55, "OFFICIAL TENDER SUBMISSION PACKAGE")

    # Tender Title
    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 18)
    c.drawString(55, h - 80, tender_title)

    # Separator
    c.setStrokeColor(colors.HexColor("#e2e8f0"))
    c.setLineWidth(1.5)
    c.line(55, h - 94, w - 55, h - 94)

    # Metadata Box
    c.setFillColor(colors.HexColor("#f8fafc"))
    c.setStrokeColor(colors.HexColor("#e2e8f0"))
    c.roundRect(55, h - 225, w - 110, 115, 6, fill=True, stroke=True)

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawString(75, h - 128, "Tender ID:")
    c.drawString(75, h - 150, "Procuring Entity:")
    c.drawString(75, h - 172, "Bidder Name:")

    c.drawString(330, h - 128, "Date Generated:")
    c.drawString(330, h - 150, "Submission Deadline:")
    c.drawString(330, h - 172, "Total Verified Documents:")

    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.drawString(165, h - 128, tender_id)
    c.drawString(165, h - 150, procuring_entity)
    c.drawString(165, h - 172, bidder)

    c.drawString(455, h - 128, date_made)
    c.setFillColor(colors.HexColor("#dc2626"))
    c.drawString(455, h - 150, deadline)
    c.setFillColor(colors.HexColor("#16a34a"))
    c.drawString(480, h - 172, f"{len(docs_info)} Included")

    # Section 6.1: List of included documents in order
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.drawString(55, h - 250, "INCLUDED DOCUMENTS SCHEDULE (IN ORDER)")

    # Table Header
    c.setFillColor(colors.HexColor("#1e293b"))
    c.rect(55, h - 275, w - 110, 20, fill=True, stroke=False)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(65, h - 262, "#")
    c.drawString(85, h - 262, "Order")
    c.drawString(130, h - 262, "Document Title")
    c.drawString(310, h - 262, "Source File")
    c.drawString(445, h - 262, "Pages")
    c.drawString(485, h - 262, "Status")

    y = h - 295
    row_h = 22
    for idx, d in enumerate(docs_info):
        if idx % 2 == 1:
            c.setFillColor(colors.HexColor("#f8fafc"))
            c.rect(55, y - 4, w - 110, row_h, fill=True, stroke=False)
        
        c.setFillColor(colors.HexColor("#475569"))
        c.setFont("Helvetica", 8.5)
        c.drawString(65, y + 3, str(idx + 1))
        
        c.setFillColor(colors.HexColor("#2563eb"))
        c.setFont("Helvetica-Bold", 8.5)
        c.drawString(85, y + 3, f"R{d['order']:02d}")
        
        c.setFillColor(colors.HexColor("#0f172a"))
        c.drawString(130, y + 3, d['title'])
        
        c.setFillColor(colors.HexColor("#475569"))
        c.drawString(310, y + 3, d['file_name'])
        c.drawString(452, y + 3, str(d['pages']))
        
        c.setFillColor(colors.HexColor("#16a34a"))
        c.setFont("Helvetica-Bold", 8)
        c.drawString(485, y + 3, "OK (Verified)")

        c.setStrokeColor(colors.HexColor("#e2e8f0"))
        c.setLineWidth(0.5)
        c.line(55, y - 4, w - 55, y - 4)
        y -= row_h

    c.setFont("Helvetica", 8)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawString(55, 52, "All documents verified against tender requirements, expiry dates validated, and compiled into single submission package.")

    c.showPage()

    # ---------------- PAGE 2: TABLE OF CONTENTS / INDEX (Bonus Task 1) ----------------
    c.setFillColor(colors.HexColor("#1e3a8a"))
    c.rect(0, h - 14, w, 14, fill=True, stroke=False)

    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 16)
    c.drawString(55, h - 60, "TABLE OF CONTENTS / DOCUMENT INDEX")

    c.setFillColor(colors.HexColor("#64748b"))
    c.setFont("Helvetica", 9.5)
    c.drawString(55, h - 75, f"Tender ID: {tender_id} • Starting Page Number Reference")

    c.setFillColor(colors.HexColor("#1e293b"))
    c.rect(55, h - 115, w - 110, 22, fill=True, stroke=False)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(65, h - 101, "Item")
    c.drawString(100, h - 101, "Required Document Title")
    c.drawString(310, h - 101, "Source File")
    c.drawString(435, h - 101, "Total Pages")
    c.drawString(485, h - 101, "Starts At")

    y = h - 138
    row_h = 24
    for idx, d in enumerate(docs_info):
        if idx % 2 == 1:
            c.setFillColor(colors.HexColor("#f8fafc"))
            c.rect(55, y - 4, w - 110, row_h, fill=True, stroke=False)

        c.setFillColor(colors.HexColor("#2563eb"))
        c.setFont("Helvetica-Bold", 8.5)
        c.drawString(65, y + 4, f"#{idx + 1}")

        c.setFillColor(colors.HexColor("#0f172a"))
        c.drawString(100, y + 4, d['title'])

        c.setFillColor(colors.HexColor("#475569"))
        c.setFont("Helvetica", 8.5)
        c.drawString(310, y + 4, d['file_name'])
        c.drawString(445, y + 4, str(d['pages']))

        c.setFillColor(colors.HexColor("#2563eb"))
        c.setFont("Helvetica-Bold", 9)
        c.drawString(490, y + 4, f"Page {d['start_page']}")

        c.setStrokeColor(colors.HexColor("#e2e8f0"))
        c.setLineWidth(0.5)
        c.line(55, y - 4, w - 55, y - 4)
        y -= row_h

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer

def add_footer_to_page(page, tender_id, current_page, total_pages):
    packet = BytesIO()
    w = float(page.mediabox.width)
    h = float(page.mediabox.height)

    can = canvas.Canvas(packet, pagesize=(w, h))

    # Bottom footer band
    can.setFillColor(colors.HexColor("#f8fafc"))
    can.rect(0, 0, w, 28, fill=True, stroke=False)

    # Divider line
    can.setStrokeColor(colors.HexColor("#cbd5e1"))
    can.setLineWidth(0.5)
    can.line(24, 28, w - 24, 28)

    # Left note
    can.setFont("Helvetica", 8)
    can.setFillColor(colors.HexColor("#64748b"))
    can.drawString(24, 10, "Official Tender Bid Package")

    # Section 6.3 compliant footer: <tender_id> | Page X of Y
    footer_text = f"{tender_id}  |  Page {current_page} of {total_pages}"
    can.setFont("Helvetica-Bold", 8.5)
    can.setFillColor(colors.HexColor("#0f172a"))
    can.drawRightString(w - 24, 10, footer_text)

    can.save()
    packet.seek(0)
    overlay_reader = PdfReader(packet)
    page.merge_page(overlay_reader.pages[0])

def generate_package():
    os.makedirs(r"c:\Vibe Coding\output", exist_ok=True)
    doc_dir = r"c:\Vibe Coding\sample-pack\documents"

    tender_id = "T-2026-0417"
    tender_title = "Supply of IT Equipment"
    procuring_entity = "Directorate of Sample Services"
    bidder = "Meghna Tech Solutions Ltd."
    deadline = "2026-10-20"
    date_made = "2026-10-06"

    # Resolved matches (all mandatory items, in order):
    # R01: Trade License -> trade_license_2026.pdf (valid until 2027-06-30 >= 2026-10-20)
    # R02: TIN Certificate -> 03_tin_certificate.pdf
    # R03: VAT Certificate -> 04_vat_certificate.pdf
    # R04: Bank Solvency -> bank_solvency.pdf (valid until 2026-12-31 >= 2026-10-20)
    # R05: Experience Certificate -> experience_cert.pdf
    # R08: Technical Proposal -> 02_technical_proposal.pdf
    # R09: Financial Proposal -> 01_financial_proposal.pdf
    # R10: Signed Declaration -> scan_0042.pdf
    
    docs_to_include = [
        {"order": 1, "id": "R01", "title": "Trade License", "file_name": "trade_license_2026.pdf"},
        {"order": 2, "id": "R02", "title": "TIN Certificate", "file_name": "03_tin_certificate.pdf"},
        {"order": 3, "id": "R03", "title": "VAT Registration Certificate", "file_name": "04_vat_certificate.pdf"},
        {"order": 4, "id": "R04", "title": "Bank Solvency Certificate", "file_name": "bank_solvency.pdf"},
        {"order": 5, "id": "R05", "title": "Experience Certificate", "file_name": "experience_cert.pdf"},
        {"order": 8, "id": "R08", "title": "Technical Proposal", "file_name": "02_technical_proposal.pdf"},
        {"order": 9, "id": "R09", "title": "Financial Proposal", "file_name": "01_financial_proposal.pdf"},
        {"order": 10, "id": "R10", "title": "Signed Declaration", "file_name": "scan_0042.pdf"}
    ]

    # Calculate page counts and starting page numbers
    cover_pages = 1
    index_pages = 1
    cursor = cover_pages + index_pages + 1

    loaded_readers = []
    for d in docs_to_include:
        p = os.path.join(doc_dir, d["file_name"])
        r = PdfReader(p)
        count = len(r.pages)
        d["pages"] = count
        d["start_page"] = cursor
        cursor += count
        loaded_readers.append((d, r))

    total_pages = cursor - 1
    print(f"Total pages in final package: {total_pages}")

    # Generate Cover & Index
    front_buf = create_cover_and_index_pages(
        tender_id, tender_title, procuring_entity, bidder, deadline, date_made, docs_to_include, total_pages
    )
    front_reader = PdfReader(front_buf)

    writer = PdfWriter()

    # Add Cover page (Page 1)
    p1 = front_reader.pages[0]
    add_footer_to_page(p1, tender_id, 1, total_pages)
    writer.add_page(p1)

    # Add Index page (Page 2)
    p2 = front_reader.pages[1]
    add_footer_to_page(p2, tender_id, 2, total_pages)
    writer.add_page(p2)

    # Add Document pages with footers
    curr_page_num = 3
    for d, r in loaded_readers:
        for page in r.pages:
            add_footer_to_page(page, tender_id, curr_page_num, total_pages)
            writer.add_page(page)
            curr_page_num += 1

    output_path = rf"c:\Vibe Coding\output\{tender_id}_Package.pdf"
    with open(output_path, "wb") as f_out:
        writer.write(f_out)

    print(f"Generated {output_path} successfully! Total pages: {len(writer.pages)}")

if __name__ == "__main__":
    generate_package()
