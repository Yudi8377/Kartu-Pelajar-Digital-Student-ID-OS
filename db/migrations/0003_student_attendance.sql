-- Student attendance schema.
-- Depends on 0001_initial.sql and 0002_runtime_security.sql.
-- Prepared for review only; do not apply to production without explicit approval.
-- No existing student records are read, inserted, updated, or deleted by this migration.

ALTER TABLE public.school_memberships
  DROP CONSTRAINT IF EXISTS school_memberships_role_check;

ALTER TABLE public.school_memberships
  ADD CONSTRAINT school_memberships_role_check
  CHECK (role IN ('school_admin','operator','verifier','student','parent','teacher'));

CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE RESTRICT,
  session_code text NOT NULL,
  class_label text NOT NULL CHECK (length(trim(class_label)) BETWEEN 1 AND 120),
  session_date date NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','open','closed','cancelled')),
  policy_version integer NOT NULL DEFAULT 1 CHECK (policy_version > 0),
  created_by uuid NOT NULL REFERENCES public.app_users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
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

CREATE INDEX IF NOT EXISTS attendance_sessions_school_date_idx
  ON public.attendance_sessions (school_id, session_date DESC);
CREATE INDEX IF NOT EXISTS attendance_events_school_session_idx
  ON public.attendance_events (school_id, session_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS attendance_events_school_student_idx
  ON public.attendance_events (school_id, student_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS attendance_corrections_event_idx
  ON public.attendance_corrections (school_id, attendance_event_id, created_at DESC);

REVOKE ALL ON TABLE public.attendance_sessions, public.attendance_events,
  public.attendance_corrections FROM PUBLIC;
REVOKE ALL ON TABLE public.attendance_sessions, public.attendance_events,
  public.attendance_corrections FROM student_id_os_runtime;

GRANT SELECT, INSERT, UPDATE ON TABLE public.attendance_sessions TO student_id_os_runtime;
GRANT SELECT, INSERT ON TABLE public.attendance_events TO student_id_os_runtime;
GRANT SELECT, INSERT ON TABLE public.attendance_corrections TO student_id_os_runtime;

ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_corrections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS attendance_sessions_select_staff ON public.attendance_sessions;
CREATE POLICY attendance_sessions_select_staff ON public.attendance_sessions
  FOR SELECT TO student_id_os_runtime
  USING (public.is_school_member(school_id, ARRAY['school_admin','operator','teacher','verifier']::text[]));

DROP POLICY IF EXISTS attendance_sessions_insert_staff ON public.attendance_sessions;
CREATE POLICY attendance_sessions_insert_staff ON public.attendance_sessions
  FOR INSERT TO student_id_os_runtime
  WITH CHECK (
    created_by = public.current_app_user_id()
    AND public.is_school_member(school_id, ARRAY['school_admin','operator','teacher']::text[])
  );

DROP POLICY IF EXISTS attendance_sessions_update_admin ON public.attendance_sessions;
CREATE POLICY attendance_sessions_update_admin ON public.attendance_sessions
  FOR UPDATE TO student_id_os_runtime
  USING (public.is_school_member(school_id, ARRAY['school_admin','operator']::text[]))
  WITH CHECK (public.is_school_member(school_id, ARRAY['school_admin','operator']::text[]));

DROP POLICY IF EXISTS attendance_events_select_staff ON public.attendance_events;
CREATE POLICY attendance_events_select_staff ON public.attendance_events
  FOR SELECT TO student_id_os_runtime
  USING (public.is_school_member(school_id, ARRAY['school_admin','operator','teacher','verifier']::text[]));

DROP POLICY IF EXISTS attendance_events_insert_staff ON public.attendance_events;
CREATE POLICY attendance_events_insert_staff ON public.attendance_events
  FOR INSERT TO student_id_os_runtime
  WITH CHECK (
    actor_user_id = public.current_app_user_id()
    AND public.is_school_member(school_id, ARRAY['school_admin','operator','teacher']::text[])
    AND EXISTS (
      SELECT 1 FROM public.attendance_sessions AS s
      WHERE s.id = session_id AND s.school_id = attendance_events.school_id
        AND s.status = 'open'
        AND statement_timestamp() BETWEEN s.starts_at AND s.ends_at
    )
    AND EXISTS (
      SELECT 1 FROM public.students AS st
      WHERE st.id = student_id AND st.school_id = attendance_events.school_id
        AND st.status = 'active'
    )
  );

DROP POLICY IF EXISTS attendance_corrections_select_staff ON public.attendance_corrections;
CREATE POLICY attendance_corrections_select_staff ON public.attendance_corrections
  FOR SELECT TO student_id_os_runtime
  USING (public.is_school_member(school_id, ARRAY['school_admin','operator','teacher']::text[]));

DROP POLICY IF EXISTS attendance_corrections_insert_staff ON public.attendance_corrections;
CREATE POLICY attendance_corrections_insert_staff ON public.attendance_corrections
  FOR INSERT TO student_id_os_runtime
  WITH CHECK (
    corrected_by = public.current_app_user_id()
    AND public.is_school_member(school_id, ARRAY['school_admin','operator','teacher']::text[])
    AND EXISTS (
      SELECT 1 FROM public.attendance_events AS e
      WHERE e.id = attendance_event_id AND e.school_id = attendance_corrections.school_id
    )
  );

-- Deliberately no UPDATE/DELETE grant for events or corrections: history is append-only.
