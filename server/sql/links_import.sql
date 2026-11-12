-- Imports rbhopdog-verify's data into strafes_links. Safe to run more than once (do a trial run, then again at cutover).
--
-- On the old server, dump the two tables that matter (active_phrases is left behind, phrases are gone):
--   mysqldump --single-transaction discord_to_roblox discord_lookup api_keys > verify.sql
-- Then here:
--   mysql -e "CREATE DATABASE IF NOT EXISTS verify_import"
--   mysql verify_import < verify.sql
--   mysql < server/sql/links_import.sql
-- Once it's checked, verify_import can be dropped.

START TRANSACTION;

-- The legacy links are replaced wholesale, so anything unlinked on the old API since the last run goes too. Links
-- made through the site are kept, and win over an old link for the same Discord account.
DELETE FROM strafes_links.discord_links WHERE source = 'legacy';
INSERT IGNORE INTO strafes_links.discord_links (discord_id, roblox_id, source, api_key_id, linked_at)
    SELECT discord_id, roblox_id, 'legacy', NULL, NULL FROM verify_import.discord_lookup;

-- The old keys were stored as is. Hashing them here means they keep working without anyone getting a new one.
-- A key deleted on the old API after a trial run isn't removed here; revoke it with the keys script.
INSERT INTO strafes_links.api_keys (key_hash, owner_discord_id, name, permissions, created_at)
    SELECT SHA2(api_key, 256), discord_id, CONCAT('Imported key for ', discord_id), permissions, UTC_TIMESTAMP()
    FROM verify_import.api_keys AS old
    ON DUPLICATE KEY UPDATE permissions = old.permissions;

COMMIT;
