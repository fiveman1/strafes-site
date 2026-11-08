-- Moves the run facts copied onto each comment (runner, map, game, style, course) into replay_runs, which reactions
-- share. In order, so the site keeps working the whole way through:
--   1. Run part 1, before deploying.
--   2. Deploy. The new code saves to replay_runs and stops writing the old columns.
--   3. yarn backfill-replay-runs (from server/), which copies the comments' runs over and looks up the reacted times.
--   4. Run part 2.

-- Part 1
CREATE TABLE replay_runs (
    time_id BIGINT PRIMARY KEY,
    runner_id BIGINT NOT NULL,
    map_id BIGINT NOT NULL,
    -- SMALLINT, like the globals table: fly trials styles are in the 500s
    game SMALLINT NOT NULL,
    style SMALLINT NOT NULL,
    course SMALLINT NOT NULL,
    run_time_ms INT UNSIGNED NOT NULL,
    run_date DATETIME NOT NULL,
    INDEX runner_idx (runner_id)
);

-- So the new code can insert comments without them
ALTER TABLE replay_comments
    MODIFY runner_id BIGINT NULL,
    MODIFY map_id BIGINT NULL,
    MODIFY game TINYINT NULL,
    MODIFY style TINYINT NULL,
    MODIFY course INT NULL;

-- Part 2, after the backfill
ALTER TABLE replay_comments
    DROP COLUMN runner_id,
    DROP COLUMN map_id,
    DROP COLUMN game,
    DROP COLUMN style,
    DROP COLUMN course;
