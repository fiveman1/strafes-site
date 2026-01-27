import mysql, { RowDataPacket } from "mysql2/promise";
import { Game, LeaderboardSortBy, Style } from "./interfaces.js";

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

const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
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