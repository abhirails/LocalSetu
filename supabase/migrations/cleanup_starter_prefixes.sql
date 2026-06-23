-- Remove legacy starter-prefix posts and society notices from early seeds.
-- Safe to re-run.

DELETE FROM public.posts
WHERE content LIKE 'Starter update:%'
   OR content LIKE 'Starter notice:%'
   OR content LIKE 'Community starter:%'
   OR content LIKE 'Need to purchase:%'
   OR content LIKE 'Need help finding%';

UPDATE public.society_posts
SET
  title = REPLACE(title, 'Starter notice: ', ''),
  body  = REPLACE(body, 'Community starter: ', ''),
  content = REPLACE(COALESCE(content, body), 'Community starter: ', '')
WHERE title LIKE 'Starter notice:%'
   OR body LIKE 'Community starter:%'
   OR content LIKE 'Community starter:%';

NOTIFY pgrst, 'reload schema';
