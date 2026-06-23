-- ============================================================
-- LocalSetu — Full feed re-seed (wipe + ready for seed_live_feed.sql)
-- Keeps: profiles, societies, society_posts, society_members
-- Clears: posts, replies, confirmations, quotes, providers
-- ============================================================

BEGIN;

DELETE FROM public.quotes;
DELETE FROM public.post_confirmations;
DELETE FROM public.replies;
DELETE FROM public.post_boosts;
DELETE FROM public.saved_posts;
DELETE FROM public.reports;
DELETE FROM public.posts;
DELETE FROM public.providers;

COMMIT;

NOTIFY pgrst, 'reload schema';
