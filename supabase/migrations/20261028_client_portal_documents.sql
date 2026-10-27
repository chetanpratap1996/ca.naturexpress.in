-- Allow clients to read and download only records for entities explicitly
-- assigned through user_client_entities. Client uploads and payment reporting
-- are added separately after their API workflows are in place.
BEGIN;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS mime_type TEXT;

DROP POLICY IF EXISTS firm_documents_select ON storage.objects;
CREATE POLICY firm_documents_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'firm-documents'
    AND (storage.foldername(name))[1] = public.current_user_firm_id()::TEXT
    AND (
      public.current_user_role() IN ('SUPER_ADMIN', 'PARTNER')
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

COMMIT;
