import apicache from "apicache";
import express from "express";
import path from "path";
import { rateLimit } from "express-rate-limit";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import { Game, Pagination, Rank, TimeSortBy, Style, Time, LeaderboardCount, LeaderboardSortBy, formatCourse, formatGame, formatStyle, MAIN_COURSE, UserSearchDataComplete, WRCount } from "shared";
import { calcRank, IS_DEV_MODE } from "./util.js";
import { readFileSync } from "fs";
import { GlobalsClient, GlobalCountSQL } from "./globals.js";
import { tryGetCached } from "./requests.js";
import { AuthClient } from "./auth.js";
import { getUserData, getUserId, setUserInfoForList, setUserThumbsForList } from "./users.js";
import { getPlacements, getRanks, getTimes, getUserRank } from "./strafes_api/api.js";
import { PagedTotalResponseTime, Time as ApiTime } from "./strafes_api/client.js";
import { exit } from "process";
import vine, { errors } from "@vinejs/vine";
import * as validators from "./validators.js";
import escapeHTML from "escape-html";

const STRAFES_DB_USER = process.env.STRAFES_DB_USER;
const STRAFES_DB_PASSWORD = process.env.STRAFES_DB_PASSWORD;

if (!STRAFES_DB_USER || !STRAFES_DB_PASSWORD) {
    console.error("Missing strafes global database user/password");
    exit(1);
}

const globalsClient = new GlobalsClient(STRAFES_DB_USER, STRAFES_DB_PASSWORD);

const CLIENT_ID = process.env.ROBLOX_CLIENT_ID;
const CLIENT_SECRET = process.env.ROBLOX_CLIENT_SECRET;
const AUTH_DB_USER = process.env.AUTH_DB_USER;
const AUTH_DB_PASSWORD = process.env.AUTH_DB_PASSWORD;
const BASE_URL = process.env.BASE_URL ?? "http://localhost:8080";

if (!CLIENT_ID || !CLIENT_SECRET || !AUTH_DB_USER || !AUTH_DB_PASSWORD) {
    console.error("Missing client ID/secret or auth DB user/password");
    exit(1);
}

const authClient = await AuthClient.Create(CLIENT_ID, CLIENT_SECRET, AUTH_DB_USER, AUTH_DB_PASSWORD, BASE_URL);

const app = express();

const TRUST_PROXY = process.env.TRUST_PROXY;
if (TRUST_PROXY) {
    app.set("trust proxy", +TRUST_PROXY);
}

const PORT = process.env.PORT ?? "8080";
const GOOGLE_SITE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION;

const cache = (IS_DEV_MODE ? apicache.options({ headers: { "cache-control": "no-cache" } }).middleware : apicache.middleware) as (duration?: string | number) => any;
const rateLimitSettings = rateLimit({ windowMs: 60 * 1000, limit: IS_DEV_MODE ? 250 : 25, validate: { xForwardedForHeader: !IS_DEV_MODE } });
const pagedRateLimitSettings = rateLimit({ windowMs: 60 * 1000, limit: IS_DEV_MODE ? 250 : 80, validate: { xForwardedForHeader: !IS_DEV_MODE } });

const dirName = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.join(dirName, "../../client/build/");

const COOKIE_SECRET = process.env.COOKIE_SECRET;
app.use(cookieParser(COOKIE_SECRET));

app.use(express.json());

app.get("/api/login", async (req, res) => {
    await authClient.redirectToAuthURL(res);
});

app.get("/api/logout", async (req, res) => {
    await authClient.logout(req, res);
});

app.get("/oauth/callback", async (req, res) => {
    await authClient.authorizeAndSetTokens(req, res);
});

app.get("/api/auth/user", async (req, res) => {
    await authClient.setLoggedInUser(req, res);
});

app.get("/api/settings", async (req, res) => {
    await authClient.getSettings(req, res);
});

app.post("/api/settings", async (req, res) => {
    await authClient.updateSettings(req, res);
});

app.get("/api/username", cache("5 minutes"), async (req, res) => {
    const [error, result] = await validators.usernameValidator.tryValidate(req.query);
    if (error) {
        res.status(400).json({ error: error instanceof errors.E_VALIDATION_ERROR ? error.messages : "Invalid input" });
        return;
    }
    const username = result.username;

    const userId = await getUserId(username);
    if (!userId) {
        res.status(404).json({ error: "Not found" });
        return;
    }

    res.status(200).json({ id: userId });
});

const searchGUID = crypto.randomUUID();
app.get("/api/usersearch", cache("5 minutes"), async (req, res) => {
    const [error, result] = await validators.usernameValidator.tryValidate(req.query);
    if (error) {
        res.status(400).json({ error: error instanceof errors.E_VALIDATION_ERROR ? error.messages : "Invalid input" });
        return;
    }
    const username = result.username;

    const usernames: UserSearchDataComplete[] = [];
    const searchRes = await tryGetCached("https://apis.roproxy.com/search-api/omni-search", {
        verticalType: "user",
        searchQuery: username,
        sessionId: searchGUID
    });

    if (!searchRes || searchRes.data.searchResults.length === 0) {
        res.status(404).json({ error: "Not found" });
        return;
    }

    for (const result of searchRes.data.searchResults[0].contents) {
        usernames.push({
            username: result.username,
            userId: result.contentId,
            previousUsernames: result.previousUsernames
        });
    }

    await setUserThumbsForList(usernames, false);

    res.status(200).json({ usernames: usernames });
});

app.get("/api/user/:id", rateLimitSettings, cache("5 minutes"), async (req, res) => {
    const [error, result] = await validators.idValidator.tryValidate(req.params);
    if (error) {
        res.status(400).json({ error: error instanceof errors.E_VALIDATION_ERROR ? error.messages : "Invalid input" });
        return;
    }

    const userId = result.id;

    const user = await getUserData(authClient, userId);
    if (!user) {
        res.status(404).json({ error: "Not found" });
        return;
    }

    res.status(200).json(user);
});

const userRankValidator = vine.create({
    game: validators.game(),
    style: validators.style()
});

app.get("/api/user/rank/:id", rateLimitSettings, cache("5 minutes"), async (req, res) => {
    const [paramsError, paramsResult] = await validators.idValidator.tryValidate(req.params);
    if (paramsError) {
        res.status(400).json({ error: paramsError instanceof errors.E_VALIDATION_ERROR ? paramsError.messages : "Invalid input" });
        return;
    }

    const [error, result] = await userRankValidator.tryValidate(req.query);
    if (error) {
        res.status(400).json({ error: error instanceof errors.E_VALIDATION_ERROR ? error.messages : "Invalid input" });
        return;
    }

    const userId = paramsResult.id;
    const game = result.game;
    const style = result.style;

    const data = await getUserRank(userId, game, style);

    if (!data) {
        res.status(404).json({ error: "Not found" });
        return;
    }

    const rank = calcRank(data.rank);

    const rankData: Rank = {
        id: data.id,
        style: style,
        game: game,
        rank: rank,
        skill: data.skill,
        userId: userId,
        username: data.user.username,
    };

    res.status(200).json(rankData);
});

const wrLeaderboardValidator = vine.create({
    game: validators.gameOrAll(),
    style: validators.styleOrAll(),
    start: vine.number().withoutDecimals().nonNegative(),
    end: vine.number().withoutDecimals().nonNegative(),
    sort: validators.leaderboardSort().optional()
});

app.get("/api/wrs/leaderboard", pagedRateLimitSettings, cache("5 minutes"), async (req, res) => {
    const [error, result] = await wrLeaderboardValidator.tryValidate(req.query);
    if (error) {
        res.status(400).json({ error: error instanceof errors.E_VALIDATION_ERROR ? error.messages : "Invalid input" });
        return;
    }

    const game = result.game;
    const style = result.style;
    const start = result.start;
    const end = result.end;
    const sort = result.sort ?? LeaderboardSortBy.MainDesc;

    if (start >= end) {
        res.status(400).json({ error: "Start must be lower than end" });
    }

    const pageRes = await globalsClient.getWRLeaderboardPage(start, end, game, style, sort);

    if (!pageRes) {
        res.status(404).json({ error: "Not found" });
        return;
    }

    const promises = [];
    for (const page of pageRes.data) {
        promises.push(convertToLeaderboardCount(page, game, style));
    }

    const data = await Promise.all(promises);
    await setUserInfoForList(authClient, data);

    res.status(200).json({
        total: pageRes.total,
        data: data
    });
});

async function convertToLeaderboardCount(page: GlobalCountSQL, game: Game, style: Style): Promise<LeaderboardCount> {
    const wrs = await globalsClient.getUserWRs(+page.userId, game, style) || [];

    let earliestTime: Time | undefined = undefined;
    let latestTime: Time | undefined = undefined;
    for (const wr of wrs) {
        const wrDate = new Date(wr.date);
        if (!earliestTime || wrDate < new Date(earliestTime.date)) {
            earliestTime = wr;
        }

        if (!latestTime || wrDate > new Date(latestTime.date)) {
            latestTime = wr;
        }
    }

    return {
        userId: +page.userId,
        username: page.username,
        count: +page.count,
        bonusCount: +page.bonusCount,
        earliestTime: earliestTime!,
        latestTime: latestTime!
    };
}

const ranksValidator = vine.create({
    game: validators.game(),
    style: validators.style(),
    start: vine.number().withoutDecimals().nonNegative(),
    end: vine.number().withoutDecimals().nonNegative(),
    sort: validators.rankSort()
});

app.get("/api/ranks", pagedRateLimitSettings, cache("5 minutes"), async (req, res) => {
    const [error, result] = await ranksValidator.tryValidate(req.query);
    if (error) {
        res.status(400).json({ error: error instanceof errors.E_VALIDATION_ERROR ? error.messages : "Invalid input" });
        return;
    }

    const game = result.game;
    const style = result.style;
    const start = result.start;
    const end = result.end;
    const sort = result.sort;

    if (start >= end) {
        res.status(400).json({ error: "Start must be lower than end" });
    }

    const page = Math.floor(start / 100) + 1;
    const ranksData = await getRanks(100, page, game, style, sort);

    if (!ranksData) {
        res.status(404).json({ error: "Not found" });
        return;
    }

    const pageStart = start % 100;
    const pageEnd = end % 100;
    const ranks = ranksData.data;
    const rankArr: Rank[] = [];

    for (let i = pageStart; (i < ranks.length) && (i <= pageEnd); ++i) {
        const data = ranks[i];
        const rank = calcRank(data.rank);
        rankArr.push({
            id: data.id,
            style: style,
            game: game,
            rank: rank,
            skill: data.skill,
            userId: data.user.id,
            username: data.user.username,
            placement: ((page - 1) * 100) + i + 1
        });
    }

    await setUserInfoForList(authClient, rankArr);

    const promises = [];
    for (const rank of rankArr) {
        promises.push(globalsClient.getUserWRs(rank.userId, game, style));
    }

    const resolved = await Promise.all(promises);

    for (let i = 0; i < resolved.length; ++i) {
        const wrs = resolved[i];
        const counts = getUserWRCounts(wrs);
        rankArr[i].mainWrs = counts.mainWrs;
        rankArr[i].bonusWrs = counts.bonusWrs;
    }

    res.status(200).json(rankArr);
});

const userTimesValidator = vine.create({
    game: validators.gameOrAll(),
    style: validators.styleOrAll(),
    course: vine.number().withoutDecimals(),
    onlyWR: vine.boolean().optional(),
    start: vine.number().withoutDecimals().nonNegative(),
    end: vine.number().withoutDecimals().nonNegative(),
    sort: validators.timesSort()
});

app.get("/api/user/times/:id", pagedRateLimitSettings, cache("5 minutes"), async (req, res) => {
    const [paramsError, paramsResult] = await validators.idValidator.tryValidate(req.params);
    if (paramsError) {
        res.status(400).json({ error: paramsError instanceof errors.E_VALIDATION_ERROR ? paramsError.messages : "Invalid input" });
        return;
    }

    const [error, result] = await userTimesValidator.tryValidate(req.query);
    if (error) {
        res.status(400).json({ error: error instanceof errors.E_VALIDATION_ERROR ? error.messages : "Invalid input" });
        return;
    }

    const userId = paramsResult.id;
    const game = result.game;
    const style = result.style;
    const course = result.course;
    const onlyWR = !!result.onlyWR;
    const start = result.start;
    const end = result.end;
    const sort = result.sort;

    if (start >= end) {
        res.status(400).json({ error: "Start must be lower than end" });
    }

    const timeInfo = await getTimesPaged(start, end, sort, course, onlyWR, game, style, { userId: userId });

    if (!timeInfo) {
        res.status(404).json({ error: "Not found" });
        return;
    }

    if (!onlyWR) {
        await setTimePlacements(timeInfo.data);
        await setTimeDiffs(timeInfo.data); // Has to happen after placements
    }

    res.status(200).json(timeInfo);
});

const userCompletionsValidator = vine.create({
    game: validators.game(),
    style: validators.style()
});

app.get("/api/user/times/completions/:id", pagedRateLimitSettings, cache("5 minutes"), async (req, res) => {
    const [paramsError, paramsResult] = await validators.idValidator.tryValidate(req.params);
    if (paramsError) {
        res.status(400).json({ error: paramsError instanceof errors.E_VALIDATION_ERROR ? paramsError.messages : "Invalid input" });
        return;
    }

    const [error, result] = await userCompletionsValidator.tryValidate(req.query);
    if (error) {
        res.status(400).json({ error: error instanceof errors.E_VALIDATION_ERROR ? error.messages : "Invalid input" });
        return;
    }

    const userId = paramsResult.id;
    const game = result.game;
    const style = result.style;

    const timeData = await getTimes(userId, undefined, 1, 1, game, style, 0);

    if (!timeData) {
        res.status(404).json({ error: "Not found" });
        return;
    }

    res.status(200).json({ completions: timeData.pagination.total_items });
});

const userWRsValidator = vine.create({
    game: validators.gameOrAll(),
    style: validators.styleOrAll()
});

app.get("/api/user/times/wrs/:id", rateLimitSettings, cache("5 minutes"), async (req, res) => {
    const [paramsError, paramsResult] = await validators.idValidator.tryValidate(req.params);
    if (paramsError) {
        res.status(400).json({ error: paramsError instanceof errors.E_VALIDATION_ERROR ? paramsError.messages : "Invalid input" });
        return;
    }

    const [error, result] = await userWRsValidator.tryValidate(req.query);
    if (error) {
        res.status(400).json({ error: error instanceof errors.E_VALIDATION_ERROR ? error.messages : "Invalid input" });
        return;
    }

    const userId = paramsResult.id;
    const game = result.game;
    const style = result.style;

    const wrs = await globalsClient.getUserWRs(userId, game, style);

    res.status(200).json(getUserWRCounts(wrs));
});

function getUserWRCounts(wrs?: Time[]): WRCount {
    let mainWrs = 0;
    let bonusWrs = 0;

    if (wrs !== undefined) {
        for (const wr of wrs) {
            if (wr.course === 0) {
                mainWrs += 1;
            }
            else {
                bonusWrs += 1;
            }
        }
    }

    return {
        mainWrs: mainWrs,
        bonusWrs: bonusWrs
    };
}

const userAllTimesValidator = vine.create({
    game: validators.game(),
    style: validators.style()
});

app.get("/api/user/times/all/:id", rateLimitSettings, cache("5 minutes"), async (req, res) => {
    const [paramsError, paramsResult] = await validators.idValidator.tryValidate(req.params);
    if (paramsError) {
        res.status(400).json({ error: paramsError instanceof errors.E_VALIDATION_ERROR ? paramsError.messages : "Invalid input" });
        return;
    }

    const [error, result] = await userAllTimesValidator.tryValidate(req.query);
    if (error) {
        res.status(400).json({ error: error instanceof errors.E_VALIDATION_ERROR ? error.messages : "Invalid input" });
        return;
    }

    const userId = paramsResult.id;
    const game = result.game;
    const style = result.style;

    const firstTimeData = await getTimes(userId, undefined, 100, 1, game, style, 0, TimeSortBy.DateDesc);

    if (!firstTimeData) {
        return undefined;
    }

    const pageInfo = firstTimeData.pagination;
    const pagination: Pagination = {
        page: pageInfo.page,
        pageSize: pageInfo.page_size,
        totalItems: pageInfo.total_items,
        totalPages: pageInfo.total_pages
    };

    const promises: Promise<PagedTotalResponseTime | undefined>[] = [];
    for (let i = 2; i <= pagination.totalPages; ++i) {
        promises.push(getTimes(userId, undefined, 100, i, game, style, 0, TimeSortBy.DateDesc));
    }
    const resolved = await Promise.all(promises);
    const allTimes = [firstTimeData];
    for (const timeData of resolved) {
        if (!timeData) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        allTimes.push(timeData);
    }

    const timeArr: Time[] = [];
    const timeIds = new Set<string>();
    for (const timeData of allTimes) {
        for (const time of timeData.data) {
            if (timeIds.has(time.id)) {
                // There is a bug with the API where sometimes it returns duplicate times! Awesome!
                continue;
            }
            timeIds.add(time.id);
            timeArr.push(apiTimeToTime(time));
        }
    }

    res.status(200).json({
        data: timeArr,
        pagination: pagination
    });
});

async function setTimePlacements(times: Time[]) {
    if (times.length < 1) {
        return;
    }

    const timeIds: string[] = [];
    for (const time of times) {
        timeIds.push(time.id);
    }

    const placementData = await getPlacements(timeIds);

    const idToPlacement = new Map<string, number>();
    if (placementData) {
        for (const placementInfo of placementData) {
            idToPlacement.set(placementInfo.id, placementInfo.placement);
        }
    }

    for (const time of times) {
        time.placement = idToPlacement.get(time.id);
    }
}

async function setTimeDiffs(times: Time[], skipUpdate?: boolean) {
    if (times.length < 1) {
        return;
    }

    const mapToWR = new Map<string, Time>();
    const keys = new Set<string>();
    for (const time of times) {
        keys.add(getMapKey(time));
    }

    const promises = [];
    for (const mapKey of keys) {
        const promise = async () => {
            const pieces = mapKey.split(",");
            const wr = await globalsClient.getMapWR(+pieces[0], +pieces[1], +pieces[2], +pieces[3]);
            if (wr) {
                mapToWR.set(mapKey, wr);
            }
        };
        promises.push(promise());
    }

    await Promise.all(promises);

    const newWrs: Time[] = [];

    for (const time of times) {
        const mapKey = getMapKey(time);
        const wr = mapToWR.get(mapKey);
        if (wr) {
            time.wrDiff = time.time - wr.time;
        }

        if (!skipUpdate && time.placement === 1 && time.wrDiff !== 0) {
            newWrs.push(time);
        }
    }

    if (newWrs.length > 0) {
        await globalsClient.updateWRs(newWrs);
        await setTimeDiffs(times, true); // Recalculate
    }
}

function getMapKey(time: Time) {
    return `${time.mapId},${time.game},${time.style},${time.course}`;
}

const wrsValidator = vine.create({
    game: validators.gameOrAll(),
    style: validators.styleOrAll(),
    course: vine.number().withoutDecimals(),
    start: vine.number().withoutDecimals().nonNegative(),
    end: vine.number().withoutDecimals().nonNegative(),
    sort: validators.timesSort()
});

app.get("/api/wrs", pagedRateLimitSettings, cache("5 minutes"), async (req, res) => {
    const [error, result] = await wrsValidator.tryValidate(req.query);
    if (error) {
        res.status(400).json({ error: error instanceof errors.E_VALIDATION_ERROR ? error.messages : "Invalid input" });
        return;
    }

    const game = result.game;
    const style = result.style;
    const course = result.course;
    const start = result.start;
    const end = result.end;
    const sort = result.sort;

    if (start >= end) {
        res.status(400).json({ error: "Start must be lower than end" });
    }

    const timeInfo = await getTimesPaged(start, end, sort, course, true, game, style, {});

    if (!timeInfo) {
        res.status(404).json({ error: "Not found" });
        return;
    }

    res.status(200).json(timeInfo);
});

async function getTimesPaged(start: number, end: number, sort: TimeSortBy, course: number, onlyWR: boolean, game: Game, style: Style, searchInfo: { userId?: number, mapId?: number }) {
    let times: Time[];
    let pagination: Pagination;
    const { userId, mapId } = searchInfo;

    if (onlyWR) {
        const { total, wrs } = await globalsClient.getWRList(start, end, game, style, sort, course, userId);

        if (!wrs) return undefined;

        times = wrs;
        pagination = {
            page: -1,
            pageSize: -1,
            totalItems: total,
            totalPages: -1
        };
    }
    else {
        const page = Math.floor(start / 100) + 1;
        const pageStart = (start % 100);
        const pageEnd = pageStart + (end - start);

        const promises = [getTimes(userId, mapId, 100, page, game, style, course, sort)];

        if (pageEnd >= 100) {
            promises.push(getTimes(userId, mapId, 100, page + 1, game, style, course, sort));
        }

        const pages = await Promise.all(promises);

        const resTimes: ApiTime[] = [];
        for (const page of pages) {
            if (page === undefined) {
                return undefined;
            }
            resTimes.push(...page.data);
        }

        times = [];
        const timeIds = new Set<string>();
        for (let i = pageStart; (i < resTimes.length) && (i <= pageEnd); ++i) {
            const time = resTimes[i];
            if (timeIds.has(time.id)) {
                // There is a bug with the API where sometimes it returns duplicate times! Awesome!
                continue;
            }
            timeIds.add(time.id);
            times.push(apiTimeToTime(time));
        }

        const pageInfo = pages[0]!.pagination;
        pagination = {
            page: pageInfo.page,
            pageSize: pageInfo.page_size,
            totalItems: pageInfo.total_items,
            totalPages: pageInfo.total_pages
        };
    }

    if (userId === undefined) {
        await setUserInfoForList(authClient, times);
    }

    return {
        data: times,
        pagination: pagination
    };
}

function apiTimeToTime(time: ApiTime): Time {
    return {
        map: time.map.display_name,
        mapId: time.map.id,
        username: time.user.username,
        userId: time.user.id,
        time: time.time,
        date: time.date,
        game: time.game_id,
        style: time.style_id,
        id: time.id,
        course: time.mode_id
    };
}

function sortTimes(times: Time[], isAsc: boolean) {
    times.sort((a, b) => {
        const timeDiff = a.time - b.time;
        if (timeDiff !== 0) {
            return isAsc ? timeDiff : -timeDiff;
        }
        // Sort by date
        const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
        return isAsc ? dateDiff : -dateDiff;
    });
}

const mapTimesValidator = vine.create({
    game: validators.game(),
    style: validators.style(),
    course: vine.number().withoutDecimals(),
    start: vine.number().withoutDecimals().nonNegative(),
    end: vine.number().withoutDecimals().nonNegative(),
    sort: validators.timesSort()
});

app.get("/api/map/times/:id", pagedRateLimitSettings, cache("5 minutes"), async (req, res) => {
    const [paramsError, paramsResult] = await validators.idValidator.tryValidate(req.params);
    if (paramsError) {
        res.status(400).json({ error: paramsError instanceof errors.E_VALIDATION_ERROR ? paramsError.messages : "Invalid input" });
        return;
    }

    const [error, result] = await mapTimesValidator.tryValidate(req.query);
    if (error) {
        res.status(400).json({ error: error instanceof errors.E_VALIDATION_ERROR ? error.messages : "Invalid input" });
        return;
    }

    const mapId = paramsResult.id;
    const game = result.game;
    const style = result.style;
    const course = result.course;
    const start = result.start;
    const end = result.end;
    const sort = result.sort;

    if (start >= end) {
        res.status(400).json({ error: "Start must be lower than end" });
    }

    const timeData = await getTimesPaged(start, end, sort, course, false, game, style, { mapId: mapId });

    if (!timeData) {
        res.status(404).json({ error: "Not found" });
        return;
    }

    const times = timeData.data;

    if (sort === TimeSortBy.TimeAsc) {
        sortTimes(times, true);
    }
    else if (sort === TimeSortBy.TimeDesc) {
        sortTimes(times, false);
    }

    const promises = [];
    if (sort === TimeSortBy.DateAsc || sort == TimeSortBy.DateDesc) {
        promises.push(setTimePlacements(times));
    }
    else {
        let i = 1;
        for (const time of times) {
            if (sort === TimeSortBy.TimeAsc) {
                time.placement = start + i;
            }
            else if (sort === TimeSortBy.TimeDesc) {
                time.placement = timeData.pagination.totalItems - (start + i) + 1;
            }
            ++i;
        }
    }

    promises.push(authClient, setUserInfoForList(authClient, times));

    await Promise.all(promises);
    await setTimeDiffs(times); // Has to happen after placements are calculated

    res.status(200).json(timeData);
});

app.get("/api/maps", rateLimitSettings, cache("1 hour"), async (req, res) => {
    const maps = await globalsClient.getAllMaps();

    if (!maps) {
        res.status(404).json({ error: "Not found" });
        return;
    }

    res.status(200).json({
        data: maps
    });
});

app.use(express.static(buildDir, { index: false }));
app.get("*splat", async (req, res): Promise<any> => {
    try {
        // Inject meta tags for title and description based on the requested URL
        // It's either this or SSR... I chose this
        let html = readFileSync(path.resolve(buildDir, "index.html"), "utf8");
        let title = "strafes";
        let description = "Browse and view users, world records, maps, and ranks from the StrafesNET Roblox games (bhop and surf)";
        const url = req.params.splat.slice(1);
        const game = req.query.game ? formatGame(+req.query.game) : formatGame(Game.bhop);
        const style = req.query.style ? formatStyle(+req.query.style) : formatStyle(Style.autohop);
        if (url[0] === "") {
            title = "home";
        }
        else if (url[0] === "globals") {
            title = "globals";
            description = `View the latest world records (game: ${game}, style: ${style})`;
        }
        else if (url[0] === "ranks") {
            title = "ranks";
            description = `Explore the leaderboards (game: ${game}, style: ${style})`;
        }
        else if (url[0] === "users") {
            title = "users";
            description = "Search user profiles and times";
            if (url.length > 1) {
                const userId = url[1];
                const user = await getUserData(authClient, +userId);
                if (user) {
                    title = `@${user.username} - users`;
                    description = `View @${user.username}'s profile and times (game: ${game}, style: ${style})`;
                }
            }
        }
        else if (url[0] === "maps") {
            title = "maps";
            description = "Browse maps and view the top times";
            if (url.length > 1) {
                const mapId = url[1];
                const mapInfo = await globalsClient.getMap(+mapId);
                if (mapInfo) {
                    const course = req.query.course ? formatCourse(+req.query.course) : formatCourse(MAIN_COURSE);
                    const courseAbrev = req.query.course ? formatCourse(+req.query.course, true) : formatCourse(MAIN_COURSE, true);
                    title = `${mapInfo.name} - maps`;
                    if (course !== "main") {
                        title += ` (${courseAbrev})`;
                    }
                    const mapGame = req.query.game ? game : formatGame(mapInfo.game);
                    description = `View the top times on ${mapInfo.name} (game: ${mapGame}, style: ${style}, course: ${course})`;
                }
            }
        }
        else if (url[0] === "compare") {
            title = "compare";
            description = "Compare users head-to-head";
            const user1 = req.query.user1;
            const user2 = req.query.user2;
            if (user1 && typeof user1 === "string" && user2 && typeof user2 === "string") {
                const user1InfoPromise = getUserData(authClient, +user1);
                const user2InfoPromise = getUserData(authClient, +user2);
                const user1Info = await user1InfoPromise;
                const user2Info = await user2InfoPromise;
                if (user1Info && user2Info) {
                    title = `@${user1Info.username} vs @${user2Info.username} - compare`;
                    description = `Compare @${user1Info.username} vs @${user2Info.username} head-to-head (game: ${game}, style: ${style})`;
                }
            }
        }
        
        // Don't give anyone an XSS attack
        html = html.replace("__META_OG_TITLE__", escapeHTML(title));
        html = html.replaceAll("__META_DESCRIPTION__", escapeHTML(description));

        if (GOOGLE_SITE_VERIFICATION) {
            html = html.replace("__GOOGLE_SITE_VERIFICATION__", escapeHTML(GOOGLE_SITE_VERIFICATION));
        }
        
        return res.send(html);
    }
    catch {
        return res.status(500);
    }
});


app.listen(PORT, () => {
    console.log(`Strafes site on port ${PORT}`);
});
