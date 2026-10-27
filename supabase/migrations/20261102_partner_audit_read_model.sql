-- Keep recent per-firm audit reads efficient as the log grows.
BEGIN;

CREATE INDEX IF NOT EXISTS idx_audit_logs_firm_created
  ON public.audit_logs (firm_id, created_at DESC);

COMMIT;
