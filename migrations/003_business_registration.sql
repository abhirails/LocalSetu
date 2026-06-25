-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 003 — Business Registration enhancements
-- Run this in Supabase SQL editor (Dashboard → SQL Editor → New query → Run)
-- Safe to run multiple times (all statements use IF NOT EXISTS / IF EXISTS).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add new columns to public.businesses
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS entity_type          TEXT DEFAULT 'shop',
  ADD COLUMN IF NOT EXISTS subcategory          TEXT,
  ADD COLUMN IF NOT EXISTS contact_person       TEXT,
  ADD COLUMN IF NOT EXISTS alternate_phone      TEXT,
  ADD COLUMN IF NOT EXISTS email                TEXT,
  ADD COLUMN IF NOT EXISTS city                 TEXT DEFAULT 'Navi Mumbai',
  ADD COLUMN IF NOT EXISTS pincode              TEXT,
  ADD COLUMN IF NOT EXISTS landmark             TEXT,
  ADD COLUMN IF NOT EXISTS service_area         TEXT,
  ADD COLUMN IF NOT EXISTS service_radius_km    INTEGER,
  ADD COLUMN IF NOT EXISTS provides_home_visit  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS provides_delivery    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pickup_available     BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS working_hours        TEXT,
  ADD COLUMN IF NOT EXISTS emergency_available  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepts_quotes       BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS typical_delivery_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS minimum_order_value  INTEGER,
  ADD COLUMN IF NOT EXISTS delivery_charge      INTEGER,
  ADD COLUMN IF NOT EXISTS payment_modes        TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS gst_number           TEXT,
  ADD COLUMN IF NOT EXISTS license_number       TEXT,
  ADD COLUMN IF NOT EXISTS verification_status  TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS submitted_at         TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS verified_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by          UUID REFERENCES public.profiles(id);

-- 2. Add CHECK constraints (guarded to avoid errors on re-run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'businesses_entity_type_check'
  ) THEN
    ALTER TABLE public.businesses
      ADD CONSTRAINT businesses_entity_type_check
      CHECK (entity_type IN (
        'shop', 'individual_provider', 'medical_facility',
        'education_institute', 'society_vendor', 'other'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'businesses_verification_status_check'
  ) THEN
    ALTER TABLE public.businesses
      ADD CONSTRAINT businesses_verification_status_check
      CHECK (verification_status IN (
        'pending', 'approved', 'rejected', 'needs_more_info'
      ));
  END IF;
END $$;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_businesses_entity_type
  ON public.businesses(entity_type);

CREATE INDEX IF NOT EXISTS idx_businesses_subcategory
  ON public.businesses(subcategory);

CREATE INDEX IF NOT EXISTS idx_businesses_verification_status
  ON public.businesses(verification_status);

CREATE INDEX IF NOT EXISTS idx_businesses_accepts_quotes
  ON public.businesses(accepts_quotes);

CREATE INDEX IF NOT EXISTS idx_businesses_category
  ON public.businesses(category);

CREATE INDEX IF NOT EXISTS idx_businesses_locality
  ON public.businesses(locality);

-- 4. Backfill existing rows so constraints don't fail
UPDATE public.businesses
  SET entity_type         = 'shop'      WHERE entity_type IS NULL;
UPDATE public.businesses
  SET verification_status = 'approved'  WHERE verification_status IS NULL AND is_verified = true;
UPDATE public.businesses
  SET verification_status = 'pending'   WHERE verification_status IS NULL;

-- 5. RLS policy: business owner can insert their own business
-- (adjust to your existing RLS style if needed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'businesses' AND policyname = 'owner_insert_business'
  ) THEN
    CREATE POLICY owner_insert_business
      ON public.businesses
      FOR INSERT
      WITH CHECK (owner_id = auth.uid());
  END IF;
END $$;
