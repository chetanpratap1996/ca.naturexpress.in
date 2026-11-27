-- Step 1: Billing Autopilot & Core Ledger Model
-- Supports Proforma, Credit Note, Advance Receipt, Multi-line Rule 33 items,
-- Partial/TDS Payment Allocations, Retainer Schedules, Rate Cards, Dunning Logs & Gapless Series.

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS document_type VARCHAR(24) NOT NULL DEFAULT 'TAX_INVOICE',
  ADD COLUMN IF NOT EXISTS parent_invoice_id UUID,
  ADD COLUMN IF NOT EXISTS line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pure_agent_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tds_claimed_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tds_26as_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS irn VARCHAR(100),
  ADD COLUMN IF NOT EXISTS irn_ack_no VARCHAR(64),
  ADD COLUMN IF NOT EXISTS irn_ack_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS firm_gstin VARCHAR(15),
  ADD COLUMN IF NOT EXISTS round_off NUMERIC(8, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promissory_date DATE,
  ADD COLUMN IF NOT EXISTS dunning_paused BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_dunning_stage VARCHAR(32),
  ADD COLUMN IF NOT EXISTS last_dunning_at TIMESTAMPTZ;

UPDATE public.invoices
SET paid_amount = total_amount
WHERE status = 'PAID' AND paid_amount = 0;

CREATE TABLE IF NOT EXISTS public.payment_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES public.client_entities(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  receipt_ref VARCHAR(100) NOT NULL,
  payment_mode VARCHAR(24) NOT NULL DEFAULT 'NEFT_RTGS',
  cash_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tds_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  allocation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(24) NOT NULL DEFAULT 'APPLIED',
  notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.retainer_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES public.client_entities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sac_code VARCHAR(20) NOT NULL DEFAULT '998231',
  billing_cycle VARCHAR(24) NOT NULL DEFAULT 'MONTHLY',
  base_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
  auto_issue BOOLEAN NOT NULL DEFAULT TRUE,
  auto_dispatch BOOLEAN NOT NULL DEFAULT TRUE,
  next_run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_run_date DATE,
  max_monthly_invoices INT DEFAULT 100,
  max_turnover_cr NUMERIC(10, 2) DEFAULT 5.0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.client_rate_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES public.client_entities(id) ON DELETE CASCADE,
  entity_type VARCHAR(32),
  turnover_min_cr NUMERIC(10, 2) NOT NULL DEFAULT 0,
  turnover_max_cr NUMERIC(10, 2) NOT NULL DEFAULT 99999,
  service_category VARCHAR(48) NOT NULL,
  sac_code VARCHAR(20) NOT NULL DEFAULT '998231',
  standard_fee NUMERIC(12, 2) NOT NULL DEFAULT 5000,
  default_hours NUMERIC(6, 2) NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dunning_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES public.client_entities(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  stage VARCHAR(32) NOT NULL,
  channel VARCHAR(24) NOT NULL DEFAULT 'WHATSAPP',
  recipient VARCHAR(255),
  status VARCHAR(24) NOT NULL DEFAULT 'SENT',
  message_preview TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoice_series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  doc_type VARCHAR(24) NOT NULL,
  prefix VARCHAR(32) NOT NULL,
  financial_year VARCHAR(16) NOT NULL,
  next_seq INT NOT NULL DEFAULT 101,
  UNIQUE (firm_id, doc_type, financial_year)
);

CREATE INDEX IF NOT EXISTS idx_payment_allocations_firm_entity
  ON public.payment_allocations (firm_id, entity_id, allocation_date DESC);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_invoice
  ON public.payment_allocations (firm_id, invoice_id);
CREATE INDEX IF NOT EXISTS idx_retainer_schedules_firm_next
  ON public.retainer_schedules (firm_id, is_active, next_run_date);
CREATE INDEX IF NOT EXISTS idx_rate_cards_firm_cat
  ON public.client_rate_cards (firm_id, service_category);
CREATE INDEX IF NOT EXISTS idx_dunning_logs_firm_entity
  ON public.dunning_logs (firm_id, entity_id, sent_at DESC);
