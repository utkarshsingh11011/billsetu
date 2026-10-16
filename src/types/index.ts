// Core Data Types for BillSetu
// Based on BillSetu PRD v1.1 - Sections 6, 8, 9 & Appendix A

export type DocumentType = 
  | 'gst_tax_invoice'
  | 'non_gst_bill'
  | 'purchase_tax_invoice'
  | 'retail_receipt'
  | 'expense_voucher'
  | 'online_invoice';

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'partially_paid' | 'cancelled';

export type PartyType = 'customer' | 'supplier';

export type GstinLookupStatus = 'verified_active' | 'unverified_manual' | 'cancelled' | 'not_found' | 'error';

export interface StateInfo {
  code: string; // e.g. "27"
  name: string; // e.g. "Maharashtra"
}

export interface BankDetails {
  bankName: string;
  accountNo: string;
  ifsc: string;
  accountHolderName: string;
  upiId?: string;
}

export interface BusinessProfile {
  id: string;
  legalName: string;
  tradeName: string;
  gstin: string;
  isGstRegistered: boolean;
  pan?: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  phone: string;
  email: string;
  logoUrl?: string;
  brandColor?: string;
  invoicePrefix: string;
  nextInvoiceSequence: number;
  financialYear: string;
  bankDetails: BankDetails;
  termsAndConditions: string;
  signatureUrl?: string;
}

export interface Party {
  id: string;
  businessId: string;
  type: PartyType;
  name: string;
  tradeName?: string;
  gstin?: string;
  phone?: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode?: string;
  lookupStatus: GstinLookupStatus;
  lastCheckedAt?: string;
  balancePaise: number;
}

export interface Item {
  id: string;
  businessId: string;
  name: string;
  hsnSac: string;
  unit: 'pcs' | 'box' | 'kg' | 'm' | 'hrs' | 'nos' | 'set' | 'pkts';
  defaultTaxRate: number; // 0, 5, 12, 18, 28
  defaultPricePaise: number;
  description?: string;
}

export interface InvoiceLine {
  id: string;
  description: string;
  hsnSac: string;
  quantity: number;
  unit: string;
  unitPricePaise: number;
  discountPercent: number;
  discountPaise: number;
  taxRate: number; // 0, 5, 12, 18, 28
  isTaxInclusive: boolean;
  taxableValuePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalPaise: number;
}

export interface PaymentRecord {
  id: string;
  amountPaise: number;
  date: string;
  method: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  referenceNo?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  businessId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  type: 'gst_tax_invoice' | 'non_gst_bill';
  status: InvoiceStatus;
  party: Party;
  placeOfSupplyState: string;
  placeOfSupplyStateCode: string;
  isReverseCharge: boolean;
  lines: InvoiceLine[];
  subtotalPaise: number;
  totalDiscountPaise: number;
  taxableValuePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  roundOffPaise: number;
  grandTotalPaise: number;
  amountPaidPaise: number;
  balanceDuePaise: number;
  notes?: string;
  terms?: string;
  issuedAt?: string;
  version: number;
  originalScanId?: string;
  payments: PaymentRecord[];
}

export interface ExtractedField<T> {
  value: T;
  confidence: number; // 0.0 - 1.0
  isUncertain?: boolean;
}

export interface ExtractedLineCandidate {
  description: string;
  quantity: number;
  unitPricePaise: number;
  taxRate: number;
  totalPaise: number;
  confidence: number;
}

export interface ExtractionResult {
  documentType: DocumentType;
  supplier: {
    gstin: ExtractedField<string>;
    legalName: ExtractedField<string>;
    address: ExtractedField<string>;
  };
  invoice: {
    number: ExtractedField<string>;
    date: ExtractedField<string>;
    currency: string;
  };
  lines: ExtractedLineCandidate[];
  totals: {
    taxableValuePaise: ExtractedField<number>;
    taxPaise: ExtractedField<number>;
    grandTotalPaise: ExtractedField<number>;
  };
  validation: {
    arithmeticMismatch: boolean;
    mismatchExplanation?: string;
    requiresHumanReview: boolean;
    duplicateSuspect?: boolean;
  };
}

export interface ScannedDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: 'image/jpeg' | 'image/png' | 'application/pdf';
  fileSize: number;
  uploadedAt: string;
  status: 'processing' | 'needs_review' | 'reviewed' | 'saved' | 'failed';
  extraction: ExtractionResult;
  destinationRecordType?: 'purchase_expense' | 'sales_archive' | 'document_archive';
  destinationRecordId?: string;
  reviewNotes?: string;
  reviewedAt?: string;
}

export interface PurchaseExpense {
  id: string;
  businessId: string;
  vendorName: string;
  vendorGstin?: string;
  invoiceNumber: string;
  invoiceDate: string;
  category: 'Inventory' | 'Office Supplies' | 'Utilities' | 'Rent' | 'Travel' | 'Software' | 'Logistics' | 'Other';
  taxableAmountPaise: number;
  taxPaise: number;
  totalAmountPaise: number;
  paymentStatus: 'paid' | 'pending';
  sourceDocumentId?: string;
  sourceDocumentFileName?: string;
  notes?: string;
  createdAt: string;
}

export interface Subscription {
  plan: 'free' | 'pro';
  pricePaise: number;
  status: 'active' | 'past_due' | 'cancelled';
  renewalDate: string;
  scanQuotaUsed: number;
  scanQuotaLimit: number;
  canRemoveFooter: boolean;
  canUseCustomBranding: boolean;
  lastPaymentId?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  entity: 'invoice' | 'scan' | 'party' | 'profile' | 'subscription' | 'payment';
  action: string;
  details: string;
}
