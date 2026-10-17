CREATE TABLE shadowcraft_members (
 id VARCHAR(36) PRIMARY KEY,
 username VARCHAR(32) NOT NULL UNIQUE,
 password_hash VARCHAR(100) NOT NULL,
 created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE TABLE shadowcraft_member_sessions (
 token_hash VARCHAR(64) PRIMARY KEY,
 member_id VARCHAR(36) NOT NULL REFERENCES shadowcraft_members(id) ON DELETE CASCADE,
 expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_shadowcraft_session_expiry ON shadowcraft_member_sessions(expires_at);
ALTER TABLE shadowcraft_public_builds ADD COLUMN author_id VARCHAR(36) REFERENCES shadowcraft_members(id);
CREATE INDEX idx_shadowcraft_build_author ON shadowcraft_public_builds(author_id);
CREATE TABLE shadowcraft_build_votes (
 build_id VARCHAR(36) NOT NULL REFERENCES shadowcraft_public_builds(id) ON DELETE CASCADE,
 member_id VARCHAR(36) NOT NULL REFERENCES shadowcraft_members(id) ON DELETE CASCADE,
 PRIMARY KEY(build_id,member_id)
);
CREATE TABLE shadowcraft_build_comments (
 id VARCHAR(36) PRIMARY KEY,
 build_id VARCHAR(36) NOT NULL REFERENCES shadowcraft_public_builds(id) ON DELETE CASCADE,
 member_id VARCHAR(36) NOT NULL REFERENCES shadowcraft_members(id) ON DELETE CASCADE,
 body VARCHAR(1000) NOT NULL,
 created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_shadowcraft_comment_build ON shadowcraft_build_comments(build_id,created_at,id);
