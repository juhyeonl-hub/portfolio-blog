-- V3: Extend page_views with visitor tracking fields

ALTER TABLE page_views
    ADD COLUMN ip_address VARCHAR(45),
    ADD COLUMN user_agent VARCHAR(500),
    ADD COLUMN referer    VARCHAR(500),
    ADD COLUMN session_id VARCHAR(64);

CREATE INDEX idx_page_views_session_id ON page_views(session_id);
