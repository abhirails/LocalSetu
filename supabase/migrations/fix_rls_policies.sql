-- Fix missing RLS policies (run_all_pending enabled RLS without policies on some tables)

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_society_member(p_society_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.society_members
    WHERE society_id = p_society_id
      AND user_id = auth.uid()
      AND status = 'approved'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_society_admin(p_society_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'society_admin'
      AND society_id = p_society_id
  )
  OR EXISTS (
    SELECT 1 FROM public.society_members
    WHERE society_id = p_society_id
      AND user_id = auth.uid()
      AND role IN ('admin','committee')
      AND status = 'approved'
  )
  OR EXISTS (
    SELECT 1 FROM public.societies
    WHERE id = p_society_id
      AND (admin_id = auth.uid() OR admin_user_id = auth.uid())
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Societies
DROP POLICY IF EXISTS "Verified societies visible to all" ON public.societies;
DROP POLICY IF EXISTS "Society admins can update society" ON public.societies;
DROP POLICY IF EXISTS "Platform admins can manage societies" ON public.societies;

CREATE POLICY "Verified societies visible to all" ON public.societies
  FOR SELECT USING (
    is_verified = true
    OR admin_id = auth.uid()
    OR admin_user_id = auth.uid()
    OR public.is_society_member(id)
    OR public.is_admin()
  );

CREATE POLICY "Society admins can update society" ON public.societies
  FOR UPDATE USING (admin_id = auth.uid() OR admin_user_id = auth.uid() OR public.is_society_admin(id));

CREATE POLICY "Platform admins can manage societies" ON public.societies
  FOR ALL USING (public.is_admin());

-- Society posts (support author_id / user_id / posted_by)
DROP POLICY IF EXISTS "Society posts visible by visibility" ON public.society_posts;
DROP POLICY IF EXISTS "Society admins can create posts" ON public.society_posts;
DROP POLICY IF EXISTS "Society admins can update posts" ON public.society_posts;
DROP POLICY IF EXISTS "Society admins can delete posts" ON public.society_posts;

CREATE POLICY "Society posts visible by visibility" ON public.society_posts
  FOR SELECT USING (
    visibility = 'public'
    OR public.is_society_member(society_id)
    OR public.is_society_admin(society_id)
    OR public.is_admin()
  );

CREATE POLICY "Society admins can create posts" ON public.society_posts
  FOR INSERT WITH CHECK (
    (auth.uid() = COALESCE(author_id, posted_by))
    AND (public.is_society_admin(society_id) OR public.is_admin())
  );

CREATE POLICY "Society admins can update posts" ON public.society_posts
  FOR UPDATE USING (public.is_society_admin(society_id) OR public.is_admin());

CREATE POLICY "Society admins can delete posts" ON public.society_posts
  FOR DELETE USING (public.is_society_admin(society_id) OR public.is_admin());

-- Society members
DROP POLICY IF EXISTS "Users can view own membership" ON public.society_members;
DROP POLICY IF EXISTS "Approved society members visible to society" ON public.society_members;
DROP POLICY IF EXISTS "Users can request membership" ON public.society_members;
DROP POLICY IF EXISTS "Society admins can manage members" ON public.society_members;

CREATE POLICY "Users can view own membership" ON public.society_members
  FOR SELECT USING (auth.uid() = user_id OR public.is_society_admin(society_id) OR public.is_admin());

CREATE POLICY "Approved society members visible to society" ON public.society_members
  FOR SELECT USING (status = 'approved' AND public.is_society_member(society_id));

CREATE POLICY "Users can request membership" ON public.society_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Society admins can manage members" ON public.society_members
  FOR UPDATE USING (public.is_society_admin(society_id) OR public.is_admin());

-- Businesses
DROP POLICY IF EXISTS "Anyone can view verified businesses" ON public.businesses;
DROP POLICY IF EXISTS "Business owners can manage own listing" ON public.businesses;
DROP POLICY IF EXISTS "Admins can manage all businesses" ON public.businesses;

CREATE POLICY "Anyone can view verified businesses" ON public.businesses
  FOR SELECT USING (is_verified = true OR owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "Business owners can manage own listing" ON public.businesses
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Admins can manage all businesses" ON public.businesses
  FOR ALL USING (public.is_admin());

NOTIFY pgrst, 'reload schema';
