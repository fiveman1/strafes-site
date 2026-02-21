import { Game, isEligibleForVoting, Map as StrafesMap, MapTierInfo, ModerationStatus, Style, TierVotingEligibilityInfo } from "shared";
import { getTimes, getUserInfo } from "./strafes_api/api.js";
import { GlobalsClient } from "./globals.js";
import { RowDataPacket } from "mysql2";

export async function loadTierVotingEligibility(userId: number): Promise<TierVotingEligibilityInfo> {
    const userInfoPromise = getUserInfo(userId);
    const bhopTimesPromise = getTimes(userId, undefined, 1, 1, Game.bhop, Style.all, 0);
    const surfTimesPromise = getTimes(userId, undefined, 1, 1, Game.surf, Style.all, 0);
    
    let status = ModerationStatus.Default;
    let bhopComps = 0;
    let surfComps = 0;
    
    const userInfo = await userInfoPromise;
    if (userInfo) {
        status = userInfo.state_id;
    }

    const bhopTimes = await bhopTimesPromise;
    if (bhopTimes) {
        bhopComps = bhopTimes.pagination.total_items;
    }

    const surfTimes = await surfTimesPromise;
    if (surfTimes) {
        surfComps = surfTimes.pagination.total_items;
    }

    return {
        moderationStatus: status,
        bhopCompletions: bhopComps,
        surfCompletions: surfComps
    };
}

export async function canUserVoteOnMap(client: GlobalsClient, userId: number, mapId: number): Promise<boolean> {
    const info = await loadTierVotingEligibility(userId);
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
    
    const [[row]] = await client.pool.query<MapTierInfoRow[]>(query, values);

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

export async function setUserTierForMap(client: GlobalsClient, userId: number, mapId: number, tier: number | undefined): Promise<MapTierInfo | undefined> {
    const map = await client.getMap(mapId);
    if (!map) {
        return undefined;
    }

    if (tier === undefined) {
        const query = `DELETE FROM tier_votes WHERE user_id=? AND map_id=?;`;
        const values = [userId, mapId];
        await client.pool.query(query, values);
        return undefined;
    }

    if (!(await canUserVoteOnMap(client, userId, mapId))) {
        return undefined;
    }

    const weight = await getVoteWeight(userId, map);

    const query = `INSERT INTO tier_votes (tier, weight, user_id, map_id) VALUES (?) AS new 
        ON DUPLICATE KEY UPDATE 
        tier=new.tier,
        weight=new.weight
    ;`;
    const values = [tier, weight, userId, mapId];
    await client.pool.query(query, [values]);
    
    return {
        userId: userId,
        mapId: mapId,
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
    // Ignores outliers (more than 2 standard deviations)
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
            ABS(tier - stats.avg) <= (stats.std)
        GROUP BY
            tier_votes.map_id
    ;`;

    const [rows] = await client.pool.query<CalcTierRow[]>(query);

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
    const [rows] = await client.pool.query<VotesRow[]>(query);

    for (const row of rows) {
        const map = idToMap.get(+row.map_id);
        if (!map) continue;
        const tier = row.tier;
        map.votes.unweighted[tier - 1] = +row.unweighted;
        map.votes.weighted[tier - 1] = +row.weighted;
    }
}