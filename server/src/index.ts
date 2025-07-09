import apicache from "apicache";
import axios, { AxiosResponse } from "axios";
import express from "express";
import path from "path";
import memoize from 'memoize';
import { rateLimit } from 'express-rate-limit';
import { fileURLToPath } from "url";
import { Game, Map as StrafesMap, Pagination, Rank, TimeSortBy, Style, Time, User, RankSortBy } from "./interfaces.js";
import { exit } from "process";
import { MapToAsset } from "./util.js";

const STRAFES_KEY = process.env.STRAFES_KEY;
if (!STRAFES_KEY) {
    console.error("Missing StrafesNET API key");
    exit(1);
}

const app = express();
const port = process.env.PORT ?? "8080";
const isDebug = process.env.DEBUG === "true";
const cache = apicache.options(isDebug ? {headers: {"cache-control": "no-cache"}} : {}).middleware as (duration?: string | number) => any;
const rateLimitSettings = rateLimit({ windowMs: 60 * 1000, limit: isDebug ? 250 : 25, validate: {xForwardedForHeader: false} });
const pagedRateLimitSettings = rateLimit({ windowMs: 60 * 1000, limit: isDebug ? 250 : 80, validate: {xForwardedForHeader: false} });

const dirName = path.dirname(fileURLToPath(import.meta.url))
const buildDir = path.join(dirName, "../../client/build/");

function calcRank(rank: number) {
    return Math.floor((1 - rank) * 19) + 1;;
}

app.use(express.static(buildDir));

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

    const pageStart = (+start % 100)
    const pageEnd = (+end % 100)
    const ranks = ranksRes.data.data as any[];
    const rankArr: Rank[] = [];
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
            placement: ((page - 1) * 100) + i + 1
        });
    }

    res.status(200).json(rankArr);
});

app.get("/api/user/times/:id", pagedRateLimitSettings, cache("5 minutes"), async (req, res) => {
    const userId = req.params.id;
    const game = req.query.game;
    const style = req.query.style;
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

    if (!sort || isNaN(+sort) || TimeSortBy[+sort] === undefined) {
        res.status(400).json({error: "Invalid sort by"});
        return;
    }

    if (+start >= +end) {
        res.status(400).json({error: "Start must be higher than end"});
    }

    const timeInfo = await getTimesPaged(+start, +end, +sort, onlyWR, userId, +game, +style);
    
    if (!timeInfo) {
        res.status(404).json({error: "Not found"});
        return;
    }

    if (!onlyWR) {
        await setTimePlacements(timeInfo.data);
    }

    res.status(200).json(timeInfo);
});

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
    for (const timeRes of allTimes) {
        for (const time of timeRes.data.data) {
            timeArr.push({
                map: time.map.display_name,
                mapId: time.map.id,
                username: time.user.username,
                userId: time.user.id,
                time: time.time,
                date: time.date,
                game: time.game_id,
                style: time.style_id,
                updatedAt: time.updated_at,
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

app.get("/api/wrs", pagedRateLimitSettings, cache("5 minutes"), async (req, res) => {
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

    if (!sort || isNaN(+sort) || TimeSortBy[+sort] === undefined) {
        res.status(400).json({error: "Invalid sort by"});
        return;
    }

    if (+start >= +end) {
        res.status(400).json({error: "Start must be higher than end"});
    }

    const timeInfo = await getTimesPaged(+start, +end, +sort, true, undefined, +game, +style);
    
    if (!timeInfo) {
        res.status(404).json({error: "Not found"});
        return;
    }

    res.status(200).json(timeInfo);
});

async function getTimesPaged(start: number, end: number, sort: TimeSortBy, onlyWR: boolean, userId?: string, game?: Game, style?: Style) {
    const page = Math.floor(+start / 100) + 1;

    const timeRes = await tryGetStrafes(onlyWR ? "time/worldrecord" : "time", {
        user_id: userId,
        game_id: game === Game.all ? undefined : game,
        style_id: style === Style.all ? undefined : style,
        mode_id: 0,
        page_number: page,
        page_size: 100,
        sort_by: +sort
    });

    if (!timeRes) {
        return undefined;
    }

    const pageStart = (+start % 100)
    const pageEnd = (+end % 100)
    const firstTimes = timeRes.data.data;

    const timeArr: Time[] = [];
    for (let i = pageStart; (i < firstTimes.length) && (i <= pageEnd); ++i) {
        const time = firstTimes[i];
        timeArr.push({
            map: time.map.display_name,
            mapId: time.map.id,
            username: time.user.username,
            userId: time.user.id,
            time: time.time,
            date: time.date,
            game: time.game_id,
            style: time.style_id,
            updatedAt: time.updated_at,
            id: time.id
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

app.get("/api/map/times/:id", pagedRateLimitSettings, cache("5 minutes"), async (req, res) => {
    const mapId = req.params.id;
    const game = req.query.game;
    const style = req.query.style;
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
        mode_id: 0,
        page_number: page + 1,
        page_size: 100,
        sort_by: +sort
    });

    if (!firstTimeRes) {
        res.status(404).json({error: "Not found"});
        return;
    }

    const pageStart = (+start % 100)
    const pageEnd = (+end % 100)
    const firstTimes = firstTimeRes.data.data;

    const pageInfo = firstTimeRes.data.pagination;
    const pagination: Pagination = {
        page: pageInfo.page,
        pageSize: pageInfo.page_size,
        totalItems: pageInfo.total_items,
        totalPages: pageInfo.total_pages
    };

    const timeArr: Time[] = [];
    for (let i = pageStart; (i < firstTimes.length) && (i <= pageEnd); ++i) {
        const time = firstTimes[i];
        let placement: number | undefined;
        if (+sort === TimeSortBy.TimeAsc) {
            placement = (page * 100) + i + 1;
        }
        else if (+sort === TimeSortBy.TimeDesc) {
            placement =  pageInfo.total_items - ((page * 100) + i);
        }
        timeArr.push({
            map: time.map.display_name,
            mapId: time.map.id,
            username: time.user.username,
            userId: time.user.id,
            time: time.time,
            date: time.date,
            game: time.game_id,
            style: time.style_id,
            updatedAt: time.updated_at,
            id: time.id,
            placement: placement
        });
    }

    if (+sort === TimeSortBy.DateAsc || +sort == TimeSortBy.DateDesc) {
        await setTimePlacements(timeArr);
    }

    res.status(200).json({
        data: timeArr,
        pagination: pagination
    });
});

app.get("/api/maps", rateLimitSettings, cache("1 hour"), async (req, res) => {
    let i = 1;
    const maps: StrafesMap[] = [];
    while (true) {
        const mapRes = await tryGetStrafes("map", {
            page_number: i,
            page_size: 100
        });
        ++i;
        if (!mapRes) {
            res.status(404).json({error: "Not found"});
            return;
        }
        const data = mapRes.data.data as any[];
        if (data.length < 1) {
            break;
        }

        const assetToThumb = new Map<number, Map<string, string>>();
        const assetIds: number[] = [];
        for (const map of data) {
            const assetId = MapToAsset[map.id];
            if (assetId) {
                assetIds.push(assetId);
            }
        }
        const largeReqPromise = tryGetCached("https://thumbnails.roproxy.com/v1/assets", {
            "assetIds": assetIds,
            "size": "420x420",
            "format": "Webp"
        });
        
        const smallReqPromise = tryGetCached("https://thumbnails.roproxy.com/v1/assets", {
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
            const assetId = MapToAsset[map.id];
            let small, large;
            if (assetId) {
                const urls = assetToThumb.get(assetId);
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
                largeThumb: large
            });
        }

        if (data.length < 100) {
            break;
        }
    }

    res.status(200).json({
        data: maps
    });
});

app.get("*splat", (req, res) => {
    res.sendFile("index.html", {root: buildDir})
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

    const userRes = await userReq;
    if (!userRes) return undefined;
    const user = userRes.data;

    let url = "";
    const thumbRes = await thumbReq;
    if (thumbRes) {
        url = thumbRes.data.data[0].imageUrl;
    }

    const strafesUserRes = await strafesUserReq;
    if (!strafesUserRes) {
        return {
            displayName: user.displayName,
            id: userId,
            username: user.name,
            joinedOn: user.created,
            thumbUrl: url
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
        muted: strafesData.muted
    };
}

const tryGetCached = memoize(tryGetRequest, {cacheKey: JSON.stringify, maxAge: 5 * 60 * 1000});
const tryPostCached = memoize(tryPostRequest, {cacheKey: JSON.stringify, maxAge: 5 * 60 * 1000});
const tryGetStrafes = memoize(tryGetStrafesCore, {cacheKey: JSON.stringify, maxAge: 60 * 1000});

async function tryGetStrafesCore(end_of_url: string, params?: any) {
    const headers = {
        "X-API-Key": STRAFES_KEY
    };
    return await tryGetRequest(`https://api.strafes.net/api/v1/${end_of_url}`, params, headers);
}

async function tryGetRequest(url: string, params?: any, headers?: any) {
    try {
        return await axios.get(url, {params: params, headers: headers, timeout: 5000});
    } 
    catch (err) {
        //console.log(err);
        return undefined;
    }
}

async function tryPostRequest(url: string, params?: any) {
    try {
        return await axios.post(url, params, {timeout: 5000});
    } 
    catch (err) {
        //console.log(err);
        return undefined;
    }
}
