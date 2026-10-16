// Bilingual Localization (English & Hindi)
// Implements PRD Section 10 ("English and Hindi first")

export type Language = 'en' | 'hi';

export const translations = {
  en: {
    // Brand
    brandName: 'BillSetu',
    brandTagline: 'A calmer, simpler billing tool for small businesses',
    
    // Core Actions
    createInvoice: 'Create invoice',
    scanBill: 'Scan bill',
    findRecord: 'Find a record',
    
    // Navigation
    navHome: 'Home',
    navSales: 'Sales invoices',
    navScan: 'Scan & import',
    navExpenses: 'Purchases/expenses',
    navParties: 'Customers & Parties',
    navItems: 'Items & Catalog',
    navRecords: 'Records',
    navBrandSub: 'Brand & Pro Plan',
    navSettings: 'Settings',

    // Home summaries
    invoicesThisMonth: 'Invoices this month',
    amountDue: 'Amount due',
    scansNeedReview: 'Scans needing review',
    syncState: 'Synced to device & cloud',
    recentActivity: 'Recent invoices & records',
    viewAllRecords: 'View all records',
    setupChecklist: 'Quick setup checklist',
    profileSetupDone: 'Business profile configured',
    gstinVerified: 'GSTIN validation active',
    firstInvoiceReady: 'Ready to issue invoices',

    // Statuses
    draft: 'Draft',
    issued: 'Issued',
    paid: 'Paid',
    partiallyPaid: 'Partially Paid',
    cancelled: 'Cancelled',
    needsReview: 'Needs Review',
    reviewed: 'Reviewed',

    // Actions & Buttons
    saveDraft: 'Save draft',
    issueInvoice: 'Issue invoice',
    previewPdf: 'Preview & Print',
    downloadPdf: 'Download PDF',
    recordPayment: 'Record payment',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    upload: 'Upload file',
    openCamera: 'Use camera',
    upgradeToPro: 'Upgrade to Pro',
    proBadge: 'PRO',

    // Common labels
    customer: 'Customer',
    supplier: 'Supplier',
    invoiceNumber: 'Invoice #',
    date: 'Date',
    dueDate: 'Due date',
    placeOfSupply: 'Place of supply',
    items: 'Items',
    subtotal: 'Subtotal',
    discount: 'Discount',
    taxableValue: 'Taxable value',
    tax: 'GST',
    roundOff: 'Round off',
    grandTotal: 'Grand total',
    amountPaid: 'Amount paid',
    balanceDue: 'Balance due',
  },
  hi: {
    // Brand
    brandName: 'बिलसेतु (BillSetu)',
    brandTagline: 'छोटे व्यवसायों के लिए सरल और भरोसेमंद बिलिंग',
    
    // Core Actions
    createInvoice: 'बिल बनाएं',
    scanBill: 'बिल स्कैन करें',
    findRecord: 'बिल खोजें',
    
    // Navigation
    navHome: 'होम',
    navSales: 'बिक्री बिल (सेल)',
    navScan: 'स्कैन और इम्पोर्ट',
    navExpenses: 'खरीद / खर्चे',
    navParties: 'ग्राहक और व्यापारी',
    navItems: 'सामान और सेवाएं',
    navRecords: 'सभी रिकॉर्ड्स',
    navBrandSub: 'ब्रांडिंग और प्रो प्लान',
    navSettings: 'सेटिंग्स',

    // Home summaries
    invoicesThisMonth: 'इस महीने के बिल',
    amountDue: 'बकाया राशि',
    scansNeedReview: 'समीक्षा हेतु स्कैन',
    syncState: 'डिवाइस पर सुरक्षित',
    recentActivity: 'हाल के बिल और रिकॉर्ड्स',
    viewAllRecords: 'सभी रिकॉर्ड देखें',
    setupChecklist: 'शुरुआती चेकलिस्ट',
    profileSetupDone: 'व्यापार प्रोफ़ाइल तैयार है',
    gstinVerified: 'जीएसटीएन सत्यापन सक्रिय है',
    firstInvoiceReady: 'बिल जारी करने के लिए तैयार',

    // Statuses
    draft: 'ड्राफ्ट',
    issued: 'जारी किया',
    paid: 'भुगतान पूरा',
    partiallyPaid: 'आंशिक भुगतान',
    cancelled: 'रद्द',
    needsReview: 'समीक्षा चाहिए',
    reviewed: 'स्वीकृत',

    // Actions & Buttons
    saveDraft: 'ड्राफ्ट सेव करें',
    issueInvoice: 'बिल जारी करें',
    previewPdf: 'प्रीव्यू और प्रिंट',
    downloadPdf: 'पीडीएफ डाउनलोड',
    recordPayment: 'भुगतान दर्ज करें',
    cancel: 'रद्द करें',
    save: 'सेव करें',
    edit: 'बदलें',
    delete: 'हटाएं',
    upload: 'फ़ाइल अपलोड करें',
    openCamera: 'कैमरा खोलें',
    upgradeToPro: 'प्रो में अपग्रेड करें',
    proBadge: 'प्रो',

    // Common labels
    customer: 'ग्राहक',
    supplier: 'आपूर्तिकर्ता',
    invoiceNumber: 'बिल संख्या',
    date: 'तारीख',
    dueDate: 'अंतिम तारीख',
    placeOfSupply: 'सप्लाई का राज्य',
    items: 'सामान की सूची',
    subtotal: 'उप-कुल',
    discount: 'छूट',
    taxableValue: 'कर योग्य मूल्य',
    tax: 'जीएसटी (GST)',
    roundOff: 'राउंड ऑफ',
    grandTotal: 'कुल देय राशि',
    amountPaid: 'प्राप्त राशि',
    balanceDue: 'शेष बकाया',
  }
};
