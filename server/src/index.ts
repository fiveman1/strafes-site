import apicache from "apicache";
import express from "express";
import path from "path";
import { rateLimit } from 'express-rate-limit';
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import { Game, Pagination, Rank, TimeSortBy, Style, Time, User, RankSortBy, LeaderboardCount, UserRole, LeaderboardSortBy, formatCourse, formatGame, formatStyle, MAIN_COURSE, UserSearchDataComplete } from "shared";
import { calcRank, safeQuoteText, validatePositiveInt } from "./util.js";
import { readFileSync } from "fs";
import { getMapWR, getUserWRs, getWRLeaderboardPage, getWRList, GlobalCountSQL, updateWRs } from "./globals.js";
import { tryGetCached, tryPostCached } from "./requests.js";
import { getAllUsersToRoles } from "./roles.js";
import { getAllMaps, getMap } from "./maps.js";
import { authorizeAndSetTokens, getSettings, loadSettingsFromDB, logout, redirectToAuthURL, setLoggedInUser, updateSettings } from "./oauth.js";
import { setUserInfoForList, setUserThumbsForList } from "./users.js";
import { getPlacements, getRanks, getTimes, getUserInfo, getUserRank } from "./strafes_api/api.js";
import { PagedTotalResponseTime } from "./strafes_api/client.js";

const app = express();
const PORT = process.env.PORT ?? "8080";
const IS_DEBUG = process.env.DEBUG === "true";
const GOOGLE_SITE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION;
const cache = apicache.options(IS_DEBUG ? {headers: {"cache-control": "no-cache"}} : {}).middleware as (duration?: string | number) => any;
const rateLimitSettings = rateLimit({ windowMs: 60 * 1000, limit: IS_DEBUG ? 250 : 25, validate: {xForwardedForHeader: false} });
const pagedRateLimitSettings = rateLimit({ windowMs: 60 * 1000, limit: IS_DEBUG ? 250 : 80, validate: {xForwardedForHeader: false} });

const dirName = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.join(dirName, "../../client/build/");

const COOKIE_SECRET = process.env.COOKIE_SECRET;
app.use(cookieParser(COOKIE_SECRET));

app.use(express.json());

app.get("/api/login", async (req, res) => {
    await redirectToAuthURL(res);
});

app.get("/api/logout", async (req, res) => {
    await logout(req, res);
});

app.get("/oauth/callback", async (req, res) => {
    await authorizeAndSetTokens(req, res);
});

app.get("/api/auth/user", async (req, res) => {
    await setLoggedInUser(req, res);
});

app.get("/api/settings", async (req, res) => {
    await getSettings(req, res);
});

app.post("/api/settings", async (req, res) => {
    await updateSettings(req, res);
});

app.get("/api/username", cache("5 minutes"), async (req, res) => {
    const username = req.query.username;
    
    if (!username || typeof username !== "string" || username.length > 50) {
        res.status(400).json({error: "Invalid username"});
        return;
    }

    const userId = await getUserId(username);
    if (!userId) {
        res.status(404).json({error: "Not found"});
        return;
    }

    res.status(200).json({id: userId});
});

const searchGUID = crypto.randomUUID();
app.get("/api/usersearch", cache("5 minutes"), async (req, res) => {
    const username = req.query.username;

    if (!username) {
        res.status(400).json({error: "Invalid username"});
        return;
    }

    const usernames: UserSearchDataComplete[] = [];
    const searchRes = await tryGetCached("https://apis.roproxy.com/search-api/omni-search", {
        verticalType: "user",
        searchQuery: username,
        sessionId: searchGUID
    });

    if (!searchRes || searchRes.data.searchResults.length === 0) {
        res.status(404).json({error: "Not found"});
        return;
    }

    for (const result of searchRes.data.searchResults[0].contents) {
        usernames.push({
            username: result.username,
            userId: result.contentId.toString(),
            previousUsernames: result.previousUsernames
        });
    }

    await setUserThumbsForList(usernames);

    res.status(200).json({usernames: usernames});

    // Below is an implementation using the web API that is actually documented, but it seems to not perform as well

    // const searchRes = await tryGetCached("https://users.roproxy.com/v1/users/search", {
    //     keyword: username,
    // });

    // if (!searchRes) {
    //     res.status(404).json({error: "Not found"});
    //     return;
    // }

    // for (const result of searchRes.data.data) {
    //     usernames.push(result.name);
    // }

    // res.status(200).json({usernames: usernames});
});

app.get("/api/user/:id", rateLimitSettings, cache("5 minutes"), async (req, res) => {
    const userId = req.params.id;
    if (typeof userId !== "string" || !validatePositiveInt(userId)) {
        res.status(400).json({error: "Invalid user ID"});
        return;
    }

    const user = await getUserData(userId);
    if (!user) {
        res.status(404).json({error: "Not found"});
        return;
    }

    res.status(200).json(user);
});

app.get("/api/user/rank/:id", rateLimitSettings, cache("5 minutes"), async (req, res) => {
    const userId = req.params.id;
    const game = req.query.game;
    const style = req.query.style;

    if (typeof userId !== "string" || !validatePositiveInt(userId)) {
        res.status(400).json({error: "Invalid user ID"});
        return;
    }

    if (!game || isNaN(+game) || Game[+game] === undefined || +game === Game.all) {
        res.status(400).json({error: "Invalid game"});
        return;
    }

    if (!style || isNaN(+style) || Style[+style] === undefined || +style == Style.all) {
        res.status(400).json({error: "Invalid style"});
        return;
    }

    const data = await getUserRank(userId, +game, +style);

    if (!data) {
        res.status(404).json({error: "Not found"});
        return;
    }

    const rank = calcRank(data.rank);

    const rankData : Rank = {
        id: data.id,
        style: +style,
        game: +game,
        rank: rank,
        skill: data.skill,
        userId: userId,
        username: data.user.username,
    };

    res.status(200).json(rankData);
});

app.get("/api/wrs/leaderboard", pagedRateLimitSettings, cache("5 minutes"), async (req, res) => {
    const game = req.query.game;
    const style = req.query.style;
    const start = req.query.start;
    const end = req.query.end;
    const qSort = req.query.sort;

    if (start === undefined || isNaN(+start) || +start < 0) {
        res.status(400).json({error: "Invalid start"});
        return;
    }

    if (end === undefined || isNaN(+end) || +end < 0) {
        res.status(400).json({error: "Invalid end"});
        return;
    }

    if (!game || isNaN(+game) || Game[+game] === undefined) {
        res.status(400).json({error: "Invalid game"});
        return;
    }

    if (!style || isNaN(+style) || Style[+style] === undefined) {
        res.status(400).json({error: "Invalid style"});
        return;
    }

    let sort = LeaderboardSortBy.MainDesc;
    if (qSort && !isNaN(+qSort) && LeaderboardSortBy[+qSort] !== undefined) {
        sort = +qSort;
    }

    if (+start >= +end) {
        res.status(400).json({error: "Start must be higher than end"});
    }

    const pageRes = await getWRLeaderboardPage(+start, +end, +game, +style, sort);

    if (!pageRes) {
        res.status(404).json({error: "Not found"});
        return;
    }

    const roles = await getAllUsersToRoles();
    const promises = [];
    for (const page of pageRes.data) {
        promises.push(convertToLeaderboardCount(page, +game, +style, roles));
    }

    const data = await Promise.all(promises);
    await setUserInfoForList(data);

    res.status(200).json({
        total: pageRes.total,
        data: data
    });
});

async function convertToLeaderboardCount(page: GlobalCountSQL, game: Game, style: Style, roles: Map<string, UserRole>): Promise<LeaderboardCount> {
    const wrs = await getUserWRs(page.userId, game, style) || [];

    let bonusCount = 0;
    let earliestDate: Date | undefined;
    let latestDate: Date | undefined;
    for (const wr of wrs) {
        if (wr.course !== 0) {
            ++bonusCount;
        }
        const wrDate = new Date(wr.date);
        if (!earliestDate || wrDate < earliestDate) {
            earliestDate = wrDate;
        }

        if (!latestDate || wrDate > latestDate) {
            latestDate = wrDate;
        }
    }

    return {
        userId: page.userId,
        username: page.username,
        userRole: roles.get(page.userId),
        count: +page.count,
        bonusCount: bonusCount,
        earliestDate: earliestDate ? earliestDate.toISOString() : "",
        latestDate: latestDate ? latestDate.toISOString() : ""
    };
}

app.get("/api/ranks", pagedRateLimitSettings, cache("5 minutes"), async (req, res) => {
    const game = req.query.game;
    const style = req.query.style;
    const start = req.query.start;
    const end = req.query.end;
    const sort = req.query.sort;

    if (start === undefined || isNaN(+start) || +start < 0) {
        res.status(400).json({error: "Invalid start"});
        return;
    }

    if (end === undefined || isNaN(+end) || +end < 0) {
        res.status(400).json({error: "Invalid end"});
        return;
    }

    if (!game || isNaN(+game) || Game[+game] === undefined || +game === Game.all) {
        res.status(400).json({error: "Invalid game"});
        return;
    }

    if (!style || isNaN(+style) || Style[+style] === undefined || +style === Style.all) {
        res.status(400).json({error: "Invalid style"});
        return;
    }

    if (!sort || isNaN(+sort) || RankSortBy[+sort] === undefined) {
        res.status(400).json({error: "Invalid sort by"});
        return;
    }

    const page = Math.floor(+start / 100) + 1;
    if (+start >= +end) {
        res.status(400).json({error: "Start must be higher than end"});
    }

    const ranksData = await getRanks(100, page, +game, +style, +sort);

    if (!ranksData) {
        res.status(404).json({error: "Not found"});
        return;
    }

    const pageStart = (+start % 100);
    const pageEnd = (+end % 100);
    const ranks = ranksData.data;
    const rankArr: Rank[] = [];
    const roles = await getAllUsersToRoles();

    for (let i = pageStart; (i < ranks.length) && (i <= pageEnd); ++i) {
        const data = ranks[i];
        const rank = calcRank(data.rank);
        const userId = data.user.id.toString();
        rankArr.push({
            id: data.id,
            style: +style,
            game: +game,
            rank: rank,
            skill: data.skill,
            userId: userId,
            username: data.user.username,
            userRole: roles.get(userId),
            placement: ((page - 1) * 100) + i + 1
        });
    }

    await setUserInfoForList(rankArr);

    const promises = [];
    for (const rank of rankArr) {
        promises.push(getUserWRs(rank.userId, +game, +style));
    }

    const resolved = await Promise.all(promises);
    
    for (let i = 0; i < resolved.length; ++i) {
        const wrs = resolved[i];
        const counts = getUserWRCounts(wrs);
        if (!counts.loaded) continue;
        rankArr[i].mainWrs = counts.mainWrs;
        rankArr[i].bonusWrs = counts.bonusWrs;
    }

    res.status(200).json(rankArr);
});

app.get("/api/user/times/:id", pagedRateLimitSettings, cache("5 minutes"), async (req, res) => {
    const userId = req.params.id;
    const game = req.query.game;
    const style = req.query.style;
    const course = req.query.course;
    const onlyWR = req.query.onlyWR ? req.query.onlyWR === "true" : false;
    const start = req.query.start;
    const end = req.query.end;
    const sort = req.query.sort;

    if (typeof userId !== "string" || !validatePositiveInt(userId)) {
        res.status(400).json({error: "Invalid user ID"});
        return;
    }

    if (start === undefined || isNaN(+start) || +start < 0) {
        res.status(400).json({error: "Invalid start"});
        return;
    }

    if (end === undefined || isNaN(+end) || +end < 0) {
        res.status(400).json({error: "Invalid end"});
        return;
    }

    if (!game || isNaN(+game) || Game[+game] === undefined) {
        res.status(400).json({error: "Invalid game"});
        return;
    }

    if (!style || isNaN(+style) || Style[+style] === undefined) {
        res.status(400).json({error: "Invalid style"});
        return;
    }

    if (course === undefined || isNaN(+course)) {
        res.status(400).json({error: "Invalid course"});
        return;
    }

    if (!sort || isNaN(+sort) || TimeSortBy[+sort] === undefined) {
        res.status(400).json({error: "Invalid sort by"});
        return;
    }

    if (+start >= +end) {
        res.status(400).json({error: "Start must be higher than end"});
    }

    const timeInfo = await getTimesPaged(+start, +end, +sort, +course, onlyWR, userId, +game, +style);
    
    if (!timeInfo) {
        res.status(404).json({error: "Not found"});
        return;
    }

    if (!onlyWR) {
        await setTimePlacements(timeInfo.data);
        await setTimeDiffs(timeInfo.data); // Has to happen after placements
    }

    res.status(200).json(timeInfo);
});

app.get("/api/user/times/completions/:id", pagedRateLimitSettings, cache("5 minutes"), async (req, res) => {
    const userId = req.params.id;
    const game = req.query.game;
    const style = req.query.style;

    if (typeof userId !== "string" || !validatePositiveInt(userId)) {
        res.status(400).json({error: "Invalid user ID"});
        return;
    }

    if (!game || isNaN(+game) || Game[+game] === undefined || +game === Game.all) {
        res.status(400).json({error: "Invalid game"});
        return;
    }

    if (!style || isNaN(+style) || Style[+style] === undefined || +style === Style.all) {
        res.status(400).json({error: "Invalid style"});
        return;
    }

    const timeData = await getTimes(userId, undefined, 1, 1, +game, +style, 0);

    if (!timeData) {
        res.status(404).json({error: "Not found"});
        return;
    }

    res.status(200).json({completions: timeData.pagination.total_items});
});

app.get("/api/user/times/wrs/:id", rateLimitSettings, cache("5 minutes"), async (req, res) => {
    const userId = req.params.id;
    const game = req.query.game;
    const style = req.query.style;

    if (typeof userId !== "string" || !validatePositiveInt(userId)) {
        res.status(400).json({error: "Invalid user ID"});
        return;
    }

    if (!game || isNaN(+game) || Game[+game] === undefined) {
        res.status(400).json({error: "Invalid game"});
        return;
    }

    if (!style || isNaN(+style) || Style[+style] === undefined) {
        res.status(400).json({error: "Invalid style"});
        return;
    }

    const wrs = await getUserWRs(userId, +game, +style);

    res.status(200).json(getUserWRCounts(wrs));
});

function getUserWRCounts(wrs?: Time[]) {
    let mainWrs = 0;
    let bonusWrs = 0;
    let loaded = false;
    
    if (wrs !== undefined) {
        loaded = true;
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
        loaded: loaded,
        mainWrs: mainWrs,
        bonusWrs: bonusWrs
    };
}

app.get("/api/user/times/all/:id", rateLimitSettings, cache("5 minutes"), async (req, res) => {
    const userId = req.params.id;
    const qGame = req.query.game;
    const qStyle = req.query.style;

    if (typeof userId !== "string" || !validatePositiveInt(userId)) {
        res.status(400).json({error: "Invalid user ID"});
        return;
    }

    if (!qGame || isNaN(+qGame) || Game[+qGame] === undefined || +qGame === Game.all) {
        res.status(400).json({error: "Invalid game"});
        return;
    }

    if (!qStyle || isNaN(+qStyle) || Style[+qStyle] === undefined || +qStyle == Style.all) {
        res.status(400).json({error: "Invalid style"});
        return;
    }

    const game: Game = +qGame;
    const style: Style = +qStyle;

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
            res.status(404).json({error: "Not found"});
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
            timeArr.push({
                map: time.map.display_name,
                mapId: time.map.id,
                username: time.user.username,
                userId: (time.user.id as number).toString(),
                time: time.time,
                date: time.date,
                game: time.game_id,
                style: time.style_id,
                course: time.mode_id,
                id: time.id
            });
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
            const wr = await getMapWR(pieces[0], +pieces[1], +pieces[2], +pieces[3]);
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
        await updateWRs(newWrs);
        await setTimeDiffs(times, true); // Recalculate
    }
}

function getMapKey(time: Time) {
    return `${time.mapId},${time.game},${time.style},${time.course}`;
}

app.get("/api/wrs", pagedRateLimitSettings, cache("5 minutes"), async (req, res) => {
    const game = req.query.game;
    const style = req.query.style;
    const course = req.query.course;
    const start = req.query.start;
    const end = req.query.end;
    const sort = req.query.sort;

    if (start === undefined || isNaN(+start) || +start < 0) {
        res.status(400).json({error: "Invalid start"});
        return;
    }

    if (end === undefined || isNaN(+end) || +end < 0) {
        res.status(400).json({error: "Invalid end"});
        return;
    }

    if (!game || isNaN(+game) || Game[+game] === undefined) {
        res.status(400).json({error: "Invalid game"});
        return;
    }

    if (!style || isNaN(+style) || Style[+style] === undefined) {
        res.status(400).json({error: "Invalid style"});
        return;
    }

    if (course === undefined || isNaN(+course)) {
        res.status(400).json({error: "Invalid course"});
        return;
    }

    if (!sort || isNaN(+sort) || TimeSortBy[+sort] === undefined) {
        res.status(400).json({error: "Invalid sort by"});
        return;
    }

    if (+start >= +end) {
        res.status(400).json({error: "Start must be higher than end"});
    }

    const timeInfo = await getTimesPaged(+start, +end, +sort, +course, true, undefined, +game, +style);
    
    if (!timeInfo) {
        res.status(404).json({error: "Not found"});
        return;
    }

    res.status(200).json(timeInfo);
});

async function getTimesPaged(start: number, end: number, sort: TimeSortBy, course: number, onlyWR: boolean, userId?: string, game?: Game, style?: Style) {
    let timeArr: Time[] = [];
    let pagination: Pagination;
    const roles = await getAllUsersToRoles();

    if (onlyWR) {
        const { total, wrs } = await getWRList(start, end, game ?? Game.all, style ?? Style.all, sort, course, userId);
        
        if (!wrs) return undefined;

        for (const wr of wrs) {
            wr.userRole = roles.get(wr.userId);
        }

        timeArr = wrs;
        pagination = {
            page: -1,
            pageSize: -1,
            totalItems: total,
            totalPages: -1
        };
    }
    else {
        const page = Math.floor(+start / 100) + 1;
        const pageStart = (+start % 100);
        const pageEnd = (+end % 100);

        const data = await getTimes(userId, undefined, 100, page, game, style, course, +sort);

        if (!data) {
            return undefined;
        }
        const resTimes = data.data;

        const timeIds = new Set<string>();
        for (let i = pageStart; (i < resTimes.length) && (i <= pageEnd); ++i) {
            const time = resTimes[i];
            if (timeIds.has(time.id)) {
                // There is a bug with the API where sometimes it returns duplicate times! Awesome!
                continue;
            }
            timeIds.add(time.id);
            const timeUserId = time.user.id.toString();
            timeArr.push({
                map: time.map.display_name,
                mapId: time.map.id,
                username: time.user.username,
                userId: timeUserId,
                userRole: roles.get(timeUserId),
                time: time.time,
                date: time.date,
                game: time.game_id,
                style: time.style_id,
                id: time.id,
                course: time.mode_id,
                placement: onlyWR ? 1 : undefined
            });
        }

        const pageInfo = data.pagination;
        pagination = {
            page: pageInfo.page,
            pageSize: pageInfo.page_size,
            totalItems: onlyWR ? -1 : pageInfo.total_items,
            totalPages: onlyWR ? -1 : pageInfo.total_pages
        };
    }

    await setUserInfoForList(timeArr);

    return {
        data: timeArr,
        pagination: pagination
    };
}

interface APITime {
    time: number
    date: string
}

function sortTimes(times: APITime[], isAsc: boolean) {
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

app.get("/api/map/times/:id", pagedRateLimitSettings, cache("5 minutes"), async (req, res) => {
    const mapId = req.params.id;
    const game = req.query.game;
    const style = req.query.style;
    const qCourse = req.query.course;
    const start = req.query.start;
    const end = req.query.end;
    const sort = req.query.sort;

    if (typeof mapId !== "string" || !validatePositiveInt(mapId)) {
        res.status(400).json({error: "Invalid map ID"});
        return;
    }

    if (start === undefined || isNaN(+start) || +start < 0) {
        res.status(400).json({error: "Invalid start"});
        return;
    }

    if (end === undefined || isNaN(+end) || +end < 0) {
        res.status(400).json({error: "Invalid end"});
        return;
    }

    if (!game || isNaN(+game) || Game[+game] === undefined || +game === Game.all) {
        res.status(400).json({error: "Invalid game"});
        return;
    }

    if (!style || isNaN(+style) || Style[+style] === undefined || +style == Style.all) {
        res.status(400).json({error: "Invalid style"});
        return;
    }

    if (qCourse === undefined || isNaN(+qCourse)) {
        res.status(400).json({error: "Invalid course"});
        return;
    }
    const course = +qCourse;

    if (!sort || isNaN(+sort) || TimeSortBy[+sort] === undefined) {
        res.status(400).json({error: "Invalid sort by"});
        return;
    }

    const page = Math.floor(+start / 100);
    if (+start >= +end) {
        res.status(400).json({error: "Start must be higher than end"});
    }

    const firstTimeData = await getTimes(undefined, mapId, 100, page + 1, +game, +style, course, +sort);

    if (!firstTimeData) {
        res.status(404).json({error: "Not found"});
        return;
    }

    const roles = await getAllUsersToRoles();

    const pageStart = (+start % 100);
    const pageEnd = (+end % 100);
    const firstTimes = firstTimeData.data;

    if (+sort === TimeSortBy.TimeAsc) {
        sortTimes(firstTimes, true);
    }
    else if (+sort === TimeSortBy.TimeDesc) {
        sortTimes(firstTimes, false);
    }

    const pageInfo = firstTimeData.pagination;
    const pagination: Pagination = {
        page: pageInfo.page,
        pageSize: pageInfo.page_size,
        totalItems: pageInfo.total_items,
        totalPages: pageInfo.total_pages
    };

    const timeArr: Time[] = [];
    const timeIds = new Set<string>();
    for (let i = pageStart; (i < firstTimes.length) && (i <= pageEnd); ++i) {
        const time = firstTimes[i];
        let placement: number | undefined;
        if (+sort === TimeSortBy.TimeAsc) {
            placement = (page * 100) + i + 1;
        }
        else if (+sort === TimeSortBy.TimeDesc) {
            placement =  pageInfo.total_items - ((page * 100) + i);
        }
        if (timeIds.has(time.id)) {
            // There is a bug with the API where sometimes it returns duplicate times! Awesome!
            continue;
        }
        timeIds.add(time.id);
        const timeUserId = time.user.id.toString();
        timeArr.push({
            map: time.map.display_name,
            mapId: time.map.id,
            username: time.user.username,
            userId: timeUserId,
            userRole: roles.get(timeUserId),
            time: time.time,
            date: time.date,
            game: time.game_id,
            style: time.style_id,
            id: time.id,
            course: time.mode_id,
            placement: placement
        });
    }

    const promises = [];
    if (+sort === TimeSortBy.DateAsc || +sort == TimeSortBy.DateDesc) {
        promises.push(setTimePlacements(timeArr));
    }
    promises.push(setUserInfoForList(timeArr));

    await Promise.all(promises);
    await setTimeDiffs(timeArr); // Has to happen after placements are calculated

    res.status(200).json({
        data: timeArr,
        pagination: pagination
    });
});

app.get("/api/maps", rateLimitSettings, cache("1 hour"), async (req, res) => {
    const maps = await getAllMaps();
    
    if (!maps) {
        res.status(404).json({error: "Not found"});
        return;
    }

    res.status(200).json({
        data: maps
    });
});

app.use(express.static(buildDir, {index: false}));
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
                const user = await getUserData(userId);
                if (user) {
                    title = `users - @${user.username}`;
                    description = `View @${user.username}'s profile and times (game: ${game}, style: ${style})`;
                }
            }
        }
        else if (url[0] === "maps") {
            title = "maps";
            description = "Browse maps and view the top times";
            if (url.length > 1) {
                const mapId = url[1];
                const mapInfo = await getMap(mapId);
                if (mapInfo) {
                    const course = req.query.course ? formatCourse(+req.query.course) : formatCourse(MAIN_COURSE);
                    const courseAbrev = req.query.course ? formatCourse(+req.query.course, true) : formatCourse(MAIN_COURSE, true);
                    title = `maps - ${mapInfo.name}`;
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
                const user1InfoPromise = getUserData(user1);
                const user2InfoPromise = getUserData(user2);
                const user1Info = await user1InfoPromise;
                const user2Info = await user2InfoPromise;
                if (user1Info && user2Info) {
                    title = `compare - @${user1Info.username} vs @${user2Info.username}`;
                    description = `Compare @${user1Info.username} vs @${user2Info.username} head-to-head (game: ${game}, style: ${style})`;
                }
            }
        }
        // Don't give Roblox or Quat/itzaname an XSS attack (safeQuoteText)
        html = html.replace("__META_OG_TITLE__", safeQuoteText(title));
        html = html.replaceAll("__META_DESCRIPTION__", safeQuoteText(description));

        if (GOOGLE_SITE_VERIFICATION) {
            html = html.replace("__GOOGLE_SITE_VERIFICATION__", GOOGLE_SITE_VERIFICATION);
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

async function getUserId(username: string): Promise<undefined | string> {
    const res = await tryPostCached("https://users.roblox.com/v1/usernames/users", {
        usernames: [username] 
    });
    if (!res) return undefined;
    
    const data = res.data.data as any[];
    if (data.length === 0) return undefined;

    const user = data[0];
    return user.id.toString();
}

async function getUserData(userId: string): Promise<undefined | User> {
    const userReq = tryGetCached("https://users.roblox.com/v1/users/" + userId);
    const thumbReq = tryGetCached("https://thumbnails.roblox.com/v1/users/avatar-headshot", {
        userIds: userId,
        size: "180x180",
        format: "Png",
        isCircular: false
    });
    const strafesUserReq = getUserInfo(userId);
    const userRolesReq = getAllUsersToRoles();
    const settingsPromise = loadSettingsFromDB(userId);

    const userRes = await userReq;
    if (!userRes) return undefined;
    const user = userRes.data;

    let url = "";
    const thumbRes = await thumbReq;
    if (thumbRes) {
        url = thumbRes.data.data[0].imageUrl;
    }

    const strafesUserData = await strafesUserReq;
    const userRoles = await userRolesReq;
    const role = userRoles.get(userId);
    const settings = await settingsPromise;

    if (!strafesUserData) {
        return {
            displayName: user.displayName,
            id: userId,
            username: user.name,
            joinedOn: user.created,
            thumbUrl: url,
            role: role,
            country: settings?.country
        };
    }

    return {
        displayName: user.displayName,
        id: userId,
        username: user.name,
        joinedOn: user.created,
        thumbUrl: url,
        status: strafesUserData.state_id,
        muted: strafesUserData.muted,
        role: role,
        country: settings?.country
    };
}
