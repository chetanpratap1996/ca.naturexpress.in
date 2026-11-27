-- Billing & WIP Scale Foundation: Indexes, FY tracking, TDS/PoS columns, and dedicated wip_jobs table

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS financial_year VARCHAR(16),
  ADD COLUMN IF NOT EXISTS tds_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tds_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_inter_state BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS place_of_supply VARCHAR(100),
  ADD COLUMN IF NOT EXISTS wip_job_id UUID;

-- Backfill financial_year for existing invoices using Indian FY (April - March)
UPDATE public.invoices
SET financial_year = CASE
  WHEN EXTRACT(MONTH FROM COALESCE(due_date, created_at::date)) >= 4 THEN
    EXTRACT(YEAR FROM COALESCE(due_date, created_at::date))::int || '-' ||
    LPAD(((EXTRACT(YEAR FROM COALESCE(due_date, created_at::date))::int + 1) % 100)::text, 2, '0')
  ELSE
    (EXTRACT(YEAR FROM COALESCE(due_date, created_at::date))::int - 1) || '-' ||
    LPAD((EXTRACT(YEAR FROM COALESCE(due_date, created_at::date))::int % 100)::text, 2, '0')
END
WHERE financial_year IS NULL;

CREATE TABLE IF NOT EXISTS public.wip_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES public.client_entities(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.compliance_tasks(id) ON DELETE SET NULL,
  financial_year VARCHAR(16) NOT NULL,
  service_title TEXT NOT NULL,
  sac_code VARCHAR(20) NOT NULL DEFAULT '998231',
  assigned_staff VARCHAR(255) NOT NULL DEFAULT 'Practice Team',
  hours_spent NUMERIC(8, 2) NOT NULL DEFAULT 0,
  estimated_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(32) NOT NULL DEFAULT 'READY_FOR_BILLING',
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Scale indexes for 1,000+ clients & 10,000+ invoices
CREATE INDEX IF NOT EXISTS idx_invoices_firm_status_due
  ON public.invoices (firm_id, status, due_date);

CREATE INDEX IF NOT EXISTS idx_invoices_firm_entity_created
  ON public.invoices (firm_id, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_firm_fy
  ON public.invoices (firm_id, financial_year);

CREATE INDEX IF NOT EXISTS idx_wip_jobs_firm_status_fy
  ON public.wip_jobs (firm_id, status, financial_year);

CREATE INDEX IF NOT EXISTS idx_wip_jobs_firm_entity
  ON public.wip_jobs (firm_id, entity_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wip_jobs_firm_task_unique
  ON public.wip_jobs (firm_id, task_id) WHERE task_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_firm_status_entity
  ON public.compliance_tasks (firm_id, status, entity_id);

CREATE INDEX IF NOT EXISTS idx_workspace_records_firm_type_entity
  ON public.firm_workspace_records (firm_id, record_type, entity_id);

ALTER TABLE public.wip_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wip_jobs_read_staff ON public.wip_jobs;
DROP POLICY IF EXISTS wip_jobs_write_staff ON public.wip_jobs;

CREATE POLICY wip_jobs_read_staff ON public.wip_jobs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid() AND u.is_active = true AND u.firm_id = wip_jobs.firm_id
      AND u.role NOT IN ('CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT')
  ));

CREATE POLICY wip_jobs_write_staff ON public.wip_jobs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid() AND u.is_active = true AND u.firm_id = wip_jobs.firm_id
      AND u.role IN ('SUPER_ADMIN', 'PARTNER', 'ARTICLE')
  ));
