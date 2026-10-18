-- ============================================================================
-- BILL SETU (बिल सेतु) - PRODUCTION MULTI-TENANT POSTGRESQL / SUPABASE SCHEMA
-- Designed for Taxi, Cab & Fleet GST Invoicing, AI Bill Scanning & Cloud Accounting
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean existing schema if necessary (Production-safe)
-- DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;

-- ----------------------------------------------------------------------------
-- 1. ORGANIZATIONS (Multi-Tenant Master)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan_tier VARCHAR(50) DEFAULT 'pro_fleet' CHECK (plan_tier IN ('free', 'starter', 'pro_fleet', 'enterprise')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. BUSINESS PROFILES (Company & GST Configuration)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_configured BOOLEAN DEFAULT FALSE,
    business_category VARCHAR(50) DEFAULT 'taxi_fleet' CHECK (business_category IN ('taxi_fleet', 'travel_agency', 'general_services')),
    legal_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    is_gst_registered BOOLEAN DEFAULT TRUE,
    gstin VARCHAR(15) CHECK (gstin IS NULL OR gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'),
    pan VARCHAR(10) CHECK (pan IS NULL OR pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'),
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(100) NOT NULL,
    state_code VARCHAR(2) NOT NULL, -- e.g. "09" for Uttar Pradesh, "27" for Maharashtra
    state_name VARCHAR(100) NOT NULL,
    pincode VARCHAR(6) NOT NULL CHECK (pincode ~ '^[0-9]{6}$'),
    email VARCHAR(255),
    phone VARCHAR(20),
    website VARCHAR(255),
    logo_url TEXT,
    signature_url TEXT,
    invoice_prefix VARCHAR(20) DEFAULT 'BCV/26-27/',
    next_invoice_sequence INT DEFAULT 1,
    default_terms TEXT,
    
    -- Bank & NPCI Dynamic UPI Settlement Details
    bank_name VARCHAR(100),
    bank_account_no VARCHAR(50),
    bank_ifsc VARCHAR(20),
    bank_branch VARCHAR(100),
    account_holder_name VARCHAR(255),
    upi_id VARCHAR(100), -- Dynamic UPI payment QR generation

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. USERS & ROLES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'operator', 'accountant')),
    has_completed_onboarding BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. PARTIES (Customers & Vendors Ledger)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('customer', 'supplier')),
    category VARCHAR(50) DEFAULT 'corporate_client' CHECK (category IN ('corporate_client', 'individual_passenger', 'vendor')),
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    gstin VARCHAR(15) CHECK (gstin IS NULL OR gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'),
    pan VARCHAR(10),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state_code VARCHAR(2) NOT NULL,
    pincode VARCHAR(6),
    lookup_status VARCHAR(50) DEFAULT 'unverified_manual' CHECK (lookup_status IN ('verified_active', 'unverified_manual', 'cancelled', 'not_found', 'error')),
    
    -- Running Ledger Balance (in Paise: + You'll Get / - You'll Give)
    current_balance_paise BIGINT DEFAULT 0,
    credit_period_days INT DEFAULT 15,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. ITEMS & FLEET TARIFF PACKAGES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    hsn_sac VARCHAR(20) NOT NULL DEFAULT '996412', -- Default Taxi SAC
    unit VARCHAR(20) DEFAULT 'trip' CHECK (unit IN ('trip', 'km', 'hr', 'day', 'pcs', 'unit')),
    default_price_paise BIGINT NOT NULL DEFAULT 0,
    default_tax_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00, -- Standard cab 5%
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. INVOICES & QUOTATIONS (Taxi, Fleet & General Invoicing)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL DEFAULT 'gst_tax_invoice' CHECK (document_type IN ('gst_tax_invoice', 'quotation_estimate', 'non_gst_bill', 'purchase_tax_invoice', 'duty_slip')),
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    billing_type VARCHAR(50) NOT NULL DEFAULT 'b2b_corporate' CHECK (billing_type IN ('b2b_corporate', 'b2c_passenger')),
    tax_mode VARCHAR(20) NOT NULL DEFAULT 'exclusive' CHECK (tax_mode IN ('exclusive', 'inclusive', 'zero')),
    
    -- Party Reference
    party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    party_name VARCHAR(255) NOT NULL,
    party_gstin VARCHAR(15),
    party_phone VARCHAR(20),
    party_address TEXT,
    party_state_code VARCHAR(2) NOT NULL,
    place_of_supply_state_code VARCHAR(2) NOT NULL,

    -- Taxi & Fleet Duty Slip Details
    vehicle_number VARCHAR(20), -- e.g. UP65-XX-1234
    vehicle_category VARCHAR(50), -- Sedan, Ertiga, Innova Crysta, Tempo Traveller
    driver_name VARCHAR(100),
    route_or_duty TEXT,
    trip_start_at TIMESTAMPTZ,
    trip_end_at TIMESTAMPTZ,
    opening_km INT,
    closing_km INT,
    total_km INT,
    extra_km_rate_paise BIGINT DEFAULT 0,
    extra_hour_rate_paise BIGINT DEFAULT 0,
    night_halt_paise BIGINT DEFAULT 0,

    -- Financial Breakdown (in Paise for 100% precision)
    subtotal_paise BIGINT NOT NULL DEFAULT 0,
    total_discount_paise BIGINT DEFAULT 0,
    taxable_value_paise BIGINT NOT NULL DEFAULT 0,
    cgst_paise BIGINT DEFAULT 0,
    sgst_paise BIGINT DEFAULT 0,
    igst_paise BIGINT DEFAULT 0,
    
    -- Non-Taxable Reimbursements (GST Rule 33 Pure Agent Toll/Parking)
    toll_charges_paise BIGINT DEFAULT 0,
    parking_charges_paise BIGINT DEFAULT 0,
    state_permit_charges_paise BIGINT DEFAULT 0,
    total_reimbursements_paise BIGINT DEFAULT 0,
    
    round_off_paise BIGINT DEFAULT 0,
    grand_total_paise BIGINT NOT NULL DEFAULT 0,
    balance_due_paise BIGINT NOT NULL DEFAULT 0,

    -- Flags & Compliance
    is_reverse_charge BOOLEAN DEFAULT FALSE,
    is_interstate BOOLEAN DEFAULT FALSE,
    status VARCHAR(30) DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'paid', 'partially_paid', 'cancelled')),
    
    -- Public Hosted Web Portal Token (/inv/[share_token])
    share_token VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    notes TEXT,
    terms TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, invoice_number)
);

-- ----------------------------------------------------------------------------
-- 7. INVOICE LINE ITEMS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    hsn_sac VARCHAR(20) NOT NULL DEFAULT '996412',
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit VARCHAR(20) DEFAULT 'trip',
    unit_price_paise BIGINT NOT NULL,
    discount_paise BIGINT DEFAULT 0,
    taxable_amount_paise BIGINT NOT NULL,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00,
    cgst_paise BIGINT DEFAULT 0,
    sgst_paise BIGINT DEFAULT 0,
    igst_paise BIGINT DEFAULT 0,
    line_total_paise BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. SETTLEMENT PAYMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount_paise BIGINT NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_mode VARCHAR(30) NOT NULL CHECK (payment_mode IN ('upi', 'cash', 'bank_transfer', 'cheque', 'other')),
    reference_no VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. SETU SCAN - SCANNED DOCUMENTS VAULT
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scanned_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('duty_slip', 'kaccha_bill', 'toll_receipt', 'vendor_invoice', 'other')),
    original_url TEXT NOT NULL, -- Permanent Cloud Storage URL
    thumbnail_url TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    ocr_status VARCHAR(30) DEFAULT 'completed' CHECK (ocr_status IN ('processing', 'completed', 'failed')),
    ocr_confidence NUMERIC(5,2) DEFAULT 0.95,
    extracted_data_json JSONB NOT NULL, -- Raw extracted key-value pairs
    converted_to_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 10. GST AUDIT TRAIL (Immutable Log)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'status_change', 'cancel', 'payment'
    details JSONB,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- INDEXES FOR INSTANT SUB-SECOND QUERIES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_invoices_org_date ON invoices(organization_id, invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_share_token ON invoices(share_token);
CREATE INDEX IF NOT EXISTS idx_parties_org_name ON parties(organization_id, name);
CREATE INDEX IF NOT EXISTS idx_parties_gstin ON parties(organization_id, gstin);
CREATE INDEX IF NOT EXISTS idx_scans_org ON scanned_documents(organization_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) FOR MULTI-TENANT ISOLATION
-- ----------------------------------------------------------------------------
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanned_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Note: In production Supabase, policies check (organization_id = auth.jwt() ->> 'org_id'):
-- Example RLS Policy:
-- CREATE POLICY "Tenant Isolation for Invoices" ON invoices
-- FOR ALL USING (organization_id = auth.jwt() ->> 'org_id');
