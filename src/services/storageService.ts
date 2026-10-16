// Storage Service for BillSetu
// Provides local persistence, reactive state updates, and realistic seed data
// Implements PRD Section 6, 8, 9

import { BusinessProfile, Party, Item, Invoice, ScannedDocument, PurchaseExpense, Subscription, AuditEvent } from '../types';
import { calculateInvoiceTotals } from './taxEngine';

const STORAGE_KEYS = {
  PROFILE: 'billsetu_profile',
  PARTIES: 'billsetu_parties',
  ITEMS: 'billsetu_items',
  INVOICES: 'billsetu_invoices',
  SCANS: 'billsetu_scans',
  EXPENSES: 'billsetu_expenses',
  SUBSCRIPTION: 'billsetu_subscription',
  AUDIT_LOG: 'billsetu_audit',
  LANGUAGE: 'billsetu_language',
};

// Initial Seed Business Profile
const DEFAULT_PROFILE: BusinessProfile = {
  id: 'biz_01',
  legalName: 'MAHARASHTRA INDUSTRIAL COMPONENTS PVT LTD',
  tradeName: 'Apex Tech Solutions',
  gstin: '27AABCU9603R1ZM',
  isGstRegistered: true,
  pan: 'AABCU9603R',
  address: 'Plot 42, MIDC Industrial Area, Andheri East',
  city: 'Mumbai',
  state: 'Maharashtra',
  stateCode: '27',
  pincode: '400093',
  phone: '+91 98200 12345',
  email: 'billing@apextechsolutions.in',
  brandColor: '#0d9488',
  invoicePrefix: 'INV-2026-',
  nextInvoiceSequence: 104,
  financialYear: '2026-27',
  bankDetails: {
    bankName: 'HDFC Bank Ltd',
    accountNo: '50200012345678',
    ifsc: 'HDFC0000123',
    accountHolderName: 'Apex Tech Solutions',
    upiId: 'apextech@hdfcbank',
  },
  termsAndConditions: '1. Payment due within 15 days of invoice date.\n2. Goods once sold will not be taken back unless damaged.\n3. Subject to Mumbai Jurisdiction.',
};

// Initial Parties
const DEFAULT_PARTIES: Party[] = [
  {
    id: 'pty_01',
    businessId: 'biz_01',
    type: 'customer',
    name: 'Sharma Electricals & Hardware',
    tradeName: 'DELHI LOGISTICS & TRADING COMPANY',
    gstin: '07AAACG0563M1ZP',
    phone: '+91 98111 22334',
    email: 'accounts@sharmaelectricals.com',
    address: 'Shop 14, Bhagirath Palace, Chandni Chowk',
    city: 'Delhi',
    state: 'Delhi',
    stateCode: '07',
    pincode: '110006',
    lookupStatus: 'verified_active',
    lastCheckedAt: '2026-10-14T10:00:00.000Z',
    balancePaise: 4500000, // ₹45,000.00
  },
  {
    id: 'pty_02',
    businessId: 'biz_01',
    type: 'customer',
    name: 'Karnataka Spices & Organics',
    tradeName: 'SOUTHERN TECH VENTURES LLP',
    gstin: '29AABCS1429B1ZB',
    phone: '+91 99888 77665',
    email: 'procurement@karnatakaspices.in',
    address: '88, 100 Feet Road, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    stateCode: '29',
    pincode: '560038',
    lookupStatus: 'verified_active',
    lastCheckedAt: '2026-10-15T14:30:00.000Z',
    balancePaise: 0,
  },
  {
    id: 'pty_03',
    businessId: 'biz_01',
    type: 'customer',
    name: 'Rohit Verma (Freelance Studio)',
    tradeName: '',
    phone: '+91 97654 32100',
    email: 'rohit@creativestudio.in',
    address: 'Flat 402, Sea Green Apartments, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    stateCode: '27',
    pincode: '400050',
    lookupStatus: 'unverified_manual',
    balancePaise: 1250000, // ₹12,500.00
  },
  {
    id: 'pty_sup_01',
    businessId: 'biz_01',
    type: 'supplier',
    name: 'Metro Hardware & Industrial Supplies',
    gstin: '27AAECM4455G1ZV',
    phone: '+91 98222 33445',
    email: 'sales@metrohardware.in',
    address: 'Gala 12, LBS Marg, Kurla West',
    city: 'Mumbai',
    state: 'Maharashtra',
    stateCode: '27',
    pincode: '400070',
    lookupStatus: 'verified_active',
    lastCheckedAt: '2026-10-10T09:00:00.000Z',
    balancePaise: 0,
  }
];

// Initial Catalog Items
const DEFAULT_ITEMS: Item[] = [
  {
    id: 'itm_01',
    businessId: 'biz_01',
    name: 'Dell 27-inch 4K Monitor',
    hsnSac: '8471',
    unit: 'pcs',
    defaultTaxRate: 18,
    defaultPricePaise: 3200000, // ₹32,000.00
    description: 'UltraSharp USB-C Hub Monitor with IPS display',
  },
  {
    id: 'itm_02',
    businessId: 'biz_01',
    name: 'High-Speed HDMI 2.1 Cable (2m)',
    hsnSac: '8544',
    unit: 'pcs',
    defaultTaxRate: 18,
    defaultPricePaise: 45000, // ₹450.00
    description: '48Gbps braided nylon high-durability cable',
  },
  {
    id: 'itm_03',
    businessId: 'biz_01',
    name: 'IT Infrastructure & Cloud Setup Consulting',
    hsnSac: '9983',
    unit: 'hrs',
    defaultTaxRate: 18,
    defaultPricePaise: 250000, // ₹2,500.00 / hr
    description: 'Senior cloud architect advisory and network hardening',
  },
  {
    id: 'itm_04',
    businessId: 'biz_01',
    name: 'Thermal Receipt Rolls (50 pack)',
    hsnSac: '4802',
    unit: 'box',
    defaultTaxRate: 12,
    defaultPricePaise: 120000, // ₹1,200.00
    description: 'BPA-free high sensitivity thermal POS paper',
  },
];

// Initial Invoices
const DEFAULT_INVOICES: Invoice[] = [
  {
    id: 'inv_101',
    businessId: 'biz_01',
    invoiceNumber: 'INV-2026-101',
    invoiceDate: '2026-10-02',
    dueDate: '2026-10-17',
    type: 'gst_tax_invoice',
    status: 'paid',
    party: DEFAULT_PARTIES[0], // Sharma Electricals (Inter-state Delhi)
    placeOfSupplyState: 'Delhi',
    placeOfSupplyStateCode: '07',
    isReverseCharge: false,
    lines: [
      {
        id: 'ln_1',
        description: 'Dell 27-inch 4K Monitor',
        hsnSac: '8471',
        quantity: 2,
        unit: 'pcs',
        unitPricePaise: 3200000,
        discountPercent: 0,
        discountPaise: 0,
        taxRate: 18,
        isTaxInclusive: false,
        taxableValuePaise: 6400000,
        cgstPaise: 0,
        sgstPaise: 0,
        igstPaise: 1152000,
        totalPaise: 7552000,
      }
    ],
    subtotalPaise: 6400000,
    totalDiscountPaise: 0,
    taxableValuePaise: 6400000,
    cgstPaise: 0,
    sgstPaise: 0,
    igstPaise: 1152000,
    roundOffPaise: 0,
    grandTotalPaise: 7552000, // ₹75,520.00
    amountPaidPaise: 7552000,
    balanceDuePaise: 0,
    issuedAt: '2026-10-02T11:00:00.000Z',
    version: 1,
    payments: [
      {
        id: 'pmt_01',
        amountPaise: 7552000,
        date: '2026-10-05',
        method: 'bank_transfer',
        referenceNo: 'HDFCR52026100599182',
        notes: 'Full payment received via NEFT',
      }
    ],
  },
  {
    id: 'inv_102',
    businessId: 'biz_01',
    invoiceNumber: 'INV-2026-102',
    invoiceDate: '2026-10-12',
    dueDate: '2026-10-27',
    type: 'gst_tax_invoice',
    status: 'issued',
    party: DEFAULT_PARTIES[0], // Sharma Electricals
    placeOfSupplyState: 'Delhi',
    placeOfSupplyStateCode: '07',
    isReverseCharge: false,
    lines: [
      {
        id: 'ln_2',
        description: 'IT Infrastructure & Cloud Setup Consulting',
        hsnSac: '9983',
        quantity: 15,
        unit: 'hrs',
        unitPricePaise: 250000,
        discountPercent: 5,
        discountPaise: 187500,
        taxRate: 18,
        isTaxInclusive: false,
        taxableValuePaise: 3562500,
        cgstPaise: 0,
        sgstPaise: 0,
        igstPaise: 641250,
        totalPaise: 4203750,
      }
    ],
    subtotalPaise: 3750000,
    totalDiscountPaise: 187500,
    taxableValuePaise: 3562500,
    cgstPaise: 0,
    sgstPaise: 0,
    igstPaise: 641250,
    roundOffPaise: 0,
    grandTotalPaise: 4203750, // ₹42,037.50
    amountPaidPaise: 0,
    balanceDuePaise: 4203750,
    issuedAt: '2026-10-12T16:20:00.000Z',
    version: 1,
    payments: [],
  },
  {
    id: 'inv_103',
    businessId: 'biz_01',
    invoiceNumber: 'INV-2026-103',
    invoiceDate: '2026-10-15',
    dueDate: '2026-10-30',
    type: 'gst_tax_invoice',
    status: 'draft',
    party: DEFAULT_PARTIES[2], // Rohit Verma (Intra-state Maharashtra)
    placeOfSupplyState: 'Maharashtra',
    placeOfSupplyStateCode: '27',
    isReverseCharge: false,
    lines: [
      {
        id: 'ln_3',
        description: 'High-Speed HDMI 2.1 Cable (2m)',
        hsnSac: '8544',
        quantity: 4,
        unit: 'pcs',
        unitPricePaise: 45000,
        discountPercent: 0,
        discountPaise: 0,
        taxRate: 18,
        isTaxInclusive: false,
        taxableValuePaise: 180000,
        cgstPaise: 16200,
        sgstPaise: 16200,
        igstPaise: 0,
        totalPaise: 212400,
      }
    ],
    subtotalPaise: 180000,
    totalDiscountPaise: 0,
    taxableValuePaise: 180000,
    cgstPaise: 16200,
    sgstPaise: 16200,
    igstPaise: 0,
    roundOffPaise: 0,
    grandTotalPaise: 212400, // ₹2,124.00
    amountPaidPaise: 0,
    balanceDuePaise: 212400,
    version: 1,
    payments: [],
  }
];

// Initial Scans for Scan-to-Books
const DEFAULT_SCANS: ScannedDocument[] = [
  {
    id: 'scan_01',
    fileName: 'metro_hardware_tax_invoice_1092.png',
    fileUrl: '/sample-bills/metro_hardware.png',
    fileType: 'image/png',
    fileSize: 482000,
    uploadedAt: '2026-10-16T11:15:00.000Z',
    status: 'needs_review',
    extraction: {
      documentType: 'purchase_tax_invoice',
      supplier: {
        gstin: { value: '27AAECM4455G1ZV', confidence: 0.98 },
        legalName: { value: 'METRO HARDWARE & INDUSTRIAL SUPPLIES', confidence: 0.96 },
        address: { value: 'Gala 12, LBS Marg, Kurla West, Mumbai 400070', confidence: 0.91 }
      },
      invoice: {
        number: { value: 'MH/2026/1092', confidence: 0.95 },
        date: { value: '2026-10-14', confidence: 0.92 },
        currency: 'INR'
      },
      lines: [
        {
          description: 'Industrial Safety Gloves (Heavy Duty Pack of 10)',
          quantity: 5,
          unitPricePaise: 65000,
          taxRate: 18,
          totalPaise: 383500,
          confidence: 0.94
        },
        {
          description: 'High Pressure Brass Valves 1/2 inch',
          quantity: 12,
          unitPricePaise: 42000,
          taxRate: 18,
          totalPaise: 594720,
          confidence: 0.92
        }
      ],
      totals: {
        taxableValuePaise: { value: 829000, confidence: 0.95 },
        taxPaise: { value: 149220, confidence: 0.95 },
        grandTotalPaise: { value: 978220, confidence: 0.96 }
      },
      validation: {
        arithmeticMismatch: false,
        requiresHumanReview: true,
      }
    }
  },
  {
    id: 'scan_02',
    fileName: 'sagar_store_thermal_receipt.jpg',
    fileUrl: '/sample-bills/sagar_thermal.jpg',
    fileType: 'image/jpeg',
    fileSize: 215000,
    uploadedAt: '2026-10-16T13:40:00.000Z',
    status: 'needs_review',
    extraction: {
      documentType: 'retail_receipt',
      supplier: {
        gstin: { value: '27BXOPM8891N1ZX', confidence: 0.76, isUncertain: true },
        legalName: { value: 'SAGAR GENERAL STORE & CAFE', confidence: 0.88 },
        address: { value: 'Station Road, Dadar East, Mumbai', confidence: 0.72, isUncertain: true }
      },
      invoice: {
        number: { value: 'POS-88219', confidence: 0.82 },
        date: { value: '2026-10-16', confidence: 0.65, isUncertain: true },
        currency: 'INR'
      },
      lines: [
        {
          description: 'Office Pantry Snacks & Coffee Beans',
          quantity: 1,
          unitPricePaise: 145000,
          taxRate: 5,
          totalPaise: 152250,
          confidence: 0.81
        }
      ],
      totals: {
        taxableValuePaise: { value: 145000, confidence: 0.84 },
        taxPaise: { value: 7250, confidence: 0.84 },
        grandTotalPaise: { value: 152250, confidence: 0.85 }
      },
      validation: {
        arithmeticMismatch: false,
        requiresHumanReview: true,
      }
    }
  },
  {
    id: 'scan_03',
    fileName: 'flagged_mismatch_invoice.png',
    fileUrl: '/sample-bills/flagged_bill.png',
    fileType: 'image/png',
    fileSize: 310000,
    uploadedAt: '2026-10-16T15:20:00.000Z',
    status: 'needs_review',
    extraction: {
      documentType: 'purchase_tax_invoice',
      supplier: {
        gstin: { value: '07AAAFK8921J1ZQ', confidence: 0.92 },
        legalName: { value: 'CAPITAL STATIONERY & PRINTERS', confidence: 0.94 },
        address: { value: 'Nehru Place, New Delhi 110019', confidence: 0.89 }
      },
      invoice: {
        number: { value: 'CSP/2026/410', confidence: 0.93 },
        date: { value: '2026-10-11', confidence: 0.91 },
        currency: 'INR'
      },
      lines: [
        {
          description: 'A4 Copier Paper (Carton of 5 reams)',
          quantity: 2,
          unitPricePaise: 110000,
          taxRate: 12,
          totalPaise: 246400,
          confidence: 0.88
        }
      ],
      totals: {
        taxableValuePaise: { value: 220000, confidence: 0.89 },
        taxPaise: { value: 26400, confidence: 0.89 },
        // Grand total on paper reads 2950.00 instead of 2464.00 (mismatch flagged!)
        grandTotalPaise: { value: 295000, confidence: 0.70, isUncertain: true }
      },
      validation: {
        arithmeticMismatch: true,
        mismatchExplanation: 'Computed total (₹2,464.00) differs from extracted grand total (₹2,950.00). Please verify line items.',
        requiresHumanReview: true,
      }
    }
  }
];

// Initial Purchases & Expenses
const DEFAULT_EXPENSES: PurchaseExpense[] = [
  {
    id: 'exp_01',
    businessId: 'biz_01',
    vendorName: 'AWS Cloud Services India',
    vendorGstin: '9917USA29005OS8',
    invoiceNumber: 'INV-AWS-2026-10',
    invoiceDate: '2026-10-01',
    category: 'Software',
    taxableAmountPaise: 850000, // ₹8,500
    taxPaise: 153000, // ₹1,530 (18% IGST)
    totalAmountPaise: 1003000, // ₹10,030
    paymentStatus: 'paid',
    notes: 'Monthly cloud hosting servers and object storage',
    createdAt: '2026-10-02T10:00:00.000Z',
  }
];

// Initial Subscription
const DEFAULT_SUBSCRIPTION: Subscription = {
  plan: 'free',
  pricePaise: 0,
  status: 'active',
  renewalDate: '2027-10-16',
  scanQuotaUsed: 3,
  scanQuotaLimit: 20,
  canRemoveFooter: false,
  canUseCustomBranding: false,
};

// Storage implementation
export const storageService = {
  getProfile(): BusinessProfile {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
      return DEFAULT_PROFILE;
    }
    return JSON.parse(raw);
  },

  saveProfile(profile: BusinessProfile): void {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    this.addAudit('profile', 'update', `Updated business profile: ${profile.tradeName}`);
  },

  getParties(): Party[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PARTIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PARTIES, JSON.stringify(DEFAULT_PARTIES));
      return DEFAULT_PARTIES;
    }
    return JSON.parse(raw);
  },

  saveParty(party: Party): Party {
    const parties = this.getParties();
    const existingIndex = parties.findIndex(p => p.id === party.id);
    if (existingIndex >= 0) {
      parties[existingIndex] = party;
    } else {
      parties.push(party);
    }
    localStorage.setItem(STORAGE_KEYS.PARTIES, JSON.stringify(parties));
    this.addAudit('party', existingIndex >= 0 ? 'update' : 'create', `Party: ${party.name}`);
    return party;
  },

  deleteParty(id: string): void {
    const parties = this.getParties().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PARTIES, JSON.stringify(parties));
    this.addAudit('party', 'delete', `Deleted party ID: ${id}`);
  },

  getItems(): Item[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ITEMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(DEFAULT_ITEMS));
      return DEFAULT_ITEMS;
    }
    return JSON.parse(raw);
  },

  saveItem(item: Item): Item {
    const items = this.getItems();
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) {
      items[idx] = item;
    } else {
      items.push(item);
    }
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    return item;
  },

  getInvoices(): Invoice[] {
    const raw = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(DEFAULT_INVOICES));
      return DEFAULT_INVOICES;
    }
    return JSON.parse(raw);
  },

  saveInvoice(invoice: Invoice): Invoice {
    const invoices = this.getInvoices();
    const idx = invoices.findIndex(i => i.id === invoice.id);
    if (idx >= 0) {
      invoices[idx] = invoice;
    } else {
      invoices.unshift(invoice);
    }
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    this.addAudit('invoice', idx >= 0 ? 'update' : 'create', `Invoice ${invoice.invoiceNumber} (${invoice.status})`);
    return invoice;
  },

  getScans(): ScannedDocument[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SCANS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(DEFAULT_SCANS));
      return DEFAULT_SCANS;
    }
    return JSON.parse(raw);
  },

  saveScan(scan: ScannedDocument): ScannedDocument {
    const scans = this.getScans();
    const idx = scans.findIndex(s => s.id === scan.id);
    if (idx >= 0) {
      scans[idx] = scan;
    } else {
      scans.unshift(scan);
    }
    localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(scans));
    this.addAudit('scan', idx >= 0 ? 'update' : 'upload', `Scan: ${scan.fileName}`);
    return scan;
  },

  getExpenses(): PurchaseExpense[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(DEFAULT_EXPENSES));
      return DEFAULT_EXPENSES;
    }
    return JSON.parse(raw);
  },

  saveExpense(expense: PurchaseExpense): PurchaseExpense {
    const expenses = this.getExpenses();
    const idx = expenses.findIndex(e => e.id === expense.id);
    if (idx >= 0) {
      expenses[idx] = expense;
    } else {
      expenses.unshift(expense);
    }
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    return expense;
  },

  getSubscription(): Subscription {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(DEFAULT_SUBSCRIPTION));
      return DEFAULT_SUBSCRIPTION;
    }
    return JSON.parse(raw);
  },

  upgradeToPro(): Subscription {
    const current = this.getSubscription();
    const updated: Subscription = {
      ...current,
      plan: 'pro',
      pricePaise: 99900,
      status: 'active',
      renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      scanQuotaLimit: 500,
      canRemoveFooter: true,
      canUseCustomBranding: true,
      lastPaymentId: `PAY_SUB_${Date.now()}`,
    };
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(updated));
    this.addAudit('subscription', 'upgrade', 'Upgraded to Pro Plan (₹999/yr)');
    return updated;
  },

  downgradeToFree(): Subscription {
    const updated: Subscription = {
      ...DEFAULT_SUBSCRIPTION,
      scanQuotaUsed: this.getSubscription().scanQuotaUsed,
    };
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(updated));
    this.addAudit('subscription', 'downgrade', 'Switched to Free Plan');
    return updated;
  },

  getAuditLog(): AuditEvent[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOG);
    if (!raw) return [];
    return JSON.parse(raw);
  },

  addAudit(entity: AuditEvent['entity'], action: string, details: string): void {
    const logs = this.getAuditLog();
    const event: AuditEvent = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actor: 'Business Owner',
      entity,
      action,
      details,
    };
    logs.unshift(event);
    // Keep last 100 events
    if (logs.length > 100) logs.length = 100;
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(logs));
  },

  getLanguage(): 'en' | 'hi' {
    return (localStorage.getItem(STORAGE_KEYS.LANGUAGE) as 'en' | 'hi') || 'en';
  },

  setLanguage(lang: 'en' | 'hi'): void {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  },

  resetAllData(): void {
    localStorage.clear();
    // Re-seed defaults
    this.getProfile();
    this.getParties();
    this.getItems();
    this.getInvoices();
    this.getScans();
    this.getExpenses();
    this.getSubscription();
  }
};
