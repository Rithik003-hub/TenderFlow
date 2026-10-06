# TenderFlow — Tender Document Package Builder

> **AI DevFest Contest Submission**  
> An enterprise-grade, frontend-only web application that turns individual PDF files into a verified, ordered, and compliant tender submission package ready for submission.

---

## 🌟 Overview & Highlights

**TenderFlow** is built specifically for office staff and procurement managers to eliminate manual errors when assembling complex tender bids. It runs **100% in the browser** (no participant backend or external database required) with high performance and zero data leakage.

### Key Capabilities
- 📄 **Strict Procurement Compliance**: Meets all rules in Section 4, 5, and 6 of the AI DevFest problem statement.
- ⚡ **1-Click Sample Pack Loader**: Instantly loads the contest sample pack (`requirements.json` and all document PDFs) for rapid judging and evaluation.
- 🚫 **Duplicate File Detection**: Automatically hashes uploaded files using browser-native SHA-256 (`crypto.subtle`) to identify exact byte-for-byte duplicates (e.g. `experience_cert (1).pdf` vs `experience_cert.pdf`) and prevents matching duplicates to different documents.
- 🛑 **Strict File Validation**: Enforces PDF-only uploads and immediately rejects non-PDF files (e.g. `company_logo.png`) with clear, descriptive error alerts.
- ⏳ **Intelligent Expiry Date Validation**: Compares document validity against the tender's `submission_deadline`. Detects expired documents (e.g. `trade_license_2025.pdf` expiring 2025-06-30 vs 2026-10-20 deadline) and flags them before submission.
- 🌐 **Full Bilingual Support (English & Bangla)**: Complete instant UI language switching between English and Bangla (বাংলা), dynamically updating document titles from `title_bn` or `title_en`, status badges, and instructions.
- 📑 **Exact PDF Package Assembly**:
  - **Page 1 (Cover Page)**: Shows Tender ID, Title, Procuring Entity, Bidder Name, Submission Deadline, Generation Date, and list of included documents in order.
  - **Page 2 (Bonus Index / Table of Contents)**: Shows each document and the exact page number where it starts in the package.
  - **All Document Pages**: Merged in strict requirement order.
  - **Universal Footer**: `<tender_id> | Page X of Y` on **every single page** (including cover & index), positioned neatly at the bottom margin without obscuring content.

---

## 🎁 Bonus Features Implemented

1. **Table of Contents / Index Page** (Section 7.1): Displays the exact starting page number of each document in the assembled package.
2. **Official Seal / Signature Stamper** (Section 7.2): Upload a PNG seal/signature and digitally stamp it onto chosen pages (all document pages, cover only, last page only) with custom corner positioning and opacity.
3. **Checklist Export (CSV / Excel)** (Section 7.3): One-click export of the full requirements checklist (ID, order, title, filename, pages, expiry date, status, blocking state) as a UTF-8 CSV.
4. **Save and Reopen Work** (Section 7.4):
   - Automatic local storage session recovery.
   - Export project configuration file (`.tenderproj` / JSON).
   - Import project configuration to resume previous sessions.
5. **Bangla Typography on PDF Cover & Index** (Section 7.5): Canvas-assisted high-DPI rendering ensures 100% accurate Bengali font glyph rendering.
6. **Smart Auto-Match** (Section 7.6): Intelligent fuzzy keyword matcher pairs uploaded files to requirements in one click with confidence feedback.
7. **Safe Bad File Handling** (Section 7.7): Corrupted or password-protected PDFs are gracefully caught with friendly UI alerts instead of crashing.
8. **AI Tender Compliance Assistant** (Section 7.8): Integrated assistant providing compliance audit reports, expiry risk analysis, and executive bid summaries (with optional user API key).

---

## 🏗️ Project Architecture

```
c:/Vibe Coding/
├── index.html                     # Semantic HTML5 frontend application
├── css/
│   └── style.css                  # Modern enterprise UI design system & dark/light theme
├── js/
│   ├── translations.js            # English & Bangla language dictionaries
│   ├── state.js                   # Reactive state manager, duplicate detector & validator
│   ├── pdf-builder.js             # Client-side PDF generator (pdf-lib engine)
│   └── app.js                     # Application controller & event binder
├── vendor/
│   ├── pdf-lib.min.js             # Vendored PDF-Lib library (offline capability)
│   ├── pdf.min.js                 # Vendored PDF.js preview engine
│   └── pdf.worker.min.js          # Vendored PDF.js web worker
├── sample-pack/
│   ├── requirements.json          # Tender specifications & requirements list
│   └── documents/                 # 11 sample files including hidden edge cases
├── output/
│   └── T-2026-0417_Package.pdf    # Fully assembled and verified 17-page submission package
├── screenshots/
│   ├── 01_initial_state_and_duplicates.png      # File list with duplicate detection & blocking issues
│   ├── 02_document_statuses_verified_ok.png     # All mandatory documents verified with OK status
│   ├── 03_bangla_bilingual_ui.png               # Full interface rendered in Bangla (বাংলা)
│   ├── 04_ai_compliance_audit.png              # AI Compliance Audit modal & report
│   └── 05_package_generated_and_download_ready.png # Package generated & download button enabled
├── scripts/
│   ├── build_submission_pdf.py    # Python verification script for Section 6 compliance
│   └── capture_screenshots.py     # Automated browser screenshot generation script
└── README.md
```

---

## 🚀 Running the Project

### Option 1: Any HTTP Server (Recommended)
From the project root directory:
```bash
python -m http.server 8080
```
Open **[http://localhost:8080](http://localhost:8080)** in Google Chrome.

### Option 2: Direct File Open
You can also open `index.html` directly in modern Google Chrome.

---

## 🧪 Testing the Sample Pack & Problems Resolved

| Hidden Problem in Pack | Detected By TenderFlow | Action Taken | Result Status |
| :--- | :--- | :--- | :--- |
| `company_logo.png` (Non-PDF) | File format validator | Automatically rejected with alert message | Rejection Alert shown |
| `experience_cert (1).pdf` & `experience_cert.pdf` | SHA-256 Binary Hash Match | Marked as Duplicate; twin prevented from matching different docs | Duplicate Warning |
| `trade_license_2025.pdf` | Expiry Date Validator | Expiry date (2025-06-30) < Deadline (2026-10-20) | `Expired` (Blocks package) |
| `trade_license_2026.pdf` | Expiry Date Validator | Expiry date (2027-06-30) >= Deadline (2026-10-20) | `OK` (Verified) |
| `bank_solvency.pdf` | Expiry Date Validator | Expiry date (2026-12-31) >= Deadline (2026-10-20) | `OK` (Verified) |
| `scan_0042.pdf` (Vague filename) | Smart Auto-Match & Preview | Matched to R10 (Signed Declaration) | `OK` (Verified) |
| R06 & R07 (Optional docs missing) | Rule 5 Status Engine | Flagged as optional unprovided documents | `Not provided` (Does not block) |

---

## 📜 Section 6 Compliance Matrix

- [x] **6.1 Cover Page**: Generated in English on Page 1 with Tender ID, Tender Title, Procuring Entity, Bidder Name, Submission Deadline, Made Date, and ordered document list.
- [x] **6.2 Document Order**: Included documents strictly sorted by `order`. Unprovided optional documents skipped.
- [x] **6.3 Universal Footer**: Every page contains `<tender_id> | Page X of Y` (Page 1 of 17, Page 2 of 17, ... Page 17 of 17).
- [x] **6.4 Non-overlapping Layout**: Footers rendered with a neat baseline bar and clean typography to guarantee readability without obscuring document contents.
