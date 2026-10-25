-- Authenticated RPCs for Neon Data API. No table grants are given to browser roles.
-- Public QR verification intentionally remains disabled until abuse controls are verified.

CREATE OR REPLACE FUNCTION public.register_digital_card_issuer(
  p_issuer_key text,
  p_display_name text,
  p_issuer_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, neon_auth, auth
AS $function$
DECLARE
  v_auth_subject text := auth.user_id();
  v_auth_user neon_auth."user"%ROWTYPE;
  v_user_id uuid;
  v_issuer_id uuid;
  v_allowed boolean;
  v_count integer;
BEGIN
  IF v_auth_subject IS NULL OR v_auth_subject !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  SELECT * INTO v_auth_user FROM neon_auth."user"
    WHERE id = v_auth_subject::uuid AND "emailVerified" = true
      AND COALESCE(banned, false) = false
      AND ("banExpires" IS NULL OR "banExpires" > clock_timestamp());
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verified active account required' USING ERRCODE = '28000';
  END IF;
  IF p_issuer_key IS NULL OR p_issuer_key !~ '^[a-z][a-z0-9_-]{2,63}$'
     OR p_display_name IS NULL OR length(trim(p_display_name)) NOT BETWEEN 2 AND 200
     OR p_issuer_type IS NULL OR p_issuer_type NOT IN ('school','project','organization','event','personal','service_provider') THEN
    RAISE EXCEPTION 'Invalid issuer details' USING ERRCODE = '22023';
  END IF;

  SELECT public.consume_digital_card_rate_limit(
    encode(digest('register-issuer:' || v_auth_subject, 'sha256'), 'hex'), 86400, 3
  ) INTO v_allowed;
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Issuer creation limit reached' USING ERRCODE = '54000';
  END IF;

  INSERT INTO public.app_users (auth_subject, display_name, email, status)
  VALUES (v_auth_subject, left(v_auth_user.name, 120), lower(v_auth_user.email), 'active')
  ON CONFLICT (auth_subject) DO UPDATE
    SET display_name = EXCLUDED.display_name, email = EXCLUDED.email
    WHERE public.app_users.status = 'active'
  RETURNING id INTO v_user_id;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Application account disabled' USING ERRCODE = '28000';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.digital_card_issuer_memberships
  WHERE user_id = v_user_id AND status = 'active';
  IF v_count >= 3 THEN
    RAISE EXCEPTION 'Issuer membership limit reached' USING ERRCODE = '54000';
  END IF;

  INSERT INTO public.digital_card_issuers (issuer_key, display_name, issuer_type, status)
  VALUES (p_issuer_key, trim(p_display_name), p_issuer_type, 'active')
  RETURNING id INTO v_issuer_id;

  INSERT INTO public.digital_card_issuer_memberships (issuer_id, user_id, role, status)
  VALUES (v_issuer_id, v_user_id, 'issuer_admin', 'active');

  INSERT INTO public.digital_card_audit_events
    (issuer_id, actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (v_issuer_id, v_user_id, 'issuer.created', 'digital_card_issuer', v_issuer_id,
    jsonb_build_object('issuerType', p_issuer_type, 'provisioning', 'self_service'));

  RETURN jsonb_build_object('issuerId', v_issuer_id, 'issuerKey', p_issuer_key,
    'displayName', trim(p_display_name), 'issuerType', p_issuer_type, 'role', 'issuer_admin');
END;
$function$;

CREATE OR REPLACE FUNCTION public.list_digital_cards(p_issuer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, neon_auth, auth
AS $function$
DECLARE
  v_auth_subject text := auth.user_id();
  v_user_id uuid;
  v_cards jsonb;
BEGIN
  IF v_auth_subject IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  SELECT au.id INTO v_user_id
  FROM public.app_users au
  JOIN neon_auth."user" nu ON nu.id::text = au.auth_subject
  WHERE au.auth_subject = v_auth_subject AND au.status = 'active'
    AND nu."emailVerified" = true AND COALESCE(nu.banned, false) = false
    AND (nu."banExpires" IS NULL OR nu."banExpires" > clock_timestamp())
  LIMIT 1;
  IF v_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.digital_card_issuer_memberships im
    JOIN public.digital_card_issuers di ON di.id = im.issuer_id
    WHERE im.issuer_id = p_issuer_id AND im.user_id = v_user_id
      AND im.status = 'active' AND di.status = 'active'
      AND im.role IN ('issuer_admin','operator')
  ) THEN
    RAISE EXCEPTION 'Issuer access denied' USING ERRCODE = '42501';
  END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', c.id, 'cardNumber', c.card_number, 'cardTypeId', c.card_type_id,
    'status', c.status, 'issuedAt', c.issued_at, 'expiresAt', c.expires_at,
    'createdAt', c.created_at, 'revokedAt', c.revoked_at
  ) ORDER BY c.created_at DESC), '[]'::jsonb)
  INTO v_cards
  FROM (
    SELECT id, card_number, card_type_id, status, issued_at, expires_at, created_at, revoked_at
    FROM public.digital_cards WHERE issuer_id = p_issuer_id
    ORDER BY created_at DESC LIMIT 200
  ) c;
  RETURN jsonb_build_object('cards', v_cards);
END;
$function$;

CREATE OR REPLACE FUNCTION public.issue_digital_card(
  p_issuer_id uuid,
  p_card_type_id text,
  p_card_number text,
  p_subject_ref text,
  p_public_claims jsonb,
  p_expires_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, neon_auth, auth
AS $function$
DECLARE
  v_auth_subject text := auth.user_id();
  v_user_id uuid;
  v_card_id uuid;
  v_token text;
  v_hash bytea;
  v_allowed boolean;
BEGIN
  IF v_auth_subject IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  SELECT au.id INTO v_user_id
  FROM public.app_users au
  JOIN neon_auth."user" nu ON nu.id::text = au.auth_subject
  WHERE au.auth_subject = v_auth_subject AND au.status = 'active'
    AND nu."emailVerified" = true AND COALESCE(nu.banned, false) = false
    AND (nu."banExpires" IS NULL OR nu."banExpires" > clock_timestamp())
  LIMIT 1;
  IF v_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.digital_card_issuer_memberships im
    JOIN public.digital_card_issuers di ON di.id = im.issuer_id
    WHERE im.issuer_id = p_issuer_id AND im.user_id = v_user_id
      AND im.status = 'active' AND di.status = 'active'
      AND im.role IN ('issuer_admin','operator')
  ) THEN
    RAISE EXCEPTION 'Issuer access denied' USING ERRCODE = '42501';
  END IF;
  SELECT public.consume_digital_card_rate_limit(
    encode(digest('issue-card:' || v_auth_subject || ':' || p_issuer_id::text, 'sha256'), 'hex'), 60, 20
  ) INTO v_allowed;
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Card issuance rate limit reached' USING ERRCODE = '54000';
  END IF;
  IF p_card_type_id IS NULL OR p_card_type_id NOT IN ('student_id','project_identity','digital_name_card','event_participant',
    'organization_membership','achievement_certificate','hajj_umrah_service')
    OR p_card_number IS NULL OR length(trim(p_card_number)) NOT BETWEEN 3 AND 100
    OR p_subject_ref IS NULL OR length(trim(p_subject_ref)) NOT BETWEEN 1 AND 160
    OR p_public_claims IS NULL OR jsonb_typeof(p_public_claims) <> 'object'
    OR (SELECT count(*) FROM jsonb_object_keys(p_public_claims)) > 3
    OR EXISTS (SELECT 1 FROM jsonb_object_keys(p_public_claims) AS keys(key)
      WHERE key NOT IN ('organization_name','role_label','status_label'))
    OR EXISTS (SELECT 1 FROM jsonb_each(p_public_claims) AS kv
      WHERE jsonb_typeof(kv.value) <> 'string' OR length(kv.value #>> '{}') > 120) THEN
    RAISE EXCEPTION 'Invalid card details or public claims' USING ERRCODE = '22023';
  END IF;
  IF p_expires_at IS NOT NULL AND
    (p_expires_at <= clock_timestamp() OR p_expires_at > clock_timestamp() + interval '10 years') THEN
    RAISE EXCEPTION 'Expiry must be in the future and within 10 years' USING ERRCODE = '22023';
  END IF;

  v_token := encode(gen_random_bytes(32), 'hex');
  v_hash := digest(v_token, 'sha256');
  INSERT INTO public.digital_cards
    (issuer_id, card_type_id, card_number, subject_ref, public_claims, private_claims,
     credential_hash, status, issued_at, expires_at)
  VALUES (p_issuer_id, p_card_type_id, trim(p_card_number), trim(p_subject_ref),
    p_public_claims, '{}'::jsonb, v_hash, 'active', clock_timestamp(), p_expires_at)
  RETURNING id INTO v_card_id;

  INSERT INTO public.digital_card_audit_events
    (issuer_id, actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (p_issuer_id, v_user_id, 'credential_issued', 'digital_card', v_card_id,
    jsonb_build_object('cardTypeId', p_card_type_id, 'publicClaimsKeys', (
      SELECT COALESCE(jsonb_agg(key), '[]'::jsonb) FROM jsonb_object_keys(p_public_claims) AS keys(key)
    )));

  RETURN jsonb_build_object('cardId', v_card_id, 'cardNumber', trim(p_card_number),
    'cardTypeId', p_card_type_id, 'status', 'active', 'issuedAt', clock_timestamp(),
    'expiresAt', p_expires_at, 'qrToken', v_token);
END;
$function$;

CREATE OR REPLACE FUNCTION public.revoke_digital_card(
  p_issuer_id uuid,
  p_card_id uuid,
  p_reason_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, neon_auth, auth
AS $function$
DECLARE
  v_auth_subject text := auth.user_id();
  v_user_id uuid;
  v_card public.digital_cards%ROWTYPE;
  v_allowed boolean;
BEGIN
  IF v_auth_subject IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  SELECT au.id INTO v_user_id
  FROM public.app_users au
  JOIN neon_auth."user" nu ON nu.id::text = au.auth_subject
  WHERE au.auth_subject = v_auth_subject AND au.status = 'active'
    AND nu."emailVerified" = true AND COALESCE(nu.banned, false) = false
    AND (nu."banExpires" IS NULL OR nu."banExpires" > clock_timestamp())
  LIMIT 1;
  IF v_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.digital_card_issuer_memberships im
    JOIN public.digital_card_issuers di ON di.id = im.issuer_id
    WHERE im.issuer_id = p_issuer_id AND im.user_id = v_user_id
      AND im.status = 'active' AND di.status = 'active'
      AND im.role IN ('issuer_admin','operator')
  ) THEN
    RAISE EXCEPTION 'Issuer access denied' USING ERRCODE = '42501';
  END IF;
  IF p_reason_code IS NULL OR p_reason_code NOT IN ('replaced','lost','incorrect_data','issuer_request','security_concern') THEN
    RAISE EXCEPTION 'Invalid revocation reason' USING ERRCODE = '22023';
  END IF;
  SELECT public.consume_digital_card_rate_limit(
    encode(digest('revoke-card:' || v_auth_subject || ':' || p_issuer_id::text, 'sha256'), 'hex'), 60, 20
  ) INTO v_allowed;
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Card revocation rate limit reached' USING ERRCODE = '54000';
  END IF;

  UPDATE public.digital_cards SET status = 'revoked', revoked_at = clock_timestamp(), updated_at = clock_timestamp()
  WHERE id = p_card_id AND issuer_id = p_issuer_id AND status IN ('active','pending')
  RETURNING * INTO v_card;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active card not found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.digital_card_audit_events
    (issuer_id, actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (p_issuer_id, v_user_id, 'credential_revoked', 'digital_card', v_card.id,
    jsonb_build_object('reasonCode', p_reason_code));

  RETURN jsonb_build_object('cardId', v_card.id, 'status', v_card.status, 'revokedAt', v_card.revoked_at);
END;
$function$;

REVOKE ALL ON FUNCTION public.register_digital_card_issuer(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.register_digital_card_issuer(text, text, text) FROM anonymous;
GRANT EXECUTE ON FUNCTION public.register_digital_card_issuer(text, text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.list_digital_cards(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_digital_cards(uuid) FROM anonymous;
GRANT EXECUTE ON FUNCTION public.list_digital_cards(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.issue_digital_card(uuid, text, text, text, jsonb, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.issue_digital_card(uuid, text, text, text, jsonb, timestamptz) FROM anonymous;
GRANT EXECUTE ON FUNCTION public.issue_digital_card(uuid, text, text, text, jsonb, timestamptz) TO authenticated;
REVOKE ALL ON FUNCTION public.revoke_digital_card(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revoke_digital_card(uuid, uuid, text) FROM anonymous;
GRANT EXECUTE ON FUNCTION public.revoke_digital_card(uuid, uuid, text) TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
