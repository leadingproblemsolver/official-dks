-- SUPABASE SCHEMA DEFINITION
-- DECISION KILL-SWITCH // LOGIC CORE

-- PROFILES TABLE (Linked to Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  usage_count INTEGER DEFAULT 0,
  last_request_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DECISIONS TABLE
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Can be UUID string or 'demo'
  decision_text TEXT NOT NULL,
  input_type TEXT,
  verdict TEXT CHECK (verdict IN ('Proceed', 'Pause', 'Kill')),
  confidence INTEGER,
  biggest_risk TEXT,
  what_breaks_this TEXT,
  relatable_perspective TEXT,
  reframe_precise TEXT,
  reframe_regular TEXT,
  secondary_nuances JSONB,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LOGS TABLE
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  event TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT
);

-- ROW LEVEL SECURITY (RLS) policies

-- Profiles: Users can only see/update their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Decisions:
-- 1. Public can read any decision via its ID (for sharing feature)
-- 2. Auth users can list their own decisions
-- 3. Auth users and 'demo' sessions can create decisions
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Decisions are publicly readable by ID" ON decisions FOR SELECT USING (true);
CREATE POLICY "Users can insert decisions" ON decisions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own decisions in list" ON decisions FOR SELECT USING (user_id = auth.uid()::text);

-- Logs: Insert only for everyone
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert logs" ON logs FOR INSERT WITH CHECK (true);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
