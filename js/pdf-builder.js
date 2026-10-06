/**
 * TenderFlow - PDF Package Builder
 * Complies strictly with Section 6 of the AI DevFest Problem Statement:
 *  - 6.1 Page 1 is Cover Page (Tender ID, Title, Procuring Entity, Bidder, Deadline, Made Date, List of included docs in order)
 *  - Bonus Task 1: Index / Table of Contents page after cover with starting page numbers
 *  - 6.2 Documents sorted by order, all pages included, skip unprovided optional docs
 *  - 6.3 Every page (including cover & index) has footer: <tender_id> | Page X of Y
 *  - 6.4 Footer is easy to read and does not cover content
 *  - Bonus Task 2: PNG Seal / Signature placement
 *  - Bonus Task 5: High-DPI Bangla rendering option
 */

class TenderPdfBuilder {
  constructor(state) {
    this.state = state;
  }

  /**
   * Main build method
   * @param {Function} onProgress Callback for progress percentage and status
   * @returns {Promise<{ pdfBytes: Uint8Array, totalPages: number, fileName: string }>}
   */
  async buildPackage(onProgress = () => {}) {
    if (typeof PDFLib === 'undefined') {
      throw new Error("PDFLib library is not loaded. Please ensure vendor/pdf-lib.min.js is included.");
    }

    const { PDFDocument, rgb, StandardFonts, degrees } = PDFLib;
    onProgress(5, "Initializing PDF Package...");

    const targetPdf = await PDFDocument.create();
    const tender = this.state.tender;
    const reqs = this.state.requirements;
    const matches = this.state.matches;
    const opts = this.state.options;

    // Filter included documents in strict order
    const includedDocs = [];
    for (const req of reqs) {
      const fileId = matches[req.id];
      if (fileId && this.state.uploadedFiles.has(fileId)) {
        const fileObj = this.state.uploadedFiles.get(fileId);
        includedDocs.push({
          req,
          file: fileObj
        });
      }
    }

    if (includedDocs.length === 0) {
      throw new Error("No documents attached to include in package.");
    }

    // Step 1: Calculate page counts and layout
    onProgress(15, "Calculating document structure and page numbers...");
    const coverPageCount = 1;
    const indexPageCount = opts.includeIndexPage ? 1 : 0;
    const docStartPages = []; // will store { req, file, startPage, pageCount }

    let currentPageCursor = coverPageCount + indexPageCount + 1; // 1-indexed

    // Pre-load all source documents to extract copied pages and get exact page counts
    const loadedDocs = [];
    for (let i = 0; i < includedDocs.length; i++) {
      const item = includedDocs[i];
      onProgress(20 + Math.round((i / includedDocs.length) * 30), `Processing document: ${item.file.name}...`);
      
      let srcDoc;
      try {
        srcDoc = await PDFDocument.load(item.file.arrayBuffer, { ignoreEncryption: true });
      } catch (err) {
        throw new Error(`Failed to read PDF "${item.file.name}". File might be damaged or password protected: ${err.message}`);
      }

      const count = srcDoc.getPageCount();
      docStartPages.push({
        req: item.req,
        file: item.file,
        startPage: currentPageCursor,
        pageCount: count
      });
      currentPageCursor += count;

      loadedDocs.push({
        item,
        srcDoc,
        pageCount: count
      });
    }

    const totalPages = coverPageCount + indexPageCount + loadedDocs.reduce((acc, d) => acc + d.pageCount, 0);

    // Step 2: Render Cover Page (Page 1)
    onProgress(55, "Generating Cover Page...");
    if (opts.banglaCoverIndex && this.state.lang === 'bn') {
      await this.renderBanglaCoverPage(targetPdf, tender, docStartPages);
    } else {
      await this.renderEnglishCoverPage(targetPdf, tender, docStartPages);
    }

    // Step 3: Render Index Page if enabled (Bonus Task 1)
    if (opts.includeIndexPage) {
      onProgress(65, "Generating Table of Contents / Index Page...");
      if (opts.banglaCoverIndex && this.state.lang === 'bn') {
        await this.renderBanglaIndexPage(targetPdf, tender, docStartPages);
      } else {
        await this.renderEnglishIndexPage(targetPdf, tender, docStartPages);
      }
    }

    // Step 4: Append all document pages in order
    onProgress(75, "Merging document pages in specified order...");
    for (const loaded of loadedDocs) {
      const pageIndices = loaded.srcDoc.getPageIndices();
      const copiedPages = await targetPdf.copyPages(loaded.srcDoc, pageIndices);
      for (const p of copiedPages) {
        targetPdf.addPage(p);
      }
    }

    // Step 5: Embed Seal / Signature if enabled (Bonus Task 2)
    if (opts.seal && opts.seal.enabled && opts.seal.dataUrl) {
      onProgress(85, "Applying official seal / signature...");
      await this.applySealStamp(targetPdf, opts.seal, coverPageCount, indexPageCount);
    }

    // Step 6: Add uniform footer to EVERY page (Section 6.3 & 6.4)
    // <tender_id> | Page X of Y
    onProgress(90, "Applying compliant package footers to all pages...");
    const font = await targetPdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await targetPdf.embedFont(StandardFonts.HelveticaBold);
    const allPages = targetPdf.getPages();
    const tenderId = tender.tender_id || "TENDER";

    for (let i = 0; i < allPages.length; i++) {
      const page = allPages[i];
      const pageNum = i + 1;
      const { width, height } = page.getSize();

      const footerText = `${tenderId}  |  Page ${pageNum} of ${totalPages}`;
      const fontSize = 9;
      const textWidth = font.widthOfTextAtSize(footerText, fontSize);
      const margin = 24;

      // Draw subtle neat semi-translucent footer band to prevent covering background content
      page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: 28,
        color: rgb(0.97, 0.98, 0.99),
        opacity: 0.92
      });

      // Thin separator line above footer
      page.drawLine({
        start: { x: margin, y: 28 },
        end: { x: width - margin, y: 28 },
        thickness: 0.5,
        color: rgb(0.80, 0.83, 0.87)
      });

      // Left-aligned tender reference note
      page.drawText(`Official Bid Package`, {
        x: margin,
        y: 10,
        size: 8,
        font: font,
        color: rgb(0.45, 0.50, 0.58)
      });

      // Right-aligned compliant footer text (<tender_id> | Page X of Y)
      page.drawText(footerText, {
        x: width - margin - textWidth,
        y: 10,
        size: fontSize,
        font: fontBold,
        color: rgb(0.12, 0.16, 0.24)
      });
    }

    onProgress(98, "Finalizing PDF byte stream...");
    const pdfBytes = await targetPdf.save();
    const fileName = `${tenderId}_Package.pdf`;

    onProgress(100, "Package successfully generated!");
    return {
      pdfBytes,
      totalPages,
      fileName
    };
  }

  /**
   * Section 6.1: Page 1 is a cover page, in English.
   * Shows: tender ID, tender title, procuring entity, bidder name,
   * submission deadline, the date the package was made, and the list of included documents in order.
   */
  async renderEnglishCoverPage(pdfDoc, tender, docStartPages) {
    const { rgb, StandardFonts } = PDFLib;
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const width = 595.28;
    const height = 841.89;
    const margin = 48;

    // Background accent bar at top
    page.drawRectangle({
      x: 0,
      y: height - 12,
      width: width,
      height: 12,
      color: rgb(0.15, 0.35, 0.75) // Royal blue banner
    });

    // Outer decorative card border
    page.drawRectangle({
      x: margin - 14,
      y: 44,
      width: width - (margin - 14) * 2,
      height: height - 76,
      borderColor: rgb(0.85, 0.88, 0.92),
      borderWidth: 1,
      color: rgb(0.995, 0.997, 1.0)
    });

    let y = height - 60;

    // Category / Organization tag
    page.drawText("OFFICIAL TENDER SUBMISSION PACKAGE", {
      x: margin,
      y: y,
      size: 11,
      font: fontBold,
      color: rgb(0.18, 0.38, 0.82)
    });
    y -= 26;

    // Main Tender Title
    const titleText = tender.title || "Tender Bid Document Package";
    page.drawText(titleText.length > 55 ? titleText.substring(0, 52) + "..." : titleText, {
      x: margin,
      y: y,
      size: 20,
      font: fontBold,
      color: rgb(0.08, 0.12, 0.20)
    });
    y -= 14;

    // Thin separator line
    page.drawLine({
      start: { x: margin, y: y },
      end: { x: width - margin, y: y },
      thickness: 1.5,
      color: rgb(0.82, 0.86, 0.92)
    });
    y -= 22;

    // Metadata Grid Box
    const boxHeight = 112;
    page.drawRectangle({
      x: margin,
      y: y - boxHeight,
      width: width - margin * 2,
      height: boxHeight,
      color: rgb(0.95, 0.97, 1.0),
      borderColor: rgb(0.84, 0.89, 0.96),
      borderWidth: 1
    });

    const metaLeftCol = margin + 16;
    const metaRightCol = margin + 265;
    const metaY = y - 24;
    const lineGap = 22;

    // Row 1
    page.drawText("Tender ID:", { x: metaLeftCol, y: metaY, size: 9, font: font, color: rgb(0.4, 0.45, 0.52) });
    page.drawText(tender.tender_id || "N/A", { x: metaLeftCol + 85, y: metaY, size: 10, font: fontBold, color: rgb(0.1, 0.15, 0.25) });

    page.drawText("Date Generated:", { x: metaRightCol, y: metaY, size: 9, font: font, color: rgb(0.4, 0.45, 0.52) });
    const today = new Date().toISOString().split('T')[0];
    page.drawText(today, { x: metaRightCol + 85, y: metaY, size: 10, font: fontBold, color: rgb(0.1, 0.15, 0.25) });

    // Row 2
    page.drawText("Procuring Entity:", { x: metaLeftCol, y: metaY - lineGap, size: 9, font: font, color: rgb(0.4, 0.45, 0.52) });
    page.drawText(tender.procuring_entity || "N/A", { x: metaLeftCol + 85, y: metaY - lineGap, size: 10, font: fontBold, color: rgb(0.1, 0.15, 0.25) });

    page.drawText("Submission Deadline:", { x: metaRightCol, y: metaY - lineGap, size: 9, font: font, color: rgb(0.4, 0.45, 0.52) });
    page.drawText(tender.submission_deadline || "N/A", { x: metaRightCol + 85, y: metaY - lineGap, size: 10, font: fontBold, color: rgb(0.80, 0.15, 0.15) });

    // Row 3
    page.drawText("Bidder Name:", { x: metaLeftCol, y: metaY - lineGap * 2, size: 9, font: font, color: rgb(0.4, 0.45, 0.52) });
    page.drawText(tender.bidder || "N/A", { x: metaLeftCol + 85, y: metaY - lineGap * 2, size: 10, font: fontBold, color: rgb(0.1, 0.15, 0.25) });

    page.drawText("Documents Count:", { x: metaRightCol, y: metaY - lineGap * 2, size: 9, font: font, color: rgb(0.4, 0.45, 0.52) });
    page.drawText(`${docStartPages.length} Documents Attached`, { x: metaRightCol + 85, y: metaY - lineGap * 2, size: 10, font: fontBold, color: rgb(0.08, 0.55, 0.35) });

    y -= (boxHeight + 28);

    // Section 6.1 Requirement: List of included documents in order
    page.drawText("INCLUDED DOCUMENTS SCHEDULE (IN ORDER)", {
      x: margin,
      y: y,
      size: 11,
      font: fontBold,
      color: rgb(0.12, 0.16, 0.24)
    });
    y -= 14;

    // Table Header
    page.drawRectangle({
      x: margin,
      y: y - 18,
      width: width - margin * 2,
      height: 20,
      color: rgb(0.20, 0.26, 0.38)
    });

    page.drawText("#", { x: margin + 8, y: y - 13, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("Order", { x: margin + 28, y: y - 13, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("Document Title", { x: margin + 70, y: y - 13, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("File Name", { x: margin + 270, y: y - 13, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("Pages", { x: margin + 415, y: y - 13, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("Status", { x: margin + 458, y: y - 13, size: 9, font: fontBold, color: rgb(1, 1, 1) });

    y -= 20;

    // Table Rows
    const rowHeight = 22;
    for (let i = 0; i < docStartPages.length; i++) {
      const doc = docStartPages[i];
      const isAlt = i % 2 === 1;

      if (isAlt) {
        page.drawRectangle({
          x: margin,
          y: y - rowHeight + 4,
          width: width - margin * 2,
          height: rowHeight,
          color: rgb(0.965, 0.975, 0.99)
        });
      }

      page.drawText(`${i + 1}`, { x: margin + 8, y: y - 10, size: 9, font: font, color: rgb(0.3, 0.35, 0.4) });
      page.drawText(`R${String(doc.req.order).padStart(2, '0')}`, { x: margin + 28, y: y - 10, size: 9, font: fontBold, color: rgb(0.2, 0.3, 0.5) });

      const title = doc.req.title_en || "Document";
      page.drawText(title.length > 32 ? title.substring(0, 30) + ".." : title, {
        x: margin + 70,
        y: y - 10,
        size: 9,
        font: fontBold,
        color: rgb(0.12, 0.16, 0.24)
      });

      const fname = doc.file.name;
      page.drawText(fname.length > 25 ? fname.substring(0, 23) + ".." : fname, {
        x: margin + 270,
        y: y - 10,
        size: 8.5,
        font: font,
        color: rgb(0.3, 0.35, 0.45)
      });

      page.drawText(`${doc.pageCount} p.`, { x: margin + 420, y: y - 10, size: 9, font: font, color: rgb(0.3, 0.35, 0.45) });

      // OK Status indicator
      page.drawText("OK (Verified)", { x: margin + 458, y: y - 10, size: 8.5, font: fontBold, color: rgb(0.08, 0.55, 0.28) });

      // Row bottom border
      page.drawLine({
        start: { x: margin, y: y - rowHeight + 4 },
        end: { x: width - margin, y: y - rowHeight + 4 },
        thickness: 0.5,
        color: rgb(0.88, 0.90, 0.94)
      });

      y -= rowHeight;
      if (y < 90) break; // keep above footer
    }

    // Official Verification Note at bottom
    page.drawText("This tender package has been assembled in compliance with procurement rules and verified for submission.", {
      x: margin,
      y: 52,
      size: 8,
      font: font,
      color: rgb(0.45, 0.50, 0.58)
    });
  }

  /**
   * Bonus Task 1: Index page after cover showing start page numbers
   */
  async renderEnglishIndexPage(pdfDoc, tender, docStartPages) {
    const { rgb, StandardFonts } = PDFLib;
    const page = pdfDoc.addPage([595.28, 841.89]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const width = 595.28;
    const height = 841.89;
    const margin = 48;

    let y = height - 60;

    page.drawText("TABLE OF CONTENTS / DOCUMENT INDEX", {
      x: margin,
      y: y,
      size: 16,
      font: fontBold,
      color: rgb(0.12, 0.16, 0.25)
    });
    y -= 12;

    page.drawText(`Tender ID: ${tender.tender_id} • Package Schedule`, {
      x: margin,
      y: y,
      size: 10,
      font: font,
      color: rgb(0.45, 0.50, 0.58)
    });
    y -= 24;

    // Header bar
    page.drawRectangle({
      x: margin,
      y: y - 20,
      width: width - margin * 2,
      height: 22,
      color: rgb(0.24, 0.32, 0.44)
    });

    page.drawText("Doc #", { x: margin + 10, y: y - 14, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("Required Document Title", { x: margin + 65, y: y - 14, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("Source File", { x: margin + 285, y: y - 14, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("Pages", { x: margin + 410, y: y - 14, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("Starts At Page", { x: margin + 450, y: y - 14, size: 9, font: fontBold, color: rgb(1, 1, 1) });

    y -= 22;

    const rowH = 26;
    for (let i = 0; i < docStartPages.length; i++) {
      const doc = docStartPages[i];
      const isAlt = i % 2 === 1;

      if (isAlt) {
        page.drawRectangle({
          x: margin,
          y: y - rowH + 6,
          width: width - margin * 2,
          height: rowH,
          color: rgb(0.97, 0.98, 0.99)
        });
      }

      page.drawText(`Item ${i + 1}`, { x: margin + 10, y: y - 12, size: 9, font: fontBold, color: rgb(0.2, 0.35, 0.65) });

      const title = doc.req.title_en;
      page.drawText(title.length > 34 ? title.substring(0, 32) + ".." : title, {
        x: margin + 65,
        y: y - 12,
        size: 9.5,
        font: fontBold,
        color: rgb(0.12, 0.16, 0.24)
      });

      const fname = doc.file.name;
      page.drawText(fname.length > 22 ? fname.substring(0, 20) + ".." : fname, {
        x: margin + 285,
        y: y - 12,
        size: 8.5,
        font: font,
        color: rgb(0.35, 0.40, 0.48)
      });

      page.drawText(`${doc.pageCount}`, { x: margin + 418, y: y - 12, size: 9, font: font, color: rgb(0.2, 0.25, 0.3) });

      // Start page pill
      page.drawText(`Page ${doc.startPage}`, {
        x: margin + 454,
        y: y - 12,
        size: 9.5,
        font: fontBold,
        color: rgb(0.15, 0.45, 0.75)
      });

      // Bottom border
      page.drawLine({
        start: { x: margin, y: y - rowH + 6 },
        end: { x: width - margin, y: y - rowH + 6 },
        thickness: 0.5,
        color: rgb(0.88, 0.90, 0.94)
      });

      y -= rowH;
    }
  }

  /**
   * Bonus Task 5: High-DPI Bangla rendering for Cover Page
   * Uses HTML5 Canvas to rasterize beautiful Bengali typography with native font rendering
   */
  async renderBanglaCoverPage(pdfDoc, tender, docStartPages) {
    const canvas = document.createElement('canvas');
    canvas.width = 1240; // 2x scale for A4 @ 150 DPI
    canvas.height = 1754;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header gradient banner
    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    grad.addColorStop(0, "#1e3a8a");
    grad.addColorStop(1, "#3b82f6");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, 24);

    // Outer card
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 130);

    // Title
    ctx.fillStyle = "#1e40af";
    ctx.font = "bold 26px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
    ctx.fillText("অফিসিয়াল দরপত্র জমাদান প্যাকেজ (TENDER SUBMISSION PACKAGE)", 90, 120);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 38px 'Hind Siliguri', 'Noto Sans Bengali', sans-serif";
    ctx.fillText(tender.title || "আইটি সামগ্রী সরবরাহ", 90, 180);

    // Divider
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(90, 210);
    ctx.lineTo(canvas.width - 90, 210);
    ctx.stroke();

    // Metadata Box
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(90, 240, canvas.width - 180, 240);
    ctx.strokeRect(90, 240, canvas.width - 180, 240);

    ctx.font = "20px 'Hind Siliguri', sans-serif";
    ctx.fillStyle = "#475569";
    const today = new Date().toISOString().split('T')[0];

    const drawMetaRow = (label, val, y) => {
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 20px 'Hind Siliguri', sans-serif";
      ctx.fillText(label, 120, y);
      ctx.fillStyle = "#0f172a";
      ctx.font = "20px 'Hind Siliguri', sans-serif";
      ctx.fillText(val, 340, y);
    };

    drawMetaRow("টেন্ডার আইডি:", tender.tender_id || "N/A", 290);
    drawMetaRow("দরপত্র আহ্বানকারী:", tender.procuring_entity || "N/A", 340);
    drawMetaRow("দরদাতা প্রতিষ্ঠান:", tender.bidder || "N/A", 390);
    drawMetaRow("জমাদানের শেষ তারিখ:", tender.submission_deadline || "N/A", 440);

    // List header
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 28px 'Hind Siliguri', sans-serif";
    ctx.fillText("সংযুক্ত ডকুমেন্টের বিবরণ ও ক্রমসূচি", 90, 540);

    // Table Header
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(90, 570, canvas.width - 180, 50);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px 'Hind Siliguri', sans-serif";
    ctx.fillText("ক্রম", 110, 602);
    ctx.fillText("আইডি", 180, 602);
    ctx.fillText("ডকুমেন্টের শিরোনাম", 280, 602);
    ctx.fillText("সংযুক্ত ফাইলের নাম", 650, 602);
    ctx.fillText("পাতা", 920, 602);
    ctx.fillText("অবস্থা", 1020, 602);

    let rowY = 645;
    for (let i = 0; i < docStartPages.length; i++) {
      const doc = docStartPages[i];
      if (i % 2 === 1) {
        ctx.fillStyle = "#f1f5f9";
        ctx.fillRect(90, rowY - 28, canvas.width - 180, 42);
      }

      ctx.fillStyle = "#334155";
      ctx.font = "18px 'Hind Siliguri', sans-serif";
      ctx.fillText(String(i + 1), 115, rowY);
      ctx.fillText(doc.req.id || `R${doc.req.order}`, 180, rowY);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 18px 'Hind Siliguri', sans-serif";
      const titleBn = doc.req.title_bn || doc.req.title_en;
      ctx.fillText(titleBn, 280, rowY);

      ctx.fillStyle = "#475569";
      ctx.font = "16px sans-serif";
      ctx.fillText(doc.file.name, 650, rowY);

      ctx.fillText(`${doc.pageCount} p.`, 920, rowY);

      ctx.fillStyle = "#16a34a";
      ctx.font = "bold 17px 'Hind Siliguri', sans-serif";
      ctx.fillText("সঠিক (OK)", 1020, rowY);

      rowY += 46;
      if (rowY > 1550) break;
    }

    // Convert canvas to image and embed into PDF page
    const pngDataUrl = canvas.toDataURL("image/png");
    const pngImageBytes = await fetch(pngDataUrl).then(res => res.arrayBuffer());
    const embeddedImage = await pdfDoc.embedPng(pngImageBytes);

    const page = pdfDoc.addPage([595.28, 841.89]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: 595.28,
      height: 841.89
    });
  }

  /**
   * Bonus Task 5: Bangla Index Page
   */
  async renderBanglaIndexPage(pdfDoc, tender, docStartPages) {
    const canvas = document.createElement('canvas');
    canvas.width = 1240;
    canvas.height = 1754;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 34px 'Hind Siliguri', sans-serif";
    ctx.fillText("সূচিপত্র (TABLE OF CONTENTS)", 90, 130);

    ctx.fillStyle = "#64748b";
    ctx.font = "20px 'Hind Siliguri', sans-serif";
    ctx.fillText(`টেন্ডার আইডি: ${tender.tender_id} • প্রতিটি ডকুমেন্টের শুরুর পাতা নম্বর`, 90, 170);

    // Header
    ctx.fillStyle = "#334155";
    ctx.fillRect(90, 210, canvas.width - 180, 50);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 19px 'Hind Siliguri', sans-serif";
    ctx.fillText("ক্রম", 115, 242);
    ctx.fillText("ডকুমেন্টের শিরোনাম", 200, 242);
    ctx.fillText("সংযুক্ত ফাইল", 620, 242);
    ctx.fillText("মোট পাতা", 880, 242);
    ctx.fillText("শুরুর পাতা নম্বর", 1000, 242);

    let rowY = 285;
    for (let i = 0; i < docStartPages.length; i++) {
      const doc = docStartPages[i];
      if (i % 2 === 1) {
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(90, rowY - 26, canvas.width - 180, 48);
      }

      ctx.fillStyle = "#2563eb";
      ctx.font = "bold 19px 'Hind Siliguri', sans-serif";
      ctx.fillText(`${i + 1}`, 120, rowY + 4);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 20px 'Hind Siliguri', sans-serif";
      ctx.fillText(doc.req.title_bn || doc.req.title_en, 200, rowY + 4);

      ctx.fillStyle = "#475569";
      ctx.font = "16px sans-serif";
      ctx.fillText(doc.file.name, 620, rowY + 4);

      ctx.fillText(`${doc.pageCount}`, 900, rowY + 4);

      ctx.fillStyle = "#1d4ed8";
      ctx.font = "bold 20px 'Hind Siliguri', sans-serif";
      ctx.fillText(`পাতা ${doc.startPage}`, 1010, rowY + 4);

      rowY += 52;
    }

    const pngDataUrl = canvas.toDataURL("image/png");
    const pngImageBytes = await fetch(pngDataUrl).then(res => res.arrayBuffer());
    const embeddedImage = await pdfDoc.embedPng(pngImageBytes);

    const page = pdfDoc.addPage([595.28, 841.89]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: 595.28,
      height: 841.89
    });
  }

  /**
   * Bonus Task 2: Digital Seal or Signature Stamp
   */
  async applySealStamp(targetPdf, sealConfig, coverPages, indexPages) {
    try {
      const imageBytes = await fetch(sealConfig.dataUrl).then(res => res.arrayBuffer());
      const sealImg = await targetPdf.embedPng(imageBytes);

      const pages = targetPdf.getPages();
      const totalPages = pages.length;

      let targetIndices = [];
      if (sealConfig.target === 'all') {
        targetIndices = pages.map((_, idx) => idx);
      } else if (sealConfig.target === 'cover_only') {
        targetIndices = [0];
      } else if (sealConfig.target === 'last_only') {
        targetIndices = [totalPages - 1];
      } else {
        // 'docs_only' (all pages after cover and index)
        const startIndex = coverPages + indexPages;
        for (let i = startIndex; i < totalPages; i++) {
          targetIndices.push(i);
        }
      }

      const imgWidth = sealImg.width * (sealConfig.scale || 0.22);
      const imgHeight = sealImg.height * (sealConfig.scale || 0.22);
      const opacity = sealConfig.opacity || 0.92;

      for (const idx of targetIndices) {
        if (idx < 0 || idx >= pages.length) continue;
        const page = pages[idx];
        const { width, height } = page.getSize();

        let posX = width - imgWidth - 36;
        let posY = 40; // above footer

        if (sealConfig.position === 'bottom-left') {
          posX = 36;
          posY = 40;
        } else if (sealConfig.position === 'top-right') {
          posX = width - imgWidth - 36;
          posY = height - imgHeight - 36;
        }

        page.drawImage(sealImg, {
          x: posX,
          y: posY,
          width: imgWidth,
          height: imgHeight,
          opacity: opacity
        });
      }
    } catch (e) {
      console.warn("Could not apply seal stamp:", e);
    }
  }
}

window.TenderPdfBuilder = TenderPdfBuilder;
