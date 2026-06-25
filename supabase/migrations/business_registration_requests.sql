-- Local shop/business registration requests with manual platform admin approval.

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS open_hours TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.business_registration_requests (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name  TEXT NOT NULL,
  category       TEXT NOT NULL,
  city           TEXT,
  locality       TEXT NOT NULL,
  landmark       TEXT,
  contact_phone  TEXT,
  whatsapp       TEXT,
  open_hours     TEXT,
  description    TEXT,
  proof_note     TEXT,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected')),
  business_id    UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  reviewed_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at    TIMESTAMPTZ,
  admin_note     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_registration_requests_status
  ON public.business_registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_business_registration_requests_user
  ON public.business_registration_requests(requested_by);

ALTER TABLE public.business_registration_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all businesses" ON public.businesses;
DROP POLICY IF EXISTS "Owners can insert their business" ON public.businesses;
DROP POLICY IF EXISTS "Owners can update their business" ON public.businesses;

CREATE POLICY "Admins can update profiles"
  ON public.profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage all businesses"
  ON public.businesses
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Owners can insert their business"
  ON public.businesses
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id AND is_verified = false);

CREATE POLICY "Owners can update their business"
  ON public.businesses
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id AND is_verified = false);

DROP POLICY IF EXISTS "Users can create business registration requests" ON public.business_registration_requests;
DROP POLICY IF EXISTS "Users can view own business registration requests" ON public.business_registration_requests;
DROP POLICY IF EXISTS "Admins can view business registration requests" ON public.business_registration_requests;
DROP POLICY IF EXISTS "Admins can update business registration requests" ON public.business_registration_requests;

CREATE POLICY "Users can create business registration requests"
  ON public.business_registration_requests
  FOR INSERT
  WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Users can view own business registration requests"
  ON public.business_registration_requests
  FOR SELECT
  USING (auth.uid() = requested_by);

CREATE POLICY "Admins can view business registration requests"
  ON public.business_registration_requests
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update business registration requests"
  ON public.business_registration_requests
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
