// Production Multi-Tenant Storage & Persistence Engine for BillSetu
// Adheres strictly to Directive 1: Zero mock/demo artifacts by default.
// Completely partitions all data by tenant (organizationId).

import { 
  BusinessProfile, 
  Party, 
  Item, 
  Invoice, 
  ScannedDocument, 
  PurchaseExpense, 
  Subscription, 
  AuditEvent,
  AdminTenant,
  AdminPromoCoupon,
  AdminSubscriptionTransaction,
  AdminPricingTier,
  AdminPlanTierId,
  AdminSubscriptionStatus
} from '../types';
import { authService, createBlankBusinessProfile } from './authService';

const getTenantKey = (key: string): string => {
  const tenantId = authService.getActiveTenantId();
  return `billsetu_${tenantId}_${key}`;
};

// Standard Taxi & Fleet Service Catalog Template
export const DEFAULT_TAXI_SERVICES: Item[] = [
  {
    id: 'item_taxi_01',
    businessId: '',
    name: 'Taxi Services / Cab Rental (Standard)',
    hsnSac: '996412',
    unit: 'km',
    defaultTaxRate: 5,
    defaultPricePaise: 1400, // ₹14.00 / km
    description: 'Passenger road transport service by motor cab without ITC',
  },
  {
    id: 'item_taxi_02',
    businessId: '',
    name: 'Rental of Passenger Vehicle with Operator',
    hsnSac: '996601',
    unit: 'days',
    defaultTaxRate: 5,
    defaultPricePaise: 350000, // ₹3,500.00 / day
    description: 'Chauffeured vehicle rental for local or outstation duty',
  },
  {
    id: 'item_taxi_03',
    businessId: '',
    name: 'Airport Transfer Package (One-Way / Round)',
    hsnSac: '996411',
    unit: 'trips',
    defaultTaxRate: 5,
    defaultPricePaise: 120000, // ₹1,200.00
    description: 'Fixed rate city to airport pickup or drop package',
  },
  {
    id: 'item_taxi_04',
    businessId: '',
    name: 'Local Sightseeing Package (8Hrs / 80Km)',
    hsnSac: '996412',
    unit: 'trips',
    defaultTaxRate: 5,
    defaultPricePaise: 250000, // ₹2,500.00
    description: 'Full day 8-hour 80-kilometer city tour duty slip package',
  },
  {
    id: 'item_taxi_05',
    businessId: '',
    name: 'Corporate B2B Monthly Cab Contract',
    hsnSac: '996601',
    unit: 'days',
    defaultTaxRate: 18,
    defaultPricePaise: 450000, // ₹4,500.00
    description: 'B2B commercial transport with Input Tax Credit (ITC)',
  }
];

export const storageService = {
  // --- Profile Operations ---
  getProfile(): BusinessProfile {
    const key = getTenantKey('profile');
    const raw = localStorage.getItem(key);
    if (!raw) {
      const user = authService.getCurrentUser();
      const blank = createBlankBusinessProfile(authService.getActiveTenantId(), user?.email || '');
      localStorage.setItem(key, JSON.stringify(blank));
      return blank;
    }
    return JSON.parse(raw);
  },

  saveProfile(profile: BusinessProfile): BusinessProfile {
    const key = getTenantKey('profile');
    localStorage.setItem(key, JSON.stringify(profile));
    this.addAudit('profile', 'update', `Updated profile: ${profile.tradeName || profile.legalName}`);
    return profile;
  },

  // --- Parties (Customers & Corporate Clients) ---
  getParties(): Party[] {
    const key = getTenantKey('parties');
    const raw = localStorage.getItem(key);
    if (!raw) {
      return []; // Clean empty state for new tenants
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
    localStorage.setItem(getTenantKey('parties'), JSON.stringify(parties));
    this.addAudit('party', existingIndex >= 0 ? 'update' : 'create', `Party: ${party.name}`);
    return party;
  },

  deleteParty(id: string): void {
    const parties = this.getParties().filter(p => p.id !== id);
    localStorage.setItem(getTenantKey('parties'), JSON.stringify(parties));
    this.addAudit('party', 'delete', `Deleted party ID: ${id}`);
  },

  // --- Items & Services ---
  getItems(): Item[] {
    const key = getTenantKey('items');
    const raw = localStorage.getItem(key);
    if (!raw) {
      const tenantId = authService.getActiveTenantId();
      const initial = DEFAULT_TAXI_SERVICES.map(item => ({ ...item, businessId: tenantId }));
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
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
    localStorage.setItem(getTenantKey('items'), JSON.stringify(items));
    return item;
  },

  // --- Invoices & Duty Slips ---
  getInvoices(): Invoice[] {
    const key = getTenantKey('invoices');
    const raw = localStorage.getItem(key);
    if (!raw) {
      return []; // Clean empty state
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
    localStorage.setItem(getTenantKey('invoices'), JSON.stringify(invoices));
    this.addAudit('invoice', idx >= 0 ? 'update' : 'create', `Invoice ${invoice.invoiceNumber} (${invoice.status})`);
    
    // Also advance invoice sequence on the profile if this is a newly created invoice
    if (idx < 0) {
      const prof = this.getProfile();
      prof.nextInvoiceSequence += 1;
      this.saveProfile(prof);
    }

    return invoice;
  },

  getInvoiceById(id: string): Invoice | undefined {
    return this.getInvoices().find(inv => inv.id === id || inv.shareableId === id);
  },

  deleteInvoice(id: string): void {
    const invoices = this.getInvoices().filter(inv => inv.id !== id);
    localStorage.setItem(getTenantKey('invoices'), JSON.stringify(invoices));
    this.addAudit('invoice', 'delete', `Deleted invoice ID ${id}`);
  },

  // --- Scanned Offline Duty Slips & Bills ---
  getScans(): ScannedDocument[] {
    const key = getTenantKey('scans');
    const raw = localStorage.getItem(key);
    if (!raw) {
      return []; // Clean empty state
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
    localStorage.setItem(getTenantKey('scans'), JSON.stringify(scans));
    this.addAudit('scan', idx >= 0 ? 'update' : 'upload', `Scan: ${scan.fileName}`);
    return scan;
  },

  deleteScan(id: string): void {
    const scans = this.getScans().filter(s => s.id !== id);
    localStorage.setItem(getTenantKey('scans'), JSON.stringify(scans));
    this.addAudit('scan', 'delete', `Deleted scan ID: ${id}`);
  },

  // --- Purchase & Fleet Expenses (Fuel, Fastag, Tolls) ---
  getExpenses(): PurchaseExpense[] {
    const key = getTenantKey('expenses');
    const raw = localStorage.getItem(key);
    if (!raw) {
      return []; // Clean empty state
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
    localStorage.setItem(getTenantKey('expenses'), JSON.stringify(expenses));
    return expense;
  },

  // --- Subscriptions ---
  getSubscription(): Subscription {
    const key = getTenantKey('subscription');
    const raw = localStorage.getItem(key);
    if (!raw) {
      const defaultSub: Subscription = {
        plan: 'free',
        pricePaise: 0,
        status: 'active',
        renewalDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        scanQuotaUsed: 0,
        scanQuotaLimit: 30,
        canRemoveFooter: false,
        canUseCustomBranding: false,
      };
      localStorage.setItem(key, JSON.stringify(defaultSub));
      return defaultSub;
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
      scanQuotaLimit: 1000,
      canRemoveFooter: true,
      canUseCustomBranding: true,
      lastPaymentId: `PAY_SUB_${Date.now()}`,
    };
    localStorage.setItem(getTenantKey('subscription'), JSON.stringify(updated));
    this.addAudit('subscription', 'upgrade', 'Upgraded to Pro Fleet Plan (₹999/yr)');
    return updated;
  },

  downgradeToFree(): Subscription {
    const sub = this.getSubscription();
    const updated: Subscription = {
      ...sub,
      plan: 'free',
      pricePaise: 0,
      canRemoveFooter: false,
      canUseCustomBranding: false,
    };
    localStorage.setItem(getTenantKey('subscription'), JSON.stringify(updated));
    return updated;
  },

  // --- Audit Trail ---
  getAuditLog(): AuditEvent[] {
    const key = getTenantKey('audit');
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  },

  addAudit(entity: AuditEvent['entity'], action: string, details: string): void {
    const logs = this.getAuditLog();
    const user = authService.getCurrentUser();
    const event: AuditEvent = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actor: user?.fullName || 'Operator',
      entity,
      action,
      details,
    };
    logs.unshift(event);
    if (logs.length > 100) logs.length = 100;
    localStorage.setItem(getTenantKey('audit'), JSON.stringify(logs));
  },

  // --- Language Preferences ---
  getLanguage(): 'en' | 'hi' {
    return (localStorage.getItem('billsetu_pref_language') as 'en' | 'hi') || 'en';
  },

  setLanguage(lang: 'en' | 'hi'): void {
    localStorage.setItem('billsetu_pref_language', lang);
  },

  // --- Optional Realistic Taxi & Fleet Sample Data Loader (Triggered only explicitly by user) ---
  seedSampleTaxiData(): void {
    const tenantId = authService.getActiveTenantId();

    const sampleProfile: BusinessProfile = {
      id: tenantId,
      isConfigured: true,
      businessCategory: 'taxi_fleet',
      legalName: 'KASHI TOURS & FLEET SERVICES PVT LTD',
      tradeName: 'Kashi Cabs & Car Rental',
      gstin: '09AAACK8892M1Z2',
      isGstRegistered: true,
      pan: 'AAACK8892M',
      address: 'Shop 4, Dashashwamedh Ghat Road, Godowlia',
      city: 'Varanasi',
      state: 'Uttar Pradesh',
      stateCode: '09',
      pincode: '221001',
      phone: '+91 98390 12345',
      email: 'billing@kashicabs.in',
      logoUrl: '',
      brandColor: '#0C2B62',
      invoicePrefix: 'KCS/26-27/',
      nextInvoiceSequence: 104,
      financialYear: '2026-27',
      bankDetails: {
        bankName: 'State Bank of India',
        accountNo: '39482019482',
        ifsc: 'SBIN0000211',
        branch: 'Varanasi Main Branch',
        accountHolderName: 'Kashi Tours & Fleet Services Pvt Ltd',
        upiId: 'kashicabs@sbi',
      },
      termsAndConditions: '1. Toll tax, state border permit, and parking charges are payable as per actual receipts.\n2. Night journey allowance (₹300) applicable for travel between 10:00 PM and 06:00 AM.\n3. Opening & closing kilometers calculated from garage to garage.\n4. Payment due within 7 days of invoice presentation.\n5. Disputes subject to Varanasi jurisdiction.',
      authorizedSignatoryName: 'Rajesh K. Sharma',
    };

    const sampleParty: Party = {
      id: `pty_${Date.now()}_1`,
      businessId: tenantId,
      type: 'customer',
      category: 'corporate_client',
      name: 'VARANASI TEXTILES & EXPORTS LLP',
      tradeName: 'Varanasi Heritage Handlooms',
      gstin: '09AABCV4920K1ZX',
      contactPerson: 'Mr. Arvind Gupta',
      phone: '+91 98391 99887',
      email: 'travel@varanasitextiles.in',
      address: 'Plot 18, Industrial Estate, Shivpur',
      city: 'Varanasi',
      state: 'Uttar Pradesh',
      stateCode: '09',
      pincode: '221003',
      lookupStatus: 'verified_active',
      lastCheckedAt: new Date().toISOString(),
      balancePaise: 0,
    };

    const sampleInvoice: Invoice = {
      id: `inv_${Date.now()}_1`,
      businessId: tenantId,
      invoiceNumber: 'KCS/26-27/101',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      type: 'gst_tax_invoice',
      billingType: 'b2b_corporate',
      status: 'issued',
      party: sampleParty,
      placeOfSupplyState: 'Uttar Pradesh',
      placeOfSupplyStateCode: '09',
      isReverseCharge: false,
      taxMode: 'exclusive',
      tripDetails: {
        vehicleNumber: 'UP65-BT-4582',
        vehicleCategory: 'SUV / Innova',
        driverName: 'Suraj Pandey',
        driverPhone: '+91 94500 11223',
        routeOrDuty: 'Varanasi Airport Pick up -> Sarnath & Kashi Darshan (8Hr/80Km)',
        tripStartDate: `${new Date().toISOString().split('T')[0]} 08:00 AM`,
        tripEndDate: `${new Date().toISOString().split('T')[0]} 06:30 PM`,
        openingKm: 42100,
        closingKm: 42195,
        totalKm: 95,
        extraKmRatePaise: 1600, // ₹16/km
        extraHours: 2,
        extraHourRatePaise: 20000, // ₹200/hr
        nightHaltChargesPaise: 0,
        tollTaxPaise: 18000, // ₹180 Toll
        statePermitPaise: 0,
        parkingChargesPaise: 12000, // ₹120 Airport parking
        taxReimbursements: false,
        totalReimbursementsPaise: 30000, // ₹300 total pure agent reimbursements
      },
      lines: [
        {
          id: 'line_1',
          description: 'Innova Crysta AC Cab Rental - 8 Hours / 80 Km Package',
          hsnSac: '996412',
          quantity: 1,
          unit: 'days',
          unitPricePaise: 320000, // ₹3,200
          discountPercent: 0,
          discountPaise: 0,
          taxRate: 5,
          isTaxInclusive: false,
          taxableValuePaise: 320000,
          cgstPaise: 8000, // 2.5% = ₹80
          sgstPaise: 8000, // 2.5% = ₹80
          igstPaise: 0,
          totalPaise: 336000,
        },
        {
          id: 'line_2',
          description: 'Extra Kilometers (15 Km @ ₹16/Km)',
          hsnSac: '996412',
          quantity: 15,
          unit: 'km',
          unitPricePaise: 1600, // ₹16
          discountPercent: 0,
          discountPaise: 0,
          taxRate: 5,
          isTaxInclusive: false,
          taxableValuePaise: 24000, // ₹240
          cgstPaise: 600, // ₹6
          sgstPaise: 600, // ₹6
          igstPaise: 0,
          totalPaise: 25200,
        },
        {
          id: 'line_3',
          description: 'Extra Hours Waiting (2 Hours @ ₹200/Hr)',
          hsnSac: '996412',
          quantity: 2,
          unit: 'hrs',
          unitPricePaise: 20000, // ₹200
          discountPercent: 0,
          discountPaise: 0,
          taxRate: 5,
          isTaxInclusive: false,
          taxableValuePaise: 40000, // ₹400
          cgstPaise: 1000, // ₹10
          sgstPaise: 1000, // ₹10
          igstPaise: 0,
          totalPaise: 42000,
        }
      ],
      subtotalPaise: 384000,
      totalDiscountPaise: 0,
      taxableValuePaise: 384000,
      cgstPaise: 9600,
      sgstPaise: 9600,
      igstPaise: 0,
      totalReimbursementsPaise: 30000, // ₹300 Toll & Parking non-taxable
      roundOffPaise: 0,
      grandTotalPaise: 433200, // ₹4,332.00
      amountPaidPaise: 0,
      balanceDuePaise: 433200,
      version: 1,
      payments: [],
      shareableId: 'kcs_duty_101',
    };

    this.saveProfile(sampleProfile);
    this.saveParty(sampleParty);
    this.saveInvoice(sampleInvoice);
    authService.markOnboardingComplete();
  },

  // ==========================================
  // ADMIN SUBSCRIPTION MANAGEMENT METHODS
  // ==========================================

  getAdminTenants(): AdminTenant[] {
    const raw = localStorage.getItem('billsetu_admin_tenants');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    const initialTenants = this.getInitialAdminTenants();
    localStorage.setItem('billsetu_admin_tenants', JSON.stringify(initialTenants));
    return initialTenants;
  },

  saveAdminTenant(tenant: AdminTenant): AdminTenant {
    const tenants = this.getAdminTenants();
    const index = tenants.findIndex(t => t.id === tenant.id);
    let updated: AdminTenant[];
    if (index >= 0) {
      updated = [...tenants];
      updated[index] = tenant;
    } else {
      updated = [tenant, ...tenants];
    }
    localStorage.setItem('billsetu_admin_tenants', JSON.stringify(updated));
    return tenant;
  },

  deleteAdminTenant(id: string): void {
    const tenants = this.getAdminTenants().filter(t => t.id !== id);
    localStorage.setItem('billsetu_admin_tenants', JSON.stringify(tenants));
  },

  getAdminPricingTiers(): AdminPricingTier[] {
    const raw = localStorage.getItem('billsetu_admin_pricing_tiers');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    const initialTiers: AdminPricingTier[] = [
      {
        id: 'starter_free',
        name: 'BillSetu Starter',
        tagline: 'Ideal for solo proprietors, freelancing, and small counters',
        monthlyPricePaise: 0,
        annualPricePaise: 0,
        scanLimit: 20,
        invoiceLimit: 'Unlimited',
        features: [
          'Unlimited GST Tax & Non-GST Invoicing',
          'Deterministic CGST, SGST & IGST Engine',
          'Offline-First IndexedDB Storage',
          'Standard UPI Dynamic QR on bills',
          '20 AI Scan-to-Books OCR credits',
          'Includes BillSetu verification badge in footer'
        ],
        buttonLabel: 'Get Started Free'
      },
      {
        id: 'pro_annual',
        name: 'BillSetu Pro Business',
        tagline: 'Complete brand white-labeling & high throughput for growing MSMEs',
        monthlyPricePaise: 12900, // ₹129/mo
        annualPricePaise: 99900,  // ₹999/yr
        scanLimit: 500,
        invoiceLimit: 'Unlimited',
        popular: true,
        badge: 'Most Popular',
        features: [
          'All Starter features included',
          '100% Watermark Removal & White-Labeling',
          'Custom Business Logo on Invoices & Thermal Slips',
          'Custom Brand Colors & Typography Accents',
          '500 AI Scan-to-Books OCR credits / year',
          'Customer Khata Statements PDF Export',
          'Direct WhatsApp One-Click Bill Dispatch',
          'Priority CSV, JSON & CA Audit Export'
        ],
        buttonLabel: 'Upgrade to Pro (₹999/yr)'
      },
      {
        id: 'enterprise_fleet',
        name: 'Enterprise Fleet & Logistics',
        tagline: 'Multi-seat access, bulk duty slips, and high-volume billing',
        monthlyPricePaise: 39900, // ₹399/mo
        annualPricePaise: 349900, // ₹3,499/yr
        scanLimit: 2500,
        invoiceLimit: 'Unlimited',
        badge: 'Scale & Fleet',
        features: [
          'All Pro Business features included',
          'Up to 5 Multi-User Staff & Counter Seats',
          '2,500 AI Scan-to-Books OCR credits / year',
          'Specialized Taxi & Logistics Trip/Duty Slips',
          'Pure Agent Reimbursement Handling (Toll/Parking)',
          'Dedicated WhatsApp Notification Gateway',
          'Webhook & REST API access for ERP sync',
          'Priority SLA & Dedicated Account Support'
        ],
        buttonLabel: 'Contact Sales / Upgrade'
      }
    ];
    localStorage.setItem('billsetu_admin_pricing_tiers', JSON.stringify(initialTiers));
    return initialTiers;
  },

  saveAdminPricingTier(tier: AdminPricingTier): AdminPricingTier {
    const tiers = this.getAdminPricingTiers();
    const index = tiers.findIndex(t => t.id === tier.id);
    let updated: AdminPricingTier[];
    if (index >= 0) {
      updated = [...tiers];
      updated[index] = tier;
    } else {
      updated = [...tiers, tier];
    }
    localStorage.setItem('billsetu_admin_pricing_tiers', JSON.stringify(updated));
    return tier;
  },

  getAdminPromoCodes(): AdminPromoCoupon[] {
    const raw = localStorage.getItem('billsetu_admin_promos');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    const initialCoupons: AdminPromoCoupon[] = [
      {
        code: 'STARTUPGST',
        discountType: 'flat',
        discountValue: 30000, // ₹300 off
        maxRedemptions: 500,
        timesRedeemed: 142,
        expiresAt: '2026-12-31',
        isActive: true,
        description: 'Flat ₹300 off on Pro Business annual subscription for new GST filers',
        applicablePlan: 'pro_annual'
      },
      {
        code: 'DIWALI50',
        discountType: 'percent',
        discountValue: 50, // 50%
        maxRedemptions: 200,
        timesRedeemed: 88,
        expiresAt: '2026-11-15',
        isActive: true,
        description: 'Festive Season 50% discount on Pro Plan',
        applicablePlan: 'pro_annual'
      },
      {
        code: 'FLEETVIP',
        discountType: 'flat',
        discountValue: 50000, // ₹500 off
        maxRedemptions: 100,
        timesRedeemed: 31,
        expiresAt: '2026-12-31',
        isActive: true,
        description: 'Exclusive ₹500 off for registered taxi fleets and logistics contractors',
        applicablePlan: 'enterprise_fleet'
      },
      {
        code: 'EARLYBIRD',
        discountType: 'percent',
        discountValue: 25,
        maxRedemptions: 1000,
        timesRedeemed: 429,
        expiresAt: '2026-10-31',
        isActive: false,
        description: 'Early adopter 25% discount campaign (Expired)',
        applicablePlan: 'all'
      }
    ];
    localStorage.setItem('billsetu_admin_promos', JSON.stringify(initialCoupons));
    return initialCoupons;
  },

  saveAdminPromoCode(coupon: AdminPromoCoupon): AdminPromoCoupon {
    const coupons = this.getAdminPromoCodes();
    const index = coupons.findIndex(c => c.code.toUpperCase() === coupon.code.toUpperCase());
    let updated: AdminPromoCoupon[];
    if (index >= 0) {
      updated = [...coupons];
      updated[index] = coupon;
    } else {
      updated = [coupon, ...coupons];
    }
    localStorage.setItem('billsetu_admin_promos', JSON.stringify(updated));
    return coupon;
  },

  deleteAdminPromoCode(code: string): void {
    const coupons = this.getAdminPromoCodes().filter(c => c.code.toUpperCase() !== code.toUpperCase());
    localStorage.setItem('billsetu_admin_promos', JSON.stringify(coupons));
  },

  getAdminTransactions(): AdminSubscriptionTransaction[] {
    const raw = localStorage.getItem('billsetu_admin_transactions');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    const initialTxns: AdminSubscriptionTransaction[] = [
      {
        id: 'tx_sub_9901',
        tenantId: 'tenant_001',
        tenantName: 'Kashi Cabs & Fleet Services',
        ownerEmail: 'contact@kashicabs.com',
        amountPaise: 99900,
        planName: 'Pro Business (Annual)',
        billingCycle: 'annual',
        gateway: 'upi_qr',
        gatewayTxnId: 'UPI/628919283741/KASHI',
        timestamp: '2026-10-14 11:24 AM',
        status: 'succeeded',
        invoiceNumber: 'SUB-2026-0812'
      },
      {
        id: 'tx_sub_9902',
        tenantId: 'tenant_002',
        tenantName: 'Bharat Traders & Distributors',
        ownerEmail: 'accounts@bharattraders.in',
        amountPaise: 349900,
        planName: 'Enterprise Fleet (Annual)',
        billingCycle: 'annual',
        gateway: 'razorpay',
        gatewayTxnId: 'pay_Px9238djL10a',
        timestamp: '2026-10-12 04:15 PM',
        status: 'succeeded',
        invoiceNumber: 'SUB-2026-0811'
      },
      {
        id: 'tx_sub_9903',
        tenantId: 'tenant_003',
        tenantName: 'Sharma Electronics & Electricals',
        ownerEmail: 'rajesh@sharmaelectricals.com',
        amountPaise: 99900,
        planName: 'Pro Business (Annual)',
        billingCycle: 'annual',
        gateway: 'razorpay',
        gatewayTxnId: 'pay_Kq771239aa81',
        timestamp: '2026-10-09 02:40 PM',
        status: 'succeeded',
        invoiceNumber: 'SUB-2026-0810'
      },
      {
        id: 'tx_sub_9904',
        tenantId: 'tenant_005',
        tenantName: 'Royal Rajasthan Tours & Travels',
        ownerEmail: 'bookings@royalrajasthantours.com',
        amountPaise: 349900,
        planName: 'Enterprise Fleet (Annual)',
        billingCycle: 'annual',
        gateway: 'manual_neft',
        gatewayTxnId: 'HDFC_NEFT_202610058821',
        timestamp: '2026-10-05 09:12 AM',
        status: 'succeeded',
        invoiceNumber: 'SUB-2026-0809'
      },
      {
        id: 'tx_sub_9905',
        tenantId: 'tenant_008',
        tenantName: 'GreenLeaf Organic Agro Foods',
        ownerEmail: 'info@greenleafagro.com',
        amountPaise: 12900,
        planName: 'Pro Business (Monthly)',
        billingCycle: 'monthly',
        gateway: 'cashfree',
        gatewayTxnId: 'cf_order_998124',
        timestamp: '2026-09-28 06:18 PM',
        status: 'succeeded',
        invoiceNumber: 'SUB-2026-0798'
      },
      {
        id: 'tx_sub_9906',
        tenantId: 'tenant_009',
        tenantName: 'Horizon Interior & Architectural Studio',
        ownerEmail: 'accounts@horizonstudio.design',
        amountPaise: 99900,
        planName: 'Pro Business (Annual)',
        billingCycle: 'annual',
        gateway: 'razorpay',
        gatewayTxnId: 'pay_Fail99120',
        timestamp: '2026-09-25 10:02 AM',
        status: 'failed',
        invoiceNumber: 'SUB-2026-0789'
      }
    ];
    localStorage.setItem('billsetu_admin_transactions', JSON.stringify(initialTxns));
    return initialTxns;
  },

  addAdminTransaction(txn: AdminSubscriptionTransaction): AdminSubscriptionTransaction {
    const txns = this.getAdminTransactions();
    const updated = [txn, ...txns];
    localStorage.setItem('billsetu_admin_transactions', JSON.stringify(updated));
    return txn;
  },

  getInitialAdminTenants(): AdminTenant[] {
    return [
      {
        id: 'tenant_001',
        businessId: 'org_kashi_01',
        businessName: 'Kashi Cabs & Fleet Services',
        tradeName: 'Kashi Cabs',
        ownerName: 'Vikas Mishra',
        ownerEmail: 'contact@kashicabs.com',
        ownerPhone: '+91 98391 23456',
        gstin: '09AAACK1234F1Z8',
        state: 'Uttar Pradesh (09)',
        category: 'taxi_fleet',
        plan: 'pro_annual',
        status: 'active',
        billingCycle: 'annual',
        mrrPaise: 8325, // ₹83.25/mo amortized
        startDate: '2026-04-10',
        renewalDate: '2027-04-10',
        invoicesGenerated: 142,
        scanQuotaUsed: 210,
        scanQuotaLimit: 500,
        customBranding: true,
        whatsappEnabled: true,
        apiAccess: false,
        multiUserSeats: 1,
        notes: 'Premium fleet operator in Varanasi. High satisfaction with Duty Slip & OCR features.'
      },
      {
        id: 'tenant_002',
        businessId: 'org_bharat_02',
        businessName: 'Bharat Traders & Distributors',
        tradeName: 'Bharat Textiles',
        ownerName: 'Sunil Agarwal',
        ownerEmail: 'accounts@bharattraders.in',
        ownerPhone: '+91 98250 88712',
        gstin: '24AADCB2244K1ZS',
        state: 'Gujarat (24)',
        category: 'wholesale_trading',
        plan: 'enterprise_fleet',
        status: 'active',
        billingCycle: 'annual',
        mrrPaise: 29158, // ₹291.58/mo amortized
        startDate: '2026-03-01',
        renewalDate: '2027-03-01',
        invoicesGenerated: 890,
        scanQuotaUsed: 412,
        scanQuotaLimit: 2500,
        customBranding: true,
        whatsappEnabled: true,
        apiAccess: true,
        multiUserSeats: 5,
        notes: 'High-volume wholesale merchant. Uses dynamic UPI QR on all B2B invoices.'
      },
      {
        id: 'tenant_003',
        businessId: 'org_sharma_03',
        businessName: 'Sharma Electronics & Electricals',
        tradeName: 'Sharma Electronics',
        ownerName: 'Rajesh Sharma',
        ownerEmail: 'rajesh@sharmaelectricals.com',
        ownerPhone: '+91 98111 77334',
        gstin: '07AAAFS3344P1ZZ',
        state: 'Delhi (07)',
        category: 'retail_kirana',
        plan: 'pro_annual',
        status: 'active',
        billingCycle: 'annual',
        mrrPaise: 8325,
        startDate: '2026-06-15',
        renewalDate: '2027-06-15',
        invoicesGenerated: 215,
        scanQuotaUsed: 85,
        scanQuotaLimit: 500,
        customBranding: true,
        whatsappEnabled: true,
        apiAccess: false,
        multiUserSeats: 1
      },
      {
        id: 'tenant_004',
        businessId: 'org_apex_04',
        businessName: 'Apex Tech Consulting LLP',
        tradeName: 'Apex Consulting',
        ownerName: 'Deepa Krishnan',
        ownerEmail: 'billing@apexconsulting.io',
        ownerPhone: '+91 97400 33221',
        gstin: '29AABCA9988D1Z2',
        state: 'Karnataka (29)',
        category: 'freelance_consulting',
        plan: 'pro_annual',
        status: 'active',
        billingCycle: 'annual',
        mrrPaise: 8325,
        startDate: '2026-05-20',
        renewalDate: '2027-05-20',
        invoicesGenerated: 98,
        scanQuotaUsed: 110,
        scanQuotaLimit: 500,
        customBranding: true,
        whatsappEnabled: false,
        apiAccess: false,
        multiUserSeats: 2
      },
      {
        id: 'tenant_005',
        businessId: 'org_royal_05',
        businessName: 'Royal Rajasthan Tours & Travels',
        tradeName: 'Royal Tours',
        ownerName: 'Mahendra Singh Rathore',
        ownerEmail: 'bookings@royalrajasthantours.com',
        ownerPhone: '+91 94140 19283',
        gstin: '08AAACR5566M1ZX',
        state: 'Rajasthan (08)',
        category: 'taxi_fleet',
        plan: 'enterprise_fleet',
        status: 'active',
        billingCycle: 'annual',
        mrrPaise: 29158,
        startDate: '2026-02-12',
        renewalDate: '2027-02-12',
        invoicesGenerated: 620,
        scanQuotaUsed: 490,
        scanQuotaLimit: 2500,
        customBranding: true,
        whatsappEnabled: true,
        apiAccess: true,
        multiUserSeats: 4,
        notes: 'Fleet of 25 luxury coaches and Innovas. Uses 80mm thermal receipts at counter.'
      },
      {
        id: 'tenant_006',
        businessId: 'org_balaji_06',
        businessName: 'Shri Balaji Supermarket & Provisions',
        tradeName: 'Balaji Supermarket',
        ownerName: 'Ganesh Patil',
        ownerEmail: 'balaji.supermarket@gmail.com',
        ownerPhone: '+91 98901 44556',
        gstin: '27AAGCS1122N1Z4',
        state: 'Maharashtra (27)',
        category: 'retail_kirana',
        plan: 'starter_free',
        status: 'active',
        billingCycle: 'monthly',
        mrrPaise: 0,
        startDate: '2026-08-01',
        renewalDate: '2026-11-01',
        invoicesGenerated: 45,
        scanQuotaUsed: 18,
        scanQuotaLimit: 20,
        customBranding: false,
        whatsappEnabled: false,
        apiAccess: false,
        multiUserSeats: 1,
        notes: 'Approaching scan limit quota. Target candidate for Pro conversion.'
      },
      {
        id: 'tenant_007',
        businessId: 'org_metro_07',
        businessName: 'Metro Cold Chain Logistics Pvt Ltd',
        tradeName: 'Metro ColdChain',
        ownerName: 'Praveen Nair',
        ownerEmail: 'accounts@metrologistics.co.in',
        ownerPhone: '+91 98200 66112',
        gstin: '27AAECM4455R1Z3',
        state: 'Maharashtra (27)',
        category: 'transport_logistics',
        plan: 'enterprise_fleet',
        status: 'active',
        billingCycle: 'annual',
        mrrPaise: 29158,
        startDate: '2026-01-15',
        renewalDate: '2027-01-15',
        invoicesGenerated: 1240,
        scanQuotaUsed: 880,
        scanQuotaLimit: 2500,
        customBranding: true,
        whatsappEnabled: true,
        apiAccess: true,
        multiUserSeats: 5
      },
      {
        id: 'tenant_008',
        businessId: 'org_greenleaf_08',
        businessName: 'GreenLeaf Organic Agro Foods',
        tradeName: 'GreenLeaf Agro',
        ownerName: 'Harpreet Singh Dhillon',
        ownerEmail: 'info@greenleafagro.com',
        ownerPhone: '+91 98720 99443',
        gstin: '03AAEFG8899Q1ZQ',
        state: 'Punjab (03)',
        category: 'wholesale_trading',
        plan: 'pro_annual',
        status: 'grace_period',
        billingCycle: 'monthly',
        mrrPaise: 12900,
        startDate: '2026-08-28',
        renewalDate: '2026-10-28',
        invoicesGenerated: 180,
        scanQuotaUsed: 340,
        scanQuotaLimit: 500,
        customBranding: true,
        whatsappEnabled: true,
        apiAccess: false,
        multiUserSeats: 2,
        notes: 'Renewal payment failed on card. Grace period active till Oct 28.'
      },
      {
        id: 'tenant_009',
        businessId: 'org_horizon_09',
        businessName: 'Horizon Interior Studio LLP',
        tradeName: 'Horizon Studio',
        ownerName: 'Kavita Reddy',
        ownerEmail: 'accounts@horizonstudio.design',
        ownerPhone: '+91 98480 55112',
        gstin: '36AAHCH6677T1Z8',
        state: 'Telangana (36)',
        category: 'freelance_consulting',
        plan: 'pro_annual',
        status: 'past_due',
        billingCycle: 'annual',
        mrrPaise: 8325,
        startDate: '2025-09-25',
        renewalDate: '2026-09-25',
        invoicesGenerated: 112,
        scanQuotaUsed: 190,
        scanQuotaLimit: 500,
        customBranding: true,
        whatsappEnabled: false,
        apiAccess: false,
        multiUserSeats: 1,
        notes: 'Past due by 22 days. Renewal reminder sent.'
      },
      {
        id: 'tenant_010',
        businessId: 'org_fasttrack_10',
        businessName: 'FastTrack Cargo & Parcel Hub',
        tradeName: 'FastTrack Express',
        ownerName: 'Subir Banerjee',
        ownerEmail: 'kolkata.hub@fasttrackexpress.in',
        ownerPhone: '+91 98310 11998',
        gstin: '19AAECF1199K1Z5',
        state: 'West Bengal (19)',
        category: 'transport_logistics',
        plan: 'starter_free',
        status: 'active',
        billingCycle: 'monthly',
        mrrPaise: 0,
        startDate: '2026-09-10',
        renewalDate: '2026-11-10',
        invoicesGenerated: 28,
        scanQuotaUsed: 12,
        scanQuotaLimit: 20,
        customBranding: false,
        whatsappEnabled: false,
        apiAccess: false,
        multiUserSeats: 1
      },
      {
        id: 'tenant_011',
        businessId: 'org_saikrupa_11',
        businessName: 'Sai Krupa Hardware & Building Supplies',
        tradeName: 'Sai Krupa Hardware',
        ownerName: 'Anil Deshmukh',
        ownerEmail: 'anil@saikrupahardware.in',
        ownerPhone: '+91 98230 44991',
        gstin: '27AAECS7788P1Z6',
        state: 'Maharashtra (27)',
        category: 'wholesale_trading',
        plan: 'pro_annual',
        status: 'trial',
        billingCycle: 'annual',
        mrrPaise: 8325,
        startDate: '2026-10-05',
        renewalDate: '2026-10-25',
        invoicesGenerated: 55,
        scanQuotaUsed: 35,
        scanQuotaLimit: 500,
        customBranding: true,
        whatsappEnabled: true,
        apiAccess: false,
        multiUserSeats: 2,
        notes: '14-day Pro trial initiated on Oct 5. Activated custom logo and thermal printing.'
      },
      {
        id: 'tenant_012',
        businessId: 'org_himalayan_12',
        businessName: 'Himalayan Eco Treks & Car Rentals',
        tradeName: 'Himalayan Cabs',
        ownerName: 'Raman Rawat',
        ownerEmail: 'info@himalayancabs.com',
        ownerPhone: '+91 94120 77665',
        gstin: '05AAACH8844D1Z9',
        state: 'Uttarakhand (05)',
        category: 'taxi_fleet',
        plan: 'enterprise_fleet',
        status: 'active',
        billingCycle: 'annual',
        mrrPaise: 29158,
        startDate: '2026-05-01',
        renewalDate: '2027-05-01',
        invoicesGenerated: 430,
        scanQuotaUsed: 290,
        scanQuotaLimit: 2500,
        customBranding: true,
        whatsappEnabled: true,
        apiAccess: true,
        multiUserSeats: 3,
        notes: 'Chardham Yatra fleet management. Duty slips and toll slip OCR heavily utilized.'
      }
    ];
  },

  resetAllData(): void {
    localStorage.clear();
  }
};

