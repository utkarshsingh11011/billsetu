// Core Data Types for BillSetu - Taxi, Fleet & Enterprise Billing Platform
// Based on BillSetu PRD v1.1 and Taxi/Fleet GST Architecture

export type DocumentType = 
  | 'gst_tax_invoice'
  | 'non_gst_bill'
  | 'purchase_tax_invoice'
  | 'retail_receipt'
  | 'duty_slip'
  | 'expense_voucher'
  | 'online_invoice';

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'partially_paid' | 'cancelled';

export type BillingType = 'b2b_corporate' | 'b2c_passenger';

export type TaxMode = 'exclusive' | 'inclusive' | 'zero';

export type PartyType = 'customer' | 'supplier';

export type PartyCategory = 'corporate_client' | 'individual_passenger' | 'vendor';

export type GstinLookupStatus = 'verified_active' | 'unverified_manual' | 'cancelled' | 'not_found' | 'error';

export interface StateInfo {
  code: string; // e.g. "09" for UP, "27" for MH
  name: string; // e.g. "Uttar Pradesh", "Maharashtra"
}

export interface BankDetails {
  bankName: string;
  accountNo: string;
  ifsc: string;
  branch?: string;
  accountHolderName: string;
  upiId?: string; // For dynamic NPCI payment QR codes
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  organizationId: string;
  role: 'owner' | 'admin' | 'staff';
  hasCompletedOnboarding: boolean;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
  tenantId: string;
}

export interface BusinessProfile {
  id: string;
  isConfigured: boolean; // false until mandatory onboarding wizard is completed
  businessCategory: 'taxi_fleet' | 'travel_agency' | 'general_services';
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
  logoUrl?: string; // base64 or URL
  brandColor?: string;
  invoicePrefix: string;
  nextInvoiceSequence: number;
  financialYear: string;
  bankDetails: BankDetails;
  termsAndConditions: string;
  authorizedSignatoryName: string;
  signatureUrl?: string; // base64 or URL
}

export interface Party {
  id: string;
  businessId: string;
  type: PartyType;
  category: PartyCategory;
  name: string;
  tradeName?: string;
  gstin?: string;
  contactPerson?: string;
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
  hsnSac: string; // e.g. 996412 for taxi services, 996601 for rental
  unit: 'km' | 'hrs' | 'days' | 'trips' | 'pcs' | 'nos' | 'set';
  defaultTaxRate: number; // 0, 5, 12, 18, 28
  defaultPricePaise: number;
  description?: string;
}

export interface TripDutySlip {
  vehicleNumber: string; // e.g. UP65-BT-1234, DL1Z-9988
  vehicleCategory: 'Sedan' | 'SUV / Innova' | 'Innova Crysta' | 'Tempo Traveller' | 'Luxury Coach' | 'Hatchback' | 'Other';
  driverName: string;
  driverPhone?: string;
  routeOrDuty: string; // e.g. "Varanasi Airport to Cantt Hotel / Kashi Darshan Local 8Hr-80Km"
  tripStartDate: string;
  tripEndDate: string;
  openingKm?: number;
  closingKm?: number;
  totalKm?: number; // auto calculated (closingKm - openingKm)
  extraKmRatePaise?: number;
  extraHours?: number;
  extraHourRatePaise?: number;
  nightHaltChargesPaise?: number;
  // Non-taxable reimbursements (Pure Agent per GST Section 33)
  tollTaxPaise: number;
  statePermitPaise: number;
  parkingChargesPaise: number;
  taxReimbursements: boolean; // default: false (no GST applied to pure reimbursements)
  totalReimbursementsPaise: number;
}

export interface InvoiceLine {
  id: string;
  description: string;
  hsnSac: string; // 996412 default for Cab Rental
  quantity: number;
  unit: string;
  unitPricePaise: number;
  discountPercent: number;
  discountPaise: number;
  taxRate: number; // 0, 5, 12, 18, 28, or custom %
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
  type: 'gst_tax_invoice' | 'non_gst_bill' | 'quotation_estimate';
  billingType: BillingType; // B2B Corporate vs B2C Passenger
  status: InvoiceStatus;
  party: Party;
  placeOfSupplyState: string;
  placeOfSupplyStateCode: string;
  isReverseCharge: boolean; // RCM Section 9(3)
  taxMode: TaxMode; // exclusive | inclusive | zero
  tripDetails?: TripDutySlip; // Specialized Cab / Travel Duty Slip
  lines: InvoiceLine[];
  subtotalPaise: number;
  totalDiscountPaise: number;
  taxableValuePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalReimbursementsPaise: number; // Toll + Permit + Parking (Non-taxable)
  roundOffPaise: number;
  grandTotalPaise: number;
  amountPaidPaise: number;
  balanceDuePaise: number;
  notes?: string;
  terms?: string;
  issuedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  version: number;
  originalScanId?: string;
  payments: PaymentRecord[];
  shareableId: string; // Unique token for public hosted invoice link
}

export interface ExtractedField<T> {
  value: T;
  confidence: number;
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
  tripDetails?: {
    vehicleNumber: ExtractedField<string>;
    driverName: ExtractedField<string>;
    routeOrDuty: ExtractedField<string>;
    openingKm: ExtractedField<number>;
    closingKm: ExtractedField<number>;
    tollParkingPaise: ExtractedField<number>;
  };
  lines: ExtractedLineCandidate[];
  totals: {
    taxableValuePaise: ExtractedField<number>;
    taxPaise: ExtractedField<number>;
    reimbursementsPaise?: ExtractedField<number>;
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
  destinationRecordType?: 'purchase_expense' | 'sales_archive' | 'duty_slip' | 'document_archive';
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
  category: 'Fuel' | 'Toll & Fastag' | 'Vehicle Maintenance' | 'Driver Allowance' | 'Office & Admin' | 'Insurance' | 'Other';
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

export type AdminPlanTierId = 'starter_free' | 'pro_annual' | 'enterprise_fleet';

export type AdminSubscriptionStatus = 'active' | 'trial' | 'past_due' | 'grace_period' | 'cancelled';

export interface AdminTenant {
  id: string;
  businessId: string;
  businessName: string;
  tradeName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  gstin: string;
  state: string;
  category: 'taxi_fleet' | 'retail_kirana' | 'wholesale_trading' | 'transport_logistics' | 'freelance_consulting' | 'manufacturing';
  plan: AdminPlanTierId;
  status: AdminSubscriptionStatus;
  billingCycle: 'monthly' | 'annual';
  mrrPaise: number;
  startDate: string;
  renewalDate: string;
  invoicesGenerated: number;
  scanQuotaUsed: number;
  scanQuotaLimit: number;
  customBranding: boolean;
  whatsappEnabled: boolean;
  apiAccess: boolean;
  multiUserSeats: number;
  notes?: string;
}

export interface AdminPromoCoupon {
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number; // e.g. 20 (for 20%) or 20000 paise (for ₹200)
  maxRedemptions: number;
  timesRedeemed: number;
  expiresAt: string;
  isActive: boolean;
  description: string;
  applicablePlan?: AdminPlanTierId | 'all';
}

export interface AdminSubscriptionTransaction {
  id: string;
  tenantId: string;
  tenantName: string;
  ownerEmail: string;
  amountPaise: number;
  planName: string;
  billingCycle: 'monthly' | 'annual';
  gateway: 'razorpay' | 'upi_qr' | 'cashfree' | 'stripe' | 'manual_neft';
  gatewayTxnId: string;
  timestamp: string;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  invoiceNumber: string;
}

export interface AdminPricingTier {
  id: AdminPlanTierId;
  name: string;
  tagline: string;
  monthlyPricePaise: number;
  annualPricePaise: number;
  scanLimit: number;
  invoiceLimit: string;
  features: string[];
  popular?: boolean;
  badge?: string;
  buttonLabel: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  entity: 'invoice' | 'scan' | 'party' | 'profile' | 'subscription' | 'payment' | 'auth';
  action: string;
  details: string;
}

