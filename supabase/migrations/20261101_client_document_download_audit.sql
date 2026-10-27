-- Record client access to private documents before issuing a short-lived link.
BEGIN;

CREATE OR REPLACE FUNCTION public.record_client_document_download(p_document_id UUID)
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
  IF public.current_user_role() NOT IN ('CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT') THEN
    RAISE EXCEPTION 'Client portal access is required.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_actor
  FROM public.users
  WHERE id = auth.uid()
    AND firm_id = public.current_user_firm_id()
    AND is_active = TRUE;

  SELECT * INTO v_document
  FROM public.documents
  WHERE id = p_document_id
    AND firm_id = public.current_user_firm_id()
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
    v_document.firm_id,
    v_actor.id,
    v_actor.full_name,
    v_actor.role::TEXT,
    COALESCE(v_entity_name, 'Assigned client entity'),
    'Client document download link issued',
    format('A short-lived download link was issued for document %s.', v_document.id),
    'DOCUMENT'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_client_document_download(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_client_document_download(UUID) TO authenticated;

COMMIT;
