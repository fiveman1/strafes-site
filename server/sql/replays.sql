CREATE TABLE replay_views (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    time_id BIGINT NOT NULL,
    user_id BIGINT,
    viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARBINARY(16) NOT NULL,
    INDEX (time_id, viewed_at, ip_address)
);