-- Authenticated workspace access baseline.
-- Run after schema.sql. API authorization must still be enforced in Next.js;
-- these policies protect direct Supabase/PostgREST access as well.

BEGIN;

-- Remove permissive policies created by legacy setup scripts before applying
-- the firm-scoped rules below. PostgreSQL combines policies with OR semantics.
DROP POLICY IF EXISTS anon_read_firms ON firms;
DROP POLICY IF EXISTS anon_read_groups ON client_groups;
DROP POLICY IF EXISTS anon_read_entities ON client_entities;
DROP POLICY IF EXISTS anon_read_tasks ON compliance_tasks;
DROP POLICY IF EXISTS anon_read_invoices ON invoices;
DROP POLICY IF EXISTS anon_read_dsc ON dsc_vault;
DROP POLICY IF EXISTS anon_read_docs ON documents;
DROP POLICY IF EXISTS anon_read_audit ON audit_logs;
DROP POLICY IF EXISTS anon_insert_tasks ON compliance_tasks;
DROP POLICY IF EXISTS anon_update_tasks ON compliance_tasks;
DROP POLICY IF EXISTS anon_insert_docs ON documents;
DROP POLICY IF EXISTS anon_update_docs ON documents;
DROP POLICY IF EXISTS anon_insert_invoices ON invoices;
DROP POLICY IF EXISTS anon_update_invoices ON invoices;
DROP POLICY IF EXISTS anon_insert_audit ON audit_logs;

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['firms','users','client_groups','client_entities','compliance_tasks','invoices','dsc_vault','documents','audit_logs'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_allow_all', table_name);
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS user_client_entities (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES client_entities(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, entity_id)
);

CREATE OR REPLACE FUNCTION public.current_user_firm_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT firm_id FROM public.users WHERE id = auth.uid() AND is_active = TRUE LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT FROM public.users WHERE id = auth.uid() AND is_active = TRUE LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_firm_staff()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() IN ('SUPER_ADMIN', 'PARTNER', 'PAID_CA_MANAGER', 'ARTICLE_TRAINEE'), FALSE)
$$;

CREATE OR REPLACE FUNCTION public.can_access_entity(target_entity_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (public.is_firm_staff() AND EXISTS (
      SELECT 1 FROM public.client_entities e
      WHERE e.id = target_entity_id AND e.firm_id = public.current_user_firm_id()
    ))
    OR EXISTS (
      SELECT 1 FROM public.user_client_entities a
      JOIN public.users u ON u.id = a.user_id AND u.is_active = TRUE
      JOIN public.client_entities e ON e.id = a.entity_id
      WHERE a.user_id = auth.uid()
        AND a.entity_id = target_entity_id
        AND u.firm_id = e.firm_id
        AND e.firm_id = public.current_user_firm_id()
    )
$$;

ALTER TABLE user_client_entities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_client_entities FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.user_client_entities TO authenticated;

-- Browser sessions are read-only on normalized business tables. The current
-- application writes through the partner-only firm_app_state API path.
REVOKE ALL ON public.users, public.client_groups, public.client_entities,
  public.compliance_tasks, public.invoices, public.dsc_vault, public.documents,
  public.audit_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.users, public.client_groups, public.client_entities,
  public.compliance_tasks, public.invoices, public.dsc_vault, public.documents,
  public.audit_logs TO authenticated;

-- Firm rows also contain bank account and payment details. RLS protects rows,
-- while column grants keep those sensitive fields out of direct browser queries.
REVOKE ALL ON public.firms FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, firm_name, frn) ON public.firms TO authenticated;

DROP POLICY IF EXISTS users_read_own_firm ON users;
CREATE POLICY users_read_own_firm ON users
  FOR SELECT USING (
    id = auth.uid()
    OR (
      firm_id = public.current_user_firm_id()
      AND public.current_user_role() IN ('SUPER_ADMIN', 'PARTNER')
    )
  );

DROP POLICY IF EXISTS firms_read_own_firm ON firms;
CREATE POLICY firms_read_own_firm ON firms
  FOR SELECT USING (id = public.current_user_firm_id());

DROP POLICY IF EXISTS client_groups_firm_scope ON client_groups;
CREATE POLICY client_groups_firm_scope ON client_groups
  FOR SELECT USING (
    firm_id = public.current_user_firm_id()
    AND (public.is_firm_staff() OR EXISTS (
      SELECT 1 FROM public.user_client_entities a
      JOIN public.client_entities e ON e.id = a.entity_id
      WHERE a.user_id = auth.uid() AND e.group_id = client_groups.id
    ))
  );

DROP POLICY IF EXISTS firm_isolation_policy ON client_entities;
DROP POLICY IF EXISTS client_entities_scoped_read ON client_entities;
CREATE POLICY client_entities_scoped_read ON client_entities
  FOR SELECT USING (public.can_access_entity(id));

DROP POLICY IF EXISTS task_isolation_policy ON compliance_tasks;
DROP POLICY IF EXISTS compliance_tasks_scoped_read ON compliance_tasks;
CREATE POLICY compliance_tasks_scoped_read ON compliance_tasks
  FOR SELECT USING (
    firm_id = public.current_user_firm_id() AND public.can_access_entity(entity_id)
  );

DROP POLICY IF EXISTS doc_isolation_policy ON documents;
DROP POLICY IF EXISTS documents_scoped_read ON documents;
CREATE POLICY documents_scoped_read ON documents
  FOR SELECT USING (
    firm_id = public.current_user_firm_id() AND public.can_access_entity(entity_id)
  );

DROP POLICY IF EXISTS invoice_isolation_policy ON invoices;
DROP POLICY IF EXISTS invoices_scoped_read ON invoices;
CREATE POLICY invoices_scoped_read ON invoices
  FOR SELECT USING (
    firm_id = public.current_user_firm_id() AND public.can_access_entity(entity_id)
  );

DROP POLICY IF EXISTS dsc_vault_scoped_read ON dsc_vault;
CREATE POLICY dsc_vault_scoped_read ON dsc_vault
  FOR SELECT USING (
    public.is_firm_staff()
    AND firm_id = public.current_user_firm_id()
  );

DROP POLICY IF EXISTS audit_logs_scoped_read ON audit_logs;
CREATE POLICY audit_logs_scoped_read ON audit_logs
  FOR SELECT USING (
    public.is_firm_staff()
    AND firm_id = public.current_user_firm_id()
  );

DROP POLICY IF EXISTS user_client_entities_scoped_read ON user_client_entities;
CREATE POLICY user_client_entities_scoped_read ON user_client_entities
  FOR SELECT USING (
    user_id = auth.uid()
    OR (public.is_firm_staff() AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = user_client_entities.user_id
        AND u.firm_id = public.current_user_firm_id()
    ))
  );

COMMIT;
