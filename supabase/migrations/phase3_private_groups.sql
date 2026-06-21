-- PHASE 3 MIGRATION — Private Resident Groups
-- Run in Supabase SQL Editor if upgrading an existing database

-- 1. Visibility tier on society_posts
ALTER TABLE public.society_posts
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'society', 'committee', 'admin'));

-- 2. Society members table
CREATE TABLE IF NOT EXISTS public.society_members (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  society_id    UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'resident'
                  CHECK (role IN ('resident', 'committee', 'admin')),
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at   TIMESTAMPTZ,
  reviewed_by   UUID REFERENCES public.profiles(id),
  UNIQUE(society_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_society_members_society ON public.society_members(society_id);
CREATE INDEX IF NOT EXISTS idx_society_members_user    ON public.society_members(user_id);
CREATE INDEX IF NOT EXISTS idx_society_members_status  ON public.society_members(status);

-- 3. RLS for society_members
ALTER TABLE public.society_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view society membership"
  ON public.society_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'society_admin' AND society_id = society_members.society_id
    )
  );

CREATE POLICY "Users can request to join society"
  ON public.society_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Society admin can review members"
  ON public.society_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'society_admin' AND society_id = society_members.society_id
    )
  );

-- 4. RLS for society_posts — members-only visibility gate
DROP POLICY IF EXISTS "Society posts visible to all" ON public.society_posts;
DROP POLICY IF EXISTS "Society posts visible to all when active" ON public.society_posts;

CREATE POLICY "Society posts visibility gate"
  ON public.society_posts FOR SELECT
  USING (
    visibility = 'public'
    OR (
      visibility = 'society'
      AND EXISTS (
        SELECT 1 FROM public.society_members
        WHERE society_id = society_posts.society_id
          AND user_id = auth.uid()
          AND status = 'approved'
      )
    )
    OR (
      visibility IN ('committee', 'admin')
      AND EXISTS (
        SELECT 1 FROM public.society_members
        WHERE society_id = society_posts.society_id
          AND user_id = auth.uid()
          AND status = 'approved'
          AND role IN ('committee', 'admin')
      )
    )
  );
