-- Independent planner snapshots. Existing blog content and personal plans are untouched.
CREATE TABLE shadowcraft_catalogs (
    class_key VARCHAR(32) PRIMARY KEY,
    payload TEXT NOT NULL
);
