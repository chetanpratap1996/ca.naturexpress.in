-- =====================================================================
-- BRAINS & TAXES ENTERPRISE CA OS — MULTI-BILLION DOLLAR ARCHITECTURE
-- Migration: 20261118_enterprise_dual_track_knowledge_engine.sql
-- Pillar 3: Dual-Track Relational & Vector Legal Database with Primary Provenance
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Enable vector extension for 1536-dimensional semantic search
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE authority_forum_enum AS ENUM (
        'PARLIAMENT_OF_INDIA',
        'CENTRAL_BOARD_OF_DIRECT_TAXES',
        'CENTRAL_BOARD_OF_INDIRECT_TAXES_AND_CUSTOMS',
        'MINISTRY_OF_CORPORATE_AFFAIRS',
        'RESERVE_BANK_OF_INDIA',
        'ICAI_COUNCIL',
        'SUPREME_COURT_OF_INDIA',
        'HIGH_COURT_OF_DELHI',
        'HIGH_COURT_OF_BOMBAY',
        'HIGH_COURT_OF_MADHYA_PRADESH',
        'HIGH_COURT_OF_CALCUTTA',
        'HIGH_COURT_OF_MADRAS',
        'HIGH_COURT_OF_KARNATAKA',
        'HIGH_COURT_OF_GUJARAT',
        'INCOME_TAX_APPELLATE_TRIBUNAL_SPECIAL_BENCH',
        'INCOME_TAX_APPELLATE_TRIBUNAL_DIVISION_BENCH',
        'CESTAT_DIVISION_BENCH',
        'GSTAT_PRINCIPAL_BENCH'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE source_doc_type_enum AS ENUM (
        'CENTRAL_ACT',
        'FINANCE_ACT_AMENDMENT',
        'STATUTORY_RULE',
        'OFFICIAL_GAZETTE_NOTIFICATION',
        'BOARD_CIRCULAR_SECTION_119',
        'BOARD_CIRCULAR_SECTION_168',
        'JUDICIAL_JUDGMENT',
        'ICAI_AUDITING_STANDARD',
        'ICAI_GUIDANCE_NOTE'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE verification_state_enum AS ENUM (
        'DRAFT_EXTRACTION',
        'UNDER_FCA_AUDIT',
        'VERIFIED_PRIMARY_SOURCE',
        'SUPERSEDED_OUTDATED',
        'QUARANTINED_DEFECTIVE'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE precedent_treatment_enum AS ENUM (
        'GOOD_LAW_BINDING',
        'AFFIRMED_BY_SUPREME_COURT',
        'DISTINGUISHED_ON_FACTS',
        'OVERRULED_BY_LARGER_BENCH',
        'SUPERSEDED_BY_RETROSPECTIVE_AMENDMENT',
        'CONTRARY_HIGH_COURT_VIEWS_EXIST'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================================
-- TABLE 1: PRIMARY LEGAL SOURCES (LAYER 1 PROVENANCE)
-- =====================================================================
CREATE TABLE IF NOT EXISTS primary_legal_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_code VARCHAR(100) NOT NULL UNIQUE, -- e.g. "GAZETTE-FA-2025", "CBDT-CIRC-19-2019"
    source_type source_doc_type_enum NOT NULL,
    issuing_authority authority_forum_enum NOT NULL,
    official_title TEXT NOT NULL,
    official_reference_number VARCHAR(150) NOT NULL, -- e.g. "Circular No. 19/2019 [F. No. 225/157/2019-ITA.II]"
    gazette_notification_number VARCHAR(100),         -- e.g. "G.S.R. 561(E)"
    publication_date DATE NOT NULL,
    commencement_date DATE NOT NULL,
    primary_source_uri TEXT NOT NULL,
    sha256_checksum VARCHAR(64) NOT NULL,            -- Cryptographic verification hash
    is_active_law BOOLEAN DEFAULT TRUE,
    repeal_or_omission_date DATE,
    repealing_act_ref VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pls_source_code ON primary_legal_sources(source_code);
CREATE INDEX IF NOT EXISTS idx_pls_authority ON primary_legal_sources(issuing_authority);
CREATE INDEX IF NOT EXISTS idx_pls_dates ON primary_legal_sources(commencement_date, repeal_or_omission_date);

-- =====================================================================
-- TABLE 2: STATUTORY PROVISIONS (LAYER 2 STRUCTURED LEGAL GRAPH)
-- =====================================================================
CREATE TABLE IF NOT EXISTS statutory_provisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provision_code VARCHAR(100) NOT NULL UNIQUE, -- e.g. "IT-1961-SEC-43BH", "CGST-2017-SEC-16-2-AA"
    primary_source_id UUID NOT NULL REFERENCES primary_legal_sources(id) ON DELETE RESTRICT,
    act_code VARCHAR(50) NOT NULL CHECK (act_code IN (
        'INCOME_TAX_ACT_1961',
        'INCOME_TAX_ACT_2025',
        'CGST_ACT_2017',
        'IGST_ACT_2017',
        'COMPANIES_ACT_2013',
        'MSMED_ACT_2006',
        'FEMA_1999'
    )),
    domain_id VARCHAR(50) NOT NULL,
    section_number VARCHAR(20) NOT NULL,
    sub_section VARCHAR(20),
    clause VARCHAR(20),
    title TEXT NOT NULL,
    verbatim_statutory_text TEXT NOT NULL,
    is_non_obstante BOOLEAN DEFAULT FALSE,
    has_deeming_fiction BOOLEAN DEFAULT FALSE,
    
    -- Explicit Temporal Scope
    effective_from DATE NOT NULL,
    effective_to DATE, -- NULL indicates current active law
    applicable_previous_years TEXT[] DEFAULT '{}',
    applicable_assessment_years TEXT[] DEFAULT '{}',
    applicable_tax_years TEXT[] DEFAULT '{}',
    
    -- Omission Tracking
    is_omitted BOOLEAN DEFAULT FALSE,
    omission_date DATE,
    omitted_by_source_id UUID REFERENCES primary_legal_sources(id),
    
    -- Verification Workflow State
    verification_state verification_state_enum DEFAULT 'VERIFIED_PRIMARY_SOURCE',
    verified_by_membership_no VARCHAR(20), -- ICAI 6-digit Membership No
    verification_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Hybrid Full Text Search Vector
    fts_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(verbatim_statutory_text, '') || ' ' || coalesce(section_number, ''))
    ) STORED,
    
    -- Vector Embeddings (1536-dimensional for OpenAI / Gemini pgvector)
    embedding vector(1536),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sp_provision_code ON statutory_provisions(provision_code);
CREATE INDEX IF NOT EXISTS idx_sp_act_section ON statutory_provisions(act_code, section_number);
CREATE INDEX IF NOT EXISTS idx_sp_domain ON statutory_provisions(domain_id);
CREATE INDEX IF NOT EXISTS idx_sp_temporal ON statutory_provisions(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_sp_omission ON statutory_provisions(is_omitted, omission_date);
CREATE INDEX IF NOT EXISTS idx_sp_fts ON statutory_provisions USING gin(fts_vector);
-- HNSW Vector Index for sub-millisecond semantic similarity search
CREATE INDEX IF NOT EXISTS idx_sp_embedding_hnsw ON statutory_provisions USING hnsw (embedding vector_cosine_ops);

-- =====================================================================
-- TABLE 3: PROVISOS AND EXPLANATIONS (LAYER 2 GRANULAR SUB-RULES)
-- =====================================================================
CREATE TABLE IF NOT EXISTS provisos_and_explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provision_id UUID NOT NULL REFERENCES statutory_provisions(id) ON DELETE CASCADE,
    element_type VARCHAR(20) NOT NULL CHECK (element_type IN ('PROVISO', 'EXPLANATION')),
    ordinal_number INT NOT NULL, -- 1 = First Proviso, 2 = Second Proviso
    verbatim_text TEXT NOT NULL,
    condition_precedent TEXT,
    statutory_effect TEXT NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pe_provision ON provisos_and_explanations(provision_id, element_type);

-- =====================================================================
-- TABLE 4: LEGISLATIVE AMENDMENT HISTORY (TEMPORAL BRANCHING)
-- =====================================================================
CREATE TABLE IF NOT EXISTS legislative_amendments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provision_id UUID NOT NULL REFERENCES statutory_provisions(id) ON DELETE CASCADE,
    amending_source_id UUID NOT NULL REFERENCES primary_legal_sources(id) ON DELETE RESTRICT,
    amendment_type VARCHAR(50) NOT NULL CHECK (amendment_type IN (
        'INSERTION',
        'SUBSTITUTION',
        'OMISSION',
        'RETROSPECTIVE_RELAXATION',
        'SUNSET_EXPIRY'
    )),
    effective_date DATE NOT NULL,
    is_retrospective BOOLEAN DEFAULT FALSE,
    retrospective_effective_date DATE,
    applicable_financial_years TEXT[] DEFAULT '{}',
    applicable_assessment_years TEXT[] DEFAULT '{}',
    applicable_tax_years TEXT[] DEFAULT '{}',
    nature_of_amendment TEXT NOT NULL,
    pre_amendment_verbatim TEXT,
    post_amendment_verbatim TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_la_provision ON legislative_amendments(provision_id);
CREATE INDEX IF NOT EXISTS idx_la_effective ON legislative_amendments(effective_date, is_retrospective);

-- =====================================================================
-- TABLE 5: JUDICIAL PRECEDENTS (LAYER 3 JURISPRUDENTIAL GRAPH)
-- =====================================================================
CREATE TABLE IF NOT EXISTS judicial_precedents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_code VARCHAR(100) NOT NULL UNIQUE, -- e.g. "SC-2022-MOHIT-MINERALS"
    case_title VARCHAR(255) NOT NULL,
    neutral_citation VARCHAR(100),
    law_report_citation VARCHAR(100) NOT NULL, -- e.g. "(2022) 10 SCC 700"
    adjudicating_forum authority_forum_enum NOT NULL,
    bench_composition VARCHAR(50) NOT NULL CHECK (bench_composition IN (
        'SINGLE_JUDGE',
        'DIVISION_BENCH',
        'FULL_BENCH',
        'CONSTITUTION_BENCH'
    )),
    judgment_date DATE NOT NULL,
    key_legal_issue TEXT NOT NULL,
    ratio_decidendi TEXT NOT NULL,
    treatment_status precedent_treatment_enum NOT NULL DEFAULT 'GOOD_LAW_BINDING',
    is_overruled BOOLEAN DEFAULT FALSE,
    overruled_by_precedent_id UUID REFERENCES judicial_precedents(id),
    superseded_by_source_id UUID REFERENCES primary_legal_sources(id),
    favourability VARCHAR(50) NOT NULL CHECK (favourability IN (
        'FAVOUR_OF_ASSESSEE',
        'FAVOUR_OF_REVENUE',
        'SPLIT_PRO_RATA'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jp_citation ON judicial_precedents(law_report_citation);
CREATE INDEX IF NOT EXISTS idx_jp_forum ON judicial_precedents(adjudicating_forum, judgment_date);
CREATE INDEX IF NOT EXISTS idx_jp_treatment ON judicial_precedents(treatment_status, is_overruled);

-- =====================================================================
-- TABLE 6: PROVISION TO PRECEDENT ASSOCIATION MATRIX
-- =====================================================================
CREATE TABLE IF NOT EXISTS provision_precedent_associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provision_id UUID NOT NULL REFERENCES statutory_provisions(id) ON DELETE CASCADE,
    precedent_id UUID NOT NULL REFERENCES judicial_precedents(id) ON DELETE CASCADE,
    association_type VARCHAR(50) NOT NULL CHECK (association_type IN (
        'INTERPRETS_STATUTE',
        'DECLARES_ULTRA_VIRES',
        'READS_DOWN_PROVISION',
        'AFFIRMS_BENEVOLENT_VIEW',
        'ESTABLISHES_EXCEPTION'
    )),
    binding_authority_notes TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provision_id, precedent_id)
);

CREATE INDEX IF NOT EXISTS idx_ppa_link ON provision_precedent_associations(provision_id, precedent_id);

-- =====================================================================
-- TABLE 7: AUDIT EVIDENCE PRECONDITIONS (PILLAR 2 GATEWAY REPOSITORY)
-- =====================================================================
CREATE TABLE IF NOT EXISTS audit_evidence_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provision_id UUID NOT NULL REFERENCES statutory_provisions(id) ON DELETE CASCADE,
    condition_code VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    issuing_authority VARCHAR(255) NOT NULL,
    accepted_formats TEXT[] DEFAULT '{"PDF_SIGNED", "JSON_PORTAL_EXPORT"}',
    is_mandatory_condition_precedent BOOLEAN DEFAULT TRUE,
    statutory_rationale TEXT NOT NULL,
    consequence_of_absence TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_aer_provision ON audit_evidence_requirements(provision_id);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
ALTER TABLE primary_legal_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE statutory_provisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE provisos_and_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE legislative_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE judicial_precedents ENABLE ROW LEVEL SECURITY;
ALTER TABLE provision_precedent_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_evidence_requirements ENABLE ROW LEVEL SECURITY;

-- Read policy: Universal read access for all verified firm users
CREATE POLICY read_pls_policy ON primary_legal_sources FOR SELECT USING (true);
CREATE POLICY read_sp_policy ON statutory_provisions FOR SELECT USING (true);
CREATE POLICY read_pe_policy ON provisos_and_explanations FOR SELECT USING (true);
CREATE POLICY read_la_policy ON legislative_amendments FOR SELECT USING (true);
CREATE POLICY read_jp_policy ON judicial_precedents FOR SELECT USING (true);
CREATE POLICY read_ppa_policy ON provision_precedent_associations FOR SELECT USING (true);
CREATE POLICY read_aer_policy ON audit_evidence_requirements FOR SELECT USING (true);
