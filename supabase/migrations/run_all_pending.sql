BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS saved_localities TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS active_locality TEXT,
  ADD COLUMN IF NOT EXISTS society_id UUID;

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
  ADD COLUMN IF NOT EXISTS medical_disclaimer_accepted BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.societies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  locality TEXT NOT NULL DEFAULT 'Kharghar',
  address TEXT,
  city TEXT NOT NULL DEFAULT 'Navi Mumbai',
  pincode TEXT,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_pro BOOLEAN NOT NULL DEFAULT false,
  pro_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_society_id_fkey' AND conrelid = 'public.profiles'::regclass) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_society_id_fkey FOREIGN KEY (society_id) REFERENCES public.societies(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.society_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'notice' CHECK (type IN ('notice','event','maintenance','alert','poll','update')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'members' CHECK (visibility IN ('public','members','admins')),
  event_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.society_posts
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'members',
  ADD COLUMN IF NOT EXISTS event_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.society_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member','admin','committee','security')),
  flat_no TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','left')),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (society_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic','standard','premium')),
  tagline TEXT,
  description TEXT,
  phone TEXT,
  whatsapp TEXT,
  locality TEXT NOT NULL,
  address TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.post_boosts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_paise INTEGER NOT NULL DEFAULT 2900,
  boosted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  boosted_until TIMESTAMPTZ NOT NULL,
  payment_ref TEXT
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('boost','society_pro','business_listing')),
  amount_paise INTEGER NOT NULL,
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','captured','failed')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  society_post_id UUID NOT NULL REFERENCES public.society_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going','maybe','not_going')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(society_post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('plumbing','electrical','lift','common_area','security','cleaning','other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  vendor_name TEXT,
  cost_estimate INTEGER,
  actual_cost INTEGER,
  reported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('noise','parking','cleanliness','security','neighbour','lift','water','other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  shop_owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_name TEXT,
  quoted_price_paise INTEGER NOT NULL CHECK (quoted_price_paise >= 0),
  delivery_fee_paise INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee_paise >= 0),
  estimated_minutes INTEGER CHECK (estimated_minutes IS NULL OR estimated_minutes > 0),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','withdrawn','expired')),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_saved_localities ON public.profiles USING gin(saved_localities);
CREATE INDEX IF NOT EXISTS idx_posts_locality ON public.posts(locality);
CREATE INDEX IF NOT EXISTS idx_posts_boosted ON public.posts(is_boosted, boosted_until);
CREATE INDEX IF NOT EXISTS idx_societies_locality ON public.societies(locality);
CREATE INDEX IF NOT EXISTS idx_society_posts_society ON public.society_posts(society_id);
CREATE INDEX IF NOT EXISTS idx_society_posts_visibility ON public.society_posts(visibility);
CREATE INDEX IF NOT EXISTS idx_society_members_society ON public.society_members(society_id);
CREATE INDEX IF NOT EXISTS idx_society_members_user ON public.society_members(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_locality ON public.businesses(locality);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses(category);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_post ON public.rsvps(society_post_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_society ON public.maintenance_records(society_id);
CREATE INDEX IF NOT EXISTS idx_complaints_society ON public.complaints(society_id);
CREATE INDEX IF NOT EXISTS idx_quotes_post ON public.quotes(post_id);
CREATE INDEX IF NOT EXISTS idx_quotes_owner ON public.quotes(shop_owner_id);

ALTER TABLE public.societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.society_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.society_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.post_confirmations REPLICA IDENTITY FULL;
ALTER TABLE public.society_posts REPLICA IDENTITY FULL;
ALTER TABLE public.rsvps REPLICA IDENTITY FULL;
ALTER TABLE public.quotes REPLICA IDENTITY FULL;

DO $$
DECLARE t TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH t IN ARRAY ARRAY['posts','post_confirmations','society_posts','rsvps','quotes'] LOOP
      IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      END IF;
    END LOOP;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
COMMIT;
