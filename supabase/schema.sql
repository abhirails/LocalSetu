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
-- PHASE 3 MIGRATION — Private Resident Groups
-- Run in Supabase SQL Editor if upgrading an existing database
-- ============================================================

-- 1. Visibility tier on society_posts
--    'public'    → pinned to public feed (existing pin_to_feed=true posts)
--    'society'   → approved members only
--    'committee' → committee + admin only
--    'admin'     → society admin only
ALTER TABLE public.society_posts
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'society', 'committee', 'admin'));

-- 2. Society members table
CREATE TABLE IF NOT EXISTS public.society_members (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  society_id    UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'resident'
                  CHECK (role IN ('resident', 'committee', 'admin')),
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at   TIMESTAMPTZ,
  reviewed_by   UUID REFERENCES public.profiles(id),
  UNIQUE(society_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_society_members_society ON public.society_members(society_id);
CREATE INDEX IF NOT EXISTS idx_society_members_user    ON public.society_members(user_id);
CREATE INDEX IF NOT EXISTS idx_society_members_status  ON public.society_members(status);

-- 3. RLS for society_members
ALTER TABLE public.society_members ENABLE ROW LEVEL SECURITY;

-- Anyone can see membership records for their own society (society admins need full list)
CREATE POLICY "Members can view society membership"
  ON public.society_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'society_admin' AND society_id = society_members.society_id
    )
  );

-- Residents can request to join
CREATE POLICY "Users can request to join society"
  ON public.society_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Society admin can approve/reject (update status)
CREATE POLICY "Society admin can review members"
  ON public.society_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'society_admin' AND society_id = society_members.society_id
    )
  );

-- 4. RLS for society_posts — members-only visibility gate
--    Society admins see all. Approved members see 'society'. Committee+ see 'committee'. Public see 'public'.
DROP POLICY IF EXISTS "Society posts visible to all" ON public.society_posts;

CREATE POLICY "Society posts visibility gate"
  ON public.society_posts FOR SELECT
  USING (
    visibility = 'public'
    OR (
      visibility = 'society'
      AND EXISTS (
        SELECT 1 FROM public.society_members
        WHERE society_id = society_posts.society_id
          AND user_id = auth.uid()
          AND status = 'approved'
      )
    )
    OR (
      visibility IN ('committee', 'admin')
      AND EXISTS (
        SELECT 1 FROM public.society_members
        WHERE society_id = society_posts.society_id
          AND user_id = auth.uid()
          AND status = 'approved'
          AND role IN ('committee', 'admin')
      )
    )
  );

CREATE TABLE IF NOT EXISTS public.society_posts (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  society_id      UUID REFERENCES public.societies(id) ON DELETE CASCADE NOT NULL,
  posted_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type            TEXT NOT NULL CHECK (type IN ('notice', 'event')),
  title           TEXT NOT NULL CHECK (char_length(title) <= 120),
  content         TEXT NOT NULL CHECK (char_length(content) <= 500),
  event_date      TIMESTAMPTZ,           -- for events
  event_location  TEXT,                  -- for events
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'resolved', 'removed')),
  pin_to_feed     BOOLEAN NOT NULL DEFAULT true,  -- show in main KhargharConnect feed
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_society_posts_society   ON public.society_posts(society_id);
CREATE INDEX IF NOT EXISTS idx_society_posts_feed      ON public.society_posts(pin_to_feed, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_societies_sector        ON public.societies(sector);

-- RLS
ALTER TABLE public.societies        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.society_posts    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Societies visible to all"
  ON public.societies FOR SELECT USING (true);

CREATE POLICY "Society posts visible to all when active"
  ON public.society_posts FOR SELECT
  USING (status = 'active');

CREATE POLICY "Society admins can insert posts"
  ON public.society_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'society_admin'
        AND society_id = society_posts.society_id
    )
  );

CREATE POLICY "Society admins can update their posts"
  ON public.society_posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'society_admin'
        AND society_id = society_posts.society_id
    )
  );

CREATE POLICY "App admins can manage all society posts"
  ON public.society_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- 11. PUSH SUBSCRIPTIONS (Web Push / VAPID)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role (Edge Functions) can read all subscriptions to send pushes
CREATE POLICY "Service role reads all subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (auth.role() = 'service_role');

-- ============================================================
-- 12. REALTIME (enable for live feed)
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.replies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_confirmations;
