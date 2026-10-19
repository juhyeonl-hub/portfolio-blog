-- Optional Steam sign-in for community members. Only the 64-bit SteamID is stored.
CREATE TABLE shadowcraft_member_steam (
 steam_id VARCHAR(20) PRIMARY KEY,
 member_id VARCHAR(36) NOT NULL UNIQUE REFERENCES shadowcraft_members(id) ON DELETE CASCADE,
 linked_at TIMESTAMP WITH TIME ZONE NOT NULL
);
