-- ============================================================
-- LocalSetu — Demo Seed Data
-- Run AFTER schema.sql in Supabase SQL Editor
-- NOTE: This creates demo profiles WITHOUT real auth.users rows.
-- For a real launch, users sign up via OTP and profiles are
-- auto-created by the trigger. This seed is for dev/demo only.
-- ============================================================

-- To use demo login in dev, create these users manually via:
-- Supabase Dashboard → Authentication → Users → Add User
-- Then run this seed to populate their profiles.

-- If you just want to test the app without real auth:
-- Leave this seed unrun and use the "Demo Login" button in the app.

-- ============================================================
-- DEMO POSTS (Kharghar, Navi Mumbai)
-- Replace user_id values with real UUIDs after creating users
-- ============================================================

-- Helper: use a fixed demo UUID for seeding
-- You can replace 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' with a real user id

DO $$
DECLARE
  demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN

  -- Insert demo profile (skip if exists)
  INSERT INTO public.profiles (id, name, locality, role, is_verified, trust_score)
  VALUES (demo_user_id, 'Demo Resident', 'Kharghar Sector 20', 'resident', true, 80)
  ON CONFLICT (id) DO NOTHING;

  -- RIGHT NOW POSTS
  INSERT INTO public.posts (user_id, type, locality, category, content, expires_at, still_happening_count)
  VALUES
    (demo_user_id, 'right_now', 'Kharghar Sector 12', 'water',
     'Pani nahi aa raha Sector 12 mein since morning. CIDCO ka koi update nahi. RO bhi khatam ho raha hai ghar mein.',
     NOW() + INTERVAL '11 hours', 8),

    (demo_user_id, 'right_now', 'Palm Beach Road', 'traffic',
     'Heavy traffic near Palm Beach Road entry point. Seems like an accident ahead. Avoid if possible — try Sion-Panvel Highway instead.',
     NOW() + INTERVAL '5 hours', 5),

    (demo_user_id, 'right_now', 'Kharghar Sector 35', 'power',
     'Light gaya Sector 35 mein. MSEDCL board ne kaha tha 3 PM tak aayega but still no power at 5:30 PM. Anyone else affected?',
     NOW() + INTERVAL '10 hours', 12),

    (demo_user_id, 'right_now', 'Bandra Station', 'transport',
     'Bandra station pe auto strike hai. No autos available from station to Linking Road. Better take rickshaw from Bandra East side.',
     NOW() + INTERVAL '5 hours', 3),

    (demo_user_id, 'right_now', 'Linking Road, Bandra', 'police',
     'Police checking on Linking Road near Shopper''s Stop. Document checking hain. Keep RC, DL, insurance ready. Moving slowly.',
     NOW() + INTERVAL '4 hours', 4),

    (demo_user_id, 'right_now', 'Nerul Sector 19', 'power',
     'Nerul mein 3 hours se power cut chal rahi hai. Sector 19, 20, 21 sab affected hai. Backup generator bhi nahi chal raha society mein.',
     NOW() + INTERVAL '9 hours', 6);

  -- NEED IT NOW POSTS
  INSERT INTO public.posts (user_id, type, locality, category, content, expires_at, needed_by, distance_range, helper_count)
  VALUES
    (demo_user_id, 'need_it_now', 'Kharghar Sector 7', 'borrow',
     'Drill machine chahiye 2 ghante ke liye. Wall drilling karna hai. Will return by evening. Sector 7, Kharghar mein aana pad sakta hai pickup ke liye.',
     NOW() + INTERVAL '24 hours', NOW() + INTERVAL '4 hours', '2km', 1),

    (demo_user_id, 'need_it_now', 'Panvel', 'rideshare',
     'Anyone going to Mumbai Airport (T2) tomorrow morning? 5:30 AM flight hai. Happy to split Ola/Uber fare. Starting from Panvel around 3:30 AM.',
     NOW() + INTERVAL '48 hours', NOW() + INTERVAL '24 hours', '5km', 0),

    (demo_user_id, 'need_it_now', 'Bandra West', 'borrow',
     'Need Dell laptop charger (65W, Type-L plug) for 1 day. Mine got damaged. Can come pick it up in Bandra West area. Will return tomorrow.',
     NOW() + INTERVAL '24 hours', NOW() + INTERVAL '6 hours', '1km', 0),

    (demo_user_id, 'need_it_now', 'Kharghar Sector 20', 'borrow',
     'Need cricket bat for evening match today. Willow bat preferred, any size. 3–4 ghante ke liye chahiye. Sector 20 ground pe match hai 5 PM se.',
     NOW() + INTERVAL '12 hours', NOW() + INTERVAL '3 hours', 'walking', 2),

    (demo_user_id, 'need_it_now', 'Kharghar', 'ticket',
     'Extra Coldplay Mumbai concert ticket available — Day 1. Face value only, no markup. Concert is this Saturday. DM if interested.',
     NOW() + INTERVAL '48 hours', NOW() + INTERVAL '72 hours', '5km', 3);

  -- PROVIDERS
  INSERT INTO public.providers (name, service_type, locality, phone, whatsapp, recommendation_count, notes, is_verified, recommender_ids, created_by)
  VALUES
    ('Ramesh Bhai', 'plumber', 'Kharghar Sector 10', '9876501001', '9876501001', 5,
     ARRAY['Fixed our bathroom leak same day, very honest about cost.', 'Came on time and did clean work. Reasonable rates.', 'Has proper tools, no shortcuts. Highly recommend.'],
     true, ARRAY[demo_user_id], demo_user_id),

    ('Sunita Tai', 'cook', 'Kharghar Sector 20', '9876501002', '9876501002', 4,
     ARRAY['Makes excellent Maharashtrian food. Very reliable.', 'Always on time, no excuses. Excellent hygiene.', 'Been working with us for 2 years. Totally trustworthy.'],
     true, ARRAY[demo_user_id], demo_user_id),

    ('Meena Bai', 'maid', 'Nerul Sector 25', '9876501003', '9876501003', 6,
     ARRAY['Very trustworthy and honest. Works in our building for 3 years.', 'Does thorough cleaning, never cuts corners.', 'Available for part-time or full-time both.'],
     true, ARRAY[demo_user_id], demo_user_id),

    ('Suresh Sir', 'tuition', 'Kharghar Sector 7', '9876501004', '9876501004', 7,
     ARRAY['Excellent teacher for Math and Science up to Class 10.', 'My daughter''s board marks went from 72% to 91% in one year.', 'Very patient with slow learners. Highly recommended.'],
     true, ARRAY[demo_user_id], demo_user_id),

    ('Raju Electrician', 'electrician', 'Ulwe Sector 3', '9876501005', '9876501005', 3,
     ARRAY['Fixed our inverter wiring professionally. Good work.', 'Responds quickly on WhatsApp. Comes same day.', 'Reasonable rates and knows his stuff.'],
     true, ARRAY[demo_user_id], demo_user_id),

    ('Deepa (Dog Walker)', 'dog_walker', 'Kharghar Sector 12', '9876501006', '9876501006', 2,
     ARRAY['Very good with dogs, my Labrador loves her.', 'Reliable and on time. Morning and evening walks.'],
     false, ARRAY[demo_user_id], demo_user_id),

    ('Kiran Carpenter', 'carpenter', 'Kamothe Sector 4', '9876501007', '9876501007', 4,
     ARRAY['Excellent woodwork. Made custom wardrobe for our room.', 'Neat finishing, no wastage. Honest quotation.', 'Completed on time, no excuses.'],
     true, ARRAY[demo_user_id], demo_user_id);

END $$;
