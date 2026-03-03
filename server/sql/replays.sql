CREATE TABLE replay_views (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    time_id BIGINT NOT NULL,
    user_id BIGINT,
    viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARBINARY(16) NOT NULL,
    INDEX view_log_idx (time_id, viewed_at, ip_address),
    INDEX recent_user_views_idx (user_id, viewed_at DESC)
);