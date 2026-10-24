CREATE TABLE shadowcraft_account_settings (
 member_id VARCHAR(36) PRIMARY KEY REFERENCES shadowcraft_members(id) ON DELETE CASCADE,
 schema_version INTEGER NOT NULL,
 revision BIGINT NOT NULL,
 payload TEXT NOT NULL,
 updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
