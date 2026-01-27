import apicache from "apicache";
import { AxiosResponse } from "axios";
import express from "express";
import path from "path";
import { rateLimit } from 'express-rate-limit';
import { fileURLToPath } from "url";
import { Game, Pagination, Rank, TimeSortBy, Style, Time, User, RankSortBy, UserSearchData, LeaderboardCount, UserRole, LeaderboardSortBy } from "./interfaces.js";
import { formatCourse, formatGame, formatStyle, MAIN_COURSE, safeQuoteText } from "./util.js";
import { readFileSync } from "fs";
import { getMapWR, getUserWRs, getWRLeaderboardPage, GlobalCountSQL, Record } from "./globals.js";
import { tryGetCached, tryGetMaps, tryGetStrafes, tryPostCached } from "./requests.js";
import { getAllUsersToRoles } from "./roles.js";
import { getMaps } from "./maps.js";

const app = express();
const port = process.env.PORT ?? "8080";
const isDebug = process.env.DEBUG === "true";
const cache = apicache.options(isDebug ? {headers: {"cache-control": "no-cache"}} : {}).middleware as (duration?: string | number) => any;
const rateLimitSettings = rateLimit({ windowMs: 60 * 1000, limit: isDebug ? 250 : 25, validate: {xForwardedForHeader: false} });
const pagedRateLimitSettings = rateLimit({ windowMs: 60 * 1000, limit: isDebug ? 250 : 80, validate: {xForwardedForHeader: false} });

const dirName = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.join(dirName, "../../client/build/");

function calcRank(rank: number) {
    return Math.floor((1 - rank) * 19) + 1;
}

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

    const usernames: UserSearchData[] = [];
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
            id: result.contentId.toString(),
            previousUsernames: result.previousUsernames
        });
    }

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

function validatePositiveInt(userId: any) {
    return !isNaN(+userId) && +userId > 0;
}

app.get("/api/user/:id", rateLimitSettings, cache("5 minutes"), async (req, res) => {
    const userId = req.params.id;
    if (!validatePositiveInt(userId)) {
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

    if (!validatePositiveInt(userId)) {
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

    const rankRes = await tryGetStrafes(`user/${userId}/rank`, {
        id: userId,
        game_id: game,
        style_id: style,
        mode_id: 0
    });

    if (!rankRes) {
        res.status(404).json({error: "Not found"});
        return;
    }

    const data = rankRes.data.data;
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

    res.status(200).json({
        total: pageRes.total,
        data: await Promise.all(promises)
    });
});

async function convertToLeaderboardCount(page: GlobalCountSQL, game: Game, style: Style, roles: Map<number, UserRole>): Promise<LeaderboardCount> {
    const wrs = await getUserWRs(page.userId, game, style) || [];

    let bonusCount = 0;
    let earliestDate, latestDate;
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
        userRole: roles.get(+page.userId),
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

    if (!game || isNaN(+game) || Game[+game] === undefined) {
        res.status(400).json({error: "Invalid game"});
        return;
    }

    if (!style || isNaN(+style) || Style[+style] === undefined) {
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

    const ranksRes = await tryGetStrafes("rank", {
        game_id: +game === Game.all ? undefined : +game,
        style_id: +style === Style.all ? undefined : +style,
        mode_id: 0,
        page_number: page,
        page_size: 100,
        sort_by: +sort
    });

    if (!ranksRes) {
        res.status(404).json({error: "Not found"});
        return;
    }

    const pageStart = (+start % 100);
    const pageEnd = (+end % 100);
    const ranks = ranksRes.data.data as any[];
    const rankArr: Rank[] = [];
    const roles = await getAllUsersToRoles();

    for (let i = pageStart; (i < ranks.length) && (i <= pageEnd); ++i) {
        const data = ranks[i];
        const rank = calcRank(data.rank);
        rankArr.push({
            id: data.id,
            style: +style,
            game: +game,
            rank: rank,
            skill: data.skill,
            userId: data.user.id,
            username: data.user.username,
            userRole: roles.get(+data.user.id),
            placement: ((page - 1) * 100) + i + 1
        });
    }

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

    if (!validatePositiveInt(userId)) {
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
        const promises = [];
        promises.push(setTimePlacements(timeInfo.data));
        promises.push(setTimeDiffs(timeInfo.data));
        await Promise.all(promises);
    }

    res.status(200).json(timeInfo);
});

app.get("/api/user/times/completions/:id", pagedRateLimitSettings, cache("5 minutes"), async (req, res) => {
    const userId = req.params.id;
    const game = req.query.game;
    const style = req.query.style;

    if (!validatePositiveInt(userId)) {
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

    const timeRes = await tryGetStrafes("time", {
        user_id: userId,
        game_id: game,
        style_id: style,
        mode_id: 0,
        page_size: 1
    });

    if (!timeRes) {
        res.status(404).json({error: "Not found"});
        return;
    }

    res.status(200).json({completions: timeRes.data.pagination.total_items});
});

app.get("/api/user/times/wrs/:id", rateLimitSettings, cache("5 minutes"), async (req, res) => {
    const userId = req.params.id;
    const game = req.query.game;
    const style = req.query.style;

    if (!validatePositiveInt(userId)) {
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

function getUserWRCounts(wrs?: Record[]) {
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

    if (!validatePositiveInt(userId)) {
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

    const firstTimeRes = await tryGetStrafes("time", {
        user_id: userId,
        game_id: game,
        style_id: style,
        mode_id: 0,
        page_number: 1,
        page_size: 100,
        sort_by: TimeSortBy.DateDesc
    });

    if (!firstTimeRes) {
        return undefined;
    }

    const pageInfo = firstTimeRes.data.pagination;
    const pagination: Pagination = {
        page: pageInfo.page,
        pageSize: pageInfo.page_size,
        totalItems: pageInfo.total_items,
        totalPages: pageInfo.total_pages
    };

    const promises: Promise<AxiosResponse<any, any> | undefined>[] = [];
    for (let i = 2; i <= pagination.totalPages; ++i) {
        promises.push(tryGetStrafes("time", {
            user_id: userId,
            game_id: game,
            style_id: style,
            mode_id: 0,
            page_number: i,
            page_size: 100,
            sort_by: TimeSortBy.DateDesc
        }));
    }
    const resolved = await Promise.all(promises);
    const allTimes = [firstTimeRes];
    for (const timeRes of resolved) {
        if (!timeRes) {
            res.status(404).json({error: "Not found"});
            return;
        }
        allTimes.push(timeRes);
    }

    const timeArr: Time[] = [];
    const timeIds = new Set<number>();
    for (const timeRes of allTimes) {
        for (const time of timeRes.data.data) {
            if (timeIds.has(time.id)) {
                // There is a bug with the API where sometimes it returns duplicate times! Awesome!
                continue;
            }
            timeIds.add(time.id);
            timeArr.push({
                map: time.map.display_name,
                mapId: time.map.id,
                username: time.user.username,
                userId: time.user.id,
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
    const placementRes = await tryGetStrafes("time/placement", {
        ids: timeIds.join(",")
    });
    const idToPlacement = new Map<string, number>();
    if (placementRes) {
        for (const placementInfo of placementRes.data.data) {
            idToPlacement.set(placementInfo.id, placementInfo.placement);
        }
    }
    for (const time of times) {
        time.placement = idToPlacement.get(time.id);
    }
}

async function setTimeDiffs(times: Time[]) {
    if (times.length < 1) {
        return;
    }

    const mapToWR = new Map<string, Record>();
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

    for (const time of times) {
        const mapKey = getMapKey(time);
        const wr = mapToWR.get(mapKey);
        if (wr) {
            time.wrDiff = time.time - wr.time;
        }
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
    const page = Math.floor(+start / 100) + 1;

    const timeRes = await tryGetStrafes(onlyWR ? "time/worldrecord" : "time", {
        user_id: userId,
        game_id: game === Game.all ? undefined : game,
        style_id: style === Style.all ? undefined : style,
        mode_id: course >= 0 ? course : undefined,
        page_number: page,
        page_size: 100,
        sort_by: +sort
    });

    if (!timeRes) {
        return undefined;
    }

    const roles = await getAllUsersToRoles();

    const pageStart = (+start % 100);
    const pageEnd = (+end % 100);
    const resTimes = timeRes.data.data;

    const timeArr: Time[] = [];
    const timeIds = new Set<number>();
    for (let i = pageStart; (i < resTimes.length) && (i <= pageEnd); ++i) {
        const time = resTimes[i];
        if (timeIds.has(time.id)) {
            // There is a bug with the API where sometimes it returns duplicate times! Awesome!
            continue;
        }
        timeIds.add(time.id);
        timeArr.push({
            map: time.map.display_name,
            mapId: time.map.id,
            username: time.user.username,
            userId: time.user.id,
            userRole: roles.get(+time.user.id),
            time: time.time,
            date: time.date,
            game: time.game_id,
            style: time.style_id,
            id: time.id,
            course: time.mode_id,
            placement: onlyWR ? 1 : undefined
        });
    }

    const pageInfo = timeRes.data.pagination;
    const pagination: Pagination = {
        page: pageInfo.page,
        pageSize: pageInfo.page_size,
        totalItems: onlyWR ? -1 : pageInfo.total_items,
        totalPages: onlyWR ? -1 : pageInfo.total_pages
    };

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

    if (!validatePositiveInt(mapId)) {
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

    const firstTimeRes = await tryGetStrafes("time", {
        map_id: mapId,
        game_id: game,
        style_id: style,
        mode_id: course >= 0 ? course : undefined,
        page_number: page + 1,
        page_size: 100,
        sort_by: +sort
    });

    if (!firstTimeRes) {
        res.status(404).json({error: "Not found"});
        return;
    }

    const roles = await getAllUsersToRoles();

    const pageStart = (+start % 100);
    const pageEnd = (+end % 100);
    const firstTimes = firstTimeRes.data.data;

    if (+sort === TimeSortBy.TimeAsc) {
        sortTimes(firstTimes, true);
    }
    else if (+sort === TimeSortBy.TimeDesc) {
        sortTimes(firstTimes, false);
    }

    const pageInfo = firstTimeRes.data.pagination;
    const pagination: Pagination = {
        page: pageInfo.page,
        pageSize: pageInfo.page_size,
        totalItems: pageInfo.total_items,
        totalPages: pageInfo.total_pages
    };

    const timeArr: Time[] = [];
    const timeIds = new Set<number>();
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
        timeArr.push({
            map: time.map.display_name,
            mapId: time.map.id,
            username: time.user.username,
            userId: time.user.id,
            userRole: roles.get(+time.user.id),
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
    promises.push(setTimeDiffs(timeArr));

    await Promise.all(promises);

    res.status(200).json({
        data: timeArr,
        pagination: pagination
    });
});

app.get("/api/maps", rateLimitSettings, cache("1 hour"), async (req, res) => {
    const maps = await getMaps();
    
    if (!maps) {
        res.status(404).json({error: "Not found"});
        return;
    }

    res.status(200).json({
        data: maps
    });
});

async function getMapInfo(mapId: string) {
    const res = await tryGetMaps(`map/${mapId}`);
    if (!res) {
        return undefined;
    }
    return res.data.data as {
        creator: string,
        date: string,
        display_name: string,
        game_id: Game,
        id: number
    };
}

app.use(express.static(buildDir, {index: false}));
app.get("*splat", async (req, res): Promise<any> => {
    try {
        // Inject meta tags for title and description based on the requested URL
        // It's either this or SSR... I chose this
        let html = readFileSync(path.resolve(buildDir, "index.html"), "utf8");
        let title = "strafes";
        let description = "Browse and view users, world records, maps, and ranks from the StrafesNET Roblox games (bhop and surf)";
        const url = (req.params as {splat: string[]}).splat.slice(1); // why isn't this automatically typed...
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
                const mapInfo = await getMapInfo(mapId);
                if (mapInfo) {
                    const course = req.query.course ? formatCourse(+req.query.course) : formatCourse(MAIN_COURSE);
                    const courseAbrev = req.query.course ? formatCourse(+req.query.course, true) : formatCourse(MAIN_COURSE, true);
                    title = `maps - ${mapInfo.display_name}`;
                    if (course !== "main") {
                        title += ` (${courseAbrev})`;
                    }
                    const mapGame = req.query.game ? game : formatGame(mapInfo.game_id);
                    description = `View the top times on ${mapInfo.display_name} (game: ${mapGame}, style: ${style}, course: ${course})`;
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
        return res.send(html);
    }
    catch {
        return res.status(500);
    }
});


app.listen(port, () => {
    console.log(`Strafes site on port ${port}`);
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
    const strafesUserReq = tryGetStrafes("user/" + userId);
    const userRolesReq = getAllUsersToRoles();

    const userRes = await userReq;
    if (!userRes) return undefined;
    const user = userRes.data;

    let url = "";
    const thumbRes = await thumbReq;
    if (thumbRes) {
        url = thumbRes.data.data[0].imageUrl;
    }

    const strafesUserRes = await strafesUserReq;
    const userRoles = await userRolesReq;
    const role = userRoles.get(+userId);

    if (!strafesUserRes) {
        return {
            displayName: user.displayName,
            id: userId,
            username: user.name,
            joinedOn: user.created,
            thumbUrl: url,
            role: role
        };
    }
    const strafesData = strafesUserRes.data.data;

    return {
        displayName: user.displayName,
        id: userId,
        username: user.name,
        joinedOn: user.created,
        thumbUrl: url,
        status: strafesData.state_id,
        muted: strafesData.muted,
        role: role
    };
}
