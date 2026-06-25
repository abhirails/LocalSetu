-- ============================================================
-- LocalSetu — Prevent duplicate replies (cleanup + constraints)
-- Safe to re-run.
-- ============================================================

-- Hide duplicate quick replies (keep oldest per user/post/type)
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY post_id, user_id, reply_type
      ORDER BY created_at ASC
    ) AS rn
  FROM public.replies
  WHERE reply_type IN ('still_happening', 'i_can_help', 'i_know_someone')
    AND is_hidden = false
)
UPDATE public.replies r
SET is_hidden = true
FROM ranked x
WHERE r.id = x.id
  AND x.rn > 1;

-- Hide exact duplicate custom replies (keep oldest)
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY post_id, user_id, lower(trim(content))
      ORDER BY created_at ASC
    ) AS rn
  FROM public.replies
  WHERE reply_type = 'custom'
    AND is_hidden = false
)
UPDATE public.replies r
SET is_hidden = true
FROM ranked x
WHERE r.id = x.id
  AND x.rn > 1;

-- One visible quick reply per user per post per type
DROP INDEX IF EXISTS public.uniq_quick_reply_per_user_post;
CREATE UNIQUE INDEX uniq_quick_reply_per_user_post
ON public.replies (post_id, user_id, reply_type)
WHERE reply_type IN ('still_happening', 'i_can_help', 'i_know_someone')
  AND is_hidden = false;

-- One visible exact custom reply per user per post
DROP INDEX IF EXISTS public.uniq_custom_reply_exact_per_user_post;
CREATE UNIQUE INDEX uniq_custom_reply_exact_per_user_post
ON public.replies (post_id, user_id, lower(trim(content)))
WHERE reply_type = 'custom'
  AND is_hidden = false;

NOTIFY pgrst, 'reload schema';
