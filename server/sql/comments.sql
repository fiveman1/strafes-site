-- Comments on replays, and what moderators need to look after them. Lives in strafes_globals, next to the reactions.

CREATE TABLE replay_comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    time_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    -- One level of replies. A reply to a reply points at the top-level comment, and reply_to_user_id says who it answered.
    parent_id BIGINT NULL,
    reply_to_user_id BIGINT NULL,
    -- Seconds into the run; NULL for a comment about the run as a whole. Replies never have one.
    replay_seconds INT UNSIGNED NULL,
    -- The length limit is enforced by the server, so it can change without a migration
    body VARCHAR(1000) NOT NULL,
    status ENUM('visible', 'pending', 'hidden', 'deleted') NOT NULL DEFAULT 'visible',
    hidden_by ENUM('runner', 'moderator') NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status_changed_at TIMESTAMP NULL,

    -- The runner, map, etc. are in replay_runs (replays.sql). The run is replaced in place (same time_id) when the
    -- runner beats it, so these save the one the comment was made on, to tell whether the comment was
    -- about an earlier run. DATETIME in UTC, not TIMESTAMP, so the session time zone can't shift it around DST.
    run_time_ms INT UNSIGNED NOT NULL,
    run_date DATETIME NOT NULL,

    INDEX replay_comments_idx (time_id, status, created_at),
    INDEX parent_idx (parent_id),
    INDEX user_comments_idx (user_id, created_at DESC),
    -- For the inbox's replies to a user's replies
    INDEX reply_to_idx (reply_to_user_id, created_at),
    INDEX queue_idx (status, created_at)
);

CREATE TABLE replay_comment_likes (
    comment_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (comment_id, user_id),
    INDEX user_likes_idx (user_id)
);

CREATE TABLE replay_comment_reports (
    comment_id BIGINT NOT NULL,
    reporter_id BIGINT NOT NULL,
    reason ENUM('hate', 'harassment', 'spam', 'other') NOT NULL,
    note VARCHAR(200) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    resolved_by BIGINT NULL,
    PRIMARY KEY (comment_id, reporter_id),
    INDEX open_reports_idx (resolved_at, created_at)
);

-- Moderators granted on the site. The Roblox Bhoppers group's staff roles and the admins in COMMENT_ADMIN_IDS aren't stored here.
CREATE TABLE comment_moderators (
    user_id BIGINT PRIMARY KEY,
    role ENUM('moderator', 'admin') NOT NULL,
    granted_by BIGINT NOT NULL,
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Kept as history. A user's active ban is any row that isn't revoked or expired.
CREATE TABLE comment_bans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    reason VARCHAR(500) NOT NULL,
    banned_by BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL, -- NULL is permanent
    revoked_at TIMESTAMP NULL,
    revoked_by BIGINT NULL,
    INDEX user_bans_idx (user_id, created_at DESC)
);

CREATE TABLE comment_moderation_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_id BIGINT NOT NULL,
    action ENUM('hide', 'restore', 'approve', 'dismiss_reports', 'ban', 'unban', 'grant_mod', 'revoke_mod') NOT NULL,
    comment_id BIGINT NULL,
    target_user_id BIGINT NULL,
    reason VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX created_idx (created_at DESC),
    INDEX target_idx (target_user_id, created_at DESC)
);
