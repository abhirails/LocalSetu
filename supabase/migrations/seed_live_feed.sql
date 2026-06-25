-- ============================================================
-- LocalSetu — Seed Live Feed (posts + providers)
-- Run in Supabase SQL Editor. Safe to re-run when feed < 8 posts.
-- Uses your existing signed-up profiles (no fake auth users).
-- ============================================================

DO $$
DECLARE
  post_count INTEGER;
  u1 UUID;
  u2 UUID;
  u3 UUID;
BEGIN
  SELECT COUNT(*) INTO post_count FROM public.posts WHERE status != 'removed';

  IF post_count >= 8 THEN
    RAISE NOTICE 'Feed already has % posts — skipping seed.', post_count;
    RETURN;
  END IF;

  SELECT id INTO u1 FROM public.profiles ORDER BY created_at ASC LIMIT 1;
  SELECT id INTO u2 FROM public.profiles ORDER BY created_at ASC OFFSET 1 LIMIT 1;
  SELECT id INTO u3 FROM public.profiles ORDER BY created_at ASC OFFSET 2 LIMIT 1;

  IF u1 IS NULL THEN
    RAISE EXCEPTION 'No profiles found. Sign up once in the app, then re-run this seed.';
  END IF;

  u2 := COALESCE(u2, u1);
  u3 := COALESCE(u3, u1);

  -- Pilot demo: only real auth accounts exist — give 2nd/3rd profiles
  -- friendly local resident names so the feed doesn't look like one person.
  UPDATE public.profiles SET name = 'Abhay G.',      locality = 'Kharghar Sector 20' WHERE id = u1;
  UPDATE public.profiles SET name = 'Priya Nair',    locality = 'Kharghar Sector 12' WHERE id = u2 AND id != u1;
  UPDATE public.profiles SET name = 'Rohan Mehta',   locality = 'Kharghar Sector 35' WHERE id = u3 AND id NOT IN (u1, u2);

  -- ── RIGHT NOW ──
  INSERT INTO public.posts (user_id, type, locality, category, content, expires_at, still_happening_count, created_at)
  VALUES
    (u1, 'right_now', 'Kharghar Sector 12', 'water',
     'Pani nahi aa raha Sector 12 mein since morning. CIDCO ka koi update nahi. RO bhi khatam ho raha hai ghar mein.',
     NOW() + INTERVAL '11 hours', 8, NOW() - INTERVAL '45 minutes'),

    (u2, 'right_now', 'Palm Beach Road', 'traffic',
     'Heavy traffic near Palm Beach Road entry point. Accident ahead — avoid if possible, try Sion-Panvel Highway.',
     NOW() + INTERVAL '5 hours', 5, NOW() - INTERVAL '20 minutes'),

    (u3, 'right_now', 'Kharghar Sector 35', 'power',
     'Light gaya Sector 35 mein. MSEDCL said 3 PM but still no power. Anyone else affected?',
     NOW() + INTERVAL '10 hours', 12, NOW() - INTERVAL '2 hours'),

    (u1, 'right_now', 'Kharghar Sector 20', 'civic',
     'Garbage not picked up near Sector 20 market since 2 days. NMMC truck skipped our lane again.',
     NOW() + INTERVAL '8 hours', 3, NOW() - INTERVAL '90 minutes'),

    (u2, 'right_now', 'Seawoods', 'transport',
     'Seawoods station side auto queue is 20+ mins. Consider walking to Nerul if you are not in a hurry.',
     NOW() + INTERVAL '4 hours', 2, NOW() - INTERVAL '35 minutes');

  -- ── NEED IT NOW ──
  INSERT INTO public.posts (user_id, type, locality, category, content, expires_at, needed_by, distance_range, helper_count, created_at)
  VALUES
    (u3, 'need_it_now', 'Kharghar Sector 7', 'borrow',
     'Drill machine chahiye 2 ghante ke liye. Wall drilling karna hai. Sector 7 pickup.',
     NOW() + INTERVAL '24 hours', NOW() + INTERVAL '4 hours', '2km', 1, NOW() - INTERVAL '1 hour'),

    (u1, 'need_it_now', 'Kharghar Sector 20', 'borrow',
     'Need cricket bat for evening match today. Sector 20 ground, 5 PM se match hai.',
     NOW() + INTERVAL '12 hours', NOW() + INTERVAL '3 hours', 'walking', 2, NOW() - INTERVAL '30 minutes'),

    (u2, 'need_it_now', 'Panvel', 'rideshare',
     'Anyone going to Mumbai Airport (T2) tomorrow 5:30 AM? Happy to split cab fare from Panvel.',
     NOW() + INTERVAL '48 hours', NOW() + INTERVAL '24 hours', '5km', 0, NOW() - INTERVAL '3 hours');

  -- ── Still Happening confirmations ──
  INSERT INTO public.post_confirmations (post_id, user_id)
  SELECT p.id, u2
  FROM public.posts p
  WHERE p.user_id = u1 AND p.category = 'water'
    AND p.created_at > NOW() - INTERVAL '1 day'
  ON CONFLICT DO NOTHING;

  INSERT INTO public.post_confirmations (post_id, user_id)
  SELECT p.id, u3
  FROM public.posts p
  WHERE p.user_id = u1 AND p.category = 'water'
    AND p.created_at > NOW() - INTERVAL '1 day'
  ON CONFLICT DO NOTHING;

  -- ── Verified Help providers ──
  IF (SELECT COUNT(*) FROM public.providers) = 0 THEN
    INSERT INTO public.providers (name, service_type, locality, phone, whatsapp, recommendation_count, notes, is_verified, recommender_ids, created_by)
    VALUES
      ('Ramesh Bhai', 'plumber', 'Kharghar Sector 10', '9876501001', '9876501001', 5,
       ARRAY['Fixed bathroom leak same day, honest about cost.', 'Clean work, reasonable rates.'],
       true, ARRAY[u1], u1),
      ('Sunita Tai', 'cook', 'Kharghar Sector 20', '9876501002', '9876501002', 4,
       ARRAY['Excellent Maharashtrian food. Very reliable.', 'On time, great hygiene.'],
       true, ARRAY[u2], u2),
      ('Suresh Sir', 'tuition', 'Kharghar Sector 7', '9876501004', '9876501004', 7,
       ARRAY['Great Math & Science teacher up to Class 10.', 'Patient with slow learners.'],
       true, ARRAY[u3], u3),
      ('Meena Bai', 'maid', 'Nerul Sector 25', '9876501003', '9876501003', 6,
       ARRAY['Very trustworthy. Works in our building for 3 years.', 'Thorough cleaning.'],
       true, ARRAY[u1], u1);
  END IF;

  RAISE NOTICE 'Live feed seeded: posts + providers added.';
END $$;

NOTIFY pgrst, 'reload schema';
