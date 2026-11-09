-- The inbox is worked out from comments, likes and reactions when it's asked for. This is all it stores: when each
-- user last opened it, so newer items show as unread.
CREATE TABLE inbox_seen (
    user_id BIGINT PRIMARY KEY,
    seen_at TIMESTAMP NOT NULL
);
