import { RowDataPacket } from "mysql2";
import { getPool } from "./globals.js";
import { Game, Map as StrafesMap } from "shared";

interface MapSQL {
    map_id: string
    name: string
    creator: string
    game: Game
    date: Date
    created_at: string
    updated_at: string
    submitter: string
    small_thumb: string | null
    large_thumb: string | null
    asset_version: string
    load_count: number
    modes: number
}

type MapSQLRow = MapSQL & RowDataPacket;

export async function getMap(mapId: string | number): Promise<StrafesMap | undefined> {
    const pool = getPool();
    if (!pool) {
        return undefined;
    }

    const query = `SELECT * FROM maps WHERE map_id = ?;`;
    const values = [mapId];
    const [[row]] = await pool.query<MapSQLRow[]>(query, values);

    if (!row) {
        return undefined;
    }

    return rowToMap(row);
}

export async function getAllMaps() {
    const pool = getPool();
    if (!pool) {
        return [];
    }

    const query = `SELECT * FROM maps;`;
    const [rows] = await pool.query<MapSQLRow[]>(query);

    return rows.map(rowToMap);
}

function rowToMap(row: MapSQLRow): StrafesMap {
    return {
        id: +row.map_id,
        name: row.name,
        creator: row.creator,
        game: row.game,
        date: row.date.toISOString(), // ISO strings for consistency
        modes: row.modes,
        loadCount: row.load_count,
        smallThumb: row.small_thumb ?? undefined,
        largeThumb: row.large_thumb ?? undefined
    };
}