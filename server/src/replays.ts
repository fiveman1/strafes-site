import AsyncLock from "async-lock";
import memoize from "memoize";
import { Replay, Time } from "shared";
import { GlobalsClient } from "./globals.js";
import { RowDataPacket } from "mysql2";

export async function convertTimeToReplay(client: GlobalsClient, time: Time, compareTimeId: string | undefined): Promise<Replay> {
    const replay: Replay = {
        ...time,
        views: 0,
        compareTimeId: compareTimeId
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

const viewLock = new AsyncLock();
export async function logViewForReplay(client: GlobalsClient, replay: Replay, ipAddress: string, userId: number | undefined) {
    await viewLock.acquire(ipAddress, async () => {

        let query = `SELECT id FROM replay_views WHERE time_id = ? AND viewed_at >= NOW() - INTERVAL 5 MINUTE AND ip_address = INET6_ATON(?)`;
        const [veryRecentRows] = await client.pool.execute<RowDataPacket[]>(query, [replay.id, ipAddress]);
        if (veryRecentRows.length > 0) {

            return;
        }


        query = `SELECT id FROM replay_views WHERE time_id = ? AND viewed_at >= NOW() - INTERVAL 4 HOUR AND ip_address = INET6_ATON(?)`;
        const [recentHoursRows] = await client.pool.execute<RowDataPacket[]>(query, [replay.id, ipAddress]);
        if (recentHoursRows.length > 4) {

            return;
        }

        query = `INSERT INTO replay_views (time_id, user_id, ip_address) VALUES (?, ?, INET6_ATON(?));`;
        await client.pool.execute(query, [replay.id, userId ?? null, ipAddress]);
    });
}