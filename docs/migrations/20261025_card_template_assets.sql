-- Digital Card OS shared template library (additive migration; no existing data is modified).
CREATE TABLE IF NOT EXISTS public.card_template_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_key_hash text NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  category text NOT NULL CHECK (char_length(category) BETWEEN 1 AND 100),
  visibility text NOT NULL DEFAULT 'draft' CHECK (visibility IN ('draft','published')),
  template_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  CHECK (pg_column_size(template_json) <= 65536)
);
CREATE INDEX IF NOT EXISTS card_template_assets_public_idx
  ON public.card_template_assets (published_at DESC)
  WHERE visibility = 'published';
CREATE INDEX IF NOT EXISTS card_template_assets_owner_idx
  ON public.card_template_assets (owner_key_hash, updated_at DESC);
