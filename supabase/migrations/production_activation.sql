-- ============================================================
-- LocalSetu — Production Activation Sprint
-- Schema compatibility + Kharghar society seed + starter notices
-- Safe to re-run (idempotent guards throughout).
-- ============================================================

BEGIN;

-- ── 1. Societies: sync admin_id from legacy admin_user_id ──
UPDATE public.societies
SET admin_id = admin_user_id
WHERE admin_id IS NULL
  AND admin_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_societies_admin_id ON public.societies(admin_id);

-- ── 2. society_posts: app-expected columns (backfill from legacy names) ──
ALTER TABLE public.society_posts
  ADD COLUMN IF NOT EXISTS posted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS pin_to_feed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS event_location TEXT;

UPDATE public.society_posts
SET posted_by = author_id
WHERE posted_by IS NULL AND author_id IS NOT NULL;

UPDATE public.society_posts
SET content = body
WHERE content IS NULL AND body IS NOT NULL;

UPDATE public.society_posts
SET pin_to_feed = COALESCE(is_pinned, false)
WHERE pin_to_feed IS DISTINCT FROM COALESCE(is_pinned, false);

-- ── 3. society_members: app-expected review columns ──
ALTER TABLE public.society_members
  ADD COLUMN IF NOT EXISTS flat_no TEXT,
  ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

UPDATE public.society_members
SET flat_no = flat_number
WHERE flat_no IS NULL AND flat_number IS NOT NULL;

UPDATE public.society_members
SET requested_at = created_at
WHERE requested_at IS NULL;

UPDATE public.society_members
SET reviewed_at = approved_at
WHERE reviewed_at IS NULL AND approved_at IS NOT NULL;

UPDATE public.society_members
SET reviewed_by = approved_by
WHERE reviewed_by IS NULL AND approved_by IS NOT NULL;

-- ── 4. Seed production-safe Kharghar societies (skip if any exist) ──
DO $$
DECLARE
  soc_count INTEGER;
  seed_user UUID;
  s1 UUID;
  s2 UUID;
  s3 UUID;
BEGIN
  SELECT COUNT(*) INTO soc_count FROM public.societies;

  IF soc_count > 0 THEN
    RAISE NOTICE 'Societies already exist (%) — skipping society seed.', soc_count;
    RETURN;
  END IF;

  SELECT id INTO seed_user FROM public.profiles ORDER BY created_at ASC LIMIT 1;

  INSERT INTO public.societies (name, locality, sector, landmark, description, is_verified, status, public_contact)
  VALUES
    ('Kharghar Heights CHS', 'Kharghar', 'Sector 20', 'Sector 20, Kharghar',
     'Production starter profile — public notices and events for Kharghar residents.', true, 'active', NULL),
    ('Green Valley Residency', 'Kharghar', 'Sector 35', 'Sector 35, Kharghar',
     'Production starter profile — community updates and society notices.', true, 'active', NULL),
    ('Central Park View CHS', 'Kharghar', 'Sector 12', 'Near Central Park, Kharghar',
     'Production starter profile — lost & found and local alerts.', true, 'active', NULL),
    ('Utsav Chowk Residency', 'Kharghar', 'Sector 7', 'Near Utsav Chowk, Kharghar',
     'Production starter profile — maintenance and event reminders.', true, 'active', NULL),
    ('Valley Shilp Residents', 'Kharghar', 'Sector 36', 'Sector 36, Kharghar',
     'Production starter profile — resident access requests welcome.', true, 'active', NULL);

  IF seed_user IS NOT NULL THEN
    SELECT id INTO s1 FROM public.societies WHERE name = 'Kharghar Heights CHS' LIMIT 1;
    SELECT id INTO s2 FROM public.societies WHERE name = 'Green Valley Residency' LIMIT 1;
    SELECT id INTO s3 FROM public.societies WHERE name = 'Central Park View CHS' LIMIT 1;

    INSERT INTO public.society_posts (
      society_id, author_id, posted_by, type, title, body, content,
      visibility, is_pinned, pin_to_feed, status
    )
    VALUES
      (s1, seed_user, seed_user, 'notice', 'Starter notice: Water timing update',
       'Community starter: Water supply may be low-pressure between 10 AM and 2 PM today. Please store water if needed.',
       'Community starter: Water supply may be low-pressure between 10 AM and 2 PM today. Please store water if needed.',
       'public', true, true, 'active'),
      (s2, seed_user, seed_user, 'event', 'Starter event: Society clean-up drive',
       'Community starter: Weekend clean-up near the society gate — Sunday 8 AM. Volunteers welcome.',
       'Community starter: Weekend clean-up near the society gate — Sunday 8 AM. Volunteers welcome.',
       'public', true, true, 'active'),
      (s3, seed_user, seed_user, 'notice', 'Starter notice: Lost keys at gate',
       'Community starter: A key set was found near the main gate. Contact society office if yours.',
       'Community starter: A key set was found near the main gate. Contact society office if yours.',
       'public', false, false, 'active');
  END IF;

  RAISE NOTICE 'Seeded 5 Kharghar societies (+ starter notices if profile exists).';
END $$;

-- ── 5. Starter public feed posts (skip if community starters already exist) ──
DO $$
DECLARE
  seed_user UUID;
  starter_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO starter_count
  FROM public.posts
  WHERE content LIKE 'Community starter:%'
     OR content LIKE 'Need to purchase:%'
     OR content LIKE 'Need help finding%';

  IF starter_count >= 5 THEN
    RAISE NOTICE 'Starter feed already seeded (% posts).', starter_count;
    RETURN;
  END IF;

  SELECT id INTO seed_user FROM public.profiles ORDER BY created_at ASC LIMIT 1;

  IF seed_user IS NULL THEN
    RAISE NOTICE 'No profile found — login once in LocalSetu, then re-run production_activation.sql';
    RETURN;
  END IF;

  INSERT INTO public.posts (user_id, type, locality, category, content, status, expires_at, is_pinned)
  VALUES
    (seed_user, 'right_now', 'Kharghar', 'water',
     'Community starter: Low water pressure reported near Sector 20. Please confirm if it is still happening in your building.',
     'active', NOW() + INTERVAL '8 hours', true),
    (seed_user, 'right_now', 'Kharghar', 'traffic',
     'Community starter: Slow traffic near Utsav Chowk side road. Add confirmation if you are nearby.',
     'active', NOW() + INTERVAL '4 hours', false),
    (seed_user, 'need_it_now', 'Kharghar', 'need_to_buy',
     'Need to purchase: 16A socket, plug top, and insulation tape. Nearby electrical shops can quote price and delivery time.',
     'active', NOW() + INTERVAL '12 hours', true),
    (seed_user, 'need_it_now', 'Kharghar', 'home_help',
     'Need help finding a reliable electrician near Kharghar today evening.',
     'active', NOW() + INTERVAL '10 hours', false),
    (seed_user, 'right_now', 'Kharghar', 'lost_found',
     'Community starter: A set of keys was found near a society gate in Kharghar. Reply only if you can identify it.',
     'active', NOW() + INTERVAL '1 day', false);

  RAISE NOTICE 'Starter public feed posts added.';
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
