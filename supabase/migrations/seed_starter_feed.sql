-- ============================================================
-- LocalSetu — Production-safe starter feed posts
-- Clearly labelled sample posts for an empty production feed.
-- Safe to re-run: skips if starter posts already exist.
-- Login once in the app first so at least one profile exists.
-- ============================================================

DO $$
DECLARE
  seed_user UUID;
  starter_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO starter_count
  FROM public.posts
  WHERE locality = 'Kharghar'
    AND is_pinned = true
    AND created_at > NOW() - INTERVAL '7 days';

  IF starter_count >= 3 THEN
    RAISE NOTICE 'Starter feed already seeded (% pinned posts) — skipping.', starter_count;
    RETURN;
  END IF;

  SELECT id INTO seed_user
  FROM public.profiles
  ORDER BY created_at ASC
  LIMIT 1;

  IF seed_user IS NULL THEN
    RAISE NOTICE 'No profile found. Login once in LocalSetu first, then rerun this seed.';
    RETURN;
  END IF;

  INSERT INTO public.posts (
    user_id, type, locality, category, content, status, expires_at, is_pinned
  )
  VALUES
    (
      seed_user,
      'right_now',
      'Kharghar Sector 20',
      'water',
      'Pani pressure bahut kam hai Sector 20 mein since morning. Koi CIDCO complaint kiya kya? Please confirm if your building is also affected.',
      'active',
      NOW() + INTERVAL '8 hours',
      true
    ),
    (
      seed_user,
      'right_now',
      'Kharghar',
      'traffic',
      'Slow moving traffic near Utsav Chowk side road. Looks like a minor accident. Try the inner road via Sector 15.',
      'active',
      NOW() + INTERVAL '4 hours',
      false
    ),
    (
      seed_user,
      'need_it_now',
      'Kharghar Sector 20',
      'need_to_buy',
      '16A socket, plug top, and insulation tape chahiye. Koi nearby electrical shop hai jo deliver kar sake? Please quote price and time.',
      'active',
      NOW() + INTERVAL '12 hours',
      true
    ),
    (
      seed_user,
      'need_it_now',
      'Kharghar',
      'home_help',
      'Looking for a reliable electrician in Kharghar for today evening. Any recommendations from locals? Need wiring work done urgently.',
      'active',
      NOW() + INTERVAL '10 hours',
      false
    ),
    (
      seed_user,
      'right_now',
      'Kharghar',
      'lost_found',
      'Keys found near a society gate in Kharghar — key ring with 3 keys. Reply only if you can describe it. Will hand over to security.',
      'active',
      NOW() + INTERVAL '1 day',
      false
    );

  RAISE NOTICE 'Starter feed posts added.';
END $$;

NOTIFY pgrst, 'reload schema';
