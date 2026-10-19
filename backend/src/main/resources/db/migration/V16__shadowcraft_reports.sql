-- Member reports on public builds and comments, reviewed by the administrator.
-- target_key is 'build:<id>' or 'comment:<id>' so one member can report a target only once.
CREATE TABLE shadowcraft_reports (
 id VARCHAR(36) PRIMARY KEY,
 target_key VARCHAR(80) NOT NULL,
 build_id VARCHAR(36) NOT NULL REFERENCES shadowcraft_public_builds(id) ON DELETE CASCADE,
 comment_id VARCHAR(36) REFERENCES shadowcraft_build_comments(id) ON DELETE CASCADE,
 reporter_id VARCHAR(36) NOT NULL REFERENCES shadowcraft_members(id) ON DELETE CASCADE,
 reason VARCHAR(16) NOT NULL,
 detail VARCHAR(300) NOT NULL DEFAULT '',
 created_at TIMESTAMP WITH TIME ZONE NOT NULL,
 resolved_at TIMESTAMP WITH TIME ZONE,
 UNIQUE (target_key, reporter_id)
);
CREATE INDEX idx_shadowcraft_reports_open ON shadowcraft_reports(resolved_at, created_at);
