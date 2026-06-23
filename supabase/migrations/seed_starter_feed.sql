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
  WHERE content LIKE 'Starter update:%'
     OR content LIKE 'Starter notice:%'
     OR content LIKE 'Need to purchase:%'
     OR content LIKE 'Need help finding%';

  IF starter_count >= 5 THEN
    RAISE NOTICE 'Starter feed already seeded (% posts) — skipping.', starter_count;
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
      'Kharghar',
      'water',
      'Starter update: Low water pressure reported near Sector 20. Please confirm if it is still happening in your building.',
      'active',
      NOW() + INTERVAL '8 hours',
      true
    ),
    (
      seed_user,
      'right_now',
      'Kharghar',
      'traffic',
      'Starter update: Slow traffic near Utsav Chowk side road. Add confirmation if you are nearby.',
      'active',
      NOW() + INTERVAL '4 hours',
      false
    ),
    (
      seed_user,
      'need_it_now',
      'Kharghar',
      'need_to_buy',
      'Need to purchase: 16A socket, plug top, and insulation tape. Nearby electrical shops can quote price and delivery time.',
      'active',
      NOW() + INTERVAL '12 hours',
      true
    ),
    (
      seed_user,
      'need_it_now',
      'Kharghar',
      'home_help',
      'Need help finding a reliable electrician near Kharghar today evening.',
      'active',
      NOW() + INTERVAL '10 hours',
      false
    ),
    (
      seed_user,
      'right_now',
      'Kharghar',
      'lost_found',
      'Starter update: A set of keys was found near a society gate in Kharghar. Reply only if you can identify it.',
      'active',
      NOW() + INTERVAL '1 day',
      false
    );

  RAISE NOTICE 'Starter feed posts added.';
END $$;

NOTIFY pgrst, 'reload schema';
