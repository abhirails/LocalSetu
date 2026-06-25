-- ============================================================
-- LocalSetu — Supabase Schema
-- Complete Phase 1 → Phase 6.7 schema
-- Run this entire file in the Supabase SQL Editor.
-- Safe to re-run: tables/columns/indexes are guarded, policies are recreated.
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- PHASE 1 — CORE LOCAL FEED
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name          TEXT NOT NULL DEFAULT 'Local Resident',
  phone         TEXT,
  email         TEXT,
  locality      TEXT NOT NULL DEFAULT 'Kharghar',
  role          TEXT NOT NULL DEFAULT 'resident'
                  CHECK (role IN ('resident', 'admin', 'moderator', 'society_admin', 'business_owner')),
  society_id    UUID,
  is_verified   BOOLEAN NOT NULL DEFAULT false,
  trust_score   INTEGER NOT NULL DEFAULT 50,
  posts_count   INTEGER NOT NULL DEFAULT 0,
  help_count    INTEGER NOT NULL DEFAULT 0,
  is_warned     BOOLEAN NOT NULL DEFAULT false,
  is_banned     BOOLEAN NOT NULL DEFAULT false,
  blocked_users UUID[] NOT NULL DEFAULT '{}',
  saved_localities TEXT[] NOT NULL DEFAULT '{}',
  active_locality  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS locality TEXT NOT NULL DEFAULT 'Kharghar',
  ADD COLUMN IF NOT EXISTS society_id UUID,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trust_score INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS posts_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS help_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_warned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_users UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS saved_localities TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS active_locality TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('resident', 'admin', 'moderator', 'society_admin', 'business_owner', 'shop_owner'));
END $$;

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
  still_happening_count INTEGER NOT NULL DEFAULT 0,
  last_confirmed_at     TIMESTAMPTZ,
  needed_by             TIMESTAMPTZ,
  distance_range        TEXT DEFAULT '2km',
  helper_count          INTEGER NOT NULL DEFAULT 0,
  is_fulfilled          BOOLEAN NOT NULL DEFAULT false,
  selected_quote_id     UUID,
  is_bought             BOOLEAN NOT NULL DEFAULT false,
  need_to_buy_item      TEXT,
  need_to_buy_qty       TEXT,
  delivery_pref         TEXT NOT NULL DEFAULT 'either'
                          CHECK (delivery_pref IN ('delivery','pickup','either')),
  budget_paise          INTEGER CHECK (budget_paise IS NULL OR budget_paise >= 0),
  reminder_sent_at      TIMESTAMPTZ,
  is_boosted            BOOLEAN NOT NULL DEFAULT false,
  boosted_until         TIMESTAMPTZ,
  -- Phase 6.5/6.7 lightweight safety/category extensions.
  civic_issue_type      TEXT,
  civic_status          TEXT NOT NULL DEFAULT 'none'
                          CHECK (civic_status IN ('none','open','acknowledged','in_progress','resolved','closed')),
  civic_reference_no    TEXT,
  civic_digest_sent_at  TIMESTAMPTZ,
  medical_context       TEXT,
  medical_urgency       TEXT CHECK (medical_urgency IS NULL OR medical_urgency IN ('low','medium','high','emergency')),
  medical_disclaimer_accepted BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS civic_issue_type TEXT,
  ADD COLUMN IF NOT EXISTS civic_status TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS civic_reference_no TEXT,
  ADD COLUMN IF NOT EXISTS civic_digest_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS medical_context TEXT,
  ADD COLUMN IF NOT EXISTS medical_urgency TEXT,
  ADD COLUMN IF NOT EXISTS medical_disclaimer_accepted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS selected_quote_id UUID,
  ADD COLUMN IF NOT EXISTS is_bought BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS need_to_buy_item TEXT,
  ADD COLUMN IF NOT EXISTS need_to_buy_qty TEXT,
  ADD COLUMN IF NOT EXISTS delivery_pref TEXT NOT NULL DEFAULT 'either',
  ADD COLUMN IF NOT EXISTS budget_paise INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'posts_civic_status_check'
      AND conrelid = 'public.posts'::regclass
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_civic_status_check
      CHECK (civic_status IN ('none','open','acknowledged','in_progress','resolved','closed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'posts_medical_urgency_check'
      AND conrelid = 'public.posts'::regclass
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_medical_urgency_check
      CHECK (medical_urgency IS NULL OR medical_urgency IN ('low','medium','high','emergency'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.post_confirmations (
  post_id     UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

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

CREATE TABLE IF NOT EXISTS public.saved_posts (
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id    UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- ============================================================
-- PHASE 2 — SOCIETY CONNECT + PUSH SUBSCRIPTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.societies (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name           TEXT NOT NULL,
  locality       TEXT NOT NULL DEFAULT 'Kharghar',
  sector         TEXT,
  landmark       TEXT,
  description    TEXT,
  rules          TEXT,
  address        TEXT,
  city           TEXT NOT NULL DEFAULT 'Navi Mumbai',
  pincode        TEXT,
  status         TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('pending','active','rejected','archived')),
  admin_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  contact_phone  TEXT,
  public_contact TEXT,
  total_flats    INTEGER CHECK (total_flats IS NULL OR total_flats > 0),
  is_verified    BOOLEAN NOT NULL DEFAULT false,
  is_pro         BOOLEAN NOT NULL DEFAULT false,
  pro_expires_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.societies
  ADD COLUMN IF NOT EXISTS sector TEXT,
  ADD COLUMN IF NOT EXISTS landmark TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS rules TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT 'Navi Mumbai',
  ADD COLUMN IF NOT EXISTS pincode TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS public_contact TEXT,
  ADD COLUMN IF NOT EXISTS total_flats INTEGER,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_pro BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.society_registration_requests (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  society_name   TEXT NOT NULL,
  city           TEXT,
  locality       TEXT NOT NULL,
  sector         TEXT,
  landmark       TEXT,
  total_flats    INTEGER CHECK (total_flats IS NULL OR total_flats > 0),
  requester_role TEXT NOT NULL
                   CHECK (requester_role IN ('resident','committee','secretary','chairman','manager','other')),
  contact_phone  TEXT,
  proof_note     TEXT,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected')),
  society_id     UUID REFERENCES public.societies(id) ON DELETE SET NULL,
  reviewed_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at    TIMESTAMPTZ,
  admin_note     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_society_id_fkey'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_society_id_fkey
      FOREIGN KEY (society_id) REFERENCES public.societies(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.society_posts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  society_id  UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type        TEXT NOT NULL DEFAULT 'notice'
                CHECK (type IN ('notice','event','maintenance','alert','poll','update')),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  visibility  TEXT NOT NULL DEFAULT 'members'
                CHECK (visibility IN ('public','members','admins')),
  event_at    TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  is_pinned   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.society_posts
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'members',
  ADD COLUMN IF NOT EXISTS event_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'society_posts_visibility_check'
      AND conrelid = 'public.society_posts'::regclass
  ) THEN
    ALTER TABLE public.society_posts
      ADD CONSTRAINT society_posts_visibility_check
      CHECK (visibility IN ('public','members','admins'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PHASE 3 — PRIVATE SOCIETY GROUPS / MEMBERSHIP GATING
-- ============================================================

CREATE TABLE IF NOT EXISTS public.society_members (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  society_id  UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member'
                CHECK (role IN ('member','admin','committee','security')),
  flat_no     TEXT,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected','left')),
  joined_at   TIMESTAMPTZ,
  requested_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (society_id, user_id)
);

ALTER TABLE public.society_members
  ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ============================================================
-- PHASE 4 — MONETIZATION FOUNDATION
-- ============================================================

CREATE TABLE IF NOT EXISTS public.businesses (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,
  city            TEXT,
  plan            TEXT NOT NULL DEFAULT 'basic'
                    CHECK (plan IN ('basic', 'standard', 'premium')),
  tagline         TEXT,
  description     TEXT,
  phone           TEXT,
  whatsapp        TEXT,
  locality        TEXT NOT NULL,
  address         TEXT,
  is_verified     BOOLEAN NOT NULL DEFAULT false,
  rating          NUMERIC(2,1) NOT NULL DEFAULT 0,
  review_count    INTEGER NOT NULL DEFAULT 0,
  owner_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  open_hours      TEXT,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  plan_expires_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS open_hours TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.business_registration_requests (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name  TEXT NOT NULL,
  category       TEXT NOT NULL,
  city           TEXT,
  locality       TEXT NOT NULL,
  landmark       TEXT,
  contact_phone  TEXT,
  whatsapp       TEXT,
  open_hours     TEXT,
  description    TEXT,
  proof_note     TEXT,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected')),
  business_id    UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  reviewed_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at    TIMESTAMPTZ,
  admin_note     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.post_boosts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id       UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_paise  INTEGER NOT NULL DEFAULT 2900,
  boosted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  boosted_until TIMESTAMPTZ NOT NULL,
  payment_ref   TEXT
);

-- ============================================================
-- PHASE 5 — PAYMENTS
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
  metadata              JSONB NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PHASE 6 — RSVP, MAINTENANCE, COMPLAINTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rsvps (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  society_post_id UUID NOT NULL REFERENCES public.society_posts(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'going'
                    CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(society_post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  society_id      UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  category        TEXT NOT NULL
                    CHECK (category IN ('plumbing','electrical','lift','common_area','security','cleaning','other')),
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','in_progress','resolved')),
  vendor_name     TEXT,
  cost_estimate   INTEGER,
  actual_cost     INTEGER,
  reported_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.complaints (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  society_id  UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL
                CHECK (category IN ('noise','parking','cleanliness','security','neighbour','lift','water','other')),
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'open'
                CHECK (status IN ('open','acknowledged','resolved')),
  admin_note  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ============================================================
-- PHASE 6.7 — NEED TO PURCHASE / SHOP QUOTES
-- Kept as an extension of Need It Now / Nearby Right Now, not a separate marketplace module.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.quotes (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id               UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  business_id           UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  shop_owner_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_name             TEXT,
  quoted_price_paise    INTEGER NOT NULL CHECK (quoted_price_paise >= 0),
  delivery_fee_paise    INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee_paise >= 0),
  estimated_minutes     INTEGER CHECK (estimated_minutes IS NULL OR estimated_minutes > 0),
  message               TEXT,
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','accepted','rejected','withdrawn','expired')),
  accepted_at           TIMESTAMPTZ,
  expires_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'posts_selected_quote_id_fkey'
      AND conrelid = 'public.posts'::regclass
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_selected_quote_id_fkey
      FOREIGN KEY (selected_quote_id) REFERENCES public.quotes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_saved_localities ON public.profiles USING gin(saved_localities);
CREATE INDEX IF NOT EXISTS idx_profiles_society_id       ON public.profiles(society_id);

CREATE INDEX IF NOT EXISTS idx_posts_type         ON public.posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_status       ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_user_id      ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_locality     ON public.posts(locality);
CREATE INDEX IF NOT EXISTS idx_posts_category     ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_created_at   ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_boosted      ON public.posts(is_boosted, boosted_until);
CREATE INDEX IF NOT EXISTS idx_posts_civic_status ON public.posts(civic_status);

CREATE INDEX IF NOT EXISTS idx_post_confirmations_user ON public.post_confirmations(user_id);
CREATE INDEX IF NOT EXISTS idx_providers_service       ON public.providers(service_type);
CREATE INDEX IF NOT EXISTS idx_providers_locality      ON public.providers(locality);
CREATE INDEX IF NOT EXISTS idx_replies_post_id         ON public.replies(post_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_quick_reply_per_user_post
  ON public.replies (post_id, user_id, reply_type)
  WHERE reply_type IN ('still_happening', 'i_can_help', 'i_know_someone')
    AND is_hidden = false;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_custom_reply_exact_per_user_post
  ON public.replies (post_id, user_id, lower(trim(content)))
  WHERE reply_type = 'custom'
    AND is_hidden = false;
CREATE INDEX IF NOT EXISTS idx_reports_status          ON public.reports(status);

CREATE INDEX IF NOT EXISTS idx_societies_locality       ON public.societies(locality);
CREATE INDEX IF NOT EXISTS idx_societies_admin          ON public.societies(admin_id);
CREATE INDEX IF NOT EXISTS idx_society_registration_requests_status ON public.society_registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_society_registration_requests_user   ON public.society_registration_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_society_posts_society    ON public.society_posts(society_id);
CREATE INDEX IF NOT EXISTS idx_society_posts_type       ON public.society_posts(type);
CREATE INDEX IF NOT EXISTS idx_society_posts_visibility ON public.society_posts(visibility);
CREATE INDEX IF NOT EXISTS idx_society_posts_created    ON public.society_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user  ON public.push_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_society_members_society ON public.society_members(society_id);
CREATE INDEX IF NOT EXISTS idx_society_members_user    ON public.society_members(user_id);
CREATE INDEX IF NOT EXISTS idx_society_members_status  ON public.society_members(status);

CREATE INDEX IF NOT EXISTS idx_businesses_locality ON public.businesses(locality);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_plan     ON public.businesses(plan);
CREATE INDEX IF NOT EXISTS idx_businesses_owner    ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_business_registration_requests_status ON public.business_registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_business_registration_requests_user   ON public.business_registration_requests(requested_by);

CREATE INDEX IF NOT EXISTS idx_post_boosts_post ON public.post_boosts(post_id);
CREATE INDEX IF NOT EXISTS idx_post_boosts_user ON public.post_boosts(user_id);

CREATE INDEX IF NOT EXISTS idx_payments_user   ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_type   ON public.payments(type);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_order  ON public.payments(razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_rsvps_post ON public.rsvps(society_post_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_user ON public.rsvps(user_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_society ON public.maintenance_records(society_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status  ON public.maintenance_records(status);

CREATE INDEX IF NOT EXISTS idx_complaints_society ON public.complaints(society_id);
CREATE INDEX IF NOT EXISTS idx_complaints_user    ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status  ON public.complaints(status);

CREATE INDEX IF NOT EXISTS idx_quotes_post     ON public.quotes(post_id);
CREATE INDEX IF NOT EXISTS idx_quotes_business ON public.quotes(business_id);
CREATE INDEX IF NOT EXISTS idx_quotes_owner    ON public.quotes(shop_owner_id);
CREATE INDEX IF NOT EXISTS idx_posts_selected_quote ON public.posts(selected_quote_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_quote_per_shop_post
  ON public.quotes(post_id, shop_owner_id)
  WHERE status <> 'withdrawn';
CREATE INDEX IF NOT EXISTS idx_quotes_status   ON public.quotes(status);

-- ============================================================
-- STORED PROCEDURES / RPCs
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_still_happening(p_post_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  already_confirmed BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.post_confirmations
    WHERE post_id = p_post_id AND user_id = p_user_id
  ) INTO already_confirmed;

  IF already_confirmed THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.post_confirmations (post_id, user_id)
  VALUES (p_post_id, p_user_id);

  UPDATE public.posts
  SET still_happening_count = still_happening_count + 1,
      last_confirmed_at = NOW()
  WHERE id = p_post_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.increment_helper_count(p_post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.posts
  SET helper_count = helper_count + 1
  WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.increment_post_report(p_post_id UUID)
RETURNS VOID AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.posts
  SET report_count = report_count + 1
  WHERE id = p_post_id
  RETURNING report_count INTO new_count;

  IF new_count >= 3 THEN
    UPDATE public.posts SET status = 'flagged' WHERE id = p_post_id AND status = 'active';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_society_member(p_society_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.society_members
    WHERE society_id = p_society_id
      AND user_id = auth.uid()
      AND status = 'approved'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_society_admin(p_society_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'society_admin'
      AND society_id = p_society_id
  )
  OR EXISTS (
    SELECT 1 FROM public.society_members
    WHERE society_id = p_society_id
      AND user_id = auth.uid()
      AND role IN ('admin','committee')
      AND status = 'approved'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_confirmations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.societies           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.society_registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.society_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.society_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_boosts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes              ENABLE ROW LEVEL SECURITY;

-- Recreate policies idempotently.
DROP POLICY IF EXISTS "Public profiles visible to all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Public profiles visible to all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Active posts visible to all" ON public.posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Admins can update any post" ON public.posts;
CREATE POLICY "Active posts visible to all" ON public.posts FOR SELECT USING (status != 'removed');
CREATE POLICY "Authenticated users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any post" ON public.posts FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Confirmations visible to all" ON public.post_confirmations;
DROP POLICY IF EXISTS "Authenticated users can confirm" ON public.post_confirmations;
CREATE POLICY "Confirmations visible to all" ON public.post_confirmations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can confirm" ON public.post_confirmations FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Providers visible to all" ON public.providers;
DROP POLICY IF EXISTS "Authenticated users can create providers" ON public.providers;
DROP POLICY IF EXISTS "Authenticated users can update providers" ON public.providers;
CREATE POLICY "Providers visible to all" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create providers" ON public.providers FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated users can update providers" ON public.providers FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Non-hidden replies visible to all" ON public.replies;
DROP POLICY IF EXISTS "Authenticated users can create replies" ON public.replies;
CREATE POLICY "Non-hidden replies visible to all" ON public.replies FOR SELECT USING (is_hidden = false);
CREATE POLICY "Authenticated users can create replies" ON public.replies FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can view reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can view reports" ON public.reports FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update reports" ON public.reports FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Users see own saved posts" ON public.saved_posts;
DROP POLICY IF EXISTS "Users can save posts" ON public.saved_posts;
DROP POLICY IF EXISTS "Users can unsave posts" ON public.saved_posts;
CREATE POLICY "Users see own saved posts" ON public.saved_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save posts" ON public.saved_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave posts" ON public.saved_posts FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Verified societies visible to all" ON public.societies;
DROP POLICY IF EXISTS "Society admins can update society" ON public.societies;
DROP POLICY IF EXISTS "Platform admins can manage societies" ON public.societies;
CREATE POLICY "Verified societies visible to all" ON public.societies FOR SELECT USING (is_verified = true OR admin_id = auth.uid() OR public.is_society_member(id) OR public.is_admin());
CREATE POLICY "Society admins can update society" ON public.societies FOR UPDATE USING (admin_id = auth.uid() OR public.is_society_admin(id));
CREATE POLICY "Platform admins can manage societies" ON public.societies FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can create society registration requests" ON public.society_registration_requests;
DROP POLICY IF EXISTS "Users can view own society registration requests" ON public.society_registration_requests;
DROP POLICY IF EXISTS "Admins can view society registration requests" ON public.society_registration_requests;
DROP POLICY IF EXISTS "Admins can update society registration requests" ON public.society_registration_requests;
CREATE POLICY "Users can create society registration requests" ON public.society_registration_requests FOR INSERT WITH CHECK (auth.uid() = requested_by);
CREATE POLICY "Users can view own society registration requests" ON public.society_registration_requests FOR SELECT USING (auth.uid() = requested_by);
CREATE POLICY "Admins can view society registration requests" ON public.society_registration_requests FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update society registration requests" ON public.society_registration_requests FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Society posts visible by visibility" ON public.society_posts;
DROP POLICY IF EXISTS "Society admins can create posts" ON public.society_posts;
DROP POLICY IF EXISTS "Society admins can update posts" ON public.society_posts;
DROP POLICY IF EXISTS "Society admins can delete posts" ON public.society_posts;
CREATE POLICY "Society posts visible by visibility" ON public.society_posts FOR SELECT USING (
  visibility = 'public'
  OR public.is_society_member(society_id)
  OR public.is_society_admin(society_id)
  OR public.is_admin()
);
CREATE POLICY "Society admins can create posts" ON public.society_posts FOR INSERT WITH CHECK (auth.uid() = user_id AND (public.is_society_admin(society_id) OR public.is_admin()));
CREATE POLICY "Society admins can update posts" ON public.society_posts FOR UPDATE USING (public.is_society_admin(society_id) OR public.is_admin());
CREATE POLICY "Society admins can delete posts" ON public.society_posts FOR DELETE USING (public.is_society_admin(society_id) OR public.is_admin());

DROP POLICY IF EXISTS "Users can view own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can create own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can update own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can view own push subscriptions" ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own push subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own push subscriptions" ON public.push_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own push subscriptions" ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own membership" ON public.society_members;
DROP POLICY IF EXISTS "Approved society members visible to society" ON public.society_members;
DROP POLICY IF EXISTS "Users can request membership" ON public.society_members;
DROP POLICY IF EXISTS "Admins can insert society members" ON public.society_members;
DROP POLICY IF EXISTS "Society admins can manage members" ON public.society_members;
CREATE POLICY "Users can view own membership" ON public.society_members FOR SELECT USING (auth.uid() = user_id OR public.is_society_admin(society_id) OR public.is_admin());
CREATE POLICY "Approved society members visible to society" ON public.society_members FOR SELECT USING (status = 'approved' AND public.is_society_member(society_id));
CREATE POLICY "Users can request membership" ON public.society_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can insert society members" ON public.society_members FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Society admins can manage members" ON public.society_members FOR UPDATE USING (public.is_society_admin(society_id) OR public.is_admin());

DROP POLICY IF EXISTS "Anyone can view verified businesses" ON public.businesses;
DROP POLICY IF EXISTS "Owners can insert their business" ON public.businesses;
DROP POLICY IF EXISTS "Owners can update their business" ON public.businesses;
DROP POLICY IF EXISTS "Admins can manage all businesses" ON public.businesses;
CREATE POLICY "Anyone can view verified businesses" ON public.businesses FOR SELECT USING (is_verified = true OR owner_id = auth.uid() OR public.is_admin());
CREATE POLICY "Owners can insert their business" ON public.businesses FOR INSERT WITH CHECK (auth.uid() = owner_id AND is_verified = false);
CREATE POLICY "Owners can update their business" ON public.businesses FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id AND is_verified = false);
CREATE POLICY "Admins can manage all businesses" ON public.businesses FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can create business registration requests" ON public.business_registration_requests;
DROP POLICY IF EXISTS "Users can view own business registration requests" ON public.business_registration_requests;
DROP POLICY IF EXISTS "Admins can view business registration requests" ON public.business_registration_requests;
DROP POLICY IF EXISTS "Admins can update business registration requests" ON public.business_registration_requests;
CREATE POLICY "Users can create business registration requests" ON public.business_registration_requests FOR INSERT WITH CHECK (auth.uid() = requested_by);
CREATE POLICY "Users can view own business registration requests" ON public.business_registration_requests FOR SELECT USING (auth.uid() = requested_by);
CREATE POLICY "Admins can view business registration requests" ON public.business_registration_requests FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update business registration requests" ON public.business_registration_requests FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users see own boosts" ON public.post_boosts;
DROP POLICY IF EXISTS "Users can boost posts" ON public.post_boosts;
CREATE POLICY "Users see own boosts" ON public.post_boosts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can boost posts" ON public.post_boosts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Service role can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Service role can update payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admins can manage payments" ON public.payments FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Society members can view RSVPs" ON public.rsvps;
DROP POLICY IF EXISTS "Users can RSVP" ON public.rsvps;
DROP POLICY IF EXISTS "Users can update own RSVP" ON public.rsvps;
DROP POLICY IF EXISTS "Users can delete own RSVP" ON public.rsvps;
CREATE POLICY "Society members can view RSVPs" ON public.rsvps FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.society_posts sp
    WHERE sp.id = rsvps.society_post_id
      AND (public.is_society_member(sp.society_id) OR public.is_society_admin(sp.society_id) OR public.is_admin())
  )
);
CREATE POLICY "Users can RSVP" ON public.rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own RSVP" ON public.rsvps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own RSVP" ON public.rsvps FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Society members can view maintenance" ON public.maintenance_records;
DROP POLICY IF EXISTS "Society admins can manage maintenance" ON public.maintenance_records;
CREATE POLICY "Society members can view maintenance" ON public.maintenance_records FOR SELECT USING (public.is_society_member(society_id) OR public.is_society_admin(society_id) OR public.is_admin());
CREATE POLICY "Society admins can manage maintenance" ON public.maintenance_records FOR ALL USING (public.is_society_admin(society_id) OR public.is_admin());

DROP POLICY IF EXISTS "Users can view own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Society admins can view all complaints" ON public.complaints;
DROP POLICY IF EXISTS "Members can file complaints" ON public.complaints;
DROP POLICY IF EXISTS "Society admins can update complaints" ON public.complaints;
CREATE POLICY "Users can view own complaints" ON public.complaints FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Society admins can view all complaints" ON public.complaints FOR SELECT USING (public.is_society_admin(society_id) OR public.is_admin());
CREATE POLICY "Members can file complaints" ON public.complaints FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_society_member(society_id));
CREATE POLICY "Society admins can update complaints" ON public.complaints FOR UPDATE USING (public.is_society_admin(society_id) OR public.is_admin());

DROP POLICY IF EXISTS "Post owners and shops can view quotes" ON public.quotes;
DROP POLICY IF EXISTS "Business owners can create quotes" ON public.quotes;
DROP POLICY IF EXISTS "Shop owners can update own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Post owners can accept quotes" ON public.quotes;
CREATE POLICY "Post owners and shops can view quotes" ON public.quotes FOR SELECT USING (
  shop_owner_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.posts p WHERE p.id = quotes.post_id AND p.user_id = auth.uid())
  OR public.is_admin()
);
CREATE POLICY "Business owners can create quotes" ON public.quotes FOR INSERT WITH CHECK (
  auth.uid() = shop_owner_id
  AND (
    business_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  )
);
CREATE POLICY "Shop owners can update own quotes" ON public.quotes FOR UPDATE USING (auth.uid() = shop_owner_id OR public.is_admin());

-- ============================================================
-- REALTIME PUBLICATION
-- ============================================================

ALTER TABLE public.posts               REPLICA IDENTITY FULL;
ALTER TABLE public.replies             REPLICA IDENTITY FULL;
ALTER TABLE public.post_confirmations  REPLICA IDENTITY FULL;
ALTER TABLE public.society_posts       REPLICA IDENTITY FULL;
ALTER TABLE public.rsvps               REPLICA IDENTITY FULL;
ALTER TABLE public.maintenance_records REPLICA IDENTITY FULL;
ALTER TABLE public.complaints          REPLICA IDENTITY FULL;
ALTER TABLE public.quotes              REPLICA IDENTITY FULL;

DO $$
DECLARE
  t TEXT;
  realtime_tables TEXT[] := ARRAY[
    'posts',
    'replies',
    'post_confirmations',
    'society_posts',
    'rsvps',
    'maintenance_records',
    'complaints',
    'quotes'
  ];
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH t IN ARRAY realtime_tables LOOP
      IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = t
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      END IF;
    END LOOP;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
