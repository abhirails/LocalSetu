-- LocalSetu - Align Need to Buy / quote schema with the frontend.
-- Safe to re-run.

BEGIN;

DO $$
BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('resident', 'admin', 'moderator', 'society_admin', 'business_owner', 'shop_owner'));
END $$;

ALTER TABLE public.posts
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
    WHERE conname = 'posts_delivery_pref_check'
      AND conrelid = 'public.posts'::regclass
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_delivery_pref_check
      CHECK (delivery_pref IN ('delivery','pickup','either'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'posts_budget_paise_check'
      AND conrelid = 'public.posts'::regclass
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_budget_paise_check
      CHECK (budget_paise IS NULL OR budget_paise >= 0);
  END IF;
END $$;

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
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','rejected','withdrawn','expired')),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS shop_owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS item_name TEXT,
  ADD COLUMN IF NOT EXISTS quoted_price_paise INTEGER,
  ADD COLUMN IF NOT EXISTS delivery_fee_paise INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill canonical columns from older local quote prototypes, if present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'submitted_by'
  ) THEN
    EXECUTE 'UPDATE public.quotes SET shop_owner_id = COALESCE(shop_owner_id, submitted_by)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'price'
  ) THEN
    EXECUTE 'UPDATE public.quotes SET quoted_price_paise = COALESCE(quoted_price_paise, price * 100)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'delivery_charge'
  ) THEN
    EXECUTE 'UPDATE public.quotes SET delivery_fee_paise = COALESCE(delivery_fee_paise, delivery_charge * 100)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'delivery_time'
  ) THEN
    EXECUTE 'UPDATE public.quotes SET estimated_minutes = COALESCE(estimated_minutes, delivery_time)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'is_removed'
  ) THEN
    EXECUTE 'UPDATE public.quotes SET status = CASE WHEN is_removed THEN ''withdrawn'' ELSE status END';
  END IF;
END $$;

UPDATE public.quotes
SET quoted_price_paise = 0
WHERE quoted_price_paise IS NULL;

ALTER TABLE public.quotes
  ALTER COLUMN shop_owner_id SET NOT NULL,
  ALTER COLUMN quoted_price_paise SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'pending';

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

CREATE INDEX IF NOT EXISTS idx_posts_selected_quote ON public.posts(selected_quote_id);
CREATE INDEX IF NOT EXISTS idx_quotes_post ON public.quotes(post_id);
CREATE INDEX IF NOT EXISTS idx_quotes_business ON public.quotes(business_id);
CREATE INDEX IF NOT EXISTS idx_quotes_owner ON public.quotes(shop_owner_id);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_quote_per_shop_post
  ON public.quotes(post_id, shop_owner_id)
  WHERE status <> 'withdrawn';

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "Post owners and shops can view quotes" ON public.quotes;
CREATE POLICY "Post owners and shops can view quotes" ON public.quotes
  FOR SELECT USING (
    auth.uid() = shop_owner_id
    OR EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.id = quotes.post_id AND p.user_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Service role can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Service role can update payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
CREATE POLICY "Admins can manage payments" ON public.payments
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Business owners can create quotes" ON public.quotes;
CREATE POLICY "Business owners can create quotes" ON public.quotes
  FOR INSERT WITH CHECK (
    auth.uid() = shop_owner_id
    AND (
      business_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.businesses b
        WHERE b.id = business_id AND b.owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Shop owners can update own quotes" ON public.quotes;
CREATE POLICY "Shop owners can update own quotes" ON public.quotes
  FOR UPDATE USING (auth.uid() = shop_owner_id OR public.is_admin());

NOTIFY pgrst, 'reload schema';

COMMIT;
