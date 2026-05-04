-- V8: Restore each post's created_at to the date it was first committed to git,
-- so the journal listing (sorted by created_at DESC) reflects authoring order
-- rather than the recent webhook-resync ordering.
--
-- Posts 01-10 were committed together (2026-04-17 18:53:48 UTC), so they're
-- spread one minute apart in slug order to make their relative ordering stable.

UPDATE posts SET created_at = TIMESTAMP '2026-04-17 18:53:48' WHERE slug = '01-why-agentic-engineering';
UPDATE posts SET created_at = TIMESTAMP '2026-04-17 18:54:48' WHERE slug = '02-c-memory-model';
UPDATE posts SET created_at = TIMESTAMP '2026-04-17 18:55:48' WHERE slug = '03-algorithm-constraints';
UPDATE posts SET created_at = TIMESTAMP '2026-04-17 18:56:48' WHERE slug = '04-unix-process-model';
UPDATE posts SET created_at = TIMESTAMP '2026-04-17 18:57:48' WHERE slug = '05-deadlock-prevention';
UPDATE posts SET created_at = TIMESTAMP '2026-04-17 18:58:48' WHERE slug = '06-tokenizer-parser';
UPDATE posts SET created_at = TIMESTAMP '2026-04-17 18:59:48' WHERE slug = '07-cpp-vtable';
UPDATE posts SET created_at = TIMESTAMP '2026-04-17 19:00:48' WHERE slug = '08-onboarding-strategy';
UPDATE posts SET created_at = TIMESTAMP '2026-04-17 19:01:48' WHERE slug = '09-ai-first-workflow';
UPDATE posts SET created_at = TIMESTAMP '2026-04-17 19:02:48' WHERE slug = '10-agentic-engineering';
UPDATE posts SET created_at = TIMESTAMP '2026-04-18 17:17:54' WHERE slug = '11-agentic-engineering-part1';
UPDATE posts SET created_at = TIMESTAMP '2026-04-22 19:00:57' WHERE slug = '12-agentic-engineering-part2';
UPDATE posts SET created_at = TIMESTAMP '2026-04-28 15:53:00' WHERE slug = '13-treating-ai-as-collaborator';
UPDATE posts SET created_at = TIMESTAMP '2026-04-30 12:38:21' WHERE slug = '14-agentic-engineering-part3';
UPDATE posts SET created_at = TIMESTAMP '2026-05-04 18:29:16' WHERE slug = '15-agentic-engineering-part4';
