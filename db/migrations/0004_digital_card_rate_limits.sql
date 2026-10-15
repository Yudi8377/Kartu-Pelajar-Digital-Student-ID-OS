-- Shared, atomic rate-limit buckets for authenticated Digital Card OS lifecycle operations.
-- Apply only after rehearsal on a disposable PostgreSQL branch.
-- The runtime role can call the function but cannot read or modify the bucket table directly.

CREATE TABLE IF NOT EXISTS public.digital_card_rate_limits (
  bucket_hash text PRIMARY KEY CHECK (bucket_hash ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz NOT NULL,
  hit_count integer NOT NULL CHECK (hit_count > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON TABLE public.digital_card_rate_limits FROM PUBLIC;
REVOKE ALL ON TABLE public.digital_card_rate_limits FROM student_id_os_runtime;
ALTER TABLE public.digital_card_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_digital_card_rate_limit(
  p_bucket_hash text,
  p_window_seconds integer,
  p_max_hits integer
)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_window timestamptz;
  v_hits integer;
BEGIN
  IF p_bucket_hash IS NULL OR p_bucket_hash !~ '^[a-f0-9]{64}$'
    OR p_window_seconds < 1 OR p_window_seconds > 86400
    OR p_max_hits < 1 OR p_max_hits > 10000 THEN
    RAISE EXCEPTION 'Invalid rate-limit arguments' USING ERRCODE = '22023';
  END IF;

  v_window := to_timestamp(
    floor(extract(epoch FROM clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO public.digital_card_rate_limits AS rl
    (bucket_hash, window_started_at, hit_count, updated_at)
  VALUES (p_bucket_hash, v_window, 1, clock_timestamp())
  ON CONFLICT (bucket_hash) DO UPDATE
    SET window_started_at = EXCLUDED.window_started_at,
        hit_count = CASE
          WHEN rl.window_started_at = EXCLUDED.window_started_at THEN rl.hit_count + 1
          ELSE 1
        END,
        updated_at = clock_timestamp()
  RETURNING hit_count INTO v_hits;

  RETURN v_hits <= p_max_hits;
END;
$function$;

REVOKE ALL ON FUNCTION public.consume_digital_card_rate_limit(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_digital_card_rate_limit(text, integer, integer) TO student_id_os_runtime;

COMMENT ON TABLE public.digital_card_rate_limits IS
  'Opaque SHA-256 rate-limit buckets. Runtime can access only the atomic function, never bucket rows.';
