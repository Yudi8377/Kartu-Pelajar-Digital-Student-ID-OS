-- Student attendance schema.
-- Depends on 0001_initial.sql and 0002_runtime_security.sql.
-- Prepared for review only; do not apply to production without explicit approval.
-- No existing student records are read, inserted, updated, or deleted by this migration.

ALTER TABLE public.school_memberships
  DROP CONSTRAINT IF EXISTS school_memberships_role_check;

ALTER TABLE public.school_memberships
  ADD CONSTRAINT school_memberships_role_check
  CHECK (role IN ('school_admin','operator','verifier','student','parent','teacher'));

CREATE TABLE IF NOT EXISTS public.school_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE RESTRICT,
  class_code text NOT NULL,
  class_label text NOT NULL CHECK (length(trim(class_label)) BETWEEN 1 AND 120),
  academic_year text NOT NULL CHECK (length(trim(academic_year)) BETWEEN 4 AND 20),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, id),
  UNIQUE (school_id, class_code, academic_year)
);

CREATE TABLE IF NOT EXISTS public.school_class_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  class_id uuid NOT NULL,
  student_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','ended')),
  starts_on date NOT NULL DEFAULT CURRENT_DATE,
  ends_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (school_id, class_id) REFERENCES public.school_classes(school_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (school_id, student_id) REFERENCES public.students(school_id, id) ON DELETE RESTRICT,
  UNIQUE (school_id, class_id, student_id),
  CHECK (ends_on IS NULL OR ends_on >= starts_on)
);

CREATE TABLE IF NOT EXISTS public.school_class_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  class_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','ended')),
  starts_on date NOT NULL DEFAULT CURRENT_DATE,
  ends_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (school_id, class_id) REFERENCES public.school_classes(school_id, id) ON DELETE RESTRICT,
  UNIQUE (school_id, class_id, user_id),
  CHECK (ends_on IS NULL OR ends_on >= starts_on)
);

CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE RESTRICT,
  class_id uuid NOT NULL,
  session_code text NOT NULL,
  session_date date NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','open','closed','cancelled')),
  policy_version integer NOT NULL DEFAULT 1 CHECK (policy_version > 0),
  created_by uuid NOT NULL REFERENCES public.app_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (school_id, class_id) REFERENCES public.school_classes(school_id, id) ON DELETE RESTRICT,
  UNIQUE (school_id, session_code),
  UNIQUE (school_id, id),
  CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS public.attendance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  session_id uuid NOT NULL,
  student_id uuid NOT NULL,
  attendance_status text NOT NULL CHECK (
    attendance_status IN ('present','late','excused','sick','absent','early_departure')
  ),
  event_type text NOT NULL DEFAULT 'check_in' CHECK (event_type IN ('check_in','check_out','manual_mark')),
  source text NOT NULL CHECK (source IN ('teacher_scan','manual','authorized_device')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE RESTRICT,
  idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 8 AND 160),
  note text CHECK (note IS NULL OR length(note) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (school_id, session_id)
    REFERENCES public.attendance_sessions(school_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (school_id, student_id)
    REFERENCES public.students(school_id, id) ON DELETE RESTRICT,
  UNIQUE (session_id, student_id, event_type),
  UNIQUE (school_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.attendance_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  attendance_event_id uuid NOT NULL,
  corrected_status text NOT NULL CHECK (
    corrected_status IN ('present','late','excused','sick','absent','early_departure')
  ),
  reason text NOT NULL CHECK (length(trim(reason)) BETWEEN 5 AND 500),
  corrected_by uuid NOT NULL REFERENCES public.app_users(id) ON DELETE RESTRICT,
  reviewed_by uuid REFERENCES public.app_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (school_id, attendance_event_id)
    REFERENCES public.attendance_events(school_id, id) ON DELETE RESTRICT,
  CHECK (reviewed_by IS NULL OR reviewed_by <> corrected_by)
);

CREATE INDEX IF NOT EXISTS school_class_students_student_idx
  ON public.school_class_students (school_id, student_id, status);
CREATE INDEX IF NOT EXISTS school_class_teachers_user_idx
  ON public.school_class_teachers (school_id, user_id, status);
CREATE INDEX IF NOT EXISTS attendance_sessions_school_date_idx
  ON public.attendance_sessions (school_id, session_date DESC);
CREATE INDEX IF NOT EXISTS attendance_events_school_session_idx
  ON public.attendance_events (school_id, session_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS attendance_events_school_student_idx
  ON public.attendance_events (school_id, student_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS attendance_corrections_event_idx
  ON public.attendance_corrections (school_id, attendance_event_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.can_manage_school_class(p_school_id uuid, p_class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT
    public.is_school_member(p_school_id, ARRAY['school_admin','operator']::text[])
    OR (
      public.is_school_member(p_school_id, ARRAY['teacher']::text[])
      AND EXISTS (
        SELECT 1 FROM public.school_class_teachers AS ct
        JOIN public.app_users AS au ON au.id = ct.user_id
        WHERE ct.school_id = p_school_id
          AND ct.class_id = p_class_id
          AND ct.status = 'active'
          AND ct.starts_on <= CURRENT_DATE
          AND (ct.ends_on IS NULL OR ct.ends_on >= CURRENT_DATE)
          AND au.auth_subject = current_setting('app.auth_subject', true)
          AND au.status = 'active'
      )
    )
$function$;

CREATE OR REPLACE FUNCTION public.can_access_student_class(p_school_id uuid, p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT
    public.is_school_member(p_school_id, ARRAY['school_admin','operator']::text[])
    OR EXISTS (
      SELECT 1
      FROM public.school_class_students AS cs
      JOIN public.school_class_teachers AS ct
        ON ct.school_id = cs.school_id AND ct.class_id = cs.class_id
      JOIN public.app_users AS au ON au.id = ct.user_id
      WHERE cs.school_id = p_school_id
        AND cs.student_id = p_student_id
        AND cs.status = 'active'
        AND cs.starts_on <= CURRENT_DATE
        AND (cs.ends_on IS NULL OR cs.ends_on >= CURRENT_DATE)
        AND ct.status = 'active'
        AND (ct.ends_on IS NULL OR ct.ends_on >= CURRENT_DATE)
        AND au.auth_subject = current_setting('app.auth_subject', true)
        AND au.status = 'active'
        AND public.is_school_member(p_school_id, ARRAY['teacher']::text[])
    )
$function$;

CREATE OR REPLACE FUNCTION public.is_active_school_student(p_school_id uuid, p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.students AS st
    WHERE st.school_id = p_school_id AND st.id = p_student_id AND st.status = 'active'
  )
$function$;

REVOKE ALL ON FUNCTION public.can_manage_school_class(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_access_student_class(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_active_school_student(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_school_class(uuid, uuid) TO student_id_os_runtime;
GRANT EXECUTE ON FUNCTION public.can_access_student_class(uuid, uuid) TO student_id_os_runtime;
GRANT EXECUTE ON FUNCTION public.is_active_school_student(uuid, uuid) TO student_id_os_runtime;

REVOKE ALL ON TABLE public.school_classes, public.school_class_students,
  public.school_class_teachers, public.attendance_sessions, public.attendance_events,
  public.attendance_corrections FROM PUBLIC;
REVOKE ALL ON TABLE public.school_classes, public.school_class_students,
  public.school_class_teachers, public.attendance_sessions, public.attendance_events,
  public.attendance_corrections FROM student_id_os_runtime;

GRANT SELECT, INSERT, UPDATE ON TABLE public.school_classes TO student_id_os_runtime;
GRANT SELECT, INSERT, UPDATE ON TABLE public.school_class_students TO student_id_os_runtime;
GRANT SELECT, INSERT, UPDATE ON TABLE public.school_class_teachers TO student_id_os_runtime;
GRANT SELECT, INSERT, UPDATE ON TABLE public.attendance_sessions TO student_id_os_runtime;
GRANT SELECT, INSERT ON TABLE public.attendance_events TO student_id_os_runtime;
GRANT SELECT, INSERT ON TABLE public.attendance_corrections TO student_id_os_runtime;

ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_class_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_corrections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS students_select_staff ON public.students;
CREATE POLICY students_select_staff ON public.students
  FOR SELECT TO student_id_os_runtime
  USING (public.can_access_student_class(school_id, id));

DROP POLICY IF EXISTS school_classes_select_assigned ON public.school_classes;
CREATE POLICY school_classes_select_assigned ON public.school_classes
  FOR SELECT TO student_id_os_runtime
  USING (public.can_manage_school_class(school_id, id));

DROP POLICY IF EXISTS school_classes_insert_admin ON public.school_classes;
CREATE POLICY school_classes_insert_admin ON public.school_classes
  FOR INSERT TO student_id_os_runtime
  WITH CHECK (public.is_school_member(school_id, ARRAY['school_admin','operator']::text[]));

DROP POLICY IF EXISTS school_classes_update_admin ON public.school_classes;
CREATE POLICY school_classes_update_admin ON public.school_classes
  FOR UPDATE TO student_id_os_runtime
  USING (public.is_school_member(school_id, ARRAY['school_admin','operator']::text[]))
  WITH CHECK (public.is_school_member(school_id, ARRAY['school_admin','operator']::text[]));

DROP POLICY IF EXISTS school_class_students_select_assigned ON public.school_class_students;
CREATE POLICY school_class_students_select_assigned ON public.school_class_students
  FOR SELECT TO student_id_os_runtime
  USING (public.can_manage_school_class(school_id, class_id));

DROP POLICY IF EXISTS school_class_students_manage_admin ON public.school_class_students;
CREATE POLICY school_class_students_manage_admin ON public.school_class_students
  FOR ALL TO student_id_os_runtime
  USING (public.is_school_member(school_id, ARRAY['school_admin','operator']::text[]))
  WITH CHECK (public.is_school_member(school_id, ARRAY['school_admin','operator']::text[]));

DROP POLICY IF EXISTS school_class_teachers_select_assigned ON public.school_class_teachers;
CREATE POLICY school_class_teachers_select_assigned ON public.school_class_teachers
  FOR SELECT TO student_id_os_runtime
  USING (public.can_manage_school_class(school_id, class_id));

DROP POLICY IF EXISTS school_class_teachers_manage_admin ON public.school_class_teachers;
CREATE POLICY school_class_teachers_manage_admin ON public.school_class_teachers
  FOR ALL TO student_id_os_runtime
  USING (public.is_school_member(school_id, ARRAY['school_admin','operator']::text[]))
  WITH CHECK (public.is_school_member(school_id, ARRAY['school_admin','operator']::text[]));

DROP POLICY IF EXISTS attendance_sessions_select_assigned ON public.attendance_sessions;
CREATE POLICY attendance_sessions_select_assigned ON public.attendance_sessions
  FOR SELECT TO student_id_os_runtime
  USING (public.can_manage_school_class(school_id, class_id));

DROP POLICY IF EXISTS attendance_sessions_insert_assigned ON public.attendance_sessions;
CREATE POLICY attendance_sessions_insert_assigned ON public.attendance_sessions
  FOR INSERT TO student_id_os_runtime
  WITH CHECK (
    created_by = public.current_app_user_id()
    AND public.can_manage_school_class(school_id, class_id)
    AND EXISTS (
      SELECT 1 FROM public.school_classes AS c
      WHERE c.school_id = attendance_sessions.school_id
        AND c.id = attendance_sessions.class_id AND c.status = 'active'
    )
  );

DROP POLICY IF EXISTS attendance_sessions_update_admin ON public.attendance_sessions;
CREATE POLICY attendance_sessions_update_admin ON public.attendance_sessions
  FOR UPDATE TO student_id_os_runtime
  USING (public.is_school_member(school_id, ARRAY['school_admin','operator']::text[]))
  WITH CHECK (public.is_school_member(school_id, ARRAY['school_admin','operator']::text[]));

DROP POLICY IF EXISTS attendance_events_select_assigned ON public.attendance_events;
CREATE POLICY attendance_events_select_assigned ON public.attendance_events
  FOR SELECT TO student_id_os_runtime
  USING (
    public.can_manage_school_class(school_id, (
      SELECT s.class_id FROM public.attendance_sessions AS s
      WHERE s.school_id = attendance_events.school_id AND s.id = attendance_events.session_id
    ))
  );

DROP POLICY IF EXISTS attendance_events_insert_assigned ON public.attendance_events;
CREATE POLICY attendance_events_insert_assigned ON public.attendance_events
  FOR INSERT TO student_id_os_runtime
  WITH CHECK (
    actor_user_id = public.current_app_user_id()
    AND public.is_active_school_student(school_id, student_id)
    AND public.can_manage_school_class(school_id, (
      SELECT s.class_id FROM public.attendance_sessions AS s
      WHERE s.school_id = attendance_events.school_id AND s.id = attendance_events.session_id
        AND s.status = 'open'
        AND statement_timestamp() BETWEEN s.starts_at AND s.ends_at
        AND attendance_events.occurred_at BETWEEN s.starts_at AND s.ends_at
    ))
    AND EXISTS (
      SELECT 1 FROM public.school_class_students AS cs
      JOIN public.attendance_sessions AS s ON s.school_id = cs.school_id AND s.class_id = cs.class_id
      WHERE s.school_id = attendance_events.school_id
        AND s.id = attendance_events.session_id
        AND cs.student_id = attendance_events.student_id
        AND cs.status = 'active'
        AND (cs.ends_on IS NULL OR cs.ends_on >= CURRENT_DATE)
    )
  );

DROP POLICY IF EXISTS attendance_corrections_select_assigned ON public.attendance_corrections;
CREATE POLICY attendance_corrections_select_assigned ON public.attendance_corrections
  FOR SELECT TO student_id_os_runtime
  USING (public.can_manage_school_class(school_id, (
    SELECT s.class_id FROM public.attendance_sessions AS s
    JOIN public.attendance_events AS e ON e.school_id = s.school_id AND e.session_id = s.id
    WHERE e.school_id = attendance_corrections.school_id
      AND e.id = attendance_corrections.attendance_event_id
  )));

DROP POLICY IF EXISTS attendance_corrections_insert_assigned ON public.attendance_corrections;
CREATE POLICY attendance_corrections_insert_assigned ON public.attendance_corrections
  FOR INSERT TO student_id_os_runtime
  WITH CHECK (
    corrected_by = public.current_app_user_id()
    AND public.can_manage_school_class(school_id, (
      SELECT s.class_id FROM public.attendance_sessions AS s
      JOIN public.attendance_events AS e ON e.school_id = s.school_id AND e.session_id = s.id
      WHERE e.school_id = attendance_corrections.school_id
        AND e.id = attendance_corrections.attendance_event_id
    ))
  );

-- Deliberately no UPDATE/DELETE grant for attendance events or corrections.
