/**
 * TenderFlow - Application State Management
 * Handles tender data, file uploads, duplicate tracking, matches, expiry checks, and reactivity
 */

class TenderState {
  constructor() {
    this.lang = localStorage.getItem('tenderflow_lang') || 'en';
    this.theme = localStorage.getItem('tenderflow_theme') || 'dark';
    
    this.tender = {
      tender_id: "",
      title: "",
      procuring_entity: "",
      bidder: "",
      submission_deadline: ""
    };
    
    this.requirements = [];
    this.uploadedFiles = new Map(); // id -> fileObj
    this.matches = {}; // reqId -> fileId
    this.expiryDates = {}; // reqId -> "YYYY-MM-DD"
    
    // Package generation options
    this.options = {
      includeIndexPage: true,
      banglaCoverIndex: false,
      seal: {
        enabled: false,
        name: "",
        dataUrl: null,
        target: "docs_only", // all, cover_only, last_only, docs_only
        position: "bottom-right", // bottom-right, bottom-left, top-right
        scale: 0.22,
        opacity: 0.95
      }
    };
    
    this.generatedBlob = null;
    this.generatedUrl = null;
    this.generatedFileName = null;
    this.generatedPageCount = 0;
    
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event, payload) {
    this.saveToLocalStorage();
    for (const listener of this.listeners) {
      try {
        listener(event, payload);
      } catch (err) {
        console.error("State listener error:", err);
      }
    }
  }

  setLanguage(lang) {
    if (lang === 'en' || lang === 'bn') {
      this.lang = lang;
      localStorage.setItem('tenderflow_lang', lang);
      this.notify('language_change', lang);
    }
  }

  setTheme(theme) {
    this.theme = theme;
    localStorage.setItem('tenderflow_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    this.notify('theme_change', theme);
  }

  loadRequirementsData(data) {
    if (!data || !data.tender || !Array.isArray(data.requirements)) {
      throw new Error("Invalid requirements.json schema");
    }
    this.tender = { ...data.tender };
    // Sort requirements by order
    this.requirements = [...data.requirements].sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Clear matches that no longer exist
    const validReqIds = new Set(this.requirements.map(r => r.id));
    for (const reqId in this.matches) {
      if (!validReqIds.has(reqId)) {
        delete this.matches[reqId];
        delete this.expiryDates[reqId];
      }
    }
    
    this.notify('requirements_loaded', this.tender);
  }

  async addUploadedFile(fileObj) {
    // fileObj: { id, name, size, pageCount, arrayBuffer, sha256 }
    this.uploadedFiles.set(fileObj.id, fileObj);
    this.recomputeDuplicates();
    this.notify('file_added', fileObj);
  }

  removeUploadedFile(fileId) {
    if (this.uploadedFiles.has(fileId)) {
      this.uploadedFiles.delete(fileId);
      // Unmatch any requirements linked to this file
      for (const [reqId, fId] of Object.entries(this.matches)) {
        if (fId === fileId) {
          delete this.matches[reqId];
        }
      }
      this.recomputeDuplicates();
      this.notify('file_removed', fileId);
    }
  }

  recomputeDuplicates() {
    const hashToFirstFile = new Map();
    for (const file of this.uploadedFiles.values()) {
      file.isDuplicate = false;
      file.duplicateOf = null;
    }

    for (const file of this.uploadedFiles.values()) {
      if (!file.sha256) continue;
      if (hashToFirstFile.has(file.sha256)) {
        const original = hashToFirstFile.get(file.sha256);
        file.isDuplicate = true;
        file.duplicateOf = original.name;
      } else {
        hashToFirstFile.set(file.sha256, file);
      }
    }
  }

  matchFileToRequirement(reqId, fileId) {
    // Rule 4.3: One document gets at most one file. One file goes to at most one document.
    // Rule 4.6: If two or more uploaded files have exactly the same content, do not allow them to be matched to different documents.
    if (!fileId) {
      // Unmatching
      delete this.matches[reqId];
      this.notify('match_changed', { reqId, fileId: null });
      return { success: true };
    }

    const targetFile = this.uploadedFiles.get(fileId);
    if (!targetFile) {
      return { success: false, error: "File not found" };
    }

    // Check duplicate rule:
    // If targetFile is a duplicate of another file, or another duplicate is already matched to a DIFFERENT document, reject!
    if (targetFile.isDuplicate || this.hasMatchedDuplicateTwin(targetFile, reqId)) {
      const twin = this.getMatchedTwinFile(targetFile, reqId);
      if (twin) {
        return {
          success: false,
          error: `Duplicate file content! "${targetFile.name}" has identical content to "${twin.name}". Rule 4.6 prohibits matching duplicate files to different documents.`
        };
      }
    }

    // Unlink this file from any other requirement (One file goes to at most one document)
    for (const [rId, fId] of Object.entries(this.matches)) {
      if (fId === fileId && rId !== reqId) {
        delete this.matches[rId];
      }
    }

    // Assign match
    this.matches[reqId] = fileId;
    this.notify('match_changed', { reqId, fileId });
    return { success: true };
  }

  hasMatchedDuplicateTwin(file, currentReqId) {
    if (!file.sha256) return false;
    for (const [rId, fId] of Object.entries(this.matches)) {
      if (rId !== currentReqId) {
        const matchedF = this.uploadedFiles.get(fId);
        if (matchedF && matchedF.id !== file.id && matchedF.sha256 === file.sha256) {
          return true;
        }
      }
    }
    return false;
  }

  getMatchedTwinFile(file, currentReqId) {
    if (!file.sha256) return null;
    for (const [rId, fId] of Object.entries(this.matches)) {
      if (rId !== currentReqId) {
        const matchedF = this.uploadedFiles.get(fId);
        if (matchedF && matchedF.id !== file.id && matchedF.sha256 === file.sha256) {
          return matchedF;
        }
      }
    }
    return null;
  }

  setExpiryDate(reqId, dateStr) {
    if (!dateStr) {
      delete this.expiryDates[reqId];
    } else {
      this.expiryDates[reqId] = dateStr.trim();
    }
    this.notify('expiry_changed', { reqId, dateStr });
  }

  getDocumentStatus(req) {
    // Section 5: Status Rules
    // Each required document shows exactly one status:
    // Missing: Required document (mandatory: true), no file matched. Blocks: Yes
    // Expiry date needed: has_expiry = true and a file is matched, but no expiry date entered. Blocks: Yes
    // Expired: The expiry date is before the submission deadline. Blocks: Yes
    // Not provided: Optional document, no file matched. Blocks: No
    // OK: File matched, and (if has_expiry) the expiry date is on or after the submission deadline. Blocks: No
    
    const matchedFileId = this.matches[req.id];
    const isMatched = Boolean(matchedFileId && this.uploadedFiles.has(matchedFileId));

    if (!isMatched) {
      if (req.mandatory) {
        return {
          status: "Missing",
          blocks: true,
          badgeClass: "badge-missing",
          reason: "Mandatory document has no file attached"
        };
      } else {
        return {
          status: "Not provided",
          blocks: false,
          badgeClass: "badge-not-provided",
          reason: "Optional document not provided"
        };
      }
    }

    // A file IS matched
    if (req.has_expiry) {
      const expiry = this.expiryDates[req.id];
      if (!expiry) {
        return {
          status: "Expiry date needed",
          blocks: true,
          badgeClass: "badge-expiry-needed",
          reason: "Expiry date must be entered and verified"
        };
      }

      // Compare with submission_deadline (YYYY-MM-DD strings compare lexicographically correctly)
      const deadline = this.tender.submission_deadline;
      if (deadline && expiry < deadline) {
        return {
          status: "Expired",
          blocks: true,
          badgeClass: "badge-expired",
          reason: `Expired on ${expiry} (before tender deadline ${deadline})`
        };
      }
    }

    return {
      status: "OK",
      blocks: false,
      badgeClass: "badge-ok",
      reason: "Document verified and valid"
    };
  }

  getBlockingIssues() {
    const issues = [];
    if (!this.requirements.length) {
      issues.push({ id: "NO_REQ", title: "No requirements loaded", reason: "Please load a valid requirements.json file" });
      return issues;
    }

    for (const req of this.requirements) {
      const st = this.getDocumentStatus(req);
      if (st.blocks) {
        issues.push({
          id: req.id,
          order: req.order,
          title: this.lang === 'bn' ? (req.title_bn || req.title_en) : req.title_en,
          status: st.status,
          reason: st.reason
        });
      }
    }
    return issues;
  }

  getReadinessStats() {
    const total = this.requirements.length;
    if (total === 0) return { total: 0, ok: 0, blocking: 0, percent: 0, mandatoryOk: 0, mandatoryTotal: 0 };

    let okCount = 0;
    let blockingCount = 0;
    let mandatoryTotal = 0;
    let mandatoryOk = 0;

    for (const req of this.requirements) {
      if (req.mandatory) mandatoryTotal++;
      const st = this.getDocumentStatus(req);
      if (st.status === 'OK') {
        okCount++;
        if (req.mandatory) mandatoryOk++;
      } else if (st.blocks) {
        blockingCount++;
      }
    }

    const percent = mandatoryTotal > 0 ? Math.round((mandatoryOk / mandatoryTotal) * 100) : 0;
    return {
      total,
      ok: okCount,
      blocking: blockingCount,
      mandatoryTotal,
      mandatoryOk,
      percent
    };
  }

  saveToLocalStorage() {
    try {
      const payload = {
        tender: this.tender,
        requirements: this.requirements,
        matches: this.matches,
        expiryDates: this.expiryDates,
        options: this.options,
        fileMetadata: Array.from(this.uploadedFiles.values()).map(f => ({
          id: f.id,
          name: f.name,
          size: f.size,
          pageCount: f.pageCount,
          sha256: f.sha256
        }))
      };
      localStorage.setItem('tenderflow_session', JSON.stringify(payload));
    } catch (e) {
      console.warn("Could not auto-save to localStorage:", e);
    }
  }

  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('tenderflow_session');
      if (!saved) return false;
      const data = JSON.parse(saved);
      if (data.tender) this.tender = data.tender;
      if (data.requirements) this.requirements = data.requirements;
      if (data.matches) this.matches = data.matches;
      if (data.expiryDates) this.expiryDates = data.expiryDates;
      if (data.options) this.options = { ...this.options, ...data.options };
      return true;
    } catch (e) {
      console.warn("Could not restore localStorage session:", e);
      return false;
    }
  }

  exportProjectJSON() {
    return JSON.stringify({
      version: "1.0",
      timestamp: new Date().toISOString(),
      tender: this.tender,
      requirements: this.requirements,
      matches: this.matches,
      expiryDates: this.expiryDates,
      options: this.options,
      fileMetadata: Array.from(this.uploadedFiles.values()).map(f => ({
        id: f.id,
        name: f.name,
        size: f.size,
        pageCount: f.pageCount,
        sha256: f.sha256
      }))
    }, null, 2);
  }

  importProjectJSON(jsonString) {
    const data = JSON.parse(jsonString);
    if (!data.tender || !Array.isArray(data.requirements)) {
      throw new Error("Invalid project JSON structure");
    }
    this.tender = data.tender;
    this.requirements = data.requirements;
    this.matches = data.matches || {};
    this.expiryDates = data.expiryDates || {};
    if (data.options) this.options = { ...this.options, ...data.options };
    this.notify('project_restored', this.tender);
  }
}

// Global state instance
window.appState = new TenderState();
