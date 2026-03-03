import memoize from "memoize";
import { Replay, Time } from "shared";
import { GlobalsClient } from "./globals.js";
import { RowDataPacket } from "mysql2";

export async function convertTimeToReplay(client: GlobalsClient, time: Time): Promise<Replay> {
    const replay: Replay = {
        ...time,
        views: 0
    };

    await setViewsForReplay(client, replay);

    return replay;
}

async function setViewsForReplay(client: GlobalsClient, replay: Replay) {
    const views = await getViewsForTimeId(client, replay.id);
    replay.views = views;
}

interface CountSQL {
    count: string
}
type CountRow = CountSQL & RowDataPacket;

const getViewsForTimeId = memoize(getViewsForTimeIdCore, { cacheKey: (args) => args[1], maxAge: 5 * 60 * 1000 });
async function getViewsForTimeIdCore(client: GlobalsClient, timeId: string) {
    const query = `SELECT COUNT(*) as count FROM replay_views WHERE time_id = ?`;
    const [[row]] = await client.pool.execute<CountRow[]>(query, [timeId]);
    return +row.count;
}

export async function logViewForReplay(client: GlobalsClient, replay: Replay, ipAddress: string, userId: number | undefined) {
    // Check if this IP has viewed the replay in the last 5 minutes
    let query = `SELECT id FROM replay_views WHERE time_id = ? AND viewed_at >= NOW() - INTERVAL 5 MINUTE AND ip_address = INET6_ATON(?)`;
    const [veryRecentRows] = await client.pool.execute<RowDataPacket[]>(query, [replay.id, ipAddress]);
    if (veryRecentRows.length > 0) {
        // You've seen enough!
        return;
    }

    // Check if this IP has viewed the replay 5 times or more in the last 4 hours
    query = `SELECT id FROM replay_views WHERE time_id = ? AND viewed_at >= NOW() - INTERVAL 4 HOUR AND ip_address = INET6_ATON(?)`;
    const [recentHoursRows] = await client.pool.execute<RowDataPacket[]>(query, [replay.id, ipAddress]);
    if (recentHoursRows.length > 4) {
        // You've seen enough!
        return;
    }

    query = `INSERT INTO replay_views (time_id, user_id, ip_address) VALUES (?, ?, INET6_ATON(?));`;
    await client.pool.execute(query, [replay.id, userId ?? null, ipAddress]);
}