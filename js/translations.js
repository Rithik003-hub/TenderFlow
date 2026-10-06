/**
 * TenderFlow - Bilingual Translations (English & Bangla)
 * AI DevFest Tender Document Package Builder
 */

const TRANSLATIONS = {
  en: {
    appTitle: "TenderFlow",
    appSubtitle: "Tender Document Package Builder",
    tagline: "Turn multiple tender documents into a compliant, verified, and ordered PDF submission package.",
    devFestBadge: "AI DevFest 2026",
    
    // Header navigation & tools
    loadSampleBtn: "Load Sample Pack",
    loadSampleHint: "Instantly load sample requirements and documents for quick testing",
    importProjectBtn: "Open Project",
    exportProjectBtn: "Save Project",
    exportCsvBtn: "Export Checklist (CSV)",
    aiAssistantBtn: "AI Assistant",
    toggleTheme: "Toggle Theme",
    
    // Tender Overview
    tenderOverviewTitle: "Tender Information",
    tenderId: "Tender ID",
    procuringEntity: "Procuring Entity",
    bidder: "Bidder Name",
    submissionDeadline: "Submission Deadline",
    packageReadiness: "Package Readiness",
    readyToGenerate: "Ready to Generate",
    hasBlockingIssues: "Action Required",
    mandatoryDocsCount: "Mandatory Documents",
    optionalDocsCount: "Optional Documents",
    totalUploadedCount: "Uploaded Files",
    readinessScore: "Compliance Score",
    
    // Requirements List
    requirementsTitle: "Requirements & Document Checklist",
    filterAll: "All",
    filterMandatory: "Mandatory",
    filterOptional: "Optional",
    filterActionNeeded: "Action Needed",
    searchReqPlaceholder: "Search requirement by title or ID...",
    colOrder: "Order",
    colTitle: "Document Title",
    colRequirementType: "Type",
    colMatchedFile: "Matched File",
    colExpiryDate: "Expiry Date",
    colStatus: "Status",
    colAction: "Actions",
    
    // Document Types
    typeMandatory: "Mandatory",
    typeOptional: "Optional",
    hasExpiryBadge: "Expiry Check Required",
    noExpiryBadge: "No Expiry",
    
    // Match Select
    selectFilePlaceholder: "-- Select matching file --",
    noFileMatched: "No file matched",
    unmatchTooltip: "Unlink this file",
    previewFileTooltip: "Preview this document",
    
    // Statuses
    statusOK: "OK",
    statusMissing: "Missing",
    statusExpiryNeeded: "Expiry date needed",
    statusExpired: "Expired",
    statusNotProvided: "Not provided",
    statusDuplicate: "Duplicate",
    
    // Status Tooltips & Explanations
    tooltipOK: "Document is properly matched and valid for submission.",
    tooltipMissing: "Mandatory document is missing a matching file (blocks package generation).",
    tooltipExpiryNeeded: "This document requires an expiry date to be verified (blocks package generation).",
    tooltipExpired: "Document expires before the submission deadline (blocks package generation).",
    tooltipNotProvided: "Optional document is not attached. Does not block package generation.",
    
    // Upload & Files Panel
    uploadPanelTitle: "Uploaded Files",
    uploadZoneText: "Drag & drop PDF files here, or click to browse",
    uploadZoneSubtext: "Accepts PDF files only • Max 30 files • Up to 50 MB total",
    browseFilesBtn: "Browse PDF Files",
    loadRequirementsBtn: "Load requirements.json",
    smartAutoMatchBtn: "Smart Auto-Match",
    smartAutoMatchTooltip: "Automatically match uploaded files based on intelligent name analysis",
    clearAllMatchesBtn: "Clear Matches",
    
    // Uploaded Files List
    fileItemPages: "pages",
    fileItemSize: "KB",
    fileDuplicateWarning: "Duplicate file content detected. Cannot match duplicate files to different documents.",
    fileMatchedTo: "Matched to",
    fileUnmatched: "Unmatched",
    removeFileTooltip: "Remove this file",
    
    // Validation & Alerts
    alertNonPdfRejected: "Rejected non-PDF file: \"{filename}\". Only valid PDF files are accepted.",
    alertCorruptPdf: "Error reading PDF file: \"{filename}\". The file may be corrupt or encrypted.",
    alertDuplicateMatchPrevented: "Duplicate file \"{filename}\" has identical content to \"{duplicateOf}\". You cannot match duplicate files to different documents.",
    alertAutoMatchedCount: "Auto-matched {count} documents successfully!",
    alertProjectSaved: "Project configuration saved successfully.",
    alertProjectLoaded: "Project configuration restored successfully.",
    alertRequirementsLoaded: "Requirements loaded for tender {tenderId}.",
    
    // Package Options
    packageOptionsTitle: "Package Configuration",
    optIncludeIndex: "Include Table of Contents / Index page after cover",
    optIncludeIndexHint: "Lists all included documents with their starting page numbers",
    optBanglaCoverIndex: "Render Cover & Index in Bangla",
    optBanglaCoverIndexHint: "Applies high-DPI Bengali typography on cover and index pages",
    optEnableSeal: "Stamp official seal / signature PNG",
    optEnableSealHint: "Digitally place company seal or authorized signature on document pages",
    
    // Seal settings
    sealSettingsTitle: "Seal & Signature Settings",
    uploadSealPrompt: "Upload PNG Seal / Signature Image",
    sealPlacementTarget: "Place Seal On:",
    sealTargetAll: "All Document Pages",
    sealTargetCoverOnly: "Cover Page Only",
    sealTargetLastOnly: "Last Document Page Only",
    sealTargetDocsOnly: "All Document Pages (Exclude Cover)",
    sealPosition: "Position on Page:",
    posBottomRight: "Bottom Right",
    posBottomLeft: "Bottom Left",
    posTopRight: "Top Right",
    sealScale: "Seal Size:",
    sealOpacity: "Opacity:",
    
    // Package Generator
    generatorTitle: "Build Tender Package",
    generateBtn: "Generate Combined Tender Package",
    generatingBtn: "Generating Package, Please Wait...",
    downloadBtn: "Download {filename}",
    previewPackageBtn: "Preview Generated Package",
    blockingIssuesTitle: "Cannot Generate: Blocking Issues Found",
    blockingIssuesIntro: "Resolve the following {count} issue(s) before generating the submission package:",
    readyToGenerateBanner: "All requirements met! You can now generate the official submission package.",
    totalPagesInfo: "Total Pages in Package: {pages}",
    
    // Preview Modal
    previewModalTitle: "Document Preview",
    pageIndicator: "Page {current} of {total}",
    prevPage: "Previous",
    nextPage: "Next",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    fitWidth: "Fit Width",
    closeModal: "Close",
    
    // AI Assistant Modal
    aiModalTitle: "AI Tender Compliance Assistant",
    aiApiKeyLabel: "Google Gemini / OpenAI API Key (Optional):",
    aiApiKeyPlaceholder: "Enter your personal API key (stored locally only)",
    aiCheckComplianceBtn: "Run Full Compliance Audit",
    aiAnalyzeExpiryBtn: "Analyze Document Expiry Risks",
    aiGenerateSummaryBtn: "Generate Bid Submission Summary",
    aiBuiltInAuditTitle: "Automated Rule Compliance Engine",
    aiResponseTitle: "AI Analysis Report",
    aiRunningPrompt: "Analyzing tender package data...",
    
    // Footer rules
    packageFooterNote: "Footer format on all pages: {tenderId} | Page X of Y",
    
    // Export CSV Headers
    csvHeaderId: "Requirement ID",
    csvHeaderOrder: "Order",
    csvHeaderTitle: "Document Title",
    csvHeaderMandatory: "Mandatory",
    csvHeaderHasExpiry: "Has Expiry",
    csvHeaderMatchedFile: "Matched File",
    csvHeaderPages: "Page Count",
    csvHeaderExpiryDate: "Expiry Date",
    csvHeaderStatus: "Status",
    csvHeaderBlocks: "Blocks Package"
  },
  
  bn: {
    appTitle: "টেন্ডারফ্লো (TenderFlow)",
    appSubtitle: "টেন্ডার ডকুমেন্ট প্যাকেজ বিল্ডার",
    tagline: "একাধিক টেন্ডার ডকুমেন্ট যাচাই করে নিয়মমাফিক ও ক্রমানুসারে একটি সম্পূর্ণ পিডিএফ প্যাকেজ তৈরি করুন।",
    devFestBadge: "এআই ডেভফেস্ট ২০২৬",
    
    // Header navigation & tools
    loadSampleBtn: "নমুনা প্যাক লোড করুন",
    loadSampleHint: "পরীক্ষা করার জন্য নমুনা রিকয়ারমেন্ট ও ফাইলগুলো তাৎক্ষণিক লোড করুন",
    importProjectBtn: "প্রজেক্ট খুলুন",
    exportProjectBtn: "প্রজেক্ট সংরক্ষণ",
    exportCsvBtn: "চেকলিস্ট এক্সপোর্ট (CSV)",
    aiAssistantBtn: "এআই সহকারী",
    toggleTheme: "থিম পরিবর্তন",
    
    // Tender Overview
    tenderOverviewTitle: "দরপত্রের বিবরণ",
    tenderId: "টেন্ডার আইডি",
    procuringEntity: "দরপত্র আহ্বানকারী কর্তৃপক্ষ",
    bidder: "দরদাতা প্রতিষ্ঠান",
    submissionDeadline: "জমাদানের শেষ সময়সীমা",
    packageReadiness: "প্যাকেজ প্রস্তুতি",
    readyToGenerate: "প্যাকেজ তৈরির জন্য প্রস্তুত",
    hasBlockingIssues: "করণীয় বাকি রয়েছে",
    mandatoryDocsCount: "আবশ্যকীয় ডকুমেন্ট",
    optionalDocsCount: "ঐচ্ছিক ডকুমেন্ট",
    totalUploadedCount: "আপলোডকৃত ফাইল",
    readinessScore: "যাচাইকরণ স্কোর",
    
    // Requirements List
    requirementsTitle: "প্রয়োজনীয় ডকুমেন্টের চেকলিস্ট",
    filterAll: "সকল",
    filterMandatory: "আবশ্যক",
    filterOptional: "ঐচ্ছিক",
    filterActionNeeded: "ত্রুটিপূর্ণ / বাকি",
    searchReqPlaceholder: "ডকুমেন্টের নাম বা আইডি দিয়ে খুঁজুন...",
    colOrder: "ক্রম",
    colTitle: "ডকুমেন্টের শিরোনাম",
    colRequirementType: "ধরন",
    colMatchedFile: "সংযুক্ত ফাইল",
    colExpiryDate: "মেয়াদ উত্তীর্ণের তারিখ",
    colStatus: "অবস্থা",
    colAction: "অ্যাকশন",
    
    // Document Types
    typeMandatory: "আবশ্যক",
    typeOptional: "ঐচ্ছিক",
    hasExpiryBadge: "মেয়াদ যাচাই আবশ্যক",
    noExpiryBadge: "মেয়াদহীন",
    
    // Match Select
    selectFilePlaceholder: "-- সংযুক্ত ফাইল নির্বাচন করুন --",
    noFileMatched: "কোনো ফাইল সংযুক্ত নেই",
    unmatchTooltip: "ফাইল সংযোগ বাতিল করুন",
    previewFileTooltip: "এই ডকুমেন্ট প্রিভিউ করুন",
    
    // Statuses
    statusOK: "সঠিক (OK)",
    statusMissing: "অনুপস্থিত (Missing)",
    statusExpiryNeeded: "মেয়াদের তারিখ প্রয়োজন",
    statusExpired: "মেয়াদোত্তীর্ণ (Expired)",
    statusNotProvided: "প্রদান করা হয়নি (Not provided)",
    statusDuplicate: "ডুপ্লিকেট (Duplicate)",
    
    // Status Tooltips & Explanations
    tooltipOK: "ডকুমেন্ট সঠিকভাবে সংযুক্ত এবং জমাদানের জন্য বৈধ।",
    tooltipMissing: "আবশ্যকীয় ডকুমেন্টে কোনো ফাইল সংযুক্ত করা হয়নি (প্যাকেজ তৈরিতে বাধা)।",
    tooltipExpiryNeeded: "এই ডকুমেন্টের মেয়াদের তারিখ প্রদান করতে হবে (প্যাকেজ তৈরিতে বাধা)।",
    tooltipExpired: "ডকুমেন্টের মেয়াদ জমাদানের শেষ সময়সীমার পূর্বে শেষ হয়েছে (প্যাকেজ তৈরিতে বাধা)।",
    tooltipNotProvided: "ঐচ্ছিক ডকুমেন্টে কোনো ফাইল দেওয়া হয়নি। এতে প্যাকেজ তৈরিতে বাধা নেই।",
    
    // Upload & Files Panel
    uploadPanelTitle: "আপলোডকৃত ফাইলসমূহ",
    uploadZoneText: "এখানে পিডিএফ ফাইল টেনে আনুন, অথবা ব্রাউজ করুন",
    uploadZoneSubtext: "শুধুমাত্র পিডিএফ ফাইল অনুমোদিত • সর্বোচ্চ ৩০টি ফাইল • মোট ৫০ মেগাবাইট পর্যন্ত",
    browseFilesBtn: "পিডিএফ ফাইল বাছুন",
    loadRequirementsBtn: "requirements.json লোড করুন",
    smartAutoMatchBtn: "স্মার্ট অটো-ম্যাচ",
    smartAutoMatchTooltip: "ফাইলের নামের ওপর ভিত্তি করে স্বয়ংক্রিয়ভাবে সঠিক ডকুমেন্টের সাথে ম্যাচ করুন",
    clearAllMatchesBtn: "সকল ম্যাচ মুছুন",
    
    // Uploaded Files List
    fileItemPages: "পাতা",
    fileItemSize: "কেবি",
    fileDuplicateWarning: "একই কনটেন্টের ডুপ্লিকেট ফাইল শনাক্ত হয়েছে! ডুপ্লিকেট ফাইল ভিন্ন ডকুমেন্টে ব্যবহার করা যাবে না।",
    fileMatchedTo: "সংযুক্ত হয়েছে",
    fileUnmatched: "অসংযুক্ত",
    removeFileTooltip: "এই ফাইলটি মুছুন",
    
    // Validation & Alerts
    alertNonPdfRejected: "নন-পিডিএফ ফাইল প্রত্যাখ্যাত: \"{filename}\"। শুধুমাত্র বৈধ পিডিএফ ফাইল গ্রহণযোগ্য।",
    alertCorruptPdf: "পিডিএফ ফাইলে ত্রুটি: \"{filename}\"। ফাইলটি ক্ষতিগ্রস্ত বা পাসওয়ার্ডযুক্ত হতে পারে।",
    alertDuplicateMatchPrevented: "ডুপ্লিকেট ফাইল \"{filename}\"-এর কনটেন্ট এবং \"{duplicateOf}\" হুবহু এক। একই ডুপ্লিকেট ফাইল ভিন্ন ডকুমেন্টে ব্যবহার করা যাবে না।",
    alertAutoMatchedCount: "সফলভাবে {count}টি ডকুমেন্ট স্বয়ংক্রিয়ভাবে ম্যাচ করা হয়েছে!",
    alertProjectSaved: "প্রজেক্ট কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে।",
    alertProjectLoaded: "প্রজেক্ট কনফিগারেশন সফলভাবে পুনরুদ্ধার করা হয়েছে।",
    alertRequirementsLoaded: "টেন্ডার {tenderId}-এর প্রয়োজনীয় তথ্যাদি লোড হয়েছে।",
    
    // Package Options
    packageOptionsTitle: "প্যাকেজ কনফিগারেশন",
    optIncludeIndex: "কভার পেজের পর সূচিপত্র / ইনডেক্স পাতা যোগ করুন",
    optIncludeIndexHint: "প্রতিটি অন্তর্ভুক্ত ডকুমেন্টের শুরুর পাতা নম্বর তালিকাভুক্ত করবে",
    optBanglaCoverIndex: "কভার ও সূচিপত্র বাংলায় তৈরি করুন",
    optBanglaCoverIndexHint: "কভার পেজ এবং ইনডেক্স পাতায় নিখুঁত বাংলা ফন্টে তথ্য প্রদর্শন করবে",
    optEnableSeal: "অফিসিয়াল সিল / স্বাক্ষর স্ট্যাম্প যুক্ত করুন",
    optEnableSealHint: "ডকুমেন্টের পাতায় প্রতিষ্ঠানের ডিজিটাল সিল বা অনুমোদিত স্বাক্ষর স্থাপন করুন",
    
    // Seal settings
    sealSettingsTitle: "সিল ও স্বাক্ষর সেটিং",
    uploadSealPrompt: "পিএনজি (PNG) সিল / স্বাক্ষর ছবি আপলোড করুন",
    sealPlacementTarget: "সিল স্থাপনের পাতা:",
    sealTargetAll: "ডকুমেন্টের সকল পাতায়",
    sealTargetCoverOnly: "শুধুমাত্র কভার পেজে",
    sealTargetLastOnly: "শুধুমাত্র শেষ ডকুমেন্টের শেষ পাতায়",
    sealTargetDocsOnly: "ডকুমেন্টের সকল পাতায় (কভার বাদে)",
    sealPosition: "পাতায় অবস্থান:",
    posBottomRight: "নিচে ডানপাশে",
    posBottomLeft: "নিচে বামপাশে",
    posTopRight: "উপরে ডানপাশে",
    sealScale: "সিলের আকার:",
    sealOpacity: "স্বচ্ছতা (Opacity):",
    
    // Package Generator
    generatorTitle: "টেন্ডার প্যাকেজ তৈরি",
    generateBtn: "সম্মিলিত টেন্ডার প্যাকেজ তৈরি করুন",
    generatingBtn: "প্যাকেজ তৈরি হচ্ছে, অপেক্ষা করুন...",
    downloadBtn: "ডাউনলোড করুন {filename}",
    previewPackageBtn: "তৈরিকৃত প্যাকেজ প্রিভিউ দেখুন",
    blockingIssuesTitle: "প্যাকেজ তৈরি করা সম্ভব নয়: ত্রুটিসমূহ সমাধান করুন",
    blockingIssuesIntro: "প্যাকেজ তৈরি করার পূর্বে নিচের {count}টি সমস্যা সমাধান করুন:",
    readyToGenerateBanner: "সকল শর্ত পূরণ হয়েছে! আপনি এখন অফিশিয়াল টেন্ডার প্যাকেজ তৈরি করতে পারেন।",
    totalPagesInfo: "প্যাকেজে মোট পাতার সংখ্যা: {pages}",
    
    // Preview Modal
    previewModalTitle: "ডকুমেন্ট প্রিভিউ",
    pageIndicator: "পাতা {current} / {total}",
    prevPage: "পূর্ববর্তী",
    nextPage: "পরবর্তী",
    zoomIn: "জুম ইন",
    zoomOut: "জুম আউট",
    fitWidth: "স্বাভাবিক আকার",
    closeModal: "বন্ধ করুন",
    
    // AI Assistant Modal
    aiModalTitle: "এআই টেন্ডার কমপ্লায়েন্স সহকারী",
    aiApiKeyLabel: "গুগল জেমিনি / ওপেনএআই এপিআই কি (ঐচ্ছিক):",
    aiApiKeyPlaceholder: "আপনার ব্যক্তিগত এপিআই কি দিন (শুধু আপনার ব্রাউজারে সংরক্ষিত থাকবে)",
    aiCheckComplianceBtn: "সম্পূর্ণ কমপ্লায়েন্স অডিট চালান",
    aiAnalyzeExpiryBtn: "মেয়াদের ঝুঁকি ও তারিখ বিশ্লেষণ করুন",
    aiGenerateSummaryBtn: "টেন্ডার জমাদানের বিবরণ তৈরি করুন",
    aiBuiltInAuditTitle: "স্বয়ংক্রিয় নিয়মকানুন যাচাই ইঞ্জিন",
    aiResponseTitle: "এআই বিশ্লেষণ রিপোর্ট",
    aiRunningPrompt: "টেন্ডার প্যাকেজ ডেটা বিশ্লেষণ করা হচ্ছে...",
    
    // Footer rules
    packageFooterNote: "প্রতিটি পাতার নিচের ফুটার: {tenderId} | Page X of Y",
    
    // Export CSV Headers
    csvHeaderId: "রিকয়ারমেন্ট আইডি",
    csvHeaderOrder: "ক্রম",
    csvHeaderTitle: "ডকুমেন্টের শিরোনাম",
    csvHeaderMandatory: "আবশ্যক কিনা",
    csvHeaderHasExpiry: "মেয়াদ আছে কিনা",
    csvHeaderMatchedFile: "সংযুক্ত ফাইল",
    csvHeaderPages: "পাতার সংখ্যা",
    csvHeaderExpiryDate: "মেয়াদ উত্তীর্ণের তারিখ",
    csvHeaderStatus: "অবস্থা",
    csvHeaderBlocks: "প্যাকেজে বাধা দেয় কিনা"
  }
};
