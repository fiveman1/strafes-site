// Fills replay_runs for times that got comments or reactions before the table existed. Safe to run more than once:
// it only looks at times that aren't in the table yet.
//
// 1. Comments made before replay_runs still have the run facts on their own row, so those are copied straight over
//    (only while replay_comments still has the old columns).
// 2. Reactions never stored them, so each of those times is looked up in the API, one at a time, pausing whenever the
//    burst limit runs low.
//
// Run after building: yarn backfill-replay-runs

import { RowDataPacket } from "mysql2";
import { exit } from "process";
import { GlobalsClient } from "../globals.js";
import { saveReplayRun } from "../replayRuns.js";
import { fetchTimeByIdWithRateLimit } from "../strafes_api/api.js";

// Pause once the API's burst limit gets this low, and wait this long for it to reset
const MIN_BURST_REMAINING = 50;
const BURST_PAUSE_MS = 60 * 1000;
// Retries for a time whose lookup failed (not a 404) before giving up on it until the next run
const MAX_ATTEMPTS = 3;

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function copyFromComments(client: GlobalsClient) {
    const columnQuery = `SELECT COUNT(*) AS count FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'replay_comments' AND COLUMN_NAME = 'runner_id';`;
    const [[column]] = await client.pool.query<({ count: string } & RowDataPacket)[]>(columnQuery);
    if (+column.count === 0) {
        console.log("replay_comments no longer has the run columns, skipping the copy from comments");
        return;
    }

    // The newest run any comment saw for each time that's missing
    const query = `INSERT INTO replay_runs (time_id, runner_id, map_id, game, style, course, run_time_ms, run_date)
        SELECT time_id, runner_id, map_id, game, style, course, run_time_ms, run_date FROM (
            SELECT c.time_id, c.runner_id, c.map_id, c.game, c.style, c.course, c.run_time_ms, c.run_date,
                ROW_NUMBER() OVER (PARTITION BY c.time_id ORDER BY c.run_date DESC, c.id DESC) AS rn
            FROM replay_comments c
            LEFT JOIN replay_runs rr ON rr.time_id = c.time_id
            WHERE rr.time_id IS NULL AND c.runner_id IS NOT NULL
        ) newest
        WHERE rn = 1;`;
    const [result] = await client.pool.query(query);
    console.log(`Copied ${(result as { affectedRows: number }).affectedRows} times from comments`);
}

async function lookUpReactedTimes(client: GlobalsClient) {
    const query = `SELECT DISTINCT r.time_id FROM replay_reactions r
        LEFT JOIN replay_runs rr ON rr.time_id = r.time_id
        WHERE rr.time_id IS NULL;`;
    const [rows] = await client.pool.query<({ time_id: string } & RowDataPacket)[]>(query);
    console.log(`${rows.length} reacted times to look up`);

    let saved = 0;
    const missing: string[] = [];
    const failed: string[] = [];
    for (let i = 0; i < rows.length; ++i) {
        const timeId = rows[i].time_id;
        let attempts = 0;
        while (true) {
            ++attempts;
            const result = await fetchTimeByIdWithRateLimit(timeId);

            if (result.burstRemaining !== undefined && result.burstRemaining < MIN_BURST_REMAINING) {
                console.log(`Burst limit down to ${result.burstRemaining}, pausing for a minute`);
                await sleep(BURST_PAUSE_MS);
            }

            if (result.time) {
                await saveReplayRun(client, result.time);
                ++saved;
                break;
            }
            if (result.status === 404) {
                // The time was deleted. Its reactions stay, but there's nothing to save.
                missing.push(timeId);
                break;
            }
            if (result.status === 429) {
                console.log("Rate limited, pausing for a minute");
                await sleep(BURST_PAUSE_MS);
                continue; // Doesn't count as a failed attempt
            }
            if (attempts >= MAX_ATTEMPTS) {
                console.log(`Couldn't look up time ${timeId} (status ${result.status})`);
                failed.push(timeId);
                break;
            }
            await sleep(2000);
        }

        if ((i + 1) % 25 === 0) {
            console.log(`${i + 1}/${rows.length}`);
        }
    }

    console.log(`Saved ${saved} times from reactions`);
    if (missing.length > 0) {
        console.log(`${missing.length} times no longer exist: ${missing.join(", ")}`);
    }
    if (failed.length > 0) {
        console.log(`${failed.length} lookups failed, run this again to retry them: ${failed.join(", ")}`);
    }
}

async function main() {
    const user = process.env.STRAFES_DB_USER;
    const password = process.env.STRAFES_DB_PASSWORD;
    if (!user || !password) {
        console.error("Missing strafes global database user/password");
        exit(1);
    }

    const client = new GlobalsClient(user, password);
    try {
        await copyFromComments(client);
        await lookUpReactedTimes(client);
    }
    finally {
        await client.pool.end();
    }
}

// Exits on its own, since the caches' expiry timers would keep the process running
main().then(() => exit(0), (err) => {
    console.error(err);
    exit(1);
});
