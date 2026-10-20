-- Comments were removed from the build community (likes only, 2026-10-20). No comment had been posted in production.
ALTER TABLE shadowcraft_reports DROP COLUMN comment_id;
DROP TABLE shadowcraft_build_comments;
