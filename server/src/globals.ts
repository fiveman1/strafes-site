import mysql, { RowDataPacket } from "mysql2/promise";
import { Game, LeaderboardCount, Style } from "./interfaces.js";

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
    total_count: string
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

export async function getMapWR(mapId: string, game: Game, style: Style, course: number): Promise<Record | undefined> {
    if (!pool) {
        return undefined;
    }
    const query = "SELECT * FROM globals WHERE map_id = ? AND game = ? AND style = ? AND course = ?;";
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

    let query = "SELECT * FROM globals WHERE user_id = ?";
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

export async function getWRLeaderboardPage(start: number, end: number, game: Game, style: Style): Promise<{ total: number; data: GlobalCountSQL[]; }> {
    if (!pool) {
        return {
            total: 0,
            data: []
        };
    }

    let query = "SELECT COUNT(time_id) as count, user_id as userId, username, COUNT(user_id) OVER() as total_count FROM globals WHERE course = 0";
    const values : any[] = [];
    
    if (game !== Game.all) {
        query += " AND game = ?";
        values.push(game);
    }
   
    if (style !== Style.all) {
        query += " AND style = ?";
        values.push(style);
    }

    values.push(end - start + 1);
    values.push(start);
    query += " GROUP BY user_id, username ORDER BY count DESC LIMIT ? OFFSET ?;";

    const [globalCounts] = await pool.query<GlobalCountRow[]>(query, values);
    
    if (!globalCounts) {
        return {
            total: 0,
            data: []
        };
    }

    const total = globalCounts.length === 0 ? 0 : globalCounts[0].total_count;
    return {
        total: +total,
        data: globalCounts
    };
}