-- Digital Card OS generic issuer/card storage foundation.
-- Additive only: preserves the existing Student ID OS tables and data.
-- Apply only after a rehearsal on a temporary database branch and a reviewed release.
-- Do not expose generic verification until a shared rate limiter and API are deployed.

CREATE TABLE IF NOT EXISTS public.digital_card_issuers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_key text NOT NULL UNIQUE CHECK (issuer_key ~ '^[a-z][a-z0-9_-]{2,63}$'),
  display_name text NOT NULL CHECK (length(trim(display_name)) BETWEEN 2 AND 200),
  issuer_type text NOT NULL CHECK (issuer_type IN ('school','project','organization','event','personal','service_provider')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.digital_card_issuer_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id uuid NOT NULL REFERENCES public.digital_card_issuers(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE RESTRICT,
  role text NOT NULL CHECK (role IN ('issuer_admin','operator','verifier','viewer')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issuer_id, user_id, role)
);

CREATE TABLE IF NOT EXISTS public.digital_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id uuid NOT NULL REFERENCES public.digital_card_issuers(id) ON DELETE RESTRICT,
  card_type_id text NOT NULL CHECK (card_type_id IN (
    'student_id','project_identity','digital_name_card','event_participant',
    'organization_membership','achievement_certificate','hajj_umrah_service'
  )),
  card_number text NOT NULL CHECK (length(trim(card_number)) BETWEEN 3 AND 100),
  -- Issuer-local opaque reference only. Do not put a name, phone, or student number here.
  subject_ref text NOT NULL CHECK (length(trim(subject_ref)) BETWEEN 1 AND 160),
  -- These JSON objects are operator-only data. Public verification must never return them.
  public_claims jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(public_claims) = 'object'),
  private_claims jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(private_claims) = 'object'),
  credential_hash bytea UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','revoked','expired','replaced')),
  issued_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issuer_id, card_number),
  CHECK (expires_at IS NULL OR issued_at IS NULL OR expires_at > issued_at),
  CHECK (status <> 'active' OR credential_hash IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.digital_card_audit_events (
  id bigserial PRIMARY KEY,
  issuer_id uuid NOT NULL REFERENCES public.digital_card_issuers(id) ON DELETE RESTRICT,
  actor_user_id uuid REFERENCES public.app_users(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (length(trim(action)) BETWEEN 1 AND 120),
  entity_type text NOT NULL CHECK (length(trim(entity_type)) BETWEEN 1 AND 80),
  entity_id uuid,
  request_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS digital_card_memberships_user_idx
  ON public.digital_card_issuer_memberships (user_id, status);
CREATE INDEX IF NOT EXISTS digital_cards_issuer_status_idx
  ON public.digital_cards (issuer_id, status);
CREATE INDEX IF NOT EXISTS digital_cards_expiry_idx
  ON public.digital_cards (expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS digital_card_audit_issuer_created_idx
  ON public.digital_card_audit_events (issuer_id, created_at DESC);

COMMENT ON TABLE public.digital_card_issuers IS 'Tenant/issuer boundary for Digital Card OS card types.';
COMMENT ON TABLE public.digital_cards IS 'Generic credentials; claims are never returned by the minimal verification function.';
COMMENT ON COLUMN public.digital_cards.credential_hash IS 'One-way SHA-256 hash of a high-entropy opaque token; never store raw QR tokens.';
COMMENT ON COLUMN public.digital_cards.subject_ref IS 'Issuer-local opaque reference; never store direct personal identifiers.';
COMMENT ON TABLE public.digital_card_audit_events IS 'Issuer-scoped audit events. Never store raw QR tokens or token hashes in metadata.';

REVOKE ALL ON TABLE public.digital_card_issuers, public.digital_card_issuer_memberships,
  public.digital_cards, public.digital_card_audit_events FROM PUBLIC;
REVOKE ALL ON TABLE public.digital_card_issuers, public.digital_card_issuer_memberships,
  public.digital_cards, public.digital_card_audit_events FROM student_id_os_runtime;
REVOKE ALL ON SEQUENCE public.digital_card_audit_events_id_seq FROM PUBLIC;
REVOKE ALL ON SEQUENCE public.digital_card_audit_events_id_seq FROM student_id_os_runtime;

GRANT SELECT, INSERT, UPDATE ON TABLE public.digital_card_issuers TO student_id_os_runtime;
GRANT SELECT, INSERT, UPDATE ON TABLE public.digital_card_issuer_memberships TO student_id_os_runtime;
GRANT SELECT, INSERT, UPDATE ON TABLE public.digital_cards TO student_id_os_runtime;
GRANT SELECT, INSERT ON TABLE public.digital_card_audit_events TO student_id_os_runtime;
GRANT USAGE, SELECT ON SEQUENCE public.digital_card_audit_events_id_seq TO student_id_os_runtime;

CREATE OR REPLACE FUNCTION public.is_card_issuer_member(
  p_issuer_id uuid,
  p_roles text[] DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.digital_card_issuer_memberships AS im
    JOIN public.app_users AS au ON au.id = im.user_id
    WHERE im.issuer_id = p_issuer_id
      AND au.auth_subject = current_setting('app.auth_subject', true)
      AND au.status = 'active'
      AND im.status = 'active'
      AND (p_roles IS NULL OR im.role = ANY(p_roles))
  )
$function$;

REVOKE ALL ON FUNCTION public.is_card_issuer_member(uuid, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_card_issuer_member(uuid, text[]) TO student_id_os_runtime;

ALTER TABLE public.digital_card_issuers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_card_issuer_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_card_audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS digital_issuers_select_member ON public.digital_card_issuers;
CREATE POLICY digital_issuers_select_member ON public.digital_card_issuers
  FOR SELECT TO student_id_os_runtime
  USING (public.is_card_issuer_member(id, NULL));

DROP POLICY IF EXISTS digital_issuers_insert_bootstrap ON public.digital_card_issuers;
CREATE POLICY digital_issuers_insert_bootstrap ON public.digital_card_issuers
  FOR INSERT TO student_id_os_runtime
  WITH CHECK (current_setting('app.bootstrap_mode', true) = 'on');

DROP POLICY IF EXISTS digital_issuers_update_admin ON public.digital_card_issuers;
CREATE POLICY digital_issuers_update_admin ON public.digital_card_issuers
  FOR UPDATE TO student_id_os_runtime
  USING (public.is_card_issuer_member(id, ARRAY['issuer_admin']::text[]))
  WITH CHECK (public.is_card_issuer_member(id, ARRAY['issuer_admin']::text[]));

DROP POLICY IF EXISTS digital_issuer_memberships_select_self_or_admin ON public.digital_card_issuer_memberships;
CREATE POLICY digital_issuer_memberships_select_self_or_admin ON public.digital_card_issuer_memberships
  FOR SELECT TO student_id_os_runtime
  USING (
    user_id = public.current_app_user_id()
    OR public.is_card_issuer_member(issuer_id, ARRAY['issuer_admin']::text[])
  );

DROP POLICY IF EXISTS digital_issuer_memberships_insert_bootstrap_or_admin ON public.digital_card_issuer_memberships;
CREATE POLICY digital_issuer_memberships_insert_bootstrap_or_admin ON public.digital_card_issuer_memberships
  FOR INSERT TO student_id_os_runtime
  WITH CHECK (
    current_setting('app.bootstrap_mode', true) = 'on'
    OR public.is_card_issuer_member(issuer_id, ARRAY['issuer_admin']::text[])
  );

DROP POLICY IF EXISTS digital_issuer_memberships_update_admin ON public.digital_card_issuer_memberships;
CREATE POLICY digital_issuer_memberships_update_admin ON public.digital_card_issuer_memberships
  FOR UPDATE TO student_id_os_runtime
  USING (public.is_card_issuer_member(issuer_id, ARRAY['issuer_admin']::text[]))
  WITH CHECK (public.is_card_issuer_member(issuer_id, ARRAY['issuer_admin']::text[]));

-- Verifiers deliberately do not receive direct SELECT access to claim JSON.
DROP POLICY IF EXISTS digital_cards_select_operators ON public.digital_cards;
CREATE POLICY digital_cards_select_operators ON public.digital_cards
  FOR SELECT TO student_id_os_runtime
  USING (public.is_card_issuer_member(issuer_id, ARRAY['issuer_admin','operator']::text[]));

DROP POLICY IF EXISTS digital_cards_insert_operators ON public.digital_cards;
CREATE POLICY digital_cards_insert_operators ON public.digital_cards
  FOR INSERT TO student_id_os_runtime
  WITH CHECK (public.is_card_issuer_member(issuer_id, ARRAY['issuer_admin','operator']::text[]));

DROP POLICY IF EXISTS digital_cards_update_operators ON public.digital_cards;
CREATE POLICY digital_cards_update_operators ON public.digital_cards
  FOR UPDATE TO student_id_os_runtime
  USING (public.is_card_issuer_member(issuer_id, ARRAY['issuer_admin','operator']::text[]))
  WITH CHECK (public.is_card_issuer_member(issuer_id, ARRAY['issuer_admin','operator']::text[]));

DROP POLICY IF EXISTS digital_card_audit_select_admin ON public.digital_card_audit_events;
CREATE POLICY digital_card_audit_select_admin ON public.digital_card_audit_events
  FOR SELECT TO student_id_os_runtime
  USING (public.is_card_issuer_member(issuer_id, ARRAY['issuer_admin']::text[]));

DROP POLICY IF EXISTS digital_card_audit_insert_member ON public.digital_card_audit_events;
CREATE POLICY digital_card_audit_insert_member ON public.digital_card_audit_events
  FOR INSERT TO student_id_os_runtime
  WITH CHECK (
    actor_user_id = public.current_app_user_id()
    AND public.is_card_issuer_member(issuer_id, ARRAY['issuer_admin','operator']::text[])
  );

-- Minimal validity result only. Do not grant this to PUBLIC; the API must enforce shared rate limiting.
CREATE OR REPLACE FUNCTION public.verify_digital_card(p_token_hash bytea)
RETURNS TABLE(valid boolean, issuer_name text, card_type_id text, card_status text, expires_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  WITH matched AS (
    SELECT dc.status AS card_status, dc.card_type_id, dc.expires_at,
           di.status AS issuer_status, di.display_name AS issuer_name
    FROM public.digital_cards AS dc
    JOIN public.digital_card_issuers AS di ON di.id = dc.issuer_id
    WHERE dc.credential_hash = p_token_hash
    LIMIT 1
  )
  SELECT
    (card_status = 'active' AND issuer_status = 'active'
      AND (expires_at IS NULL OR expires_at > statement_timestamp())) AS valid,
    CASE WHEN card_status = 'active' AND issuer_status = 'active'
      AND (expires_at IS NULL OR expires_at > statement_timestamp()) THEN issuer_name ELSE NULL END,
    CASE WHEN card_status = 'active' AND issuer_status = 'active'
      AND (expires_at IS NULL OR expires_at > statement_timestamp()) THEN card_type_id ELSE NULL END,
    CASE WHEN card_status = 'active' AND issuer_status = 'active'
      AND (expires_at IS NULL OR expires_at > statement_timestamp()) THEN card_status ELSE NULL END,
    CASE WHEN card_status = 'active' AND issuer_status = 'active'
      AND (expires_at IS NULL OR expires_at > statement_timestamp()) THEN expires_at ELSE NULL END
  FROM matched
  UNION ALL
  SELECT false, NULL::text, NULL::text, NULL::text, NULL::timestamptz
  WHERE NOT EXISTS (SELECT 1 FROM matched)
$function$;

REVOKE ALL ON FUNCTION public.verify_digital_card(bytea) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_digital_card(bytea) TO student_id_os_runtime;
