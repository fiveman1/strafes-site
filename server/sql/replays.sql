CREATE TABLE replay_views (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    time_id BIGINT NOT NULL,
    user_id BIGINT,
    viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARBINARY(16) NOT NULL,
    INDEX view_log_idx (time_id, viewed_at DESC, ip_address),
    INDEX recent_user_views_idx (user_id, viewed_at DESC)
);

CREATE TABLE replay_reactions (
    time_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    reaction VARCHAR(16) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (time_id, user_id, reaction),
    INDEX time_reaction_idx (time_id, reaction),
    INDEX user_reactions_idx (user_id, created_at DESC)
);

-- The facts about a time with comments or reactions, so a list of them (the mod portal, the inbox) doesn't have to look
-- each time up in the API. Saved whenever one is commented on, reacted to, or opened on the replay page.
CREATE TABLE replay_runs (
    time_id BIGINT PRIMARY KEY,
    runner_id BIGINT NOT NULL,
    map_id BIGINT NOT NULL,
    -- SMALLINT, like the globals table: fly trials styles are in the 500s
    game SMALLINT NOT NULL,
    style SMALLINT NOT NULL,
    course SMALLINT NOT NULL,
    -- The newest run seen for the time, which is replaced in place when the runner beats it. DATETIME in UTC.
    run_time_ms INT UNSIGNED NOT NULL,
    run_date DATETIME NOT NULL,
    INDEX runner_idx (runner_id)
);
