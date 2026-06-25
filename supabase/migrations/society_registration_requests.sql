-- Society registration requests with manual platform admin approval.

ALTER TABLE public.societies
  ADD COLUMN IF NOT EXISTS sector TEXT,
  ADD COLUMN IF NOT EXISTS landmark TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS rules TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS public_contact TEXT,
  ADD COLUMN IF NOT EXISTS total_flats INTEGER;

ALTER TABLE public.society_members
  ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.society_registration_requests (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  society_name   TEXT NOT NULL,
  city           TEXT,
  locality       TEXT NOT NULL,
  sector         TEXT,
  landmark       TEXT,
  total_flats    INTEGER CHECK (total_flats IS NULL OR total_flats > 0),
  requester_role TEXT NOT NULL
                   CHECK (requester_role IN ('resident','committee','secretary','chairman','manager','other')),
  contact_phone  TEXT,
  proof_note     TEXT,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected')),
  society_id     UUID REFERENCES public.societies(id) ON DELETE SET NULL,
  reviewed_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at    TIMESTAMPTZ,
  admin_note     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_society_registration_requests_status
  ON public.society_registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_society_registration_requests_user
  ON public.society_registration_requests(requested_by);

ALTER TABLE public.society_registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.society_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Platform admins can manage societies" ON public.societies;
DROP POLICY IF EXISTS "Admins can insert society members" ON public.society_members;

CREATE POLICY "Admins can update profiles"
  ON public.profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Platform admins can manage societies"
  ON public.societies
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can insert society members"
  ON public.society_members
  FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can create society registration requests" ON public.society_registration_requests;
DROP POLICY IF EXISTS "Users can view own society registration requests" ON public.society_registration_requests;
DROP POLICY IF EXISTS "Admins can view society registration requests" ON public.society_registration_requests;
DROP POLICY IF EXISTS "Admins can update society registration requests" ON public.society_registration_requests;

CREATE POLICY "Users can create society registration requests"
  ON public.society_registration_requests
  FOR INSERT
  WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Users can view own society registration requests"
  ON public.society_registration_requests
  FOR SELECT
  USING (auth.uid() = requested_by);

CREATE POLICY "Admins can view society registration requests"
  ON public.society_registration_requests
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update society registration requests"
  ON public.society_registration_requests
  FOR UPDATE
  USING (public.is_admin());
