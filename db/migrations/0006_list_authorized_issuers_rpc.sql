-- List only issuers for which the verified caller has an active membership.
CREATE OR REPLACE FUNCTION public.list_digital_card_issuers()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, neon_auth, auth
AS $function$
DECLARE
  v_auth_subject text := auth.user_id();
  v_issuers jsonb;
BEGIN
  IF v_auth_subject IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM neon_auth."user" nu
    WHERE nu.id::text = v_auth_subject AND nu."emailVerified" = true
      AND COALESCE(nu.banned, false) = false
      AND (nu."banExpires" IS NULL OR nu."banExpires" > clock_timestamp())
  ) THEN
    RAISE EXCEPTION 'Verified active account required' USING ERRCODE = '28000';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'issuerId', di.id,
    'issuerKey', di.issuer_key,
    'displayName', di.display_name,
    'issuerType', di.issuer_type,
    'role', im.role,
    'status', di.status
  ) ORDER BY di.created_at DESC), '[]'::jsonb)
  INTO v_issuers
  FROM public.digital_card_issuer_memberships im
  JOIN public.app_users au ON au.id = im.user_id
  JOIN public.digital_card_issuers di ON di.id = im.issuer_id
  WHERE au.auth_subject = v_auth_subject
    AND au.status = 'active'
    AND im.status = 'active'
    AND di.status = 'active'
    AND im.role IN ('issuer_admin','operator','verifier','viewer')
  LIMIT 100;

  RETURN jsonb_build_object('issuers', v_issuers);
END;
$function$;

REVOKE ALL ON FUNCTION public.list_digital_card_issuers() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_digital_card_issuers() FROM anonymous;
GRANT EXECUTE ON FUNCTION public.list_digital_card_issuers() TO authenticated;
