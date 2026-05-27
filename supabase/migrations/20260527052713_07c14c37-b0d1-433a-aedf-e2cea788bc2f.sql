
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  dob DATE,
  zodiac TEXT,
  symbol TEXT,
  region TEXT NOT NULL DEFAULT 'GLOBAL' CHECK (region IN ('GLOBAL','IN')),
  is_premium BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile delete" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- Questions library
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  options TEXT[] NOT NULL,
  category TEXT,
  region TEXT NOT NULL CHECK (region IN ('GLOBAL','IN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX questions_region_idx ON public.questions(region);
GRANT SELECT ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read questions" ON public.questions FOR SELECT TO authenticated USING (true);

-- Seen questions
CREATE TABLE public.user_questions_seen (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);
CREATE INDEX user_questions_seen_user_idx ON public.user_questions_seen(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_questions_seen TO authenticated;
GRANT ALL ON public.user_questions_seen TO service_role;
ALTER TABLE public.user_questions_seen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own seen select" ON public.user_questions_seen FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own seen insert" ON public.user_questions_seen FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own seen delete" ON public.user_questions_seen FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Daily decodes
CREATE TABLE public.daily_decodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decode_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  card JSONB NOT NULL,
  regenerations_used INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, decode_date)
);
CREATE INDEX daily_decodes_user_date_idx ON public.daily_decodes(user_id, decode_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_decodes TO authenticated;
GRANT ALL ON public.daily_decodes TO service_role;
ALTER TABLE public.daily_decodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own decodes select" ON public.daily_decodes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own decodes insert" ON public.daily_decodes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own decodes update" ON public.daily_decodes FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER decodes_updated BEFORE UPDATE ON public.daily_decodes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed questions
INSERT INTO public.questions (question_text, options, category, region) VALUES
('Pick the unhinged ritual that feels most like you right now.', ARRAY['Replying to texts at 3am like a war general','Romanticizing oat milk in a sad mug','Plotting revenge through silent excellence','Buying things I cannot afford to feel something'], 'ritual', 'GLOBAL'),
('What''s secretly running your operating system this week?', ARRAY['One unread voicemail I refuse to open','A playlist that''s emotionally illegal','Pure delusion and a green juice','Spite. Just spite, beautifully wrapped.'], 'mood', 'GLOBAL'),
('If your aura had a vibe-check this morning, it would say:', ARRAY['Hot, unbothered, slightly cursed','Soft, scheming, dangerously online','Tired but the lighting is cinematic','Healing, but make it theatrical'], 'aura', 'GLOBAL'),
('Pick the most embarrassingly accurate self-care move.', ARRAY['Crying to a song that came out when I was 14','Texting my ex just to read the typing dots','Reorganizing my closet at 2am','Booking a flight I cannot afford'], 'ritual', 'GLOBAL'),
('What''s your current toxic trait?', ARRAY['Pretending I''m fine when I''m feral','Making everything a personality','Ghosting and calling it boundaries','Romanticizing my own downfall'], 'shadow', 'GLOBAL'),
('Pick the lie you''re telling yourself this week.', ARRAY['I''m not checking their story','This is my last drink','I''ll start Monday','I don''t care what they think'], 'shadow', 'GLOBAL'),
('Your group chat would describe you as:', ARRAY['The chaos starter','The wise but tired one','The unhinged poet','The one who disappears'], 'social', 'GLOBAL'),
('Pick the soundtrack of your inner monologue.', ARRAY['Sad girl indie on loop','Hyperpop and rage','Lo-fi study beats but I''m crying','Pure silence and dread'], 'mood', 'GLOBAL'),
('What does your phone screen time say about you?', ARRAY['I am the algorithm''s villain','TikTok owns my soul','Strictly screenshots and screams','I''m studying everyone like a scientist'], 'digital', 'GLOBAL'),
('Pick the most you-coded fashion crime.', ARRAY['Going full goth on a Tuesday','Wearing pajamas with confidence','Layering inappropriately','Dressing for the era I''m manifesting'], 'aesthetic', 'GLOBAL'),
-- IN
('Sach bata — what''s your current main character moment?', ARRAY['3am chai aur overthinking, full Delhi winter energy','Ignoring family WhatsApp group like a CEO','Jugaad-ing my entire personality together','Soft launching a situationship I haven''t confirmed'], 'ritual', 'IN'),
('What''s secretly running your OS this hafta?', ARRAY['Shaadi season anxiety and ek unread rishta','Mumbai local energy — chaos but make it cute','Bangalore traffic patience with Goa weekend dreams','Pure log kya kahenge, beautifully ignored'], 'mood', 'IN'),
('Aaj subah your aura did a vibe-check and said:', ARRAY['Hot, unbothered, thoda cursed','Soft, scheming, dangerously online on Insta','Thaki hui but lighting is straight up Karan Johar','Healing, but make it a Bollywood montage'], 'aura', 'IN'),
('Pick your most desi toxic trait.', ARRAY['Saying "I''m fine" while planning emotional damage','Comparing my life to every cousin at every shaadi','Blocking and unblocking like a sport','Romanticizing my own breakdown in slow-mo'], 'shadow', 'IN'),
('Your relationship with your maa''s phone calls:', ARRAY['Always on Do Not Disturb, always guilty','Picks up while pretending to be at office','One word replies, peak avoidance','Cries within 2 minutes every time'], 'family', 'IN'),
('Pick your situationship status, honestly.', ARRAY['He texts "hyy" once a week, I read it 47 times','We''re "talking" since 8 months, no labels','Soft launched on close friends, hard ghosted IRL','I''m the situation, he''s the ship'], 'love', 'IN'),
('Your chai order says you''re:', ARRAY['Kadak with adrak — no patience for nonsense','Cutting with extra elaichi — secretly soft','Green tea pretending to be wellness queen','Filter coffee superiority complex activated'], 'aesthetic', 'IN'),
('Pick the most accurate Indian auntie energy you channel.', ARRAY['Judging everyone''s outfit at the function','Asking when you''re getting married while eating samosa','Forwarding good morning images at 6am','Hosting kitty party gossip with full theatrics'], 'social', 'IN'),
('What''s your current Bollywood arc?', ARRAY['Kabhi Khushi Kabhie Gham but make it Tuesday','Rockstar phase — sad, unwashed, brooding','Jab We Met Geet — chaotic, alive, annoying everyone','Cocktail era — looking hot, internally collapsing'], 'mood', 'IN'),
('Pick your weekend energy.', ARRAY['Brunch with friends, fight with self','Sleeping till 3pm, calling it self-care','Doomscrolling Insta wedding reels and crying','Random Goa trip booked, no plan, full vibe'], 'ritual', 'IN');
