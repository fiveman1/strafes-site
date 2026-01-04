import mysql, { RowDataPacket } from "mysql2/promise";
import { Game, Style } from "./interfaces.js";

export interface Record {
    time_id: string,
    user_id: string,
    map_id: string,
    game: number,
    style: number,
    course: number,
    date: string,
    time: number
}

type RecordRow = Record & RowDataPacket;

const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
if (!user || !password) {
    console.error("Missing database user or password");
    process.exit(1);
}

const pool = mysql.createPool({
    host: "localhost",
    user: user,
    password: password,
    database: "strafes_globals",
    timezone: "Z", // UTC
    dateStrings: true,
    supportBigNumbers: true,
    bigNumberStrings: true
});

export async function getMapWR(mapId: string, game: Game, style: Style, course: number): Promise<Record | undefined> {
    const query = "SELECT * FROM globals WHERE map_id = ? AND game = ? AND style = ? AND course = ?;";
    const [[record]] = await pool.query<RecordRow[]>(query, [mapId, game, style, course]);
    if (!record) {
        return undefined;
    }
    return record;
}