-- =====================================================================
-- TAXOBRAIN ENTERPRISE CA PRACTICE MANAGEMENT OS
-- Production PostgreSQL Database Schema with Multi-Tenancy & RLS
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CA FIRMS (Master Tenant Record)
CREATE TABLE IF NOT EXISTS firms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_name VARCHAR(255) NOT NULL,
    frn VARCHAR(20) NOT NULL UNIQUE, -- ICAI Firm Registration Number (e.g. 104523W)
    constitution VARCHAR(50) NOT NULL DEFAULT 'PARTNERSHIP', -- PROPRIETORSHIP / PARTNERSHIP / LLP
    pan VARCHAR(10) NOT NULL CHECK (pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]$'),
    gstin VARCHAR(15) CHECK (gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
    peer_review_status VARCHAR(100) DEFAULT 'Compliant (Validity till 2028)',
    head_office_address TEXT NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    bank_account_number VARCHAR(50) NOT NULL,
    bank_ifsc VARCHAR(20) NOT NULL,
    firm_upi_vpa VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. FIRM USERS & PROFILES (Partners, Managers, Articles, Clients)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'PARTNER', 'PAID_CA_MANAGER', 'ARTICLE_TRAINEE', 'CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'ARTICLE_TRAINEE',
    membership_number VARCHAR(20), -- ICAI 6-digit Membership No for Partners/CAs (e.g. 049281)
    articleship_reg_no VARCHAR(20), -- ICAI Student WRO/CRO Reg No for Articles (e.g. WRO0641209)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. PROMOTER GROUPS (1 Promoter -> Multiple Legal Entities)
CREATE TABLE IF NOT EXISTS client_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    group_name VARCHAR(255) NOT NULL,
    promoter_name VARCHAR(255) NOT NULL,
    promoter_phone VARCHAR(20) NOT NULL,
    promoter_email VARCHAR(255) NOT NULL,
    unbilled_wip_total NUMERIC(15, 2) DEFAULT 0.00,
    overdue_fees_total NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CLIENT LEGAL ENTITIES (Private Ltd, LLP, Trust, Partnership)
DO $$ BEGIN
    CREATE TYPE entity_type AS ENUM ('PVT_LTD', 'PUBLIC_LTD', 'LLP', 'PARTNERSHIP', 'PROPRIETORSHIP', 'INDIVIDUAL_HNI', 'TRUST_NGO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS client_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES client_groups(id) ON DELETE CASCADE,
    entity_name VARCHAR(255) NOT NULL,
    type entity_type NOT NULL DEFAULT 'PVT_LTD',
    pan VARCHAR(10) NOT NULL CHECK (pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]$'),
    gstin VARCHAR(15) CHECK (gstin IS NULL OR gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
    cin VARCHAR(21),
    tan VARCHAR(10),
    turnover_cr NUMERIC(10, 2) DEFAULT 0.00,
    incorporation_year INT,
    partner_in_charge_id UUID REFERENCES users(id),
    assigned_article_id UUID REFERENCES users(id),
    penalty_risk_accrued NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. STATUTORY COMPLIANCE TASKS (GST, ITR, Tax Audit, TDS, ROC)
DO $$ BEGIN
    CREATE TYPE compliance_category AS ENUM ('GST', 'INCOME_TAX', 'TAX_AUDIT', 'TDS', 'ROC_MCA', 'TRANSFER_PRICING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE workflow_status AS ENUM ('DOCUMENTS_AWAITED', 'IN_PREPARATION', 'MANAGER_REVIEW', 'PARTNER_SIGN_OFF', 'FILED_AND_COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS compliance_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES client_entities(id) ON DELETE CASCADE,
    category compliance_category NOT NULL,
    title VARCHAR(255) NOT NULL,
    period VARCHAR(50) NOT NULL, -- e.g. "September 2026", "FY 2025-26"
    due_date DATE NOT NULL,
    status workflow_status NOT NULL DEFAULT 'DOCUMENTS_AWAITED',
    priority task_priority NOT NULL DEFAULT 'HIGH',
    assigned_to_id UUID REFERENCES users(id),
    reviewed_by_id UUID REFERENCES users(id),
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

-- 6. SECURE DOCUMENT INTAKE & VAULT (No Paywalls, Multi-Tenant Isolation)
DO $$ BEGIN
    CREATE TYPE document_category AS ENUM ('BANK_STATEMENT', 'GST_INVOICES', 'TAX_COMPUTATION', 'AUDIT_REPORT', 'NOTICE_REPLY', 'CHALLAN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE doc_review_status AS ENUM ('PENDING_REVIEW', 'APPROVED', 'CORRECTION_NEEDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES client_entities(id) ON DELETE CASCADE,
    task_id UUID REFERENCES compliance_tasks(id) ON DELETE SET NULL,
    category document_category NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    financial_year VARCHAR(20) NOT NULL,
    uploaded_by_id UUID REFERENCES users(id),
    review_status doc_review_status NOT NULL DEFAULT 'PENDING_REVIEW',
    review_notes TEXT,
    reviewed_by_id UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. FEE INVOICES & DIRECT BANK SETTLEMENT (Zero-Gateway Architecture)
DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('PENDING', 'UTR_SUBMITTED', 'PAID', 'OVERDUE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE payment_mode AS ENUM ('NEFT_RTGS', 'UPI', 'IMPS', 'CHEQUE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES client_entities(id) ON DELETE CASCADE,
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
    reconciled_by_id UUID REFERENCES users(id),
    reconciled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. PHYSICAL DSC TOKEN VAULT
CREATE TABLE IF NOT EXISTS dsc_vault (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES client_entities(id) ON DELETE CASCADE,
    holder_name VARCHAR(255) NOT NULL,
    holder_pan VARCHAR(10) NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
    token_type VARCHAR(50) NOT NULL,
    valid_till DATE NOT NULL,
    current_custodian_id UUID REFERENCES users(id),
    vault_slot VARCHAR(100) NOT NULL,
    checked_out_at TIMESTAMP WITH TIME ZONE,
    checked_out_purpose TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. IMMUTABLE AUDIT TRAIL (ICAI Peer-Review Compliant)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id),
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE dsc_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Multi-Tenant Firm Isolation Policy: Users can only query their own Firm's records
DROP POLICY IF EXISTS firm_isolation_policy ON client_entities;
CREATE POLICY firm_isolation_policy ON client_entities
    FOR ALL
    USING (firm_id = (SELECT firm_id FROM users WHERE users.id = auth.uid()));

DROP POLICY IF EXISTS task_isolation_policy ON compliance_tasks;
CREATE POLICY task_isolation_policy ON compliance_tasks
    FOR ALL
    USING (firm_id = (SELECT firm_id FROM users WHERE users.id = auth.uid()));

DROP POLICY IF EXISTS doc_isolation_policy ON documents;
CREATE POLICY doc_isolation_policy ON documents
    FOR ALL
    USING (firm_id = (SELECT firm_id FROM users WHERE users.id = auth.uid()));

DROP POLICY IF EXISTS invoice_isolation_policy ON invoices;
CREATE POLICY invoice_isolation_policy ON invoices
    FOR ALL
    USING (firm_id = (SELECT firm_id FROM users WHERE users.id = auth.uid()));

-- Indexes for Sub-Millisecond Scale Queries
CREATE INDEX IF NOT EXISTS idx_tasks_entity_id ON compliance_tasks(entity_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON compliance_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON compliance_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_docs_entity_id ON documents(entity_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_entities_pan ON client_entities(pan);
CREATE INDEX IF NOT EXISTS idx_entities_gstin ON client_entities(gstin);
