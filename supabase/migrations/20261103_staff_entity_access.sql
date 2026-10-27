-- Explicit staff-to-entity assignments. Employee access never inherits the
-- partner-wide firm scope; it is limited to entities in this table.
BEGIN;

CREATE TABLE IF NOT EXISTS public.user_staff_entities (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES public.client_entities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_user_staff_entities_entity_user
  ON public.user_staff_entities (entity_id, user_id);

ALTER TABLE public.user_staff_entities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_staff_entities FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.user_staff_entities TO authenticated;
GRANT ALL ON public.user_staff_entities TO service_role;

DROP POLICY IF EXISTS user_staff_entities_scoped_read ON public.user_staff_entities;
CREATE POLICY user_staff_entities_scoped_read ON public.user_staff_entities
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      public.current_user_role() IN ('SUPER_ADMIN', 'PARTNER')
      AND EXISTS (
        SELECT 1 FROM public.users employee
        WHERE employee.id = user_staff_entities.user_id
          AND employee.firm_id = public.current_user_firm_id()
      )
    )
  );

CREATE OR REPLACE FUNCTION public.can_access_entity(target_entity_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (
      public.current_user_role() IN ('SUPER_ADMIN', 'PARTNER')
      AND EXISTS (
        SELECT 1 FROM public.client_entities entity
        WHERE entity.id = target_entity_id
          AND entity.firm_id = public.current_user_firm_id()
      )
    )
    OR (
      public.current_user_role() IN ('PAID_CA_MANAGER', 'ARTICLE_TRAINEE')
      AND EXISTS (
        SELECT 1
        FROM public.user_staff_entities assignment
        JOIN public.client_entities entity ON entity.id = assignment.entity_id
        WHERE assignment.user_id = auth.uid()
          AND assignment.entity_id = target_entity_id
          AND entity.firm_id = public.current_user_firm_id()
      )
    )
    OR (
      public.current_user_role() IN ('CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT')
      AND EXISTS (
        SELECT 1
        FROM public.user_client_entities assignment
        JOIN public.users client_user ON client_user.id = assignment.user_id AND client_user.is_active = TRUE
        JOIN public.client_entities entity ON entity.id = assignment.entity_id
        WHERE assignment.user_id = auth.uid()
          AND assignment.entity_id = target_entity_id
          AND client_user.firm_id = entity.firm_id
          AND entity.firm_id = public.current_user_firm_id()
      )
    )
$$;

DROP POLICY IF EXISTS client_groups_firm_scope ON public.client_groups;
CREATE POLICY client_groups_firm_scope ON public.client_groups
  FOR SELECT TO authenticated
  USING (
    firm_id = public.current_user_firm_id()
    AND EXISTS (
      SELECT 1 FROM public.client_entities entity
      WHERE entity.group_id = client_groups.id
        AND entity.firm_id = client_groups.firm_id
        AND public.can_access_entity(entity.id)
    )
  );

DROP POLICY IF EXISTS dsc_vault_scoped_read ON public.dsc_vault;
CREATE POLICY dsc_vault_scoped_read ON public.dsc_vault
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() IN ('SUPER_ADMIN', 'PARTNER')
    AND firm_id = public.current_user_firm_id()
  );

DROP POLICY IF EXISTS audit_logs_scoped_read ON public.audit_logs;
CREATE POLICY audit_logs_scoped_read ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() IN ('SUPER_ADMIN', 'PARTNER')
    AND firm_id = public.current_user_firm_id()
  );

DROP POLICY IF EXISTS user_client_entities_scoped_read ON public.user_client_entities;
CREATE POLICY user_client_entities_scoped_read ON public.user_client_entities
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      public.current_user_role() IN ('SUPER_ADMIN', 'PARTNER')
      AND EXISTS (
        SELECT 1 FROM public.users client_user
        WHERE client_user.id = user_client_entities.user_id
          AND client_user.firm_id = public.current_user_firm_id()
      )
    )
  );

DROP POLICY IF EXISTS invoices_scoped_read ON public.invoices;
CREATE POLICY invoices_scoped_read ON public.invoices
  FOR SELECT TO authenticated
  USING (
    firm_id = public.current_user_firm_id()
    AND public.current_user_role() IN ('SUPER_ADMIN', 'PARTNER', 'CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT')
    AND public.can_access_entity(entity_id)
  );

DROP POLICY IF EXISTS firm_documents_select ON storage.objects;
CREATE POLICY firm_documents_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'firm-documents'
    AND (storage.foldername(name))[1] = public.current_user_firm_id()::TEXT
    AND (
      public.current_user_role() IN ('SUPER_ADMIN', 'PARTNER')
      OR (
        public.current_user_role() IN ('PAID_CA_MANAGER', 'ARTICLE_TRAINEE')
        AND CASE
          WHEN (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          THEN public.can_access_entity(((storage.foldername(name))[2])::UUID)
          ELSE FALSE
        END
      )
      OR (
        public.current_user_role() IN ('CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT')
        AND CASE
          WHEN (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          THEN public.can_access_entity(((storage.foldername(name))[2])::UUID)
          ELSE FALSE
        END
      )
    )
  );

DROP POLICY IF EXISTS firm_documents_insert ON storage.objects;
CREATE POLICY firm_documents_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'firm-documents'
    AND (storage.foldername(name))[1] = public.current_user_firm_id()::TEXT
    AND (
      public.current_user_role() IN ('SUPER_ADMIN', 'PARTNER')
      OR (
        public.current_user_role() IN ('PAID_CA_MANAGER', 'ARTICLE_TRAINEE')
        AND (storage.foldername(name))[3] = auth.uid()::TEXT
        AND CASE
          WHEN (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          THEN public.can_access_entity(((storage.foldername(name))[2])::UUID)
          ELSE FALSE
        END
      )
      OR (
        public.current_user_role() IN ('CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT')
        AND (storage.foldername(name))[3] = auth.uid()::TEXT
        AND CASE
          WHEN (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          THEN public.can_access_entity(((storage.foldername(name))[2])::UUID)
          ELSE FALSE
        END
      )
    )
  );

CREATE OR REPLACE FUNCTION public.grant_staff_entity_access(
  p_firm_id UUID,
  p_actor_id UUID,
  p_user_id UUID,
  p_entity_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entity_count INTEGER;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users actor
    WHERE actor.id = p_actor_id AND actor.firm_id = p_firm_id
      AND actor.is_active = TRUE AND actor.role::TEXT IN ('SUPER_ADMIN', 'PARTNER')
  ) THEN
    RAISE EXCEPTION 'Partner authorization is required.' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.users employee
    WHERE employee.id = p_user_id AND employee.firm_id = p_firm_id
      AND employee.is_active = TRUE
      AND employee.role::TEXT IN ('PAID_CA_MANAGER', 'ARTICLE_TRAINEE')
  ) THEN
    RAISE EXCEPTION 'The employee does not belong to this firm or is inactive.' USING ERRCODE = '22023';
  END IF;
  IF p_entity_ids IS NULL OR cardinality(p_entity_ids) < 1 OR cardinality(p_entity_ids) > 50
     OR (SELECT COUNT(DISTINCT item.entity_id) FROM unnest(p_entity_ids) AS item(entity_id)) <> cardinality(p_entity_ids) THEN
    RAISE EXCEPTION 'Select between 1 and 50 distinct client entities.' USING ERRCODE = '22023';
  END IF;
  SELECT COUNT(*) INTO v_entity_count
  FROM public.client_entities entity
  WHERE entity.firm_id = p_firm_id AND entity.id = ANY(p_entity_ids);
  IF v_entity_count <> cardinality(p_entity_ids) THEN
    RAISE EXCEPTION 'One or more selected entities are outside this firm.' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.user_staff_entities (user_id, entity_id, created_by)
  SELECT p_user_id, item.entity_id, p_actor_id FROM unnest(p_entity_ids) AS item(entity_id)
  ON CONFLICT (user_id, entity_id) DO NOTHING;

  INSERT INTO public.audit_logs (firm_id, actor_id, actor_name, actor_role, entity_name, action, details, category)
  SELECT p_firm_id, actor.id, actor.full_name, actor.role::TEXT, 'Employee access',
    'Staff entity access assigned',
    format('Granted %s entity assignment(s) to an employee account.', cardinality(p_entity_ids)),
    'SECURITY'
  FROM public.users actor WHERE actor.id = p_actor_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_staff_entity_access(
  p_firm_id UUID,
  p_actor_id UUID,
  p_user_id UUID,
  p_entity_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users actor
    WHERE actor.id = p_actor_id AND actor.firm_id = p_firm_id
      AND actor.is_active = TRUE AND actor.role::TEXT IN ('SUPER_ADMIN', 'PARTNER')
  ) THEN
    RAISE EXCEPTION 'Partner authorization is required.' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.users employee
    WHERE employee.id = p_user_id AND employee.firm_id = p_firm_id
      AND employee.role::TEXT IN ('PAID_CA_MANAGER', 'ARTICLE_TRAINEE')
  ) OR NOT EXISTS (
    SELECT 1 FROM public.client_entities entity
    WHERE entity.id = p_entity_id AND entity.firm_id = p_firm_id
  ) THEN
    RAISE EXCEPTION 'The employee or entity does not belong to this firm.' USING ERRCODE = '22023';
  END IF;

  DELETE FROM public.user_staff_entities
  WHERE user_id = p_user_id AND entity_id = p_entity_id;

  INSERT INTO public.audit_logs (firm_id, actor_id, actor_name, actor_role, entity_name, action, details, category)
  SELECT p_firm_id, actor.id, actor.full_name, actor.role::TEXT, 'Employee access',
    'Staff entity access revoked', 'Revoked one employee entity assignment.', 'SECURITY'
  FROM public.users actor WHERE actor.id = p_actor_id;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_staff_entity_access(UUID, UUID, UUID, UUID[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.revoke_staff_entity_access(UUID, UUID, UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_staff_entity_access(UUID, UUID, UUID, UUID[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.revoke_staff_entity_access(UUID, UUID, UUID, UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.record_staff_document_download(p_document_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_document public.documents%ROWTYPE;
  v_actor public.users%ROWTYPE;
  v_entity_name TEXT;
BEGIN
  IF public.current_user_role() NOT IN ('PAID_CA_MANAGER', 'ARTICLE_TRAINEE') THEN
    RAISE EXCEPTION 'Staff workspace access is required.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_actor
  FROM public.users
  WHERE id = auth.uid() AND firm_id = public.current_user_firm_id() AND is_active = TRUE;
  SELECT * INTO v_document
  FROM public.documents
  WHERE id = p_document_id AND firm_id = public.current_user_firm_id()
    AND public.can_access_entity(entity_id);
  IF v_actor.id IS NULL OR v_document.id IS NULL THEN
    RAISE EXCEPTION 'The document was not found for an assigned entity.' USING ERRCODE = '42501';
  END IF;

  SELECT entity_name INTO v_entity_name
  FROM public.client_entities
  WHERE id = v_document.entity_id AND firm_id = v_document.firm_id;
  INSERT INTO public.audit_logs (
    firm_id, actor_id, actor_name, actor_role, entity_name, action, details, category
  ) VALUES (
    v_document.firm_id, v_actor.id, v_actor.full_name, v_actor.role::TEXT,
    COALESCE(v_entity_name, 'Assigned client entity'),
    'Staff document download link issued',
    format('A short-lived download link was issued for document %s.', v_document.id),
    'DOCUMENT'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_staff_document_download(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_staff_document_download(UUID) TO authenticated;

-- Staff can move assigned engagements through preparation and manager review.
-- Partner sign-off and government filing stay outside staff authority.
CREATE OR REPLACE FUNCTION public.advance_staff_task(
  p_task_id UUID,
  p_new_status workflow_status
)
RETURNS workflow_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor public.users%ROWTYPE;
  v_task public.compliance_tasks%ROWTYPE;
  v_entity_name TEXT;
  v_state_rows INTEGER;
BEGIN
  SELECT * INTO v_actor FROM public.users
  WHERE id = auth.uid() AND is_active = TRUE AND firm_id = public.current_user_firm_id();
  IF v_actor.id IS NULL OR v_actor.role::TEXT NOT IN ('PAID_CA_MANAGER', 'ARTICLE_TRAINEE') THEN
    RAISE EXCEPTION 'Active staff access is required.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_task FROM public.compliance_tasks
  WHERE id = p_task_id AND firm_id = v_actor.firm_id AND public.can_access_entity(entity_id)
  FOR UPDATE;
  IF v_task.id IS NULL THEN
    RAISE EXCEPTION 'Task was not found for an assigned entity.' USING ERRCODE = '42501';
  END IF;
  IF v_task.status = 'DOCUMENTS_AWAITED' AND p_new_status = 'IN_PREPARATION' THEN
    NULL;
  ELSIF v_actor.role::TEXT = 'PAID_CA_MANAGER'
    AND v_task.status = 'IN_PREPARATION' AND p_new_status = 'MANAGER_REVIEW' THEN
    NULL;
  ELSE
    RAISE EXCEPTION 'This task status transition is not available to your role.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.compliance_tasks SET status = p_new_status, updated_at = CURRENT_TIMESTAMP WHERE id = v_task.id;
  SELECT entity_name INTO v_entity_name FROM public.client_entities
  WHERE id = v_task.entity_id AND firm_id = v_task.firm_id;
  INSERT INTO public.audit_logs (firm_id, actor_id, actor_name, actor_role, entity_name, action, details, category)
  VALUES (v_actor.firm_id, v_actor.id, v_actor.full_name, v_actor.role::TEXT,
    COALESCE(v_entity_name, 'Assigned client entity'), 'Task status advanced',
    format('Changed %s from %s to %s.', v_task.title, v_task.status, p_new_status), 'COMPLIANCE');
  UPDATE public.firm_app_state state_row
  SET data = jsonb_set(
        jsonb_set(state_row.data, '{tasks}', (
          SELECT jsonb_agg(
            CASE WHEN item.value->>'id' = v_task.id::TEXT
              THEN jsonb_set(item.value, '{status}', to_jsonb(p_new_status::TEXT), TRUE)
              ELSE item.value END
            ORDER BY item.ordinality
          )
          FROM jsonb_array_elements(CASE WHEN jsonb_typeof(state_row.data->'tasks') = 'array' THEN state_row.data->'tasks' ELSE '[]'::JSONB END)
            WITH ORDINALITY AS item(value, ordinality)
        ), TRUE),
        '{lastUpdated}', to_jsonb(CURRENT_TIMESTAMP::TEXT), TRUE),
      revision = revision + 1, updated_at = CURRENT_TIMESTAMP
  WHERE state_row.firm_id = v_actor.firm_id
    AND COALESCE(state_row.data->'tasks', '[]'::JSONB) @> jsonb_build_array(jsonb_build_object('id', v_task.id::TEXT));
  GET DIAGNOSTICS v_state_rows = ROW_COUNT;
  IF v_state_rows <> 1 THEN
    RAISE EXCEPTION 'Firm task state could not be synchronized.' USING ERRCODE = '40001';
  END IF;
  RETURN p_new_status;
END;
$$;

REVOKE ALL ON FUNCTION public.advance_staff_task(UUID, workflow_status) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.advance_staff_task(UUID, workflow_status) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_staff_document_upload(
  p_document_id UUID,
  p_entity_id UUID,
  p_task_id UUID,
  p_category document_category,
  p_file_name TEXT,
  p_file_size_bytes BIGINT,
  p_storage_path TEXT,
  p_mime_type TEXT,
  p_financial_year TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_document public.documents%ROWTYPE;
  v_actor public.users%ROWTYPE;
  v_firm_id UUID;
  v_entity_name TEXT;
  v_payload JSONB;
  v_state_rows INTEGER;
BEGIN
  SELECT * INTO v_actor FROM public.users
  WHERE id = auth.uid() AND is_active = TRUE AND firm_id = public.current_user_firm_id()
    AND role::TEXT IN ('PAID_CA_MANAGER', 'ARTICLE_TRAINEE');
  IF v_actor.id IS NULL OR p_document_id IS NULL OR p_file_size_bytes < 1 OR p_file_size_bytes > 20971520
     OR p_file_name IS NULL OR length(p_file_name) < 1 OR length(p_file_name) > 180
     OR p_financial_year IS NULL OR length(btrim(p_financial_year)) < 1 OR length(p_financial_year) > 20
     OR p_mime_type IS NULL
     OR p_mime_type NOT IN (
       'application/pdf','image/jpeg','image/png','text/plain','text/csv',
       'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
       'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'
     ) THEN
    RAISE EXCEPTION 'Active staff access is required.' USING ERRCODE = '42501';
  END IF;
  v_firm_id := v_actor.firm_id;
  IF p_entity_id IS NULL OR p_storage_path IS NULL OR NOT public.can_access_entity(p_entity_id)
     OR split_part(p_storage_path, '/', 1) IS DISTINCT FROM v_firm_id::TEXT
     OR split_part(p_storage_path, '/', 2) IS DISTINCT FROM p_entity_id::TEXT
     OR split_part(p_storage_path, '/', 3) IS DISTINCT FROM auth.uid()::TEXT
     OR split_part(p_storage_path, '/', 4) IS DISTINCT FROM p_document_id::TEXT
     OR array_length(string_to_array(p_storage_path, '/'), 1) <> 5
     OR NOT EXISTS (SELECT 1 FROM storage.objects object
       WHERE object.bucket_id = 'firm-documents' AND object.name = p_storage_path) THEN
    RAISE EXCEPTION 'Document entity assignment could not be verified.' USING ERRCODE = '42501';
  END IF;
  IF p_task_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.compliance_tasks task
    WHERE task.id = p_task_id AND task.entity_id = p_entity_id
      AND task.firm_id = v_firm_id AND public.can_access_entity(task.entity_id)
  ) THEN
    RAISE EXCEPTION 'The selected task is not in this assigned entity.' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.documents (
    id, firm_id, entity_id, task_id, category, file_name, file_size_bytes,
    storage_path, mime_type, financial_year, uploaded_by_id, review_status
  ) VALUES (
    p_document_id, v_firm_id, p_entity_id, p_task_id, p_category, p_file_name,
    p_file_size_bytes, p_storage_path, p_mime_type, btrim(p_financial_year),
    v_actor.id, 'PENDING_REVIEW'
  ) RETURNING * INTO v_document;
  SELECT entity_name INTO v_entity_name FROM public.client_entities
  WHERE id = p_entity_id AND firm_id = v_firm_id;
  v_payload := jsonb_build_object(
    'id', v_document.id, 'entityId', v_document.entity_id, 'entityName', v_entity_name,
    'category', v_document.category::TEXT, 'fileName', v_document.file_name,
    'fileSize', CASE WHEN v_document.file_size_bytes < 1048576
      THEN to_char(v_document.file_size_bytes::NUMERIC / 1024, 'FM999999990.0') || ' KB'
      ELSE to_char(v_document.file_size_bytes::NUMERIC / 1048576, 'FM999999990.00') || ' MB' END,
    'sizeBytes', v_document.file_size_bytes, 'mimeType', v_document.mime_type,
    'storagePath', v_document.storage_path, 'uploadedAt', v_document.created_at,
    'uploadedBy', 'FIRM_STAFF', 'financialYear', v_document.financial_year,
    'taskId', v_document.task_id, 'reviewStatus', v_document.review_status::TEXT
  );
  UPDATE public.firm_app_state
  SET data = jsonb_set(
        jsonb_set(data, '{documents}',
          (CASE WHEN jsonb_typeof(data->'documents') = 'array' THEN data->'documents' ELSE '[]'::JSONB END)
            || jsonb_build_array(v_payload), TRUE),
        '{lastUpdated}', to_jsonb(CURRENT_TIMESTAMP::TEXT), TRUE),
      revision = revision + 1, updated_at = CURRENT_TIMESTAMP
  WHERE firm_id = v_document.firm_id
    AND NOT (COALESCE(data->'documents', '[]'::JSONB) @> jsonb_build_array(jsonb_build_object('id', v_document.id)));
  GET DIAGNOSTICS v_state_rows = ROW_COUNT;
  IF v_state_rows <> 1 THEN
    RAISE EXCEPTION 'Firm document state could not be synchronized.' USING ERRCODE = '40001';
  END IF;
  INSERT INTO public.audit_logs (firm_id, actor_id, actor_name, actor_role, entity_name, action, details, category)
  VALUES (v_actor.firm_id, v_actor.id, v_actor.full_name, v_actor.role::TEXT,
    COALESCE(v_entity_name, 'Assigned client entity'), 'Staff document uploaded',
    format('Uploaded %s for review.', v_document.file_name), 'DOCUMENT');
END;
$$;

REVOKE ALL ON FUNCTION public.record_staff_document_upload(UUID, UUID, UUID, document_category, TEXT, BIGINT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_staff_document_upload(UUID, UUID, UUID, document_category, TEXT, BIGINT, TEXT, TEXT, TEXT) TO authenticated;

COMMIT;
