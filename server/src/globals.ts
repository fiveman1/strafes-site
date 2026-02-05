import mysql, { RowDataPacket } from "mysql2/promise";
import { Game, LeaderboardSortBy, Style, Time } from "shared";

export interface Record {
    time_id: string,
    user_id: string,
    username: string,
    map_id: string,
    game: number,
    style: number,
    course: number,
    date: string,
    time: number
}

type RecordRow = Record & RowDataPacket;

export interface GlobalCountSQL {
    userId: string,
    username: string,
    count: string
    totalCount: string
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
        dateStrings: true,
        supportBigNumbers: true,
        bigNumberStrings: true
    });
}

export function getPool() {
    return pool;
}

export async function getMapWR(mapId: string, game: Game, style: Style, course: number): Promise<Record | undefined> {
    if (!pool) {
        return undefined;
    }
    const query = "SELECT globals.*, users.username FROM globals INNER JOIN users ON globals.user_id = users.user_id WHERE map_id = ? AND game = ? AND style = ? AND course = ?;";
    const [[record]] = await pool.query<RecordRow[]>(query, [mapId, game, style, course]);
    if (!record) {
        return undefined;
    }
    return record;
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

export async function getUserWRs(userId: string, game: Game, style: Style): Promise<Record[] | undefined> {
    if (!pool) {
        return undefined;
    }

    let query = "SELECT globals.*, users.username FROM globals INNER JOIN users ON globals.user_id = users.user_id WHERE globals.user_id = ?";
    const values : any[] = [userId];
    
    if (game !== Game.all) {
        query += " AND game = ?";
        values.push(game);
    }
   
    if (style !== Style.all) {
        query += " AND style = ?";
        values.push(style);
    }
    
    query += ";";

    const [records] = await pool.query<RecordRow[]>(query, values);
    
    if (!records) {
        return undefined;
    }
   
    return records;
}

export async function getWRLeaderboardPage(start: number, end: number, game: Game, style: Style, sort: LeaderboardSortBy): Promise<{ total: number; data: GlobalCountSQL[]; }> {
    if (!pool) {
        return {
            total: 0,
            data: []
        };
    }

    let query = "SELECT COUNT(globals.time_id) as count, globals.user_id as userId, users.username, COUNT(globals.user_id) OVER() as totalCount FROM globals INNER JOIN users ON globals.user_id = users.user_id WHERE course = 0";
    const values : any[] = [];
    
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
    values.push(end - start + 1);
    values.push(start);
    query += `, username ${userDir} LIMIT ? OFFSET ?;`;

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