import mysql, { RowDataPacket } from "mysql2/promise";
import { Game, LeaderboardSortBy, Style, Time, TimeSortBy } from "shared";

interface WithTotalCount {
    totalCount: string
}

export interface Record {
    time_id: string
    user_id: string
    username: string
    map_id: string
    map_name: string
    game: number
    style: number
    course: number
    date: Date
    time: number
}

type RecordRow = Record & RowDataPacket;

export interface GlobalCountSQL extends WithTotalCount {
    userId: string,
    username: string,
    count: string
}

type GlobalCountRow = GlobalCountSQL & RowDataPacket;

const user = process.env.STRAFES_DB_USER;
const password = process.env.STRAFES_DB_PASSWORD;
let pool: mysql.Pool | undefined = undefined;
if (user && password) {
    pool = mysql.createPool({
        host: "localhost",
        user: user,
        password: password,
        database: "strafes_globals",
        timezone: "Z", // UTC
        supportBigNumbers: true,
        bigNumberStrings: true
    });
}

export function getPool() {
    return pool;
}

export async function getMapWR(mapId: string, game: Game, style: Style, course: number): Promise<Time | undefined> {
    if (!pool) {
        return undefined;
    }
    
    const query = `SELECT globals.*, users.username, maps.name as map_name
        FROM globals 
        INNER JOIN users ON globals.user_id = users.user_id 
        INNER JOIN maps ON globals.map_id = maps.map_id
        WHERE globals.map_id = ? AND globals.game = ? AND globals.style = ? AND globals.course = ?
    ;`;
    const [[record]] = await pool.query<RecordRow[]>(query, [mapId, game, style, course]);
    
    if (!record) {
        return undefined;
    }
    
    return recordToTime(record);
}

// TODO: This is only being used to get total WR counts, replace this with something that just does that
export async function getUserWRs(userId: string, game: Game, style: Style, course?: number): Promise<Time[] | undefined> {
    if (!pool) {
        return undefined;
    }

    let query = `SELECT globals.*, users.username, maps.name as map_name 
    FROM globals 
    INNER JOIN users ON globals.user_id = users.user_id 
    INNER JOIN maps ON globals.map_id = maps.map_id
    WHERE globals.user_id = ?`;

    const values: any[] = [userId];

    if (game !== Game.all) {
        query += " AND globals.game = ?";
        values.push(game);
    }

    if (style !== Style.all) {
        query += " AND globals.style = ?";
        values.push(style);
    }

    if (course !== undefined && course >= 0) {
        query += " AND globals.course = ?";
        values.push(course);
    }

    query += ";";

    const [records] = await pool.query<RecordRow[]>(query, values);

    if (!records) {
        return undefined;
    }

    return records.map(recordToTime);
}

export async function getWRList(start: number, end: number, game: Game, style: Style, sort: TimeSortBy, course?: number, userId?: string): Promise<{ total: number; wrs: Time[]; }> {
    if (!pool) {
        return {
            total: 0,
            wrs: []
        };
    }

    let query = `SELECT globals.*, users.username, maps.name as map_name, COUNT(globals.time_id) OVER() as totalCount
    FROM globals 
    INNER JOIN users ON globals.user_id = users.user_id 
    INNER JOIN maps ON globals.map_id = maps.map_id`;

    const values = [];
    let whereClause = "";

    if (userId !== undefined) {
        whereClause += " AND globals.user_id = ?";
        values.push(userId);
    }

    if (game !== Game.all) {
        whereClause += " AND globals.game = ?";
        values.push(game);
    }

    if (style !== Style.all) {
        whereClause += " AND globals.style = ?";
        values.push(style);
    }

    if (course !== undefined && course >= 0) {
        whereClause += " AND globals.course = ?";
        values.push(course);
    }

    if (whereClause !== "") {
        query += " WHERE " + whereClause.slice(5); // Remove the first " AND "
    }

    query += " ORDER BY ";
    if (sort === TimeSortBy.DateAsc) {
        query += "date ASC";
    }
    else if (sort === TimeSortBy.DateDesc) {
        query += "date DESC";
    }
    else if (sort === TimeSortBy.TimeAsc) {
        query += "time ASC";
    }
    else if (sort === TimeSortBy.TimeDesc) {
        query += "time DESC";
    }

    query += ` LIMIT ? OFFSET ?;`;
    values.push(end - start + 1);
    values.push(start);

    const [records] = await pool.query<(RecordRow & WithTotalCount)[]>(query, values);

    if (!records) {
        return {
            total: 0,
            wrs: []
        };
    }

    const total = records.length === 0 ? 0 : +records[0].totalCount;
    return {
        total: total,
        wrs: records.map(recordToTime)
    };
}

function recordToTime(record: RecordRow): Time {
    return {
        map: record.map_name,
        mapId: +record.map_id,
        time: record.time,
        date: record.date.toISOString(),
        game: record.game,
        style: record.style,
        id: record.time_id,
        course: record.course,
        userId: record.user_id,
        username: record.username,
        placement: 1
    };
}

export async function getWRLeaderboardPage(start: number, end: number, game: Game, style: Style, sort: LeaderboardSortBy): Promise<{ total: number; data: GlobalCountSQL[]; }> {
    if (!pool) {
        return {
            total: 0,
            data: []
        };
    }

    let query = "SELECT COUNT(globals.time_id) as count, globals.user_id as userId, users.username, COUNT(globals.user_id) OVER() as totalCount FROM globals INNER JOIN users ON globals.user_id = users.user_id WHERE course = 0";
    const values: any[] = [];

    if (game !== Game.all) {
        query += " AND game = ?";
        values.push(game);
    }

    if (style !== Style.all) {
        query += " AND style = ?";
        values.push(style);
    }

    query += " GROUP BY globals.user_id ORDER BY ";
    let userDir = "ASC";
    if (sort === LeaderboardSortBy.MainAsc) {
        query += "count ASC";
        userDir = "DESC";
    }
    else {
        query += "count DESC";
    }

    query += `, username ${userDir} LIMIT ? OFFSET ?;`;
    values.push(end - start + 1);
    values.push(start);

    const [globalCounts] = await pool.query<GlobalCountRow[]>(query, values);

    if (!globalCounts) {
        return {
            total: 0,
            data: []
        };
    }

    const total = globalCounts.length === 0 ? 0 : globalCounts[0].totalCount;
    return {
        total: +total,
        data: globalCounts
    };
}

export async function updateWRs(wrs: Time[]) {
    if (!pool || wrs.length < 1) {
        return;
    }

    if (!(await wrsHaveMapsLoaded(wrs))) {
        // Don't want to cause a foreign key constraint not met error
        return;
    }

    const userIdSet = new Set<string>();
    const userRows = [];
    for (const wr of wrs) {
        if (userIdSet.has(wr.userId)) continue;
        userIdSet.add(wr.userId);
        userRows.push([wr.userId, wr.username]);
    }

    let query = `INSERT INTO users (user_id, username) VALUES ? AS new ON DUPLICATE KEY UPDATE username=new.username;`;
    await pool.query(query, [userRows]);

    const wrRows = wrs.map((record) => [
        record.id,
        record.userId,
        record.mapId,
        record.game,
        record.style,
        record.course,
        new Date(record.date),
        record.time
    ]);

    query = `INSERT INTO globals (time_id, user_id, map_id, game, style, course, date, time) 
        VALUES ? AS new 
        ON DUPLICATE KEY UPDATE
            time_id=new.time_id,
            user_id=new.user_id,
            map_id=new.map_id,
            game=new.game,
            style=new.style,
            course=new.course,
            date=new.date,
            time=new.time
    ;`;

    await pool.query(query, [wrRows]);
}

async function wrsHaveMapsLoaded(wrs: Time[]) {
    if (!pool || wrs.length < 1) {
        return false;
    }

    const mapIdSet = new Set<number>();
    const mapIds: number[] = [];
    for (const wr of wrs) {
        if (mapIdSet.has(wr.mapId)) continue;
        mapIdSet.add(wr.mapId);
        mapIds.push(wr.mapId);
    }

    const query = `SELECT map_id FROM maps WHERE map_id IN (?);`;
    const [rows] = await pool.query<RowDataPacket[]>(query, [mapIds]);
    return rows.length === mapIds.length;
}
