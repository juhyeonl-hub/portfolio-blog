CREATE TABLE shadowcraft_public_builds (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(80) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    class_key VARCHAR(32) NOT NULL,
    catalog_version VARCHAR(100) NOT NULL,
    payload TEXT NOT NULL,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    revision BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_shadowcraft_builds_public ON shadowcraft_public_builds(published, updated_at DESC, id);
