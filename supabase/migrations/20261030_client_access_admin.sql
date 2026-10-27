-- Partner-only account assignment transactions, callable only by the
-- server-side Supabase secret client after it independently authenticates the
-- requesting partner.
BEGIN;

CREATE OR REPLACE FUNCTION public.grant_client_entity_access(
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
    SELECT 1 FROM public.users client_user
    WHERE client_user.id = p_user_id AND client_user.firm_id = p_firm_id
      AND client_user.role::TEXT IN ('CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT')
  ) THEN
    RAISE EXCEPTION 'The client user does not belong to this firm.' USING ERRCODE = '22023';
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

  INSERT INTO public.user_client_entities (user_id, entity_id, created_by)
  SELECT p_user_id, item.entity_id, p_actor_id FROM unnest(p_entity_ids) AS item(entity_id)
  ON CONFLICT (user_id, entity_id) DO NOTHING;
  UPDATE public.users SET is_active = TRUE WHERE id = p_user_id AND firm_id = p_firm_id;
  INSERT INTO public.audit_logs (firm_id, actor_id, actor_name, actor_role, entity_name, action, details, category)
  SELECT p_firm_id, actor.id, actor.full_name, actor.role::TEXT, 'Client access',
    'Client entity access assigned',
    format('Granted %s entity assignment(s) to a client account.', cardinality(p_entity_ids)),
    'SECURITY'
  FROM public.users actor WHERE actor.id = p_actor_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_client_entity_access(
  p_firm_id UUID,
  p_actor_id UUID,
  p_user_id UUID,
  p_entity_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining INTEGER;
  v_deactivated BOOLEAN := FALSE;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users actor
    WHERE actor.id = p_actor_id AND actor.firm_id = p_firm_id
      AND actor.is_active = TRUE AND actor.role::TEXT IN ('SUPER_ADMIN', 'PARTNER')
  ) THEN
    RAISE EXCEPTION 'Partner authorization is required.' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.users client_user
    WHERE client_user.id = p_user_id AND client_user.firm_id = p_firm_id
      AND client_user.role::TEXT IN ('CLIENT_PROMOTER', 'CLIENT_ACCOUNTANT')
  ) OR NOT EXISTS (
    SELECT 1 FROM public.client_entities entity
    WHERE entity.id = p_entity_id AND entity.firm_id = p_firm_id
  ) THEN
    RAISE EXCEPTION 'The client account or entity does not belong to this firm.' USING ERRCODE = '22023';
  END IF;

  DELETE FROM public.user_client_entities WHERE user_id = p_user_id AND entity_id = p_entity_id;
  SELECT COUNT(*) INTO v_remaining FROM public.user_client_entities WHERE user_id = p_user_id;
  IF v_remaining = 0 THEN
    UPDATE public.users SET is_active = FALSE WHERE id = p_user_id AND firm_id = p_firm_id;
    v_deactivated := TRUE;
  END IF;

  INSERT INTO public.audit_logs (firm_id, actor_id, actor_name, actor_role, entity_name, action, details, category)
  SELECT p_firm_id, actor.id, actor.full_name, actor.role::TEXT, 'Client access',
    'Client entity access revoked',
    CASE WHEN v_deactivated THEN 'Revoked the final entity assignment and deactivated the client account.'
      ELSE 'Revoked one client entity assignment.' END,
    'SECURITY'
  FROM public.users actor WHERE actor.id = p_actor_id;
  RETURN v_deactivated;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_client_entity_access(UUID, UUID, UUID, UUID[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.revoke_client_entity_access(UUID, UUID, UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_client_entity_access(UUID, UUID, UUID, UUID[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.revoke_client_entity_access(UUID, UUID, UUID, UUID) TO service_role;

COMMIT;
