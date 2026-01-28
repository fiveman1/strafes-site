import { RowDataPacket } from "mysql2";
import { getPool } from "./globals.js";
import { Game, Map as StrafesMap } from "./interfaces.js";
import { tryGetMaps, tryGetRequest } from "./requests.js";

interface MapSQL {
    map_id: string
    name: string
    creator: string
    game: Game
    date: string
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

async function getMapFromDB(mapId: string | number): Promise<StrafesMap | undefined> {
    const pool = getPool();
    if (!pool) {
        return undefined;;
    }

    const query = `SELECT * FROM maps WHERE map_id = ?;`;
    const values = [mapId];
    const [[row]] = await pool.query<MapSQLRow[]>(query, values);

    if (!row) {
        return undefined;
    }

    return {
        id: +row.map_id,
        name: row.name,
        creator: row.creator,
        game: row.game,
        date: new Date(row.date).toISOString(), // ISO strings for consistency
        modes: row.modes,
        loadCount: row.load_count,
        smallThumb: row.small_thumb ?? undefined,
        largeThumb: row.large_thumb ?? undefined
    };
}

export async function getMap(mapId: string | number): Promise<StrafesMap | undefined> {
    const dbMap = await getMapFromDB(mapId);
    if (dbMap) {
        return dbMap;
    }

    const res = await tryGetMaps(`map/${mapId}`);
    if (!res) {
        return undefined;
    }

    const map = res.data.data;
    return {
        id: map.id,
        name: map.display_name,
        creator: map.creator,
        game: map.game_id,
        date: map.date,
        loadCount: map.load_count,
        modes: map.modes
    };
}

async function getAllMapsFromDB() {
    const pool = getPool();
    if (!pool) {
        return [];
    }

    const query = `SELECT * FROM maps;`;
    const [rows] = await pool.query<MapSQLRow[]>(query);

    const maps: StrafesMap[] = [];

    for (const row of rows) {
        maps.push({
            id: +row.map_id,
            name: row.name,
            creator: row.creator,
            game: row.game,
            date: new Date(row.date).toISOString(), // ISO strings for consistency
            modes: row.modes,
            loadCount: row.load_count,
            smallThumb: row.small_thumb ?? undefined,
            largeThumb: row.large_thumb ?? undefined
        });
    }

    return maps;
}

export async function getAllMaps() {
    const dbMaps = await getAllMapsFromDB();
    if (dbMaps) {
        return dbMaps;
    }

    // Fallback to loading it from API
    let i = 1;
    const maps: StrafesMap[] = [];
    while (true) {
        const mapRes = await tryGetMaps("map", {
            page_number: i,
            page_size: 100
        });

        ++i;

        if (!mapRes) {
            return [];
        }

        const data = mapRes.data.data as any[];
        if (data.length < 1) {
            break;
        }

        const assetToThumb = new Map<number, Map<string, string>>();
        const assetIds: number[] = [];
        for (const map of data) {
            if (map.thumbnail) {
                assetIds.push(map.thumbnail);
            }
        }

        const largeReqPromise = tryGetRequest("https://thumbnails.roproxy.com/v1/assets", {
            "assetIds": assetIds,
            "size": "420x420",
            "format": "Webp"
        });
        
        const smallReqPromise = tryGetRequest("https://thumbnails.roproxy.com/v1/assets", {
            "assetIds": assetIds,
            "size": "75x75",
            "format": "Webp"
        });

        const largeReq = await largeReqPromise;
        const smallReq = await smallReqPromise;

        if (largeReq) {
            for (const assetInfo of largeReq.data.data) {
                const targetId = assetInfo.targetId;
                const url = assetInfo.imageUrl;
                assetToThumb.set(targetId, new Map<string, string>([["large", url]]));
            }
        }

        if (smallReq) {
            for (const assetInfo of smallReq.data.data) {
                const targetId = assetInfo.targetId;
                const url = assetInfo.imageUrl;
                const urlMap = assetToThumb.get(targetId);
                if (urlMap) {
                    urlMap.set("small", url);
                }
                else {
                    assetToThumb.set(targetId, new Map<string, string>([["small", url]]));
                }
            }
        }

        for (const map of data) {
            let small, large;
            if (map.thumbnail) {
                const urls = assetToThumb.get(map.thumbnail);
                small = urls?.get("small");
                large = urls?.get("large");
            }
            
            maps.push({
                id: map.id,
                name: map.display_name,
                creator: map.creator,
                game: map.game_id,
                date: map.date,
                smallThumb: small,
                largeThumb: large,
                loadCount: map.load_count,
                modes: map.modes
            });
        }

        if (data.length < 100) {
            break;
        }
    }

    return maps;
}