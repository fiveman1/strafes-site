import mysql, { RowDataPacket } from "mysql2/promise";
import { Game, LeaderboardSortBy, Style, Time, TimeSortBy, Map as StrafesMap, MAX_TIER, MAIN_COURSE, formatGame, formatStyle, formatDiff, formatTime } from "shared";
import { tryPostRequest } from "./requests.js";
import { setUserThumbsForList } from "./users.js";
import { DiscordEmbed, DiscordWebhookField, DiscordWebhookParams } from "./discord_webhooks.js";

interface WithTotalCount {
    totalCount: string
}

export interface GlobalsRecord {
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
    has_bot: number
}

type RecordRow = GlobalsRecord & RowDataPacket;

export interface GlobalCountSQL extends WithTotalCount {
    userId: string,
    username: string,
    count: string
    bonusCount: string
}

type GlobalCountRow = GlobalCountSQL & RowDataPacket;

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

export interface DiscordWebhooks {
    bhopAuto: string | undefined,
    bhopStyles: string | undefined,
    surfAuto: string | undefined,
    surfStyles: string | undefined,
    all: string | undefined,
    avatarUrl: string | undefined
}

export class GlobalsClient {

    protected readonly _pool: mysql.Pool;
    protected readonly webhooks: DiscordWebhooks;
    protected readonly baseUrl: string;

    public constructor(user: string, password: string, baseUrl: string, webhooks: DiscordWebhooks) {
        this._pool = mysql.createPool({
            host: "localhost",
            user: user,
            password: password,
            database: "strafes_globals",
            timezone: "Z", // UTC
            supportBigNumbers: true,
            bigNumberStrings: true,
            dateStrings: ["TIMESTAMP"]
        });
        this.baseUrl = baseUrl;
        this.webhooks = webhooks;
    }

    public get pool() {
        return this._pool;
    }

    public async getMapWR(mapId: number, game: Game, style: Style, course: number): Promise<Time | undefined> {
        const query = `SELECT globals.*, users.username, maps.name as map_name
            FROM globals 
            INNER JOIN users ON globals.user_id = users.user_id 
            INNER JOIN maps ON globals.map_id = maps.map_id
            WHERE globals.map_id = ? AND globals.game = ? AND globals.style = ? AND globals.course = ?
        ;`;
        const [[record]] = await this.pool.execute<RecordRow[]>(query, [mapId, game, style, course]);
        
        if (!record) {
            return undefined;
        }
        
        return GlobalsClient.recordToTime(record);
    }

    // TODO: This is only being used to get total WR counts, replace this with something that just does that
    public async getUserWRs(userId: number, game: Game, style: Style, course?: number): Promise<Time[] | undefined> {
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

        const [records] = await this.pool.execute<RecordRow[]>(query, values);

        if (!records) {
            return undefined;
        }

        return records.map(GlobalsClient.recordToTime);
    }

    public async getWRList(start: number, end: number, game: Game, style: Style, sort: TimeSortBy, course?: number, userId?: number, mapId?: number): Promise<{ total: number; wrs: Time[]; }> {
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

        if (mapId !== undefined) {
            whereClause += " AND globals.map_id = ?";
            values.push(mapId);
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

        query += ` LIMIT ${end - start + 1} OFFSET ${start};`;

        const [records] = await this.pool.execute<(RecordRow & WithTotalCount)[]>(query, values);

        if (!records) {
            return {
                total: 0,
                wrs: []
            };
        }

        const total = records.length === 0 ? 0 : +records[0].totalCount;
        return {
            total: total,
            wrs: records.map(GlobalsClient.recordToTime)
        };
    }

    protected static recordToTime(record: RecordRow): Time {
        return {
            map: record.map_name,
            mapId: +record.map_id,
            time: record.time,
            date: record.date.toISOString(),
            game: record.game,
            style: record.style,
            id: record.time_id,
            course: record.course,
            userId: +record.user_id,
            username: record.username,
            placement: 1,
            hasBot: Boolean(record.has_bot)
        };
    }

    public async getWRLeaderboardPage(start: number, end: number, game: Game, style: Style, sort: LeaderboardSortBy): Promise<{ total: number; data: GlobalCountSQL[]; }> {
        let query = `SELECT 
            COUNT(CASE WHEN course = 0 THEN 1 ELSE NULL END) as count, 
            COUNT(CASE WHEN course <> 0 THEN 1 ELSE NULL END) as bonusCount, 
            globals.user_id as userId, 
            users.username, 
            COUNT(globals.user_id) OVER() as totalCount 
            FROM globals 
            INNER JOIN users ON globals.user_id = users.user_id 
        `;
        const values: any[] = [];

        let whereClause = "";
        if (game !== Game.all) {
            whereClause += " AND game = ?";
            values.push(game);
        }

        if (style !== Style.all) {
            whereClause += " AND style = ?";
            values.push(style);
        }

        if (whereClause !== "") {
            query += " WHERE " + whereClause.slice(5); // Remove the first " AND "
        }

        query += " GROUP BY globals.user_id ORDER BY ";
        let userDir = "ASC";
        if (sort === LeaderboardSortBy.MainAsc || sort === LeaderboardSortBy.BonusAsc) {
            userDir = "DESC";
            if (sort === LeaderboardSortBy.MainAsc) {
                query += `count ASC, bonusCount ASC`;
            }
            else {
                query += `bonusCount ASC, count ASC`;
            }
        }
        else {
            if (sort === LeaderboardSortBy.MainDesc) {
                query += `count DESC, bonusCount DESC`;
            }
            else {
                query += `bonusCount DESC, count DESC`;
            }
        }

        query += `, username ${userDir} LIMIT ${end - start + 1} OFFSET ${start};`;

        const [globalCounts] = await this.pool.execute<GlobalCountRow[]>(query, values);

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

    public async updateWRs(wrs: Time[]) {
        if (wrs.length < 1) {
            return;
        }

        if (!(await this.wrsHaveMapsLoaded(wrs))) {
            // Don't want to cause a foreign key constraint not met error
            return;
        }

        const userIdSet = new Set<number>();
        const userRows = [];
        for (const wr of wrs) {
            if (userIdSet.has(wr.userId)) continue;
            userIdSet.add(wr.userId);
            userRows.push([wr.userId, wr.username]);
        }

        let query = `INSERT INTO users (user_id, username) VALUES ? AS new ON DUPLICATE KEY UPDATE username=new.username;`;
        await this.pool.query(query, [userRows]);

        await setUserThumbsForList(wrs, true);
        const promises = [];
        for (const wr of wrs) {
            promises.push(this.postGlobalToDiscord(wr));
        }
        await Promise.all(promises);

        const wrRows = wrs.map((record) => [
            record.id,
            record.userId,
            record.mapId,
            record.game,
            record.style,
            record.course,
            new Date(record.date),
            record.time,
            record.hasBot
        ]);

        query = `INSERT INTO globals (time_id, user_id, map_id, game, style, course, date, time, has_bot) 
            VALUES ? AS new 
            ON DUPLICATE KEY UPDATE
                time_id=new.time_id,
                user_id=new.user_id,
                map_id=new.map_id,
                game=new.game,
                style=new.style,
                course=new.course,
                date=new.date,
                time=new.time,
                has_bot=new.has_bot
        ;`;

        await this.pool.query(query, [wrRows]);
    }

    protected async postGlobalToDiscord(wr: Time) {
        if (wr.course !== MAIN_COURSE) {
            return;
        }

        if (wr.game !== Game.bhop && wr.game !== Game.surf) {
            return;
        }

        const twoHoursAgo = Date.now() - (48 * 60 * 60 * 1000);
        const wrDate = new Date(wr.date);
        if (wrDate.getTime() < twoHoursAgo) {
            return;
        }

        let webhook: string | undefined;
        if (wr.game === Game.bhop) {
            if (wr.style === Style.autohop) {
                webhook = this.webhooks.bhopAuto;
            }
            else {
                webhook = this.webhooks.bhopStyles;
            }
        }
        else if (wr.game === Game.surf) {
            if (wr.style === Style.autohop) {
                webhook = this.webhooks.surfAuto;
            }
            else {
                webhook = this.webhooks.surfStyles;
            }
        }

        if (!webhook && !this.webhooks.all) {
            return;
        }

        const mapInfo = await this.getMap(wr.mapId);
        const prevWR = await this.getMapWR(wr.mapId, wr.game, wr.style, wr.course);

        let info = `**Game:** ${formatGame(wr.game)}\n`;
        info += `**Style:** ${formatStyle(wr.style)}\n`;
        info += `**Date:** <t:${Math.round(wrDate.getTime() / 1000)}:f>\n`;

        let time = `${formatTime(wr.time)} `;
        
        if (prevWR) {
            info += `**Previous WR:** ${formatTime(prevWR.time)} (${prevWR.username})`;
            time += `(${formatDiff(wr.wrDiff ?? 0)})`;
        }
        else {
            info += "**Previous WR:** n/a";
            time += "(-n/a s)";
        }

        const fields: DiscordWebhookField[] = [
            { name: "Player", value: `[${wr.username}](${this.baseUrl}/users/${wr.userId}?game=${wr.game}&style=${wr.style})`, inline: true },
            { name: "Time", value: time, inline: true }
        ];

        if (wr.hasBot) {
            fields.push({ name: "Replay", value: `[Watch replay](${this.baseUrl}/replays/${wr.id})`, inline: false });
        }

        fields.push({ name: "Info", value: info, inline: false });

        const embed: DiscordEmbed = {
            title: `👑  ${wr.map}`,
            url: `${this.baseUrl}/maps/${wr.mapId}?game=${wr.game}&style=${wr.style}`,
            color: 0x80ff80,
            timestamp: wrDate.toISOString(),
            author: {
                name: "New WR",
                icon_url: "https://i.imgur.com/PtLyW2j.png"
            },
            fields: fields,
            footer: { text: "World Record" },
        };

        if (wr.userThumb) {
            embed.thumbnail = { url: wr.userThumb };
        }

        if (mapInfo?.largeThumb) {
            embed.image = { url: mapInfo.largeThumb };
        }

        const params: DiscordWebhookParams = {
            username: "strafes globals",
            avatar_url: this.webhooks.avatarUrl,
            embeds: [embed]
        };

        // Not awaiting the post requests because we don't actually care when they finish
        if (webhook) {
            tryPostRequest(webhook, params);
        }
        
        if (this.webhooks.all) {
            tryPostRequest(this.webhooks.all, params);
        }
    }

    protected async wrsHaveMapsLoaded(wrs: Time[]) {
        if (wrs.length < 1) {
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
        const [rows] = await this.pool.query<RowDataPacket[]>(query, [mapIds]);
        return rows.length === mapIds.length;
    }

    public async getMap(mapId: number): Promise<StrafesMap | undefined> {
        const query = `SELECT * FROM maps WHERE map_id = ?;`;
        const values = [mapId];
        const [[row]] = await this.pool.execute<MapSQLRow[]>(query, values);

        if (!row) {
            return undefined;
        }

        return GlobalsClient.rowToMap(row);
    }

    public async getAllMaps() {
        const query = `SELECT * FROM maps;`;
        const [rows] = await this.pool.execute<MapSQLRow[]>(query);

        return rows.map(GlobalsClient.rowToMap);
    }

    protected static rowToMap(row: MapSQLRow): StrafesMap {
        return {
            id: +row.map_id,
            name: row.name,
            creator: row.creator,
            game: row.game,
            date: row.date.toISOString(), // ISO strings for consistency
            modes: row.modes,
            loadCount: row.load_count,
            smallThumb: row.small_thumb ?? undefined,
            largeThumb: row.large_thumb ?? undefined,
            votes: {
                unweighted: Array(MAX_TIER).fill(0),
                weighted: Array(MAX_TIER).fill(0)
            }
        };
    }
}