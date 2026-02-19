CREATE TABLE tier_votes (
    id int NOT NULL AUTO_INCREMENT,
    tier tinyint unsigned NOT NULL,
    map_id bigint NOT NULL,
    user_id bigint NOT NULL,
    weight tinyint unsigned NOT NULL,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX map_voter_index (map_id, user_id),
    PRIMARY KEY (id)
);