-- Clients may upload source documents only to their assigned entity folder.
-- Object and metadata cleanup is limited to objects/rows uploaded by that user.
BEGIN;

DROP POLICY IF EXISTS firm_documents_insert ON storage.objects;
CREATE POLICY firm_documents_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'firm-documents'
    AND (storage.foldername(name))[1] = public.current_user_firm_id()::TEXT
    AND (
      public.current_user_role() IN ('SUPER_ADMIN', 'PARTNER')
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

DROP POLICY IF EXISTS firm_documents_delete ON storage.objects;
CREATE POLICY firm_documents_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'firm-documents'
    AND (storage.foldername(name))[1] = public.current_user_firm_id()::TEXT
    AND (
      public.current_user_role() IN ('SUPER_ADMIN', 'PARTNER')
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

DROP POLICY IF EXISTS client_documents_insert ON public.documents;
CREATE POLICY client_documents_insert ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (
    firm_id = public.current_user_firm_id()
    AND public.current_user_role() IN ('CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT')
    AND public.can_access_entity(entity_id)
    AND uploaded_by_id = auth.uid()
    AND review_status = 'PENDING_REVIEW'
    AND category IN ('BANK_STATEMENT','GST_INVOICES','TAX_COMPUTATION','NOTICE_REPLY','CHALLAN')
    AND split_part(storage_path, '/', 1) = firm_id::TEXT
    AND split_part(storage_path, '/', 2) = entity_id::TEXT
    AND split_part(storage_path, '/', 3) = auth.uid()::TEXT
    AND task_id IS NULL
  );

DROP POLICY IF EXISTS client_documents_delete_own ON public.documents;
CREATE POLICY client_documents_delete_own ON public.documents
  FOR DELETE TO authenticated
  USING (
    firm_id = public.current_user_firm_id()
    AND public.current_user_role() IN ('CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT')
    AND public.can_access_entity(entity_id)
    AND uploaded_by_id = auth.uid()
  );

GRANT INSERT (id, firm_id, entity_id, task_id, category, file_name, file_size_bytes,
  storage_path, mime_type, financial_year, uploaded_by_id, review_status)
  ON public.documents TO authenticated;
GRANT DELETE ON public.documents TO authenticated;

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
    format('Client portal upload recorded for document %s.', v_document.id), 'DOCUMENT'
  );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.record_client_document_upload(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_client_document_upload(UUID) TO authenticated;

COMMIT;
