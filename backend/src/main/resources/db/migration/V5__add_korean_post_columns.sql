-- V5: Add Korean translation columns to posts
-- Nullable so existing rows remain valid; backfilled in V6.
ALTER TABLE posts ADD COLUMN title_ko VARCHAR(300);
ALTER TABLE posts ADD COLUMN content_ko TEXT;
ALTER TABLE posts ADD COLUMN excerpt_ko VARCHAR(500);
