import { Game, isEligibleForVoting, Map as StrafesMap, MapTierInfo, ModerationStatus, Style, TierVoteEligibility, StrafesUserRole } from "shared";
import { getTimes, lookupUserInfo } from "./strafes_api/api.js";
import { GlobalsClient } from "./globals.js";
import { RowDataPacket } from "mysql2";
import { loadUsersToStrafesRoles } from "./roles.js";
import { memoizeAsync } from "./util.js";

/** undefined if StrafesNET couldn't be reached, which isn't cached so it doesn't stick for hours. */
export const loadTierVotingEligibility = memoizeAsync(loadTierVotingEligibilityCore, { maxAge: 4 * 60 * 60 * 1000 });
async function loadTierVotingEligibilityCore(userId: number): Promise<TierVoteEligibility | undefined> {
    const [userInfo, bhopTimes, surfTimes] = await Promise.all([
        lookupUserInfo(userId),
        getTimes(userId, undefined, 1, 1, Game.bhop, Style.all, 0),
        getTimes(userId, undefined, 1, 1, Game.surf, Style.all, 0)
    ]);

    // Otherwise a failed request would look like 0 completions
    if (userInfo === undefined || !bhopTimes || !surfTimes) {
        return undefined;
    }

    return {
        // null if they've never joined the game
        moderationStatus: userInfo?.state_id ?? ModerationStatus.Default,
        bhopCompletions: bhopTimes.pagination.total_items,
        surfCompletions: surfTimes.pagination.total_items
    };
}

/** undefined if it couldn't be checked */
export async function canUserVoteOnMap(client: GlobalsClient, userId: number, mapId: number): Promise<boolean | undefined> {
    const info = await loadTierVotingEligibilityCore(userId);
    if (!info) {
        return undefined;
    }
    const map = await client.getMap(mapId);
    if (!map) {
        return false;
    }
    return isEligibleForVoting(info, map.game);
}

interface MapTierInfoSQL {
    id: number
    map_id: string
    user_id: string
    tier: number
    weight: number
    updated_at: string
}
type MapTierInfoRow = MapTierInfoSQL & RowDataPacket;

export async function getUserTierForMap(client: GlobalsClient, userId: number, mapId: number): Promise<MapTierInfo | undefined> {
    const query = `SELECT * FROM tier_votes WHERE user_id=? AND map_id=?;`;
    const values = [userId, mapId];

    const [[row]] = await client.pool.execute<MapTierInfoRow[]>(query, values);

    if (!row) {
        return undefined;
    }

    return {
        userId: userId,
        mapId: mapId,
        tier: row.tier,
        weight: row.weight,
        updatedAt: new Date(row.updated_at).toISOString()
    };
}

async function getVoteWeight(userId: number, map: StrafesMap): Promise<number> {
    // Waits for the roles (or throws) rather than guess, since the weight is saved with the vote
    const strafesRoles = await loadUsersToStrafesRoles();
    const role = strafesRoles.get(userId);
    if (role === StrafesUserRole.MapAdmin || role === StrafesUserRole.MapCouncil || role === StrafesUserRole.MapAccess) {
        return 10;
    }

    const times = await getTimes(userId, map.id, 20, 1, map.game, Style.all, 0);
    if (times) {
        // Not faste or low gravity
        const allowedStyles = new Set([Style.autohop, Style.scroll, Style.sideways, Style.hsw, Style.wonly, Style.aonly, Style.backwards]);
        for (const time of times.data) {
            if (allowedStyles.has(time.style_id)) {
                return 5; // Extra weight for people who have beaten the map
            }
        }
    }
    return 1;
}

/** Doesn't check if they can vote on the map, the caller does (see canUserVoteOnMap). */
export async function setUserTierForMap(client: GlobalsClient, userId: number, map: StrafesMap, tier: number | undefined): Promise<MapTierInfo | undefined> {
    if (tier === undefined) {
        const query = `DELETE FROM tier_votes WHERE user_id=? AND map_id=?;`;
        const values = [userId, map.id];
        await client.pool.execute(query, values);
        return undefined;
    }

    const weight = await getVoteWeight(userId, map);

    const query = `INSERT INTO tier_votes (tier, weight, user_id, map_id) VALUES (?, ?, ?, ?) AS new 
        ON DUPLICATE KEY UPDATE 
        tier=new.tier,
        weight=new.weight
    ;`;
    await client.pool.execute(query, [tier, weight, userId, map.id]);

    return {
        userId: userId,
        mapId: map.id,
        tier: tier,
        weight: weight,
        updatedAt: new Date().toISOString()
    };
}

interface CalcTierSQL {
    map_id: string
    weighted_tier: string
}
type CalcTierRow = CalcTierSQL & RowDataPacket;

export async function calcMapTiers(client: GlobalsClient): Promise<Map<number, number>> {
    const mapIdToTier = new Map<number, number>();

    // Calculates the weighted average for every map
    // Ignores outliers (more than 1 standard deviation)
    const query = `
        SELECT
            tier_votes.map_id,
            SUM(weight * tier) / SUM(weight) AS weighted_tier
        FROM
            tier_votes
        INNER JOIN
            (
                SELECT
                    map_id,
                    SUM(weight * tier) / SUM(weight) AS avg,
                    SQRT(
                        SUM(weight * POWER(tier, 2)) / SUM(weight) - POWER(SUM(weight * tier) / SUM(weight), 2)
                    ) AS std
                FROM
                    tier_votes
                GROUP BY
                    map_id
            ) stats
        ON
            tier_votes.map_id = stats.map_id
        WHERE
            ABS(tier - stats.avg) <= (1.5 * stats.std)
        GROUP BY
            tier_votes.map_id
    ;`;

    const [rows] = await client.pool.execute<CalcTierRow[]>(query);

    for (const row of rows) {
        mapIdToTier.set(+row.map_id, Math.round(+row.weighted_tier));
    }

    return mapIdToTier;
}

interface VotesSQL {
    map_id: string
    tier: number
    unweighted: string
    weighted: string
}
type VotesRow = VotesSQL & RowDataPacket;

export async function setMapVoteCounts(client: GlobalsClient, maps: StrafesMap[]) {
    const idToMap = new Map<number, StrafesMap>();
    for (const map of maps) {
        idToMap.set(map.id, map);
    }

    const query = `
        SELECT
            map_id,
            tier,
            COUNT(*) AS unweighted,
            SUM(weight) AS weighted
        FROM
            tier_votes
        GROUP BY
            map_id, tier
    ;`;
    const [rows] = await client.pool.execute<VotesRow[]>(query);

    for (const row of rows) {
        const map = idToMap.get(+row.map_id);
        if (!map) continue;
        const tier = row.tier;
        map.votes.unweighted[tier - 1] = +row.unweighted;
        map.votes.weighted[tier - 1] = +row.weighted;
    }
}

// The client is the only argument, and there's just the one. A failed load (it throws) isn't cached, and neither is an
// empty list, which only happens before the maps are first synced from StrafesNET.
export const getAllMapsWithTiers = memoizeAsync(getAllMapsWithTiersCore, {
    cacheKey: () => "maps",
    maxAge: 30 * 60 * 1000,
    shouldCache: (maps) => maps.length > 0
});
async function getAllMapsWithTiersCore(client: GlobalsClient): Promise<StrafesMap[]> {
    const maps = await client.getAllMaps();

    const voteCountPromise = setMapVoteCounts(client, maps);

    const tiers = await calcMapTiers(client);
    await voteCountPromise;

    for (const map of maps) {
        map.tier = tiers.get(map.id);
    }

    return maps;
}