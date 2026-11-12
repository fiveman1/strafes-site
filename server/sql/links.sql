-- Discord <-> Roblox account links, and the API keys for the public API that serves them. Lives in strafes_links.
-- Every time is UTC: DATETIME columns, written with UTC_TIMESTAMP() in SQL, or from JS Dates through a pool with
-- timezone "Z" (UTC), so mysql2 converts them as UTC instead of local time.

CREATE DATABASE IF NOT EXISTS strafes_links;
USE strafes_links;

CREATE TABLE api_keys (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    -- SHA-256 of the whole key. The keys are random, so a slow password hash wouldn't add anything.
    key_hash CHAR(64) NOT NULL,
    -- Who the key was made for
    owner_discord_id BIGINT UNSIGNED NOT NULL,
    -- Shown to users on the link page ("<name> wants to link...")
    name VARCHAR(100) NOT NULL,
    -- Bit flags: 1 = LOOKUP (Roblox -> Discord lookups), 2 = LINK (link requests and unlinking)
    permissions INT UNSIGNED NOT NULL DEFAULT 0,
    -- Where link.completed events are sent, signed with webhook_secret. Both unset for keys without a webhook.
    webhook_url VARCHAR(500) NULL,
    webhook_secret VARCHAR(100) NULL,
    created_at DATETIME NOT NULL,
    last_used_at DATETIME NULL,
    revoked_at DATETIME NULL,
    UNIQUE INDEX key_hash_idx (key_hash),
    INDEX owner_idx (owner_discord_id)
);

CREATE TABLE discord_links (
    -- A Discord account links to one Roblox account; a Roblox account can have many Discord accounts
    discord_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    roblox_id BIGINT UNSIGNED NOT NULL,
    -- legacy: imported from rbhopdog-verify (verified with a phrase), oauth: through a link request
    source ENUM('legacy', 'oauth') NOT NULL,
    -- The key whose link request made it. Unset for legacy links.
    api_key_id INT UNSIGNED NULL,
    -- Unset for legacy links, which didn't record it
    linked_at DATETIME NULL,
    INDEX roblox_idx (roblox_id)
);

CREATE TABLE link_requests (
    -- Public ID, for checking on the request and in webhook events
    id CHAR(36) NOT NULL PRIMARY KEY,
    -- SHA-256 of the token in the link the user opens. The token itself is never stored.
    token_hash CHAR(64) NOT NULL,
    api_key_id INT UNSIGNED NOT NULL,
    discord_id BIGINT UNSIGNED NOT NULL,
    -- Given by the bot, to show on the link page
    discord_username VARCHAR(64) NULL,
    discord_avatar_url VARCHAR(255) NULL,
    -- 'expired' is never stored: a pending request past expires_at is expired. 'cancelled' is when a newer request
    -- for the same Discord account (from the same key) replaced it.
    status ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    -- Set once completed
    completed_at DATETIME NULL,
    roblox_id BIGINT UNSIGNED NULL,
    roblox_username VARCHAR(64) NULL,
    -- What the Discord account was linked to before, if anything
    previous_roblox_id BIGINT UNSIGNED NULL,
    UNIQUE INDEX token_hash_idx (token_hash),
    INDEX discord_idx (discord_id, api_key_id, status),
    INDEX created_idx (created_at)
);
