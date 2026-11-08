import memCache from "memory-cache";
import { CommentRun } from "shared";
import { GlobalsClient } from "./globals.js";
import { Time as ApiTime } from "./strafes_api/generated/strafes.js";

// The facts about a time that comments and reactions need, kept in replay_runs so lists of them (the mod portal, the
// inbox) don't have to look each time up in the API. Everything but the run itself stays the same for a time ID.

/** The run a time holds now, in the form it's stored. */
export function currentRunOf(time: { time: number, date: string }): CommentRun {
    // Whole seconds, since that's all a DATETIME keeps
    return {
        time: time.time,
        date: new Date(Math.floor(Date.parse(time.date) / 1000) * 1000).toISOString()
    };
}

// Times saved lately, and the run they were saved with, so a busy replay page doesn't write on every view
const recentlySaved: memCache.CacheClass<string, string> = new memCache.Cache();
const RECENTLY_SAVED_MS = 10 * 60 * 1000;

/**
 * Adds the time to replay_runs, or refreshes its run. An older copy of the time (from a cache, say) never replaces a
 * newer one that's already saved.
 */
export async function saveReplayRun(client: GlobalsClient, time: ApiTime) {
    const run = currentRunOf(time);
    if (recentlySaved.get(time.id) === `${run.time}:${run.date}`) {
        return;
    }

    // run_time_ms is set first, so it compares against run_date from before this update
    const query = `INSERT INTO replay_runs (time_id, runner_id, map_id, game, style, course, run_time_ms, run_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?) AS new
        ON DUPLICATE KEY UPDATE
            run_time_ms = IF(new.run_date >= replay_runs.run_date, new.run_time_ms, replay_runs.run_time_ms),
            run_date = GREATEST(replay_runs.run_date, new.run_date);`;
    await client.pool.execute(query, [
        time.id,
        time.user.id,
        time.map.id,
        time.game_id,
        time.style_id,
        time.mode_id,
        run.time,
        new Date(run.date)
    ]);
    recentlySaved.put(time.id, `${run.time}:${run.date}`, RECENTLY_SAVED_MS);
}
