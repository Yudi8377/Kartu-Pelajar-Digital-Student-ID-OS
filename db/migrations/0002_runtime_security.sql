-- Student ID OS runtime security migration.
-- Apply only after rehearsal on a temporary Neon branch and explicit release approval.
-- No student records are inserted or modified by this migration.

GRANT USAGE ON SCHEMA public TO student_id_os_runtime;

REVOKE ALL ON TABLE public.schools, public.app_users, public.school_memberships,
  public.students, public.student_cards, public.audit_events FROM PUBLIC;
REVOKE ALL ON TABLE public.schools, public.app_users, public.school_memberships,
  public.students, public.student_cards, public.audit_events FROM student_id_os_runtime;
REVOKE ALL ON SEQUENCE public.audit_events_id_seq FROM PUBLIC;
REVOKE ALL ON SEQUENCE public.audit_events_id_seq FROM student_id_os_runtime;

GRANT SELECT, INSERT, UPDATE ON TABLE public.schools TO student_id_os_runtime;
GRANT SELECT, INSERT, UPDATE ON TABLE public.app_users TO student_id_os_runtime;
GRANT SELECT, INSERT, UPDATE ON TABLE public.school_memberships TO student_id_os_runtime;
GRANT SELECT, INSERT, UPDATE ON TABLE public.students TO student_id_os_runtime;
GRANT SELECT, INSERT, UPDATE ON TABLE public.student_cards TO student_id_os_runtime;
GRANT SELECT, INSERT ON TABLE public.audit_events TO student_id_os_runtime;
GRANT USAGE, SELECT ON SEQUENCE public.audit_events_id_seq TO student_id_os_runtime;

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT au.id
  FROM public.app_users AS au
  WHERE au.auth_subject = current_setting('app.auth_subject', true)
    AND au.status = 'active'
  LIMIT 1
$function$;

CREATE OR REPLACE FUNCTION public.is_school_member(p_school_id uuid, p_roles text[] DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.school_memberships AS sm
    JOIN public.app_users AS au ON au.id = sm.user_id
    WHERE sm.school_id = p_school_id
      AND au.auth_subject = current_setting('app.auth_subject', true)
      AND au.status = 'active'
      AND sm.status = 'active'
      AND (p_roles IS NULL OR sm.role = ANY(p_roles))
  )
$function$;

REVOKE ALL ON FUNCTION public.current_app_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_school_member(uuid, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO student_id_os_runtime;
GRANT EXECUTE ON FUNCTION public.is_school_member(uuid, text[]) TO student_id_os_runtime;

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS schools_select_member ON public.schools;
CREATE POLICY schools_select_member ON public.schools
  FOR SELECT TO student_id_os_runtime
  USING (public.is_school_member(id, NULL));

DROP POLICY IF EXISTS schools_insert_bootstrap ON public.schools;
CREATE POLICY schools_insert_bootstrap ON public.schools
  FOR INSERT TO student_id_os_runtime
  WITH CHECK (current_setting('app.bootstrap_mode', true) = 'on');

DROP POLICY IF EXISTS schools_update_admin ON public.schools;
CREATE POLICY schools_update_admin ON public.schools
  FOR UPDATE TO student_id_os_runtime
  USING (public.is_school_member(id, ARRAY['school_admin']::text[]))
  WITH CHECK (public.is_school_member(id, ARRAY['school_admin']::text[]));

DROP POLICY IF EXISTS app_users_select_self ON public.app_users;
CREATE POLICY app_users_select_self ON public.app_users
  FOR SELECT TO student_id_os_runtime
  USING (id = public.current_app_user_id());

DROP POLICY IF EXISTS app_users_insert_self_or_bootstrap ON public.app_users;
CREATE POLICY app_users_insert_self_or_bootstrap ON public.app_users
  FOR INSERT TO student_id_os_runtime
  WITH CHECK (
    auth_subject = current_setting('app.auth_subject', true)
    OR current_setting('app.bootstrap_mode', true) = 'on'
  );

DROP POLICY IF EXISTS app_users_update_self ON public.app_users;
CREATE POLICY app_users_update_self ON public.app_users
  FOR UPDATE TO student_id_os_runtime
  USING (id = public.current_app_user_id())
  WITH CHECK (id = public.current_app_user_id());

DROP POLICY IF EXISTS memberships_select_self_or_admin ON public.school_memberships;
CREATE POLICY memberships_select_self_or_admin ON public.school_memberships
  FOR SELECT TO student_id_os_runtime
  USING (
    user_id = public.current_app_user_id()
    OR public.is_school_member(school_id, ARRAY['school_admin']::text[])
  );

DROP POLICY IF EXISTS memberships_insert_bootstrap_or_admin ON public.school_memberships;
CREATE POLICY memberships_insert_bootstrap_or_admin ON public.school_memberships
  FOR INSERT TO student_id_os_runtime
  WITH CHECK (
    current_setting('app.bootstrap_mode', true) = 'on'
    OR public.is_school_member(school_id, ARRAY['school_admin']::text[])
  );

DROP POLICY IF EXISTS memberships_update_admin ON public.school_memberships;
CREATE POLICY memberships_update_admin ON public.school_memberships
  FOR UPDATE TO student_id_os_runtime
  USING (public.is_school_member(school_id, ARRAY['school_admin']::text[]))
  WITH CHECK (public.is_school_member(school_id, ARRAY['school_admin']::text[]));

DROP POLICY IF EXISTS students_select_staff ON public.students;
CREATE POLICY students_select_staff ON public.students
  FOR SELECT TO student_id_os_runtime
  USING (public.is_school_member(school_id, ARRAY['school_admin','operator']::text[]));

DROP POLICY IF EXISTS students_insert_staff ON public.students;
CREATE POLICY students_insert_staff ON public.students
  FOR INSERT TO student_id_os_runtime
  WITH CHECK (public.is_school_member(school_id, ARRAY['school_admin','operator']::text[]));

DROP POLICY IF EXISTS students_update_staff ON public.students;
CREATE POLICY students_update_staff ON public.students
  FOR UPDATE TO student_id_os_runtime
  USING (public.is_school_member(school_id, ARRAY['school_admin','operator']::text[]))
  WITH CHECK (public.is_school_member(school_id, ARRAY['school_admin','operator']::text[]));

DROP POLICY IF EXISTS cards_select_staff ON public.student_cards;
CREATE POLICY cards_select_staff ON public.student_cards
  FOR SELECT TO student_id_os_runtime
  USING (public.is_school_member(school_id, ARRAY['school_admin','operator','verifier']::text[]));

DROP POLICY IF EXISTS cards_insert_staff ON public.student_cards;
CREATE POLICY cards_insert_staff ON public.student_cards
  FOR INSERT TO student_id_os_runtime
  WITH CHECK (public.is_school_member(school_id, ARRAY['school_admin','operator']::text[]));

DROP POLICY IF EXISTS cards_update_staff ON public.student_cards;
CREATE POLICY cards_update_staff ON public.student_cards
  FOR UPDATE TO student_id_os_runtime
  USING (public.is_school_member(school_id, ARRAY['school_admin','operator']::text[]))
  WITH CHECK (public.is_school_member(school_id, ARRAY['school_admin','operator']::text[]));

DROP POLICY IF EXISTS audit_select_staff ON public.audit_events;
CREATE POLICY audit_select_staff ON public.audit_events
  FOR SELECT TO student_id_os_runtime
  USING (school_id IS NOT NULL AND public.is_school_member(school_id, ARRAY['school_admin','operator']::text[]));

DROP POLICY IF EXISTS audit_insert_member ON public.audit_events;
CREATE POLICY audit_insert_member ON public.audit_events
  FOR INSERT TO student_id_os_runtime
  WITH CHECK (
    actor_user_id = public.current_app_user_id()
    AND school_id IS NOT NULL
    AND public.is_school_member(school_id, ARRAY['school_admin','operator','verifier']::text[])
  );

CREATE OR REPLACE FUNCTION public.verify_student_card(p_token_hash bytea)
RETURNS TABLE(valid boolean, school_name text, card_status text, expires_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  WITH matched AS (
    SELECT sc.status AS card_status, sc.expires_at, st.status AS student_status,
           s.status AS school_status, s.name AS school_name
    FROM public.student_cards AS sc
    JOIN public.students AS st ON st.id = sc.student_id AND st.school_id = sc.school_id
    JOIN public.schools AS s ON s.id = sc.school_id
    WHERE sc.qr_token_hash = p_token_hash
    LIMIT 1
  )
  SELECT
    (card_status = 'active' AND student_status = 'active' AND school_status = 'active'
      AND (expires_at IS NULL OR expires_at > statement_timestamp())) AS valid,
    CASE WHEN card_status = 'active' AND student_status = 'active' AND school_status = 'active'
      AND (expires_at IS NULL OR expires_at > statement_timestamp()) THEN school_name ELSE NULL END,
    CASE WHEN card_status = 'active' AND student_status = 'active' AND school_status = 'active'
      AND (expires_at IS NULL OR expires_at > statement_timestamp()) THEN card_status ELSE NULL END,
    CASE WHEN card_status = 'active' AND student_status = 'active' AND school_status = 'active'
      AND (expires_at IS NULL OR expires_at > statement_timestamp()) THEN expires_at ELSE NULL END
  FROM matched
  UNION ALL
  SELECT false, NULL::text, NULL::text, NULL::timestamptz
  WHERE NOT EXISTS (SELECT 1 FROM matched)
$function$;

REVOKE ALL ON FUNCTION public.verify_student_card(bytea) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_student_card(bytea) TO student_id_os_runtime;
