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
