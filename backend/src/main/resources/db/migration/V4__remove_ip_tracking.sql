-- V4: Drop ip_address column from page_views for GDPR compliance.
-- Session tracking relies on session_id + user_agent + referer only.
-- Dropping the column also removes all previously collected IP data.

ALTER TABLE page_views DROP COLUMN ip_address;
