-- ============================================================
-- LocalSetu — Test commerce personas (run after creating auth users)
-- Create test users via email login first, then run this migration.
-- ============================================================

BEGIN;

-- 1) Upgrade test profiles into useful personas.
UPDATE public.profiles p
SET
  name = v.name,
  locality = v.locality,
  role = v.role,
  is_verified = true,
  trust_score = v.trust_score,
  updated_at = NOW()
FROM (
  VALUES
    ('resident.test@localsetu.dev',      'Amit Resident',         'Kharghar Sector 20', 'resident',       78),
    ('society.admin@localsetu.dev',      'Seema Society Admin',   'Kharghar Sector 20', 'society_admin',  92),
    ('electrical.owner@localsetu.dev',   'Raju Electricals',      'Kharghar Sector 20', 'shop_owner',     85),
    ('hardware.owner@localsetu.dev',     'Mahavir Hardware',      'Kharghar Sector 21', 'shop_owner',     84),
    ('pharmacy.owner@localsetu.dev',     'CarePlus Pharmacy',     'Kharghar Sector 20', 'shop_owner',     88),
    ('stationery.owner@localsetu.dev',   'PrintPoint Stationery', 'Kharghar Sector 19', 'shop_owner',     82),
    ('repair.owner@localsetu.dev',       'QuickFix Repairs',      'Kharghar Sector 20', 'shop_owner',     83)
) AS v(email, name, locality, role, trust_score)
WHERE p.email = v.email;

-- Also match profiles created before email was copied to profiles row.
UPDATE public.profiles p
SET
  name = v.name,
  locality = v.locality,
  role = v.role,
  email = v.email,
  is_verified = true,
  trust_score = v.trust_score,
  updated_at = NOW()
FROM auth.users u,
(
  VALUES
    ('resident.test@localsetu.dev',      'Amit Resident',         'Kharghar Sector 20', 'resident',       78),
    ('society.admin@localsetu.dev',      'Seema Society Admin',   'Kharghar Sector 20', 'society_admin',  92),
    ('electrical.owner@localsetu.dev',   'Raju Electricals',      'Kharghar Sector 20', 'shop_owner',     85),
    ('hardware.owner@localsetu.dev',     'Mahavir Hardware',      'Kharghar Sector 21', 'shop_owner',     84),
    ('pharmacy.owner@localsetu.dev',     'CarePlus Pharmacy',     'Kharghar Sector 20', 'shop_owner',     88),
    ('stationery.owner@localsetu.dev',   'PrintPoint Stationery', 'Kharghar Sector 19', 'shop_owner',     82),
    ('repair.owner@localsetu.dev',       'QuickFix Repairs',      'Kharghar Sector 20', 'shop_owner',     83)
) AS v(email, name, locality, role, trust_score)
WHERE p.id = u.id
  AND u.email = v.email
  AND (p.email IS NULL OR p.email = v.email);

-- 2) Create one test society and attach society admin.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'societies' AND column_name = 'address'
  ) THEN
    INSERT INTO public.societies (name, locality, address, city, pincode, is_verified, is_pro)
    SELECT
      'Sector 20 Residency Test CHS',
      'Kharghar Sector 20',
      'Near Sector 20 Market, Kharghar',
      'Navi Mumbai',
      '410210',
      true,
      true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.societies WHERE name = 'Sector 20 Residency Test CHS'
    );
  ELSE
    INSERT INTO public.societies (
      name, locality, sector, landmark, description, is_verified, status
    )
    SELECT
      'Sector 20 Residency Test CHS',
      'Kharghar',
      'Sector 20',
      'Near Sector 20 Market, Kharghar',
      'Test society for commerce and admin flows',
      true,
      'active'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.societies WHERE name = 'Sector 20 Residency Test CHS'
    );
  END IF;
END $$;

UPDATE public.societies s
SET
  admin_id = p.id,
  admin_user_id = COALESCE(s.admin_user_id, p.id)
FROM public.profiles p
WHERE s.name = 'Sector 20 Residency Test CHS'
  AND p.email = 'society.admin@localsetu.dev';

UPDATE public.profiles p
SET society_id = s.id
FROM public.societies s
WHERE p.email = 'society.admin@localsetu.dev'
  AND s.name = 'Sector 20 Residency Test CHS';

INSERT INTO public.society_members (
  society_id, user_id, role, flat_no, status
)
SELECT
  s.id,
  p.id,
  'admin',
  'A-101',
  'approved'
FROM public.societies s
JOIN public.profiles p ON p.email = 'society.admin@localsetu.dev'
WHERE s.name = 'Sector 20 Residency Test CHS'
ON CONFLICT (society_id, user_id) DO UPDATE
SET role = 'admin', status = 'approved';

-- 3) Remove old test businesses so reseed is clean.
DELETE FROM public.businesses
WHERE name IN (
  'Raju Electricals',
  'Mahavir Hardware & Paints',
  'CarePlus Pharmacy',
  'PrintPoint Stationery',
  'QuickFix Mobile & Appliance Repair'
);

-- 4) Seed local shop-owner businesses.
INSERT INTO public.businesses (
  name, category, plan, tagline, description, phone, whatsapp,
  locality, address, is_verified, rating, review_count, owner_id,
  plan_expires_at
)
SELECT
  x.name,
  x.category,
  x.plan,
  x.tagline,
  x.description,
  x.phone,
  x.whatsapp,
  x.locality,
  x.address,
  true,
  x.rating,
  x.review_count,
  p.id,
  NOW() + INTERVAL '180 days'
FROM (
  VALUES
    (
      'electrical.owner@localsetu.dev',
      'Raju Electricals',
      'electrical',
      'premium',
      'Sockets, switches, wires and urgent electrical items',
      'Electrical shop for sockets, plugs, wires, switchboards, MCBs, extension cords and small home electrical needs. Delivery around Sector 20 and nearby Kharghar areas.',
      '9000001001',
      '9000001001',
      'Kharghar Sector 20',
      'Shop 3, Sector 20 Market, Kharghar',
      4.7::numeric,
      48
    ),
    (
      'hardware.owner@localsetu.dev',
      'Mahavir Hardware & Paints',
      'hardware',
      'standard',
      'Hardware, tools, plumbing and paint supplies',
      'Local hardware shop for tools, screws, plumbing parts, adhesives, tapes, paints and emergency household repair items.',
      '9000001002',
      '9000001002',
      'Kharghar Sector 21',
      'Shop 8, Sector 21 Market Road, Kharghar',
      4.5::numeric,
      36
    ),
    (
      'pharmacy.owner@localsetu.dev',
      'CarePlus Pharmacy',
      'pharmacy',
      'standard',
      'Medicines and basic health essentials',
      'Pharmacy for OTC medicines, first aid, wellness essentials and home delivery in nearby sectors.',
      '9000001003',
      '9000001003',
      'Kharghar Sector 20',
      'Shop 5, Arihant Complex, Sector 20, Kharghar',
      4.6::numeric,
      62
    ),
    (
      'stationery.owner@localsetu.dev',
      'PrintPoint Stationery',
      'stationery',
      'basic',
      'Printouts, stationery and school supplies',
      'Stationery shop for urgent printouts, photocopy, binding, school supplies, pens, files and small office items.',
      '9000001004',
      '9000001004',
      'Kharghar Sector 19',
      'Near Sector 19 Bus Stop, Kharghar',
      4.3::numeric,
      29
    ),
    (
      'repair.owner@localsetu.dev',
      'QuickFix Mobile & Appliance Repair',
      'repair',
      'standard',
      'Mobile, charger and small appliance repairs',
      'Repair shop for phone charging issues, small appliance checks, cables, adapters and quick troubleshooting.',
      '9000001005',
      '9000001005',
      'Kharghar Sector 20',
      'Shop 11, Sector 20 Market, Kharghar',
      4.4::numeric,
      41
    )
) AS x(email, name, category, plan, tagline, description, phone, whatsapp, locality, address, rating, review_count)
JOIN public.profiles p ON p.email = x.email;

-- 5) Seed one Need to Buy request from resident.
INSERT INTO public.posts (
  user_id, type, locality, category, content, status,
  expires_at, needed_by, distance_range, helper_count, is_fulfilled,
  need_to_buy_item, need_to_buy_qty, delivery_pref, budget_paise
)
SELECT
  p.id,
  'need_it_now',
  'Kharghar Sector 20',
  'need_to_buy',
  'Need a 16A socket, plug top, and insulation tape near Sector 20 today. Nearby electrical or hardware shops can quote price and delivery time.',
  'active',
  NOW() + INTERVAL '12 hours',
  NOW() + INTERVAL '3 hours',
  '2km',
  0,
  false,
  '16A socket, plug top and insulation tape',
  '1 set',
  'delivery',
  30000
FROM public.profiles p
WHERE p.email = 'resident.test@localsetu.dev'
  AND NOT EXISTS (
    SELECT 1
    FROM public.posts
    WHERE content ILIKE '%Need a 16A socket, plug top%'
      AND status = 'active'
  );

-- 6) Seed competing quotes for the test Need to Buy request.
INSERT INTO public.quotes (
  post_id, business_id, shop_owner_id, item_name, quoted_price_paise,
  delivery_fee_paise, estimated_minutes, message, status
)
SELECT
  req.id,
  b.id,
  b.owner_id,
  '16A socket, plug top and insulation tape',
  x.price_paise,
  x.delivery_fee_paise,
  x.estimated_minutes,
  x.message,
  'pending'
FROM (
  VALUES
    ('Raju Electricals', 23500, 0, 35, 'Available now. Can deliver near Sector 20 in about 35 minutes.'),
    ('Mahavir Hardware & Paints', 24900, 2000, 45, 'All items available. Delivery possible, or pickup from Sector 21 shop.')
) AS x(business_name, price_paise, delivery_fee_paise, estimated_minutes, message)
JOIN public.businesses b ON b.name = x.business_name
JOIN public.posts req
  ON req.content ILIKE '%Need a 16A socket, plug top%'
 AND req.status = 'active'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.quotes q
  WHERE q.post_id = req.id
    AND q.shop_owner_id = b.owner_id
    AND q.status <> 'withdrawn'
);

NOTIFY pgrst, 'reload schema';

COMMIT;
