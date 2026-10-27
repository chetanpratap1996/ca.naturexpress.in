-- Durable per-firm JSON state used by the current application repository.
-- The Next.js server connects with DATABASE_URL after verifying the user and
-- firm in middleware. Supabase browser roles receive no direct access.

BEGIN;

CREATE TABLE IF NOT EXISTS public.firm_app_state (
  firm_id UUID PRIMARY KEY REFERENCES public.firms(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  revision BIGINT NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.firm_app_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.firm_app_state FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.firm_app_state TO authenticated;

DROP POLICY IF EXISTS firm_app_state_select ON public.firm_app_state;
CREATE POLICY firm_app_state_select ON public.firm_app_state
  FOR SELECT TO authenticated
  USING (firm_id = public.current_user_firm_id() AND public.current_user_role() IN ('SUPER_ADMIN', 'PARTNER'));

DROP POLICY IF EXISTS firm_app_state_insert ON public.firm_app_state;
CREATE POLICY firm_app_state_insert ON public.firm_app_state
  FOR INSERT TO authenticated
  WITH CHECK (firm_id = public.current_user_firm_id() AND public.current_user_role() IN ('SUPER_ADMIN', 'PARTNER'));

DROP POLICY IF EXISTS firm_app_state_update ON public.firm_app_state;
CREATE POLICY firm_app_state_update ON public.firm_app_state
  FOR UPDATE TO authenticated
  USING (firm_id = public.current_user_firm_id() AND public.current_user_role() IN ('SUPER_ADMIN', 'PARTNER'))
  WITH CHECK (firm_id = public.current_user_firm_id() AND public.current_user_role() IN ('SUPER_ADMIN', 'PARTNER'));

-- Private firm document storage. Object paths are
-- <firm UUID>/<entity UUID>/<document UUID>/<file name>.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'firm-documents',
  'firm-documents',
  FALSE,
  20971520,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = FALSE,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS firm_documents_select ON storage.objects;
CREATE POLICY firm_documents_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'firm-documents'
    AND (storage.foldername(name))[1] = public.current_user_firm_id()::TEXT
    AND public.current_user_role() IN ('SUPER_ADMIN', 'PARTNER')
  );

DROP POLICY IF EXISTS firm_documents_insert ON storage.objects;
CREATE POLICY firm_documents_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'firm-documents'
    AND (storage.foldername(name))[1] = public.current_user_firm_id()::TEXT
    AND public.current_user_role() IN ('SUPER_ADMIN', 'PARTNER')
  );

DROP POLICY IF EXISTS firm_documents_update ON storage.objects;
CREATE POLICY firm_documents_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'firm-documents'
    AND (storage.foldername(name))[1] = public.current_user_firm_id()::TEXT
    AND public.current_user_role() IN ('SUPER_ADMIN', 'PARTNER')
  )
  WITH CHECK (
    bucket_id = 'firm-documents'
    AND (storage.foldername(name))[1] = public.current_user_firm_id()::TEXT
    AND public.current_user_role() IN ('SUPER_ADMIN', 'PARTNER')
  );

DROP POLICY IF EXISTS firm_documents_delete ON storage.objects;
CREATE POLICY firm_documents_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'firm-documents'
    AND (storage.foldername(name))[1] = public.current_user_firm_id()::TEXT
    AND public.current_user_role() IN ('SUPER_ADMIN', 'PARTNER')
  );

COMMIT;
