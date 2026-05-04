-- V7: Consolidate paired -en / -ko posts into a single post per article.
-- Background: GitHubSyncService treated *.en.md and *.ko.md as separate posts,
-- producing 30 rows (15 EN + 15 KO) with slugs like "01-why-agentic-engineering-en"
-- and "01-why-agentic-engineering-ko". This migration merges each pair into
-- one post that uses the V5-introduced title_ko / content_ko / excerpt_ko columns.

-- Step 1: copy Korean fields onto the matching English post.
UPDATE posts en
SET title_ko   = ko.title,
    content_ko = ko.content,
    excerpt_ko = ko.excerpt
FROM posts ko
WHERE en.slug LIKE '%-en'
  AND ko.slug = REGEXP_REPLACE(en.slug, '-en$', '-ko');

-- Step 2: drop the now-redundant Korean rows.
DELETE FROM posts WHERE slug LIKE '%-ko';

-- Step 3: strip the -en suffix so URLs become clean (one URL per article).
UPDATE posts SET slug = REGEXP_REPLACE(slug, '-en$', '') WHERE slug LIKE '%-en';
