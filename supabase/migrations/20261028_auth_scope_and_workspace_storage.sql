-- Security and durable workspace-record foundation.
-- Apply after reviewing existing user rows. Auth users must be explicitly linked to firm profiles.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS client_group_id uuid REFERENCES public.client_groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_entity_id uuid REFERENCES public.client_entities(id) ON DELETE SET NULL;

-- Safely link existing firm profiles to Supabase Auth accounts by verified email.
-- Unmatched profiles remain unable to sign in until an administrator links them.
UPDATE public.users AS profile
SET auth_user_id = auth_user.id
FROM auth.users AS auth_user
WHERE profile.auth_user_id IS NULL
  AND lower(profile.email) = lower(auth_user.email);

CREATE UNIQUE INDEX IF NOT EXISTS users_auth_user_id_unique
  ON public.users(auth_user_id) WHERE auth_user_id IS NOT NULL;

ALTER TABLE public.firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dsc_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS entity_id uuid REFERENCES public.client_entities(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS firm_isolation_policy ON public.client_entities;
DROP POLICY IF EXISTS task_isolation_policy ON public.compliance_tasks;
DROP POLICY IF EXISTS doc_isolation_policy ON public.documents;
DROP POLICY IF EXISTS invoice_isolation_policy ON public.invoices;
DROP POLICY IF EXISTS firms_read_own ON public.firms;
DROP POLICY IF EXISTS users_read_self ON public.users;
DROP POLICY IF EXISTS client_groups_read_scoped ON public.client_groups;
DROP POLICY IF EXISTS client_groups_insert_partner ON public.client_groups;
DROP POLICY IF EXISTS client_entities_read_scoped ON public.client_entities;
DROP POLICY IF EXISTS client_entities_insert_partner ON public.client_entities;
DROP POLICY IF EXISTS client_entities_update_partner ON public.client_entities;
DROP POLICY IF EXISTS compliance_tasks_read_scoped ON public.compliance_tasks;
DROP POLICY IF EXISTS compliance_tasks_write_staff ON public.compliance_tasks;
DROP POLICY IF EXISTS documents_read_scoped ON public.documents;
DROP POLICY IF EXISTS documents_insert_scoped ON public.documents;
DROP POLICY IF EXISTS documents_update_staff ON public.documents;
DROP POLICY IF EXISTS invoices_read_scoped ON public.invoices;
DROP POLICY IF EXISTS invoices_insert_partner ON public.invoices;
DROP POLICY IF EXISTS invoices_update_scoped ON public.invoices;
DROP POLICY IF EXISTS dsc_read_staff ON public.dsc_vault;
DROP POLICY IF EXISTS dsc_update_partner ON public.dsc_vault;
DROP POLICY IF EXISTS audit_logs_read_partner ON public.audit_logs;

CREATE POLICY users_read_self ON public.users FOR SELECT
  USING (auth_user_id = auth.uid() AND is_active = true);

CREATE POLICY firms_read_own ON public.firms FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid() AND u.is_active = true AND u.firm_id = firms.id
  ));

CREATE POLICY client_groups_read_scoped ON public.client_groups FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid() AND u.is_active = true AND u.firm_id = client_groups.firm_id
      AND (u.role NOT IN ('CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT')
        OR u.client_group_id = client_groups.id
        OR EXISTS (
          SELECT 1 FROM public.client_entities e
          WHERE e.id = u.client_entity_id AND e.group_id = client_groups.id AND e.firm_id = client_groups.firm_id
        ))
  ));
CREATE POLICY client_groups_insert_partner ON public.client_groups FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true
      AND u.firm_id = client_groups.firm_id AND u.role IN ('SUPER_ADMIN', 'PARTNER')
  ));

CREATE POLICY client_entities_read_scoped ON public.client_entities FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid() AND u.is_active = true AND u.firm_id = client_entities.firm_id
      AND (u.role NOT IN ('CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT')
        OR u.client_entity_id = client_entities.id
        OR (u.client_entity_id IS NULL AND u.client_group_id = client_entities.group_id))
  ));

CREATE POLICY client_entities_insert_partner ON public.client_entities FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true
      AND u.firm_id = client_entities.firm_id AND u.role IN ('SUPER_ADMIN', 'PARTNER')
  ));
CREATE POLICY client_entities_update_partner ON public.client_entities FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true
      AND u.firm_id = client_entities.firm_id AND u.role IN ('SUPER_ADMIN', 'PARTNER')
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true
      AND u.firm_id = client_entities.firm_id AND u.role IN ('SUPER_ADMIN', 'PARTNER')
  ));

CREATE POLICY compliance_tasks_read_scoped ON public.compliance_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true
      AND u.firm_id = compliance_tasks.firm_id
      AND (u.role NOT IN ('CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT')
        OR u.client_entity_id = compliance_tasks.entity_id
        OR (u.client_entity_id IS NULL AND u.client_group_id = (SELECT e.group_id FROM public.client_entities e WHERE e.id = compliance_tasks.entity_id)))
  ));
CREATE POLICY compliance_tasks_write_staff ON public.compliance_tasks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true
      AND u.firm_id = compliance_tasks.firm_id AND u.role IN ('SUPER_ADMIN', 'PARTNER', 'PAID_CA_MANAGER', 'ARTICLE_TRAINEE')
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true
      AND u.firm_id = compliance_tasks.firm_id AND u.role IN ('SUPER_ADMIN', 'PARTNER', 'PAID_CA_MANAGER', 'ARTICLE_TRAINEE')
  ));

CREATE POLICY documents_read_scoped ON public.documents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true
      AND u.firm_id = documents.firm_id
      AND (u.role NOT IN ('CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT')
        OR u.client_entity_id = documents.entity_id
        OR (u.client_entity_id IS NULL AND u.client_group_id = (SELECT e.group_id FROM public.client_entities e WHERE e.id = documents.entity_id)))
  ));
CREATE POLICY documents_insert_scoped ON public.documents FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true
      AND u.firm_id = documents.firm_id
      AND (u.role IN ('SUPER_ADMIN', 'PARTNER', 'PAID_CA_MANAGER', 'ARTICLE_TRAINEE')
        OR (u.role IN ('CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT') AND u.client_entity_id = documents.entity_id))
  ));
CREATE POLICY documents_update_staff ON public.documents FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true
      AND u.firm_id = documents.firm_id AND u.role IN ('SUPER_ADMIN', 'PARTNER', 'PAID_CA_MANAGER', 'ARTICLE_TRAINEE')
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true
      AND u.firm_id = documents.firm_id AND u.role IN ('SUPER_ADMIN', 'PARTNER', 'PAID_CA_MANAGER', 'ARTICLE_TRAINEE')
  ));

CREATE POLICY invoices_read_scoped ON public.invoices FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true
      AND u.firm_id = invoices.firm_id
      AND (u.role NOT IN ('CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT')
        OR u.client_entity_id = invoices.entity_id
        OR (u.client_entity_id IS NULL AND u.client_group_id = (SELECT e.group_id FROM public.client_entities e WHERE e.id = invoices.entity_id)))
  ));
CREATE POLICY invoices_insert_partner ON public.invoices FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true
      AND u.firm_id = invoices.firm_id AND u.role IN ('SUPER_ADMIN', 'PARTNER')
  ));
CREATE POLICY invoices_update_scoped ON public.invoices FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true
      AND u.firm_id = invoices.firm_id AND u.role IN ('SUPER_ADMIN', 'PARTNER')
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true
      AND u.firm_id = invoices.firm_id AND u.role IN ('SUPER_ADMIN', 'PARTNER')
  ));

-- Client UTR submissions may update only the payment reference fields, never totals or settlement status.
CREATE OR REPLACE FUNCTION public.submit_invoice_utr(
  p_invoice_id uuid,
  p_utr text,
  p_payment_mode public.payment_mode,
  p_note text DEFAULT NULL
) RETURNS public.invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE updated_invoice public.invoices;
BEGIN
  IF nullif(trim(coalesce(p_utr, '')), '') IS NULL THEN
    RAISE EXCEPTION 'A payment reference is required';
  END IF;
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.invoices i ON i.firm_id = u.firm_id
    WHERE u.auth_user_id = auth.uid() AND u.is_active = true
      AND u.role IN ('CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT')
      AND u.client_entity_id = i.entity_id AND i.id = p_invoice_id
  ) THEN
    RAISE EXCEPTION 'Invoice is not assigned to this client account';
  END IF;

  UPDATE public.invoices
  SET status = 'UTR_SUBMITTED',
      client_utr_number = left(trim(p_utr), 100),
      client_payment_mode = p_payment_mode,
      client_payment_date = CURRENT_DATE,
      client_payer_note = left(coalesce(p_note, ''), 1000)
  WHERE id = p_invoice_id AND status IN ('PENDING', 'OVERDUE')
  RETURNING * INTO updated_invoice;

  IF updated_invoice.id IS NULL THEN
    RAISE EXCEPTION 'Invoice is not payable or was already submitted';
  END IF;
  RETURN updated_invoice;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_invoice_utr(uuid, text, public.payment_mode, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_invoice_utr(uuid, text, public.payment_mode, text) TO authenticated;

CREATE POLICY dsc_read_staff ON public.dsc_vault FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true
      AND u.firm_id = dsc_vault.firm_id AND u.role IN ('SUPER_ADMIN', 'PARTNER', 'PAID_CA_MANAGER', 'ARTICLE_TRAINEE')
  ));
CREATE POLICY dsc_update_partner ON public.dsc_vault FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true
      AND u.firm_id = dsc_vault.firm_id AND u.role IN ('SUPER_ADMIN', 'PARTNER')
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true
      AND u.firm_id = dsc_vault.firm_id AND u.role IN ('SUPER_ADMIN', 'PARTNER')
  ));
CREATE POLICY audit_logs_read_partner ON public.audit_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true
      AND u.firm_id = audit_logs.firm_id AND u.role IN ('SUPER_ADMIN', 'PARTNER')
  ));
DROP POLICY IF EXISTS audit_logs_insert_staff ON public.audit_logs;

-- Audit entries are written through this function so clients cannot forge actors or firm events.
CREATE OR REPLACE FUNCTION public.append_audit_event(
  p_entity_id uuid,
  p_action text,
  p_details text,
  p_category text
) RETURNS public.audit_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile public.users;
  entity public.client_entities;
  firm public.firms;
  created_log public.audit_logs;
BEGIN
  SELECT * INTO profile FROM public.users
  WHERE auth_user_id = auth.uid() AND is_active = true LIMIT 1;
  IF profile.id IS NULL THEN RAISE EXCEPTION 'Active firm profile required'; END IF;

  IF p_entity_id IS NOT NULL THEN
    SELECT * INTO entity FROM public.client_entities
    WHERE id = p_entity_id AND firm_id = profile.firm_id LIMIT 1;
    IF entity.id IS NULL THEN RAISE EXCEPTION 'Entity is outside the firm'; END IF;
  END IF;

  IF profile.role IN ('CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT') THEN
    IF p_action NOT IN ('Document Uploaded', 'Payment Reference Submitted')
      OR p_entity_id IS NULL
      OR p_category NOT IN ('DOCUMENT', 'INVOICE')
      OR NOT (profile.client_entity_id = p_entity_id OR
        (profile.client_entity_id IS NULL AND profile.client_group_id = entity.group_id)) THEN
      RAISE EXCEPTION 'Client audit event is not permitted';
    END IF;
  END IF;

  INSERT INTO public.audit_logs (
    firm_id, actor_id, actor_name, actor_role, entity_id, entity_name, action, details, category
  ) VALUES (
    profile.firm_id, profile.id, profile.full_name, profile.role::text, p_entity_id,
    coalesce(entity.entity_name, (SELECT f.firm_name FROM public.firms f WHERE f.id = profile.firm_id)),
    left(trim(p_action), 100), left(coalesce(p_details, ''), 4000), left(coalesce(p_category, 'SYSTEM'), 50)
  ) RETURNING * INTO created_log;
  RETURN created_log;
END;
$$;
REVOKE ALL ON FUNCTION public.append_audit_event(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.append_audit_event(uuid, text, text, text) TO authenticated;

-- Durable per-record extension store for features that do not have normalized tables yet.
CREATE TABLE IF NOT EXISTS public.firm_workspace_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id uuid NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  entity_id uuid REFERENCES public.client_entities(id) ON DELETE CASCADE,
  record_type text NOT NULL,
  payload jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS firm_workspace_records_lookup
  ON public.firm_workspace_records(firm_id, record_type, entity_id);
ALTER TABLE public.firm_workspace_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS workspace_records_scoped ON public.firm_workspace_records;
CREATE POLICY workspace_records_scoped ON public.firm_workspace_records FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true
      AND u.firm_id = firm_workspace_records.firm_id
      AND (u.role NOT IN ('CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT')
        OR u.client_entity_id = firm_workspace_records.entity_id
        OR (u.client_entity_id IS NULL AND u.client_group_id = (SELECT e.group_id FROM public.client_entities e WHERE e.id = firm_workspace_records.entity_id)))
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_active = true
      AND u.firm_id = firm_workspace_records.firm_id
      AND (u.role IN ('SUPER_ADMIN', 'PARTNER', 'PAID_CA_MANAGER', 'ARTICLE_TRAINEE')
        OR (u.role IN ('CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT') AND u.client_entity_id = firm_workspace_records.entity_id))
  ));

-- Private document storage. Object paths must be firm UUID / entity UUID / filename.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('client-documents', 'client-documents', false, 10485760)
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 10485760;

DROP POLICY IF EXISTS firm_documents_read_scoped ON storage.objects;
DROP POLICY IF EXISTS firm_documents_insert_scoped ON storage.objects;
DROP POLICY IF EXISTS firm_documents_delete_staff ON storage.objects;
CREATE POLICY firm_documents_read_scoped ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'client-documents' AND EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.client_entities e ON e.firm_id = u.firm_id
      WHERE u.auth_user_id = auth.uid() AND u.is_active = true
        AND u.firm_id::text = (storage.foldername(name))[1]
        AND e.id::text = (storage.foldername(name))[2]
        AND (u.role NOT IN ('CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT')
          OR u.client_entity_id = e.id
          OR (u.client_entity_id IS NULL AND u.client_group_id = e.group_id))
    )
  );
CREATE POLICY firm_documents_insert_scoped ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'client-documents' AND EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.client_entities e ON e.firm_id = u.firm_id
      WHERE u.auth_user_id = auth.uid() AND u.is_active = true
        AND u.firm_id::text = (storage.foldername(name))[1]
        AND e.id::text = (storage.foldername(name))[2]
        AND (u.role IN ('SUPER_ADMIN', 'PARTNER', 'PAID_CA_MANAGER', 'ARTICLE_TRAINEE')
          OR (u.role IN ('CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT') AND u.client_entity_id = e.id))
    )
  );
CREATE POLICY firm_documents_delete_staff ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'client-documents' AND EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.client_entities e ON e.firm_id = u.firm_id
      WHERE u.auth_user_id = auth.uid() AND u.is_active = true
        AND u.firm_id::text = (storage.foldername(name))[1]
        AND e.id::text = (storage.foldername(name))[2]
        AND (
          u.role IN ('SUPER_ADMIN', 'PARTNER')
          OR (u.role IN ('CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT') AND u.client_entity_id = e.id
            AND NOT EXISTS (SELECT 1 FROM public.documents d WHERE d.storage_path = storage.objects.name))
        )
    )
  );
