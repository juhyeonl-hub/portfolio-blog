-- V10: Shared leaderboard for Block X Flight single mode

CREATE TABLE block_x_flight_scores (
    id BIGSERIAL PRIMARY KEY,
    player_name VARCHAR(18) NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0),
    lines INTEGER NOT NULL CHECK (lines >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_block_x_flight_scores_rank
    ON block_x_flight_scores (score DESC, created_at ASC);
