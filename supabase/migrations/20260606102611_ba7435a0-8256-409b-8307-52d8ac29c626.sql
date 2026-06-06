
-- ============ era_cards ============
CREATE TABLE public.era_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  decode_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'UTC'))::date,
  vibe_word text,
  era_name text,
  brutal_truth text,
  aura_color_name text,
  aura_color_hex text,
  warning text,
  power_move text,
  cosmic_prediction text,
  song_name text,
  song_artist text,
  song_reason text,
  city text,
  age_group text,
  zodiac text,
  accuracy_rating int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.era_cards TO authenticated;
GRANT ALL ON public.era_cards TO service_role;
-- public count needs anon SELECT (count only; no PII fields are exposed by app code)
GRANT SELECT ON public.era_cards TO anon;
ALTER TABLE public.era_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own era_cards select" ON public.era_cards FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own era_cards insert" ON public.era_cards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own era_cards update" ON public.era_cards FOR UPDATE TO authenticated USING (auth.uid() = user_id);
-- allow anon to count (no row data exposed without filter; for total count queries)
CREATE POLICY "anon era_cards count" ON public.era_cards FOR SELECT TO anon USING (true);
CREATE TRIGGER touch_era_cards_updated BEFORE UPDATE ON public.era_cards FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX era_cards_user_date_idx ON public.era_cards(user_id, decode_date DESC);
CREATE INDEX era_cards_date_idx ON public.era_cards(decode_date);

-- ============ feedback ============
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  era_name text,
  brutal_truth text,
  accuracy_rating int NOT NULL CHECK (accuracy_rating BETWEEN 1 AND 5),
  city text,
  zodiac text,
  feedback_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'UTC'))::date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own feedback select" ON public.feedback FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own feedback insert" ON public.feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ battles ============
CREATE TABLE public.battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token text NOT NULL UNIQUE,
  creator_user_id uuid NOT NULL,
  creator_name text,
  creator_card jsonb NOT NULL,
  questions jsonb NOT NULL,
  opponent_name text,
  opponent_zodiac text,
  opponent_card jsonb,
  verdict text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.battles TO authenticated;
GRANT SELECT, UPDATE ON public.battles TO anon;
GRANT ALL ON public.battles TO service_role;
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;
-- anyone can read a battle (needed for share link)
CREATE POLICY "battles public select" ON public.battles FOR SELECT TO anon USING (true);
CREATE POLICY "battles auth select" ON public.battles FOR SELECT TO authenticated USING (true);
-- only authed users can create their own battle
CREATE POLICY "battles creator insert" ON public.battles FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_user_id);
-- opponent updates handled server-side via service_role; restrict client updates to creator
CREATE POLICY "battles creator update" ON public.battles FOR UPDATE TO authenticated USING (auth.uid() = creator_user_id);
CREATE TRIGGER touch_battles_updated BEFORE UPDATE ON public.battles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX battles_token_idx ON public.battles(share_token);
