-- ============================================================
-- LocalSetu — Supabase Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. PROFILES (extends auth.users)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name          TEXT NOT NULL DEFAULT 'Local Resident',
  phone         TEXT,
  email         TEXT,
  locality      TEXT NOT NULL DEFAULT 'Kharghar',
  role          TEXT NOT NULL DEFAULT 'resident'
                  CHECK (role IN ('resident', 'admin', 'moderator', 'society_admin')),
  society_id    UUID,  -- set when role = 'society_admin'; FK added after societies table
  is_verified   BOOLEAN NOT NULL DEFAULT false,
  trust_score   INTEGER NOT NULL DEFAULT 50,
  posts_count   INTEGER NOT NULL DEFAULT 0,
  help_count    INTEGER NOT NULL DEFAULT 0,
  is_warned     BOOLEAN NOT NULL DEFAULT false,
  is_banned     BOOLEAN NOT NULL DEFAULT false,
  blocked_users UUID[] NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. POSTS (Right Now + Need It Now)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.posts (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type                  TEXT NOT NULL CHECK (type IN ('right_now', 'need_it_now')),
  locality              TEXT NOT NULL,
  category              TEXT NOT NULL,
  content               TEXT NOT NULL CHECK (char_length(content) <= 280),
  status                TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active','expired','removed','flagged','fulfilled')),
  expires_at            TIMESTAMPTZ NOT NULL,
  is_pinned             BOOLEAN NOT NULL DEFAULT false,
  report_count          INTEGER NOT NULL DEFAULT 0,
  -- Right Now specific
  still_happening_count INTEGER NOT NULL DEFAULT 0,
  last_confirmed_at     TIMESTAMPTZ,
  -- Need It Now specific
  needed_by             TIMESTAMPTZ,
  distance_range        TEXT DEFAULT '2km',
  helper_count          INTEGER NOT NULL DEFAULT 0,
  is_fulfilled          BOOLEAN NOT NULL DEFAULT false,
  reminder_sent_at      TIMESTAMPTZ,                     -- set when expiry reminder push is sent
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. POST CONFIRMATIONS (Still Happening)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.post_confirmations (
  post_id     UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- ============================================================
-- 4. PROVIDERS (Verified Help directory)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.providers (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name                 TEXT NOT NULL,
  service_type         TEXT NOT NULL,
  locality             TEXT NOT NULL,
  phone                TEXT,
  whatsapp             TEXT,
  recommendation_count INTEGER NOT NULL DEFAULT 0,
  notes                TEXT[] NOT NULL DEFAULT '{}',
  is_verified          BOOLEAN NOT NULL DEFAULT false,
  recommender_ids      UUID[] NOT NULL DEFAULT '{}',
  created_by           UUID REFERENCES public.profiles(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_recommended_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. REPLIES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.replies (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id      UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content      TEXT NOT NULL CHECK (char_length(content) <= 200),
  reply_type   TEXT NOT NULL DEFAULT 'custom'
                 CHECK (reply_type IN ('still_happening','i_can_help','i_know_someone','custom')),
  report_count INTEGER NOT NULL DEFAULT 0,
  is_hidden    BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. REPORTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reports (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_type   TEXT NOT NULL CHECK (target_type IN ('post','reply','user')),
  target_id     UUID NOT NULL,
  reason        TEXT NOT NULL,
  reporter_note TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','reviewed','actioned')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. SAVED POSTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.saved_posts (
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id    UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- ============================================================
-- 8. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_posts_type        ON public.posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_status      ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_user_id     ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at  ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_replies_post_id   ON public.replies(post_id);
CREATE INDEX IF NOT EXISTS idx_reports_status    ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_providers_service ON public.providers(service_type);

-- ============================================================
-- 9. STORED PROCEDURES (RPCs)
-- ============================================================

-- Atomically increment still_happening_count
CREATE OR REPLACE FUNCTION increment_still_happening(p_post_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  already_confirmed BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM post_confirmations
    WHERE post_id = p_post_id AND user_id = p_user_id
  ) INTO already_confirmed;

  IF already_confirmed THEN
    RETURN FALSE;
  END IF;

  INSERT INTO post_confirmations (post_id, user_id)
  VALUES (p_post_id, p_user_id);

  UPDATE posts
  SET still_happening_count = still_happening_count + 1,
      last_confirmed_at = NOW()
  WHERE id = p_post_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomically increment helper_count
CREATE OR REPLACE FUNCTION increment_helper_count(p_post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET helper_count = helper_count + 1
  WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Flag post after 3 reports
CREATE OR REPLACE FUNCTION increment_post_report(p_post_id UUID)
RETURNS VOID AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE posts
  SET report_count = report_count + 1
  WHERE id = p_post_id
  RETURNING report_count INTO new_count;

  IF new_count >= 3 THEN
    UPDATE posts SET status = 'flagged' WHERE id = p_post_id AND status = 'active';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Local Resident'),
    NEW.phone,
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 10. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts       ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Public profiles visible to all"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- POSTS
CREATE POLICY "Active posts visible to all"
  ON public.posts FOR SELECT
  USING (status != 'removed');

CREATE POLICY "Authenticated users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any post"
  ON public.posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- POST CONFIRMATIONS
CREATE POLICY "Confirmations visible to all"
  ON public.post_confirmations FOR SELECT USING (true);

CREATE POLICY "Authenticated users can confirm"
  ON public.post_confirmations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- PROVIDERS
CREATE POLICY "Providers visible to all"
  ON public.providers FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create providers"
  ON public.providers FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update providers"
  ON public.providers FOR UPDATE
  USING (auth.role() = 'authenticated');

-- REPLIES
CREATE POLICY "Non-hidden replies visible to all"
  ON public.replies FOR SELECT
  USING (is_hidden = false);

CREATE POLICY "Authenticated users can create replies"
  ON public.replies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- REPORTS
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view reports"
  ON public.reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- SAVED POSTS
CREATE POLICY "Users see own saved posts"
  ON public.saved_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts"
  ON public.saved_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts"
  ON public.saved_posts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 11. SOCIETIES + SOCIETY POSTS (Phase 2)
-- ================================================
-- ============================================================
-- PHASE 2.5 MIGRATION — Multi-Locality
-- Run in Supabase SQL Editor if upgrading an existing database
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS saved_localities TEXT[]    NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS active_locality  TEXT;

-- Index for locality queries
CREATE INDEX IF NOT EXISTS idx_profiles_saved_localities
  ON public.profiles USING gin(saved_localities);

CREATE INDEX IF NOT EXISTS idx_posts_locality
  ON public.posts(locality);

-- ============================================================
-- PHASE 4 MIGRATION — Monetization
-- Run in Supabase SQL Editor if upgrading an existing database
-- ============================================================

-- 1. Verified Business Listings
CREATE TABLE IF NOT EXISTS public.businesses (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  plan          TEXT NOT NULL DEFAULT 'basic'
                  CHECK (plan IN ('basic', 'standard', 'premium')),
  tagline       TEXT,
  description   TEXT,
  phone         TEXT,
  whatsapp      TEXT,
  locality      TEXT NOT NULL,
  address       TEXT,
  is_verified   BOOLEAN NOT NULL DEFAULT false,
  rating        NUMERIC(2,1) NOT NULL DEFAULT 0,
  review_count  INTEGER NOT NULL DEFAULT 0,
  owner_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  plan_expires_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_businesses_locality  ON public.businesses(locality);
CREATE INDEX IF NOT EXISTS idx_businesses_category  ON public.businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_plan      ON public.businesses(plan);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified businesses"
  ON public.businesses FOR SELECT
  USING (is_verified = true OR owner_id = auth.uid());

CREATE POLICY "Owners can insert their business"
  ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their business"
  ON public.businesses FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all businesses"
  ON public.businesses FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Post boosts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS is_boosted    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.post_boosts (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id      UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_paise INTEGER NOT NULL DEFAULT 2900,  -- ₹29 in paise
  boosted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  boosted_until TIMESTAMPTZ NOT NULL,
  payment_ref  TEXT
);

CREATE INDEX IF NOT EXISTS idx_post_boosts_post ON public.post_boosts(post_id);
CREATE INDEX IF NOT EXISTS idx_post_boosts_user ON public.post_boosts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_boosted    ON public.posts(is_boosted, boosted_until);

ALTER TABLE public.post_boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own boosts"
  ON public.post_boosts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can boost posts"
  ON public.post_boosts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Society Admin Pro flag
ALTER TABLE public.societies
  ADD COLUMN IF NOT EXISTS is_pro         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMPTZ;

-- ============================================================
-- PHASE 5 MIGRATION — Real Payments (Razorpay)
-- Run in Supabase SQL Editor if upgrading an existing database
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type                  TEXT NOT NULL
                          CHECK (type IN ('boost', 'society_pro', 'business_listing')),
  amount_paise          INTEGER NOT NULL,
  razorpay_order_id     TEXT NOT NULL UNIQUE,
  razorpay_payment_id   TEXT,
  razorpay_signature    TEXT,
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'captured', 'failed')),
  -- Flexible metadata: post_id for boosts, society_id for pro, etc.
  metadata              JSONB NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user   ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_type   ON public.payments(type);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_order  ON public.payments(razorpay_order_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can see their own payments
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (serverless function) inserts payments
CREATE POLICY "Service role can insert payments"
  ON public.payments FOR INSERT
  WITH CHECK (true);  -- secured by service_role key in the API route

-- Service role can update payment status after verification
CREATE POLICY "Service role can update payments"
  ON public.payments FOR UPDATE
  USING (true);  -- secured by service_role key in the API route
