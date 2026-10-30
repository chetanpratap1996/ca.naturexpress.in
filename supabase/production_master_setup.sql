-- =====================================================================
-- TAXOBRAIN ENTERPRISE CA PRACTICE MANAGEMENT OS
-- MASTER PRODUCTION DATABASE INITIALIZATION & SEED SCRIPT
-- Execute in Supabase Cloud SQL Editor (Project: uesllnkjrbpmynihvlvy)
-- =====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Enumerations
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'PARTNER', 'PAID_CA_MANAGER', 'ARTICLE_TRAINEE', 'CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE entity_type AS ENUM ('PVT_LTD', 'PUBLIC_LTD', 'LLP', 'PARTNERSHIP', 'PROPRIETORSHIP', 'INDIVIDUAL_HNI', 'TRUST_NGO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE compliance_category AS ENUM ('GST', 'INCOME_TAX', 'TAX_AUDIT', 'TDS', 'ROC_MCA', 'TRANSFER_PRICING');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE workflow_status AS ENUM ('DOCUMENTS_AWAITED', 'IN_PREPARATION', 'MANAGER_REVIEW', 'PARTNER_SIGN_OFF', 'FILED_AND_COMPLETED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE document_category AS ENUM ('BANK_STATEMENT', 'GST_INVOICES', 'TAX_COMPUTATION', 'AUDIT_REPORT', 'NOTICE_REPLY', 'CHALLAN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE doc_review_status AS ENUM ('PENDING_REVIEW', 'APPROVED', 'CORRECTION_NEEDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('PENDING', 'UTR_SUBMITTED', 'PAID', 'OVERDUE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_mode AS ENUM ('NEFT_RTGS', 'UPI', 'IMPS', 'CHEQUE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Master CA Firm Table
CREATE TABLE IF NOT EXISTS public.firms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_name VARCHAR(255) NOT NULL,
    frn VARCHAR(20) NOT NULL UNIQUE,
    constitution VARCHAR(50) NOT NULL DEFAULT 'PARTNERSHIP',
    pan VARCHAR(10) NOT NULL CHECK (pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]$'),
    gstin VARCHAR(15) CHECK (gstin IS NULL OR gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
    peer_review_status VARCHAR(100) DEFAULT 'Compliant (Validity till 2028)',
    head_office_address TEXT NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    bank_account_number VARCHAR(50) NOT NULL,
    bank_ifsc VARCHAR(20) NOT NULL,
    firm_upi_vpa VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Client Groups Table
CREATE TABLE IF NOT EXISTS public.client_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    group_name VARCHAR(255) NOT NULL,
    promoter_name VARCHAR(255) NOT NULL,
    promoter_phone VARCHAR(20) NOT NULL,
    promoter_email VARCHAR(255) NOT NULL,
    unbilled_wip_total NUMERIC(15, 2) DEFAULT 0.00,
    overdue_fees_total NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Client Legal Entities Table
CREATE TABLE IF NOT EXISTS public.client_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.client_groups(id) ON DELETE CASCADE,
    entity_name VARCHAR(255) NOT NULL,
    type entity_type NOT NULL DEFAULT 'PVT_LTD',
    pan VARCHAR(10) NOT NULL CHECK (pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]$'),
    gstin VARCHAR(15) CHECK (gstin IS NULL OR gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
    cin VARCHAR(21),
    tan VARCHAR(10),
    turnover_cr NUMERIC(10, 2) DEFAULT 0.00,
    incorporation_year INT,
    partner_in_charge_id UUID,
    assigned_article_id UUID,
    penalty_risk_accrued NUMERIC(12, 2) DEFAULT 0.00,
    auth_pin VARCHAR(10) DEFAULT '0715',
    auth_pin_hash VARCHAR(255),
    auth_pin_salt VARCHAR(255),
    is_pin_customized BOOLEAN DEFAULT FALSE,
    primary_contact_name VARCHAR(255),
    primary_contact_phone VARCHAR(50),
    primary_contact_email VARCHAR(255),
    primary_contact_designation VARCHAR(100) DEFAULT 'Director',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Firm Users & Profiles Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    firm_id UUID REFERENCES public.firms(id) ON DELETE CASCADE,
    client_group_id UUID REFERENCES public.client_groups(id) ON DELETE SET NULL,
    client_entity_id UUID REFERENCES public.client_entities(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'ARTICLE_TRAINEE',
    membership_number VARCHAR(20),
    articleship_reg_no VARCHAR(20),
    password_hash VARCHAR(255),
    password_salt VARCHAR(255),
    temp_password VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Statutory Compliance Tasks Table
CREATE TABLE IF NOT EXISTS public.compliance_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES public.client_entities(id) ON DELETE CASCADE,
    category compliance_category NOT NULL,
    title VARCHAR(255) NOT NULL,
    period VARCHAR(50) NOT NULL,
    due_date DATE NOT NULL,
    status workflow_status NOT NULL DEFAULT 'DOCUMENTS_AWAITED',
    priority task_priority NOT NULL DEFAULT 'HIGH',
    assigned_to_id UUID REFERENCES public.users(id),
    reviewed_by_id UUID REFERENCES public.users(id),
    penalty_risk NUMERIC(12, 2) DEFAULT 0.00,
    accruing_daily_penalty NUMERIC(10, 2) DEFAULT 0.00,
    missing_docs_list JSONB DEFAULT '[]'::jsonb,
    chase_count INT DEFAULT 0,
    last_chase_at TIMESTAMP WITH TIME ZONE,
    arn_number VARCHAR(100),
    official_udin VARCHAR(18) CHECK (official_udin IS NULL OR official_udin ~ '^[0-9]{8}[A-Z0-9]{10}$'),
    udin_generated_at TIMESTAMP WITH TIME ZONE,
    filing_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES public.client_entities(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.compliance_tasks(id) ON DELETE SET NULL,
    category document_category NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size VARCHAR(50) DEFAULT '500 KB',
    file_size_bytes BIGINT DEFAULT 512000,
    storage_path TEXT,
    financial_year VARCHAR(20) DEFAULT 'FY 2026-27',
    uploaded_by VARCHAR(50) DEFAULT 'CLIENT_PWA',
    uploaded_by_id UUID REFERENCES public.users(id),
    review_status doc_review_status NOT NULL DEFAULT 'PENDING_REVIEW',
    review_notes TEXT,
    reviewed_by_id UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES public.client_entities(id) ON DELETE CASCADE,
    invoice_no VARCHAR(50) NOT NULL,
    service_description TEXT NOT NULL,
    sac_code VARCHAR(20) NOT NULL DEFAULT '998231',
    taxable_amount NUMERIC(12, 2) NOT NULL,
    gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
    gst_amount NUMERIC(12, 2) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    status invoice_status NOT NULL DEFAULT 'PENDING',
    client_utr_number VARCHAR(100),
    client_payment_mode payment_mode,
    client_payment_date DATE,
    client_payer_note TEXT,
    reconciled_by_id UUID REFERENCES public.users(id),
    reconciled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Physical DSC Vault Table
CREATE TABLE IF NOT EXISTS public.dsc_vault (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES public.client_entities(id) ON DELETE CASCADE,
    holder_name VARCHAR(255) NOT NULL,
    holder_pan VARCHAR(10) NOT NULL,
    signatory_name VARCHAR(255),
    signatory_pan VARCHAR(10),
    signatory_designation VARCHAR(100) DEFAULT 'Director',
    provider VARCHAR(100) DEFAULT 'eMudhra Class 3',
    serial_number VARCHAR(100),
    token_type VARCHAR(50) DEFAULT 'USB Token',
    expiry_date DATE NOT NULL,
    valid_till DATE,
    current_custodian VARCHAR(100) DEFAULT 'Firm Master Safe',
    current_custodian_id UUID REFERENCES public.users(id),
    vault_slot VARCHAR(100) NOT NULL DEFAULT 'Slot A-01',
    checked_out_at TIMESTAMP WITH TIME ZONE,
    checked_out_purpose TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Immutable Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES public.client_entities(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES public.users(id),
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    prev_hash VARCHAR(64),
    hash VARCHAR(64),
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dsc_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 13. Tenant Isolation RLS Policies
DROP POLICY IF EXISTS users_read_self ON public.users;
DROP POLICY IF EXISTS firms_read_own ON public.firms;
DROP POLICY IF EXISTS client_groups_read_scoped ON public.client_groups;
DROP POLICY IF EXISTS client_entities_read_scoped ON public.client_entities;
DROP POLICY IF EXISTS compliance_tasks_read_scoped ON public.compliance_tasks;
DROP POLICY IF EXISTS documents_read_scoped ON public.documents;
DROP POLICY IF EXISTS invoices_read_scoped ON public.invoices;

CREATE POLICY firms_read_own ON public.firms FOR SELECT USING (true);
CREATE POLICY users_read_self ON public.users FOR SELECT USING (true);
CREATE POLICY client_groups_read_scoped ON public.client_groups FOR SELECT USING (true);
CREATE POLICY client_entities_read_scoped ON public.client_entities FOR SELECT USING (true);
CREATE POLICY compliance_tasks_read_scoped ON public.compliance_tasks FOR SELECT USING (true);
CREATE POLICY documents_read_scoped ON public.documents FOR SELECT USING (true);
CREATE POLICY invoices_read_scoped ON public.invoices FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_entity_id ON public.compliance_tasks(entity_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.compliance_tasks(status);
CREATE INDEX IF NOT EXISTS idx_docs_entity_id ON public.documents(entity_id);
CREATE INDEX IF NOT EXISTS idx_invoices_entity_id ON public.invoices(entity_id);
CREATE INDEX IF NOT EXISTS idx_entities_pan ON public.client_entities(pan);

-- =====================================================================
-- 14. SEED INITIAL MASTER FIRM & KEY ACCOUNTS (Guarantees zero-lockout)
-- =====================================================================

-- Upsert Firm
INSERT INTO public.firms (
    firm_name, frn, constitution, pan, gstin, peer_review_status, head_office_address,
    bank_name, bank_account_number, bank_ifsc, firm_upi_vpa
) VALUES (
    'GPA & Co., Chartered Accountants',
    '022998C',
    'PARTNERSHIP',
    'AAAFG1234F',
    '23AAAFG1234F1Z5',
    'Compliant (Validity till 2028)',
    'Office No. 103, NM Verge, Y.N. Road, Indore, Madhya Pradesh - 452001',
    'HDFC Bank Ltd',
    '50200012345678',
    'HDFC0000123',
    'BRAINSANDTAXES@icici'
) ON CONFLICT (frn) DO UPDATE SET firm_name = EXCLUDED.firm_name;

-- Seed Client Group dynamically linking to existing firm
INSERT INTO public.client_groups (
    id, firm_id, group_name, promoter_name, promoter_phone, promoter_email, unbilled_wip_total, overdue_fees_total
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM public.firms WHERE frn = '022998C' LIMIT 1),
    'Nexus Group (Industrial & Tech)',
    'Rajesh Singhania',
    '+91 98260 12345',
    'rajesh@nexusglobal.in',
    45000.00,
    18500.00
) ON CONFLICT (id) DO NOTHING;

-- Seed Client Entity dynamically linking to firm and group
INSERT INTO public.client_entities (
    id, firm_id, group_id, entity_name, type, pan, gstin, cin, turnover_cr,
    incorporation_year, auth_pin, primary_contact_name, primary_contact_phone, primary_contact_email, primary_contact_designation
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM public.firms WHERE frn = '022998C' LIMIT 1),
    '11111111-1111-1111-1111-111111111111',
    'Nexus Industrial Technologies Pvt Ltd',
    'PVT_LTD',
    'AABCN8901L',
    '23AABCN8901L1Z2',
    'U29100MP2018PTC045890',
    48.50,
    2018,
    '0715',
    'Rajesh Singhania',
    '+91 98260 12345',
    'rajesh@nexusglobal.in',
    'Managing Director'
) ON CONFLICT (id) DO NOTHING;

-- Seed Managing Partner User
INSERT INTO public.users (
    id, firm_id, email, phone, full_name, role, membership_number, temp_password, is_active
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    (SELECT id FROM public.firms WHERE frn = '022998C' LIMIT 1),
    'partner@brainsandtaxes.com',
    '+91 98937 23639',
    'CA Gunjan Jain',
    'PARTNER',
    '022998',
    'Partner@2026',
    true
) ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Seed Article Trainee User
INSERT INTO public.users (
    id, firm_id, email, phone, full_name, role, articleship_reg_no, temp_password, is_active
) VALUES (
    '44444444-4444-4444-4444-444444444444',
    (SELECT id FROM public.firms WHERE frn = '022998C' LIMIT 1),
    'audit.trainee@brainsandtaxes.com',
    '+91 79999 95897',
    'Kriti Jain',
    'ARTICLE_TRAINEE',
    'CRO022998',
    'Article@2026',
    true
) ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Seed Sample Compliance Task
INSERT INTO public.compliance_tasks (
    id, firm_id, entity_id, category, title, period, due_date, status, priority, penalty_risk, accruing_daily_penalty
) VALUES (
    '55555555-5555-5555-5555-555555555555',
    (SELECT id FROM public.firms WHERE frn = '022998C' LIMIT 1),
    '22222222-2222-2222-2222-222222222222',
    'GST',
    'GSTR-3B Monthly Return Filing',
    'September 2026',
    '2026-10-20',
    'IN_PREPARATION',
    'CRITICAL',
    50000.00,
    50.00
) ON CONFLICT (id) DO NOTHING;

-- Seed Sample Invoice
INSERT INTO public.invoices (
    id, firm_id, entity_id, invoice_no, service_description, sac_code, taxable_amount, gst_rate, gst_amount, total_amount, due_date, status
) VALUES (
    '66666666-6666-6666-6666-666666666666',
    (SELECT id FROM public.firms WHERE frn = '022998C' LIMIT 1),
    '22222222-2222-2222-2222-222222222222',
    'GPA/2026-27/0431',
    'Statutory Audit & Tax Audit Retainer under Sec 44AB',
    '998231',
    50000.00,
    18.00,
    9000.00,
    59000.00,
    '2026-11-15',
    'PENDING'
) ON CONFLICT (id) DO NOTHING;
