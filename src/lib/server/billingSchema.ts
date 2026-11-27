import { Pool } from "pg";

let schemaInitPromise: Promise<void> | null = null;

/**
 * Computes Indian Financial Year string (e.g. "2026-27") from a date or ISO string.
 */
export function getIndianFyFromDate(input?: string | Date | null): string {
  const d = input ? new Date(input) : new Date();
  const valid = Number.isNaN(d.getTime()) ? new Date() : d;
  const month = valid.getMonth();
  const year = valid.getFullYear();
  const startYear = month >= 3 ? year : year - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

export function getIndianFyDateRange(fy: string): { start: string; end: string } | null {
  const match = /^(\d{4})-(\d{2})$/.exec((fy || "").trim());
  if (!match) return null;
  const startYear = parseInt(match[1], 10);
  return {
    start: `${startYear}-04-01`,
    end: `${startYear + 1}-03-31`,
  };
}

/**
 * Atomically allocates the next gapless invoice/document number for (firmId, docType, fy).
 */
export async function allocateNextDocumentNumber(
  pool: Pool,
  firmId: string,
  docType: "TAX_INVOICE" | "PROFORMA" | "CREDIT_NOTE" | "ADVANCE_RECEIPT",
  fy: string
): Promise<string> {
  const prefixMap: Record<string, string> = {
    TAX_INVOICE: `BT/${fy}/INV-`,
    PROFORMA: `BT/${fy}/PRO-`,
    CREDIT_NOTE: `BT/${fy}/CN-`,
    ADVANCE_RECEIPT: `BT/${fy}/ADV-`,
  };
  const prefix = prefixMap[docType] || `BT/${fy}/INV-`;

  const res = await pool.query(
    `INSERT INTO public.invoice_series (firm_id, doc_type, prefix, financial_year, next_seq)
     VALUES ($1, $2, $3, $4, 102)
     ON CONFLICT (firm_id, doc_type, financial_year)
     DO UPDATE SET next_seq = public.invoice_series.next_seq + 1
     RETURNING next_seq - 1 AS seq, prefix`,
    [firmId, docType, prefix, fy]
  );

  const seq = Number(res.rows[0]?.seq || 101);
  return `${res.rows[0]?.prefix || prefix}${String(seq).padStart(3, "0")}`;
}

/**
 * Idempotently ensures all billing/WIP/autopilot tables, columns, and scale indexes exist.
 */
export async function ensureBillingSchema(pool: Pool): Promise<void> {
  if (!schemaInitPromise) {
    schemaInitPromise = (async () => {
      try {
        await pool.query(`
          ALTER TABLE public.invoices
            ADD COLUMN IF NOT EXISTS financial_year VARCHAR(16),
            ADD COLUMN IF NOT EXISTS tds_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS tds_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS is_inter_state BOOLEAN NOT NULL DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS place_of_supply VARCHAR(100),
            ADD COLUMN IF NOT EXISTS wip_job_id UUID,
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
          CREATE INDEX IF NOT EXISTS idx_payment_allocations_firm_entity
            ON public.payment_allocations (firm_id, entity_id, allocation_date DESC);
          CREATE INDEX IF NOT EXISTS idx_retainer_schedules_firm_next
            ON public.retainer_schedules (firm_id, is_active, next_run_date);
          CREATE INDEX IF NOT EXISTS idx_dunning_logs_firm_entity
            ON public.dunning_logs (firm_id, entity_id, sent_at DESC);
        `);
      } catch (err: any) {
        schemaInitPromise = null;
        console.error("[BILLING_SCHEMA_INIT_WARN]", err?.message || err);
      }
    })();
  }
  await schemaInitPromise;
}
