-- A firm must explicitly clear the required document list before staff start
-- preparation. This keeps client uploads reviewable and prevents status-only
-- shortcuts from hiding outstanding source records.
BEGIN;

ALTER TABLE public.compliance_tasks
  ADD COLUMN IF NOT EXISTS assigned_to_name TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by_name TEXT;

CREATE OR REPLACE FUNCTION public.sync_task_assignee_names_from_firm_state()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  task_json JSONB;
BEGIN
  SELECT item.value INTO task_json
  FROM public.firm_app_state state_row
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(state_row.data->'tasks') = 'array' THEN state_row.data->'tasks' ELSE '[]'::JSONB END
  ) AS item(value)
  WHERE state_row.firm_id = NEW.firm_id AND item.value->>'id' = NEW.id::TEXT
  LIMIT 1;

  IF task_json IS NOT NULL THEN
    NEW.assigned_to_id := public.try_uuid(task_json->>'assignedToId');
    NEW.reviewed_by_id := public.try_uuid(task_json->>'reviewedById');
    IF NEW.assigned_to_id IS NOT NULL THEN
      SELECT full_name INTO NEW.assigned_to_name FROM public.users
      WHERE id = NEW.assigned_to_id AND firm_id = NEW.firm_id AND is_active = TRUE
        AND role::TEXT IN ('PAID_CA_MANAGER', 'ARTICLE_TRAINEE');
      IF NEW.assigned_to_name IS NULL THEN
        RAISE EXCEPTION 'Choose an active manager or article trainee from this firm as the task owner.' USING ERRCODE = '22023';
      END IF;
    ELSE
      NEW.assigned_to_name := NULLIF(btrim(task_json->>'assignedTo'), '');
    END IF;
    IF NEW.reviewed_by_id IS NOT NULL THEN
      SELECT full_name INTO NEW.reviewed_by_name FROM public.users
      WHERE id = NEW.reviewed_by_id AND firm_id = NEW.firm_id AND is_active = TRUE
        AND role::TEXT IN ('SUPER_ADMIN', 'PARTNER', 'PAID_CA_MANAGER');
      IF NEW.reviewed_by_name IS NULL THEN
        RAISE EXCEPTION 'Choose an active manager or partner from this firm as the task reviewer.' USING ERRCODE = '22023';
      END IF;
    ELSE
      NEW.reviewed_by_name := NULLIF(btrim(task_json->>'reviewedBy'), '');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS compliance_tasks_sync_assignee_names ON public.compliance_tasks;
CREATE TRIGGER compliance_tasks_sync_assignee_names
  BEFORE INSERT OR UPDATE ON public.compliance_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_task_assignee_names_from_firm_state();

UPDATE public.compliance_tasks task
SET assigned_to_name = NULLIF(btrim(task_json.value->>'assignedTo'), ''),
    reviewed_by_name = NULLIF(btrim(task_json.value->>'reviewedBy'), '')
FROM public.firm_app_state state_row
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(state_row.data->'tasks') = 'array' THEN state_row.data->'tasks' ELSE '[]'::JSONB END
) AS task_json(value)
WHERE task.firm_id = state_row.firm_id AND task.id::TEXT = task_json.value->>'id';

CREATE OR REPLACE FUNCTION public.require_task_document_requests_cleared()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  requested_count INTEGER := 0;
BEGIN
  IF OLD.status = 'DOCUMENTS_AWAITED' AND NEW.status = 'IN_PREPARATION' THEN
    IF jsonb_typeof(NEW.missing_docs_list) = 'array' THEN
      requested_count := jsonb_array_length(NEW.missing_docs_list);
    END IF;
    IF requested_count > 0 THEN
      RAISE EXCEPTION 'Review the requested documents and clear the outstanding list before starting preparation.'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS compliance_tasks_document_requests_cleared ON public.compliance_tasks;
CREATE TRIGGER compliance_tasks_document_requests_cleared
  BEFORE UPDATE OF status ON public.compliance_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.require_task_document_requests_cleared();

-- Keep the partner's firm workspace snapshot in step with the normalized
-- document row, including the engagement association supplied by the client.
CREATE OR REPLACE FUNCTION public.record_client_document_upload(p_document_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_document public.documents%ROWTYPE;
  v_actor public.users%ROWTYPE;
  v_entity_name TEXT;
  v_document_payload JSONB;
  v_updated_revision BIGINT;
BEGIN
  IF public.current_user_role() NOT IN ('CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT') THEN
    RAISE EXCEPTION 'Client portal access is required.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_actor FROM public.users
  WHERE id = auth.uid() AND is_active = TRUE AND firm_id = public.current_user_firm_id();
  SELECT * INTO v_document FROM public.documents
  WHERE id = p_document_id AND firm_id = public.current_user_firm_id()
    AND uploaded_by_id = auth.uid() AND public.can_access_entity(entity_id);
  IF v_actor.id IS NULL OR v_document.id IS NULL THEN
    RAISE EXCEPTION 'Uploaded document was not found for this account.' USING ERRCODE = '42501';
  END IF;

  SELECT entity_name INTO v_entity_name FROM public.client_entities
  WHERE id = v_document.entity_id AND firm_id = v_document.firm_id;
  v_document_payload := jsonb_build_object(
    'id', v_document.id,
    'entityId', v_document.entity_id,
    'entityName', v_entity_name,
    'category', v_document.category::TEXT,
    'fileName', v_document.file_name,
    'fileSize', CASE WHEN v_document.file_size_bytes < 1048576
      THEN to_char(v_document.file_size_bytes::NUMERIC / 1024, 'FM999999990.0') || ' KB'
      ELSE to_char(v_document.file_size_bytes::NUMERIC / 1048576, 'FM999999990.00') || ' MB' END,
    'sizeBytes', v_document.file_size_bytes,
    'mimeType', v_document.mime_type,
    'storagePath', v_document.storage_path,
    'uploadedAt', v_document.created_at,
    'uploadedBy', 'CLIENT_PWA',
    'financialYear', v_document.financial_year,
    'taskId', v_document.task_id,
    'reviewStatus', v_document.review_status::TEXT
  );

  UPDATE public.firm_app_state
  SET data = jsonb_set(
        jsonb_set(
          data,
          '{documents}',
          (CASE WHEN jsonb_typeof(data->'documents') = 'array' THEN data->'documents' ELSE '[]'::JSONB END)
            || jsonb_build_array(v_document_payload),
          TRUE
        ),
        '{lastUpdated}', to_jsonb(CURRENT_TIMESTAMP::TEXT), TRUE
      ),
      revision = revision + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE firm_id = v_document.firm_id
    AND NOT (COALESCE(data->'documents', '[]'::JSONB) @> jsonb_build_array(jsonb_build_object('id', v_document.id)))
  RETURNING revision INTO v_updated_revision;

  IF v_updated_revision IS NULL AND NOT EXISTS (
    SELECT 1 FROM public.firm_app_state state_row
    WHERE state_row.firm_id = v_document.firm_id
      AND COALESCE(state_row.data->'documents', '[]'::JSONB) @> jsonb_build_array(jsonb_build_object('id', v_document.id))
  ) THEN
    RAISE EXCEPTION 'The firm document workspace is not initialized.' USING ERRCODE = '55000';
  END IF;

  IF v_updated_revision IS NOT NULL THEN
    INSERT INTO public.audit_logs (firm_id, actor_id, actor_name, actor_role, entity_name, action, details, category)
    VALUES (v_document.firm_id, v_actor.id, v_actor.full_name, v_actor.role::TEXT,
      v_entity_name, 'Client document uploaded',
      format('Client portal upload recorded for document %s.', v_document.id), 'DOCUMENT');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.record_client_document_upload(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_client_document_upload(UUID) TO authenticated;

COMMIT;
