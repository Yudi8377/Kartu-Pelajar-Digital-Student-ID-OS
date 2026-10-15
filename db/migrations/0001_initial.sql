CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 200),
  code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_subject text NOT NULL UNIQUE,
  display_name text NOT NULL,
  email text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS school_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  role text NOT NULL CHECK (role IN ('school_admin','operator','verifier','student','parent')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, user_id, role)
);

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
  student_number text NOT NULL,
  full_name text NOT NULL,
  class_label text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','graduated','transferred')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, student_number),
  UNIQUE (school_id, id)
);

CREATE TABLE IF NOT EXISTS student_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  student_id uuid NOT NULL,
  card_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','revoked','expired','replaced')),
  qr_token_hash bytea UNIQUE,
  issued_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (school_id, student_id) REFERENCES students(school_id, id) ON DELETE RESTRICT,
  UNIQUE (school_id, card_number),
  CHECK (expires_at IS NULL OR issued_at IS NULL OR expires_at > issued_at),
  CHECK (status <> 'active' OR qr_token_hash IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS students_school_status_idx ON students (school_id, status);
CREATE INDEX IF NOT EXISTS cards_school_student_idx ON student_cards (school_id, student_id);
CREATE INDEX IF NOT EXISTS cards_expiry_idx ON student_cards (expires_at) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS audit_events (
  id bigserial PRIMARY KEY,
  school_id uuid REFERENCES schools(id) ON DELETE RESTRICT,
  actor_user_id uuid REFERENCES app_users(id) ON DELETE RESTRICT,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  request_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_school_created_idx ON audit_events (school_id, created_at DESC);
-- Do not store raw QR tokens, credentials, or unnecessary student PII in audit metadata.
