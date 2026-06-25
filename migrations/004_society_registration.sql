-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 004 — Society Registration enhancements
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query → Run)
-- Safe to run multiple times (uses IF NOT EXISTS guards).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add new columns to public.societies
ALTER TABLE public.societies
  ADD COLUMN IF NOT EXISTS wings               TEXT[]      DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pincode             TEXT,
  ADD COLUMN IF NOT EXISTS registration_number TEXT,
  ADD COLUMN IF NOT EXISTS admin_flat_number   TEXT,
  ADD COLUMN IF NOT EXISTS admin_role          TEXT,
  ADD COLUMN IF NOT EXISTS locality            TEXT,
  ADD COLUMN IF NOT EXISTS registration_status TEXT        DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS submitted_at        TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS verified_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by         UUID        REFERENCES public.profiles(id);

-- 2. CHECK constraint on registration_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'societies_registration_status_check'
  ) THEN
    ALTER TABLE public.societies
      ADD CONSTRAINT societies_registration_status_check
      CHECK (registration_status IN ('pending', 'approved', 'rejected', 'needs_more_info'));
  END IF;
END $$;

-- 3. Backfill existing verified societies
UPDATE public.societies
  SET registration_status = 'approved'
  WHERE registration_status IS NULL AND is_verified = true;

UPDATE public.societies
  SET registration_status = 'pending'
  WHERE registration_status IS NULL;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_societies_registration_status
  ON public.societies(registration_status);
CREATE INDEX IF NOT EXISTS idx_societies_locality
  ON public.societies(locality);
CREATE INDEX IF NOT EXISTS idx_societies_admin_id
  ON public.societies(admin_id);

-- 5. RLS: allow any authenticated user to INSERT a society (pending)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'societies' AND policyname = 'resident_register_society'
  ) THEN
    CREATE POLICY resident_register_society
      ON public.societies
      FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 6. RLS: only the admin or a LocalSetu moderator can UPDATE their society
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'societies' AND policyname = 'admin_update_own_society'
  ) THEN
    CREATE POLICY admin_update_own_society
      ON public.societies
      FOR UPDATE
      USING (admin_id = auth.uid())
      WITH CHECK (admin_id = auth.uid());
  END IF;
END $$;
