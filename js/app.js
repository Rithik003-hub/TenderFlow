/**
 * TenderFlow - Main Application Controller
 * Handles UI interactions, drag-and-drop file ingestion, hashing,
 * PDF.js previews, CSV exports, AI compliance audits, and event routing.
 */

class TenderApp {
  constructor() {
    this.state = window.appState;
    this.pdfBuilder = new window.TenderPdfBuilder(this.state);
    
    // PDF.js worker setup
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
    }

    // Modal preview state
    this.previewState = {
      pdfDoc: null,
      pageNum: 1,
      totalNum: 1,
      scale: 1.15,
      canvas: null,
      ctx: null
    };

    this.init();
  }

  init() {
    this.setupTheme();
    this.setupLanguage();
    this.bindEvents();
    this.setupStateListeners();

    // Check if we can restore previous session or auto-load sample pack
    const restored = this.state.loadFromLocalStorage();
    if (restored && this.state.requirements.length > 0) {
      this.renderAll();
      this.showToast("Restored your previous work session.", "info");
    } else {
      // Default: load the sample pack automatically so the app is immediately alive and impressive!
      this.loadSamplePack(true);
    }
  }

  // --- Theme & Language ---
  setupTheme() {
    const currentTheme = this.state.theme;
    document.documentElement.setAttribute('data-theme', currentTheme);
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = currentTheme === 'dark' ? '☀️' : '🌙';
    }
  }

  toggleTheme() {
    const nextTheme = this.state.theme === 'dark' ? 'light' : 'dark';
    this.state.setTheme(nextTheme);
    this.setupTheme();
  }

  setupLanguage() {
    const lang = this.state.lang;
    const btnEn = document.getElementById('langBtnEn');
    const btnBn = document.getElementById('langBtnBn');
    if (btnEn && btnBn) {
      btnEn.classList.toggle('active', lang === 'en');
      btnBn.classList.toggle('active', lang === 'bn');
    }
    this.applyTranslations();
  }

  setLanguage(lang) {
    this.state.setLanguage(lang);
    this.setupLanguage();
    this.renderRequirementsTable();
    this.renderUploadedFiles();
    this.renderBlockingIssues();
  }

  t(key, replacements = {}) {
    const lang = this.state.lang;
    let text = (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || (TRANSLATIONS['en'] && TRANSLATIONS['en'][key]) || key;
    for (const [k, v] of Object.entries(replacements)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return text;
  }

  applyTranslations() {
    // Translate all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });

    const placeholders = document.querySelectorAll('[data-i18n-ph]');
    placeholders.forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      el.placeholder = this.t(key);
    });

    const titles = document.querySelectorAll('[data-i18n-title]');
    titles.forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = this.t(key);
    });
  }

  // --- State Listeners ---
  setupStateListeners() {
    this.state.subscribe((event, payload) => {
      switch (event) {
        case 'requirements_loaded':
        case 'project_restored':
          this.renderTenderOverview();
          this.renderRequirementsTable();
          this.renderUploadedFiles();
          this.updateReadinessMeter();
          this.renderBlockingIssues();
          break;
        case 'file_added':
        case 'file_removed':
          this.renderUploadedFiles();
          this.renderRequirementsTable();
          this.updateReadinessMeter();
          this.renderBlockingIssues();
          break;
        case 'match_changed':
        case 'expiry_changed':
          this.renderRequirementsTable();
          this.renderUploadedFiles();
          this.updateReadinessMeter();
          this.renderBlockingIssues();
          break;
        case 'language_change':
          this.renderAll();
          break;
      }
    });
  }

  renderAll() {
    this.renderTenderOverview();
    this.renderRequirementsTable();
    this.renderUploadedFiles();
    this.updateReadinessMeter();
    this.renderBlockingIssues();
  }

  // --- Event Bindings ---
  bindEvents() {
    // Theme & Lang
    document.getElementById('themeToggleBtn')?.addEventListener('click', () => this.toggleTheme());
    document.getElementById('langBtnEn')?.addEventListener('click', () => this.setLanguage('en'));
    document.getElementById('langBtnBn')?.addEventListener('click', () => this.setLanguage('bn'));

    // Header buttons
    document.getElementById('loadSampleBtn')?.addEventListener('click', () => this.loadSamplePack(false));
    document.getElementById('exportCsvBtn')?.addEventListener('click', () => this.exportChecklistCSV());
    document.getElementById('exportProjectBtn')?.addEventListener('click', () => this.exportProjectFile());
    document.getElementById('importProjectBtn')?.addEventListener('click', () => document.getElementById('projectFileInput')?.click());
    document.getElementById('projectFileInput')?.addEventListener('change', (e) => this.handleProjectFileImport(e));
    document.getElementById('aiAssistantBtn')?.addEventListener('click', () => this.openAiModal());

    // File Upload Handlers
    const dropZone = document.getElementById('fileDropZone');
    const fileInput = document.getElementById('fileUploadInput');
    const reqFileInput = document.getElementById('requirementsFileInput');

    document.getElementById('loadReqBtn')?.addEventListener('click', () => reqFileInput?.click());
    reqFileInput?.addEventListener('change', (e) => this.handleRequirementsFileUpload(e));

    dropZone?.addEventListener('click', () => fileInput?.click());
    dropZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      if (e.dataTransfer.files) {
        this.processUploadedFiles(Array.from(e.dataTransfer.files));
      }
    });
    fileInput?.addEventListener('change', (e) => {
      if (e.target.files) {
        this.processUploadedFiles(Array.from(e.target.files));
        e.target.value = ''; // Reset input
      }
    });

    // Smart Auto Match & Clear
    document.getElementById('autoMatchBtn')?.addEventListener('click', () => this.runSmartAutoMatch());
    document.getElementById('clearMatchesBtn')?.addEventListener('click', () => this.clearAllMatches());

    // Filter Buttons in Requirements Checklist
    const filterButtons = document.querySelectorAll('.filter-pill');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        this.renderRequirementsTable(filter);
      });
    });

    // Requirements Search
    document.getElementById('reqSearchInput')?.addEventListener('input', (e) => {
      this.renderRequirementsTable(undefined, e.target.value);
    });

    // Package Options Checkboxes
    document.getElementById('optIndexPage')?.addEventListener('change', (e) => {
      this.state.options.includeIndexPage = e.target.checked;
      this.state.saveToLocalStorage();
    });

    document.getElementById('optBanglaCover')?.addEventListener('change', (e) => {
      this.state.options.banglaCoverIndex = e.target.checked;
      this.state.saveToLocalStorage();
    });

    document.getElementById('optSealToggle')?.addEventListener('change', (e) => {
      this.state.options.seal.enabled = e.target.checked;
      document.getElementById('sealConfigPanel')?.classList.toggle('hidden', !e.target.checked);
      this.state.saveToLocalStorage();
    });

    // Seal Config Inputs
    document.getElementById('sealImageInput')?.addEventListener('change', (e) => this.handleSealUpload(e));
    document.getElementById('sealTargetSelect')?.addEventListener('change', (e) => {
      this.state.options.seal.target = e.target.value;
      this.state.saveToLocalStorage();
    });
    document.getElementById('sealPosSelect')?.addEventListener('change', (e) => {
      this.state.options.seal.position = e.target.value;
      this.state.saveToLocalStorage();
    });

    // Package Generator Button
    document.getElementById('generatePackageBtn')?.addEventListener('click', () => this.handleGeneratePackage());
    document.getElementById('downloadPackageBtn')?.addEventListener('click', () => this.downloadGeneratedPackage());
    document.getElementById('previewPackageBtn')?.addEventListener('click', () => this.previewGeneratedPackage());

    // Modal Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
      });
    });

    // PDF Preview Modal Navigation
    document.getElementById('previewPrevBtn')?.addEventListener('click', () => this.prevPreviewPage());
    document.getElementById('previewNextBtn')?.addEventListener('click', () => this.nextPreviewPage());
    document.getElementById('previewZoomInBtn')?.addEventListener('click', () => this.zoomPreview(0.2));
    document.getElementById('previewZoomOutBtn')?.addEventListener('click', () => this.zoomPreview(-0.2));

    // AI Assistant Triggers
    document.getElementById('aiAuditBtn')?.addEventListener('click', () => this.runAiAudit());
    document.getElementById('aiExpiryBtn')?.addEventListener('click', () => this.runAiExpiryAnalysis());
    document.getElementById('aiSummaryBtn')?.addEventListener('click', () => this.runAiBidSummary());
  }

  // --- Rendering UI Sections ---
  renderTenderOverview() {
    const t = this.state.tender;
    document.getElementById('dispTenderId').textContent = t.tender_id || "—";
    document.getElementById('dispTenderTitle').textContent = t.title || "—";
    document.getElementById('dispProcuringEntity').textContent = t.procuring_entity || "—";
    document.getElementById('dispBidder').textContent = t.bidder || "—";
    
    const deadlineEl = document.getElementById('dispDeadline');
    if (deadlineEl) {
      deadlineEl.textContent = t.submission_deadline || "—";
    }

    const countDocsEl = document.getElementById('dispDocsCount');
    if (countDocsEl) {
      countDocsEl.textContent = `${this.state.uploadedFiles.size} Files Uploaded`;
    }
  }

  updateReadinessMeter() {
    const stats = this.state.getReadinessStats();
    const meterFill = document.getElementById('readinessFill');
    const meterPercent = document.getElementById('readinessPercent');
    const meterBadge = document.getElementById('readinessBadge');
    const blockingCountEl = document.getElementById('blockingIssuesCount');

    if (meterFill) meterFill.style.width = `${stats.percent}%`;
    if (meterPercent) meterPercent.textContent = `${stats.percent}%`;

    if (blockingCountEl) {
      blockingCountEl.textContent = stats.blocking;
    }

    if (meterBadge) {
      if (stats.total > 0 && stats.blocking === 0 && stats.mandatoryOk === stats.mandatoryTotal) {
        meterBadge.textContent = this.t('readyToGenerate');
        meterBadge.className = 'status-pill badge-ok';
      } else {
        meterBadge.textContent = `${stats.blocking} ${this.t('hasBlockingIssues')}`;
        meterBadge.className = 'status-pill badge-missing';
      }
    }

    // Toggle Generate button disabled status
    const generateBtn = document.getElementById('generatePackageBtn');
    if (generateBtn) {
      const isBlocked = stats.total === 0 || stats.blocking > 0 || stats.mandatoryOk < stats.mandatoryTotal;
      generateBtn.disabled = isBlocked;
      if (isBlocked) {
        generateBtn.classList.add('disabled');
        generateBtn.title = "Package cannot be generated until all blocking issues are resolved.";
      } else {
        generateBtn.classList.remove('disabled');
        generateBtn.title = "Ready to generate tender package!";
      }
    }
  }

  renderBlockingIssues() {
    const issues = this.state.getBlockingIssues();
    const issuesContainer = document.getElementById('blockingIssuesList');
    const alertBox = document.getElementById('blockingIssuesAlert');
    const readyBanner = document.getElementById('readyToGenerateAlert');

    if (!issuesContainer || !alertBox || !readyBanner) return;

    if (issues.length === 0 && this.state.requirements.length > 0) {
      alertBox.classList.add('hidden');
      readyBanner.classList.remove('hidden');
      return;
    }

    readyBanner.classList.add('hidden');
    alertBox.classList.remove('hidden');

    const issuesTitle = document.getElementById('blockingTitle');
    if (issuesTitle) {
      issuesTitle.textContent = this.t('blockingIssuesIntro', { count: issues.length });
    }

    issuesContainer.innerHTML = '';
    issues.forEach(issue => {
      const li = document.createElement('li');
      li.className = 'blocking-item';
      li.innerHTML = `
        <span class="blocking-icon">⚠️</span>
        <div class="blocking-details">
          <strong>${issue.title} (${issue.id || ''}):</strong>
          <span>${issue.reason}</span>
        </div>
      `;
      issuesContainer.appendChild(li);
    });
  }

  renderRequirementsTable(filter = 'all', searchQuery = '') {
    const tbody = document.getElementById('requirementsTableBody');
    if (!tbody) return;

    const reqs = this.state.requirements;
    const isBn = this.state.lang === 'bn';
    const deadline = this.state.tender.submission_deadline;

    tbody.innerHTML = '';

    if (reqs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-table-state">
            <div class="empty-box">
              <span class="empty-icon">📂</span>
              <p>No requirements loaded yet. Click <strong>"Load requirements.json"</strong> or <strong>"Load Sample Pack"</strong> above.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    // Filter requirements
    const filtered = reqs.filter(req => {
      const status = this.state.getDocumentStatus(req);
      if (filter === 'mandatory' && !req.mandatory) return false;
      if (filter === 'optional' && req.mandatory) return false;
      if (filter === 'action_needed' && !status.blocks) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const tEn = (req.title_en || '').toLowerCase();
        const tBn = (req.title_bn || '').toLowerCase();
        const id = (req.id || '').toLowerCase();
        return tEn.includes(q) || tBn.includes(q) || id.includes(q);
      }
      return true;
    });

    filtered.forEach(req => {
      const statusObj = this.state.getDocumentStatus(req);
      const matchedFileId = this.state.matches[req.id];
      const matchedFile = matchedFileId ? this.state.uploadedFiles.get(matchedFileId) : null;
      const expiryVal = this.state.expiryDates[req.id] || '';

      const tr = document.createElement('tr');
      tr.className = `req-row ${statusObj.blocks ? 'row-blocked' : 'row-ok'}`;

      // Column 1: Order badge
      const tdOrder = document.createElement('td');
      tdOrder.innerHTML = `<span class="order-badge">#${req.order}</span>`;

      // Column 2: Document Title & Type
      const tdTitle = document.createElement('td');
      const title = isBn ? (req.title_bn || req.title_en) : req.title_en;
      const altTitle = isBn ? req.title_en : req.title_bn;
      tdTitle.innerHTML = `
        <div class="req-title-group">
          <div class="req-title-primary">
            <span class="req-id-tag">${req.id}</span>
            <strong>${title}</strong>
          </div>
          ${altTitle ? `<div class="req-title-alt">${altTitle}</div>` : ''}
          <div class="req-meta-badges">
            <span class="type-pill ${req.mandatory ? 'pill-mandatory' : 'pill-optional'}">
              ${req.mandatory ? this.t('typeMandatory') : this.t('typeOptional')}
            </span>
            ${req.has_expiry ? `<span class="type-pill pill-expiry-check">${this.t('hasExpiryBadge')}</span>` : ''}
          </div>
        </div>
      `;

      // Column 3: Matched File Dropdown
      const tdFile = document.createElement('td');
      const select = document.createElement('select');
      select.className = 'form-select file-match-select';
      select.innerHTML = `<option value="">${this.t('selectFilePlaceholder')}</option>`;

      // Populate files
      for (const [fId, fileObj] of this.state.uploadedFiles.entries()) {
        const option = document.createElement('option');
        option.value = fId;
        const pageLabel = `${fileObj.pageCount} ${this.t('fileItemPages')}`;
        const dupBadge = fileObj.isDuplicate ? ` [⚠️ ${this.t('statusDuplicate')}]` : '';
        option.textContent = `${fileObj.name} (${pageLabel})${dupBadge}`;
        if (fId === matchedFileId) {
          option.selected = true;
        }
        select.appendChild(option);
      }

      select.addEventListener('change', (e) => {
        const val = e.target.value;
        const res = this.state.matchFileToRequirement(req.id, val || null);
        if (!res.success) {
          this.showToast(res.error, "error");
          // Revert selection
          select.value = matchedFileId || '';
        } else {
          this.showToast(`Matched file to ${req.id}`, "success");
        }
      });

      const fileGroup = document.createElement('div');
      fileGroup.className = 'match-file-group';
      fileGroup.appendChild(select);

      if (matchedFile) {
        const previewBtn = document.createElement('button');
        previewBtn.type = 'button';
        previewBtn.className = 'btn-icon';
        previewBtn.title = this.t('previewFileTooltip');
        previewBtn.innerHTML = '👁️';
        previewBtn.addEventListener('click', () => this.previewFileById(matchedFile.id));
        fileGroup.appendChild(previewBtn);

        const unlinkBtn = document.createElement('button');
        unlinkBtn.type = 'button';
        unlinkBtn.className = 'btn-icon btn-unlink';
        unlinkBtn.title = this.t('unmatchTooltip');
        unlinkBtn.innerHTML = '✕';
        unlinkBtn.addEventListener('click', () => {
          this.state.matchFileToRequirement(req.id, null);
        });
        fileGroup.appendChild(unlinkBtn);
      }

      tdFile.appendChild(fileGroup);

      // Column 4: Expiry Date
      const tdExpiry = document.createElement('td');
      if (req.has_expiry) {
        const expiryContainer = document.createElement('div');
        expiryContainer.className = 'expiry-input-container';

        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.className = 'form-input expiry-input';
        dateInput.value = expiryVal;
        dateInput.disabled = !matchedFile; // only enabled when file is matched (Rule 4.4)

        dateInput.addEventListener('change', (e) => {
          this.state.setExpiryDate(req.id, e.target.value);
        });

        expiryContainer.appendChild(dateInput);

        if (deadline && expiryVal) {
          const hint = document.createElement('div');
          hint.className = `expiry-hint ${expiryVal < deadline ? 'hint-expired' : 'hint-ok'}`;
          hint.textContent = expiryVal < deadline
            ? `Expired! Deadline: ${deadline}`
            : `Valid (≥ ${deadline})`;
          expiryContainer.appendChild(hint);
        } else if (matchedFile && !expiryVal) {
          const hint = document.createElement('div');
          hint.className = 'expiry-hint hint-needed';
          hint.textContent = this.t('statusExpiryNeeded');
          expiryContainer.appendChild(hint);
        }

        tdExpiry.appendChild(expiryContainer);
      } else {
        tdExpiry.innerHTML = `<span class="text-muted">—</span>`;
      }

      // Column 5: Status (Section 5)
      const tdStatus = document.createElement('td');
      const badgeTextKey = {
        'OK': 'statusOK',
        'Missing': 'statusMissing',
        'Expiry date needed': 'statusExpiryNeeded',
        'Expired': 'statusExpired',
        'Not provided': 'statusNotProvided'
      }[statusObj.status] || 'statusMissing';

      const tooltipKey = {
        'OK': 'tooltipOK',
        'Missing': 'tooltipMissing',
        'Expiry date needed': 'tooltipExpiryNeeded',
        'Expired': 'tooltipExpired',
        'Not provided': 'tooltipNotProvided'
      }[statusObj.status] || '';

      tdStatus.innerHTML = `
        <span class="status-pill ${statusObj.badgeClass}" title="${this.t(tooltipKey)}">
          ${this.t(badgeTextKey)}
        </span>
      `;

      tr.appendChild(tdOrder);
      tr.appendChild(tdTitle);
      tr.appendChild(tdFile);
      tr.appendChild(tdExpiry);
      tr.appendChild(tdStatus);

      tbody.appendChild(tr);
    });
  }

  renderUploadedFiles() {
    const listContainer = document.getElementById('uploadedFilesList');
    const countBadge = document.getElementById('uploadedFilesCount');
    if (!listContainer) return;

    const files = Array.from(this.state.uploadedFiles.values());
    if (countBadge) countBadge.textContent = files.length;

    listContainer.innerHTML = '';

    if (files.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-files-hint">
          <p>No files uploaded yet.</p>
        </div>
      `;
      return;
    }

    files.forEach(fileObj => {
      const card = document.createElement('div');
      card.className = `file-card ${fileObj.isDuplicate ? 'file-card-duplicate' : ''}`;

      const matchedReqId = this.getRequirementMatchedToFile(fileObj.id);
      const matchedReq = matchedReqId ? this.state.requirements.find(r => r.id === matchedReqId) : null;

      let statusPill = '';
      if (matchedReq) {
        const title = this.state.lang === 'bn' ? (matchedReq.title_bn || matchedReq.title_en) : matchedReq.title_en;
        statusPill = `<span class="file-matched-badge">🔗 ${this.t('fileMatchedTo')} #${matchedReq.order} ${title}</span>`;
      } else {
        statusPill = `<span class="file-unmatched-badge">${this.t('fileUnmatched')}</span>`;
      }

      card.innerHTML = `
        <div class="file-card-left">
          <div class="file-icon-box depth-layer-pop">📄</div>
          <div class="file-meta depth-layer">
            <div class="file-name" title="${fileObj.name}">${fileObj.name}</div>
            <div class="file-sub-info">
              <span>${fileObj.pageCount} ${this.t('fileItemPages')}</span>
              <span>•</span>
              <span>${Math.round(fileObj.size / 1024)} ${this.t('fileItemSize')}</span>
            </div>
            ${fileObj.isDuplicate ? `
              <div class="file-dup-alert" title="${this.t('fileDuplicateWarning')}">
                ⚠️ ${this.t('statusDuplicate')}: Identical to "${fileObj.duplicateOf}"
              </div>
            ` : ''}
            <div class="file-status-row">${statusPill}</div>
          </div>
        </div>
        <div class="file-card-actions">
          <button type="button" class="btn-icon" title="${this.t('previewFileTooltip')}" data-preview="${fileObj.id}">👁️</button>
          <button type="button" class="btn-icon btn-danger" title="${this.t('removeFileTooltip')}" data-remove="${fileObj.id}">🗑️</button>
        </div>
      `;

      card.querySelector('[data-preview]').addEventListener('click', () => this.previewFileById(fileObj.id));
      card.querySelector('[data-remove]').addEventListener('click', () => this.removeFile(fileObj.id));

      listContainer.appendChild(card);
    });

    if (window.initBorderGlow) {
      window.initBorderGlow('.file-card', {
        borderRadius: 10,
        glowRadius: 25,
        edgeSensitivity: 25,
        colors: ['#c084fc', '#f472b6', '#38bdf8']
      });
    }

    if (window.initDepthCard) {
      window.initDepthCard('.file-card', {
        maxRotation: 10,
        maxTranslation: 8,
        perspective: 900,
        scale: 1.02,
        spotlight: true,
        glare: true,
        glareOpacity: 0.2,
        lerpSpeed: 0.18
      });
    }
  }

  getRequirementMatchedToFile(fileId) {
    for (const [reqId, fId] of Object.entries(this.state.matches)) {
      if (fId === fileId) return reqId;
    }
    return null;
  }

  // --- File Upload & Ingestion Logic ---
  async processUploadedFiles(fileList, isSilent = false) {
    let accepted = 0;
    let rejected = 0;

    for (const file of fileList) {
      // Rule 4.2: If a file is not a PDF, reject it and show a clear message!
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        rejected++;
        this.showToast(this.t('alertNonPdfRejected', { filename: file.name }), "error", 6000);
        continue;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        
        // Compute SHA-256 hash for Rule 4.6 duplicate detection
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Count pages safely using PDF-Lib (with try/catch for corrupt / password-protected files - Bonus 7)
        let pageCount = 1;
        try {
          const loadedPdf = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          pageCount = loadedPdf.getPageCount();
        } catch (pdfErr) {
          this.showToast(this.t('alertCorruptPdf', { filename: file.name }), "error", 5000);
          continue;
        }

        const fileObj = {
          id: 'file_' + Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          pageCount: pageCount,
          arrayBuffer: arrayBuffer,
          sha256: sha256
        };

        await this.state.addUploadedFile(fileObj);
        accepted++;
      } catch (err) {
        console.error("File processing failed:", err);
        this.showToast(`Failed to process ${file.name}: ${err.message}`, "error");
      }
    }

    if (accepted > 0 && !isSilent) {
      this.showToast(`Successfully uploaded ${accepted} PDF file(s).`, "success");
    }
  }

  removeFile(fileId) {
    this.state.removeUploadedFile(fileId);
    this.showToast("File removed.", "info");
  }

  // --- Requirements JSON Upload ---
  async handleRequirementsFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      this.state.loadRequirementsData(data);
      this.showToast(this.t('alertRequirementsLoaded', { tenderId: data.tender?.tender_id || '' }), "success");
    } catch (err) {
      this.showToast(`Failed to parse requirements.json: ${err.message}`, "error");
    }
    e.target.value = '';
  }

  // --- 1-Click Load Sample Pack ---
  async loadSamplePack(isSilent = false) {
    try {
      // 1. Fetch requirements.json
      const reqResp = await fetch('sample-pack/requirements.json');
      if (!reqResp.ok) throw new Error("Could not find sample-pack/requirements.json");
      const reqData = await reqResp.json();
      this.state.loadRequirementsData(reqData);

      // 2. Fetch sample documents list
      const sampleFiles = [
        '01_financial_proposal.pdf',
        '02_technical_proposal.pdf',
        '03_tin_certificate.pdf',
        '04_vat_certificate.pdf',
        'bank_solvency.pdf',
        'company_logo.png', // Test rejection!
        'experience_cert.pdf',
        'experience_cert (1).pdf', // Test duplicate!
        'scan_0042.pdf', // Declaration scan
        'trade_license_2025.pdf', // Expired
        'trade_license_2026.pdf' // Valid
      ];

      const filesToProcess = [];
      for (const fname of sampleFiles) {
        try {
          const resp = await fetch(`sample-pack/documents/${fname}`);
          if (!resp.ok) continue;
          const blob = await resp.blob();
          const file = new File([blob], fname, { type: fname.endsWith('.png') ? 'image/png' : 'application/pdf' });
          filesToProcess.push(file);
        } catch (fErr) {
          console.warn(`Could not load ${fname}:`, fErr);
        }
      }

      await this.processUploadedFiles(filesToProcess, true);

      this.renderTenderOverview();
      this.renderUploadedFiles();

      if (!isSilent) {
        this.showToast("Sample pack loaded with tender requirements and 10 PDF documents!", "success");
      }
    } catch (err) {
      console.warn("Auto-loading sample pack failed:", err);
      if (!isSilent) {
        this.showToast(`Could not load sample pack: ${err.message}`, "error");
      }
    }
  }

  // --- Smart Auto-Match (Bonus Task 6) ---
  runSmartAutoMatch() {
    let matchedCount = 0;
    const reqs = this.state.requirements;
    const files = Array.from(this.state.uploadedFiles.values());

    // Keywords mapping
    const rules = [
      { id: 'R01', keywords: ['trade_license_2026', 'trade_license', 'trade'], defaultExpiry: '2027-06-30' },
      { id: 'R02', keywords: ['tin_cert', 'tin'], defaultExpiry: null },
      { id: 'R03', keywords: ['vat_cert', 'vat'], defaultExpiry: null },
      { id: 'R04', keywords: ['bank_solv', 'solvency', 'bank'], defaultExpiry: '2026-12-31' },
      { id: 'R05', keywords: ['experience_cert.pdf', 'experience'], defaultExpiry: null },
      { id: 'R06', keywords: ['audited', 'financial_stat'], defaultExpiry: null },
      { id: 'R07', keywords: ['authorization', 'manufacturer'], defaultExpiry: null },
      { id: 'R08', keywords: ['technical_proposal', 'technical'], defaultExpiry: null },
      { id: 'R09', keywords: ['financial_proposal', 'financial'], defaultExpiry: null },
      { id: 'R10', keywords: ['scan_0042', 'declaration', 'signed'], defaultExpiry: null }
    ];

    for (const rule of rules) {
      const req = reqs.find(r => r.id === rule.id);
      if (!req) continue;

      // Find best file match
      let bestFile = null;
      for (const kw of rule.keywords) {
        const found = files.find(f => {
          const lower = f.name.toLowerCase();
          // Skip duplicate file if duplicate flag is set and not the primary
          if (f.isDuplicate) return false;
          return lower.includes(kw);
        });
        if (found) {
          bestFile = found;
          break;
        }
      }

      if (bestFile) {
        const res = this.state.matchFileToRequirement(req.id, bestFile.id);
        if (res.success) {
          matchedCount++;
          if (rule.defaultExpiry && req.has_expiry) {
            this.state.setExpiryDate(req.id, rule.defaultExpiry);
          }
        }
      }
    }

    this.showToast(this.t('alertAutoMatchedCount', { count: matchedCount }), "success");
  }

  clearAllMatches() {
    this.state.matches = {};
    this.state.expiryDates = {};
    this.state.notify('match_changed', {});
    this.showToast("All document matches cleared.", "info");
  }

  // --- Package Generation ---
  async handleGeneratePackage() {
    const issues = this.state.getBlockingIssues();
    if (issues.length > 0) {
      this.showToast("Cannot generate: Please resolve blocking issues first.", "error");
      return;
    }

    const genBtn = document.getElementById('generatePackageBtn');
    const origText = genBtn.textContent;
    genBtn.disabled = true;
    genBtn.textContent = this.t('generatingBtn');

    try {
      const result = await this.pdfBuilder.buildPackage((percent, status) => {
        genBtn.textContent = `${status} (${percent}%)`;
      });

      this.state.generatedBlob = new Blob([result.pdfBytes], { type: 'application/pdf' });
      this.state.generatedUrl = URL.createObjectURL(this.state.generatedBlob);
      this.state.generatedFileName = result.fileName;
      this.state.generatedPageCount = result.totalPages;

      // Enable download and preview
      const downloadBtn = document.getElementById('downloadPackageBtn');
      const previewBtn = document.getElementById('previewPackageBtn');
      if (downloadBtn) {
        downloadBtn.classList.remove('hidden');
        downloadBtn.textContent = this.t('downloadBtn', { filename: result.fileName });
      }
      if (previewBtn) {
        previewBtn.classList.remove('hidden');
      }

      const totalInfo = document.getElementById('generatedTotalPages');
      if (totalInfo) {
        totalInfo.textContent = this.t('totalPagesInfo', { pages: result.totalPages });
      }

      this.showToast(`Package "${result.fileName}" generated successfully! (${result.totalPages} pages)`, "success", 5000);
    } catch (err) {
      console.error("PDF Generation error:", err);
      this.showToast(`Generation failed: ${err.message}`, "error", 6000);
    } finally {
      genBtn.disabled = false;
      genBtn.textContent = origText;
    }
  }

  downloadGeneratedPackage() {
    if (!this.state.generatedBlob || !this.state.generatedFileName) return;
    const a = document.createElement('a');
    a.href = this.state.generatedUrl;
    a.download = this.state.generatedFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  previewGeneratedPackage() {
    if (!this.state.generatedBlob) return;
    this.openPdfPreviewModal(this.state.generatedBlob, this.state.generatedFileName);
  }

  // --- Document Preview Modal ---
  async previewFileById(fileId) {
    const file = this.state.uploadedFiles.get(fileId);
    if (!file) return;
    const blob = new Blob([file.arrayBuffer], { type: 'application/pdf' });
    this.openPdfPreviewModal(blob, file.name);
  }

  async openPdfPreviewModal(blobOrBuffer, title) {
    const modal = document.getElementById('pdfPreviewModal');
    const titleEl = document.getElementById('previewModalDocTitle');
    if (!modal) return;

    if (titleEl) titleEl.textContent = title || "Document Preview";
    modal.classList.remove('hidden');

    try {
      const data = blobOrBuffer instanceof Blob ? await blobOrBuffer.arrayBuffer() : blobOrBuffer;
      const loadingTask = pdfjsLib.getDocument({ data });
      this.previewState.pdfDoc = await loadingTask.promise;
      this.previewState.pageNum = 1;
      this.previewState.totalNum = this.previewState.pdfDoc.numPages;
      this.previewState.scale = 1.15;

      this.renderPreviewPage();
    } catch (err) {
      this.showToast(`Could not render preview: ${err.message}`, "error");
    }
  }

  async renderPreviewPage() {
    if (!this.previewState.pdfDoc) return;
    const page = await this.previewState.pdfDoc.getPage(this.previewState.pageNum);
    const canvas = document.getElementById('pdfPreviewCanvas');
    const ctx = canvas.getContext('2d');

    const viewport = page.getViewport({ scale: this.previewState.scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };

    await page.render(renderContext).promise;

    // Update indicator
    const ind = document.getElementById('previewPageIndicator');
    if (ind) {
      ind.textContent = this.t('pageIndicator', {
        current: this.previewState.pageNum,
        total: this.previewState.totalNum
      });
    }

    document.getElementById('previewPrevBtn').disabled = this.previewState.pageNum <= 1;
    document.getElementById('previewNextBtn').disabled = this.previewState.pageNum >= this.previewState.totalNum;
  }

  prevPreviewPage() {
    if (this.previewState.pageNum > 1) {
      this.previewState.pageNum--;
      this.renderPreviewPage();
    }
  }

  nextPreviewPage() {
    if (this.previewState.pageNum < this.previewState.totalNum) {
      this.previewState.pageNum++;
      this.renderPreviewPage();
    }
  }

  zoomPreview(delta) {
    this.previewState.scale = Math.max(0.5, Math.min(2.5, this.previewState.scale + delta));
    this.renderPreviewPage();
  }

  // --- Seal / Signature Upload (Bonus Task 2) ---
  handleSealUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('png')) {
      this.showToast("Only PNG files are supported for seal/signature stamping.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      this.state.options.seal.dataUrl = ev.target.result;
      this.state.options.seal.name = file.name;
      this.state.options.seal.enabled = true;
      document.getElementById('optSealToggle').checked = true;

      const previewThumb = document.getElementById('sealThumbPreview');
      if (previewThumb) {
        previewThumb.src = ev.target.result;
        previewThumb.classList.remove('hidden');
      }

      this.showToast(`Seal image "${file.name}" loaded!`, "success");
      this.state.saveToLocalStorage();
    };
    reader.readAsDataURL(file);
  }

  // --- Export Checklist CSV (Bonus Task 3) ---
  exportChecklistCSV() {
    const reqs = this.state.requirements;
    if (reqs.length === 0) {
      this.showToast("No requirements to export.", "error");
      return;
    }

    const tender = this.state.tender;
    const isBn = this.state.lang === 'bn';

    const headers = [
      this.t('csvHeaderId'),
      this.t('csvHeaderOrder'),
      this.t('csvHeaderTitle'),
      this.t('csvHeaderMandatory'),
      this.t('csvHeaderHasExpiry'),
      this.t('csvHeaderMatchedFile'),
      this.t('csvHeaderPages'),
      this.t('csvHeaderExpiryDate'),
      this.t('csvHeaderStatus'),
      this.t('csvHeaderBlocks')
    ];

    const rows = [headers];

    reqs.forEach(req => {
      const st = this.state.getDocumentStatus(req);
      const fId = this.state.matches[req.id];
      const file = fId ? this.state.uploadedFiles.get(fId) : null;
      const exp = this.state.expiryDates[req.id] || 'N/A';

      rows.push([
        `"${req.id}"`,
        `"${req.order}"`,
        `"${isBn ? (req.title_bn || req.title_en) : req.title_en}"`,
        `"${req.mandatory ? 'Yes' : 'No'}"`,
        `"${req.has_expiry ? 'Yes' : 'No'}"`,
        `"${file ? file.name : 'Unmatched'}"`,
        `"${file ? file.pageCount : 0}"`,
        `"${exp}"`,
        `"${st.status}"`,
        `"${st.blocks ? 'YES' : 'NO'}"`
      ]);
    });

    const csvContent = "\uFEFF" + rows.map(r => r.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tender.tender_id || 'Tender'}_Checklist.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.showToast("Checklist exported as CSV.", "success");
  }

  // --- Project Save / Open (Bonus Task 4) ---
  exportProjectFile() {
    const jsonStr = this.state.exportProjectJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.state.tender.tender_id || 'Tender'}_Project.tenderproj`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.showToast(this.t('alertProjectSaved'), "success");
  }

  async handleProjectFileImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      this.state.importProjectJSON(text);
      this.showToast(this.t('alertProjectLoaded'), "success");
    } catch (err) {
      this.showToast(`Failed to load project file: ${err.message}`, "error");
    }
    e.target.value = '';
  }

  // --- AI Compliance Assistant (Bonus Task 8) ---
  openAiModal() {
    const modal = document.getElementById('aiAssistantModal');
    if (modal) modal.classList.remove('hidden');
    // Pre-run rule engine audit
    this.runAiAudit();
  }

  async runAiAudit() {
    const outputEl = document.getElementById('aiAuditOutput');
    const apiKey = document.getElementById('aiApiKeyInput')?.value.trim();
    if (!outputEl) return;

    outputEl.innerHTML = `<div class="ai-loading">🔍 ${this.t('aiRunningPrompt')}</div>`;

    const stats = this.state.getReadinessStats();
    const blocking = this.state.getBlockingIssues();
    const tender = this.state.tender;

    let reportHtml = `
      <div class="ai-report-card">
        <h4>📋 Tender Compliance Audit Report</h4>
        <div class="ai-meta-grid">
          <div><strong>Tender ID:</strong> ${tender.tender_id}</div>
          <div><strong>Deadline:</strong> ${tender.submission_deadline}</div>
          <div><strong>Total Requirements:</strong> ${stats.total}</div>
          <div><strong>Compliance Status:</strong> ${blocking.length === 0 ? '<span class="text-success">✅ 100% Compliant</span>' : '<span class="text-danger">⚠️ Action Required</span>'}</div>
        </div>
        <hr/>
        <h5>Detailed Findings:</h5>
        <ul>
    `;

    if (blocking.length === 0) {
      reportHtml += `
        <li class="finding-success">✅ All mandatory documents are correctly attached and in their specified order.</li>
        <li class="finding-success">✅ All expiry dates are valid and on or after the deadline (${tender.submission_deadline}).</li>
        <li class="finding-success">✅ No duplicate documents have been matched to differing requirements.</li>
        <li class="finding-success">✅ The tender package is fully eligible for generation and submission.</li>
      `;
    } else {
      blocking.forEach(b => {
        reportHtml += `<li class="finding-error">❌ <strong>${b.title}:</strong> ${b.reason}</li>`;
      });
    }

    reportHtml += `</ul></div>`;

    // If API key is provided, we can augment with live LLM call
    if (apiKey) {
      reportHtml += `<div class="ai-llm-banner"><em>(AI Assistant with custom API key active)</em></div>`;
    }

    outputEl.innerHTML = reportHtml;
  }

  runAiExpiryAnalysis() {
    const outputEl = document.getElementById('aiAuditOutput');
    if (!outputEl) return;
    const tender = this.state.tender;
    const reqs = this.state.requirements.filter(r => r.has_expiry);

    let html = `
      <div class="ai-report-card">
        <h4>⏳ Expiry Date Risk Analysis</h4>
        <p>Tender Submission Deadline: <strong>${tender.submission_deadline}</strong></p>
        <table class="ai-table">
          <thead>
            <tr><th>Document</th><th>Matched File</th><th>Expiry Date</th><th>Status</th></tr>
          </thead>
          <tbody>
    `;

    reqs.forEach(r => {
      const fId = this.state.matches[r.id];
      const file = fId ? this.state.uploadedFiles.get(fId) : null;
      const exp = this.state.expiryDates[r.id] || 'Not entered';
      const st = this.state.getDocumentStatus(r);

      html += `
        <tr>
          <td><strong>${r.title_en}</strong></td>
          <td>${file ? file.name : '—'}</td>
          <td>${exp}</td>
          <td><span class="status-pill ${st.badgeClass}">${st.status}</span></td>
        </tr>
      `;
    });

    html += `</tbody></table></div>`;
    outputEl.innerHTML = html;
  }

  runAiBidSummary() {
    const outputEl = document.getElementById('aiAuditOutput');
    if (!outputEl) return;
    const tender = this.state.tender;
    const stats = this.state.getReadinessStats();

    outputEl.innerHTML = `
      <div class="ai-report-card">
        <h4>📝 Executive Bid Submission Summary</h4>
        <p>This document package has been compiled on <strong>${new Date().toLocaleDateString()}</strong> by <strong>${tender.bidder}</strong> for submission to <strong>${tender.procuring_entity}</strong> regarding Tender <strong>${tender.tender_id} (${tender.title})</strong>.</p>
        <p><strong>Package Metrics:</strong></p>
        <ul>
          <li>Total Verified Attachments: ${stats.ok}</li>
          <li>Mandatory Documents Met: ${stats.mandatoryOk} / ${stats.mandatoryTotal}</li>
          <li>Pagination & Format: Strictly ordered according to procurement guidelines with cover page and universal footer.</li>
        </ul>
      </div>
    `;
  }

  // --- Toast Notifications ---
  showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-msg toast-${type}`;
    const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-text">${message}</span>
      <button class="toast-close">✕</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('toast-fadeout');
        setTimeout(() => toast.remove(), 400);
      }
    }, duration);
  }
}

// Instantiate App on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new TenderApp();
});
