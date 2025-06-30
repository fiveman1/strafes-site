import apicache from "apicache";
import axios from "axios";
import express from "express";
import path from "path";
import memoize from 'memoize';
import { rateLimit } from 'express-rate-limit';
import { fileURLToPath } from "url";
import { Game, Map, Pagination, RankData, Style, Time, User } from "./interfaces.js";
import { exit } from "process";

const app = express();
const port = process.env.PORT ?? "8080";
const cache = apicache.middleware;
const rateLimitSettings = rateLimit({ windowMs: 60 * 1000, limit: 25, validate: {xForwardedForHeader: false} });
const pagedRateLimitSettings = rateLimit({ windowMs: 60 * 1000, limit: 80, validate: {xForwardedForHeader: false} })

const STRAFES_KEY = process.env.STRAFES_KEY;
if (!STRAFES_KEY) {
    console.error("Missing StrafesNET API key");
    exit(1);
}

const dirName = path.dirname(fileURLToPath(import.meta.url))
const buildDir = path.join(dirName, "../../client/build/");

app.use(express.static(buildDir));

app.get("/api/username", cache("1 hour"), async (req, res) => {
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

app.get("/api/user/:id", cache("1 hour"), async (req, res) => {
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

    if (!game || isNaN(+game) || Game[+game] === undefined) {
        res.status(400).json({error: "Invalid game"});
        return;
    }

    if (!style || isNaN(+style) || Style[+style] === undefined) {
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
    const rank = 1 + Math.floor((1 - data.rank) * 19);

    const rankData : RankData = {
        style: +style,
        game: +game,
        rank: rank,
        skill: data.skill,
        userId: userId
    };

    res.status(200).json(rankData);
});

app.get("/api/user/times/:id", pagedRateLimitSettings, cache("5 minutes"), async (req, res) => {
    const userId = req.params.id;
    const game = req.query.game;
    const style = req.query.style;
    const onlyWR = req.query.onlyWR ? req.query.onlyWR === "true" : false;
    const start = req.query.start;
    const end = req.query.end;

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

    const page = Math.floor(+start / 100) + 1;
    if (+start >= +end) {
        res.status(400).json({error: "Start must be higher than end"});
    }

    const firstTimeRes = await tryGetStrafes(onlyWR ? "time/worldrecord" : "time", {
        user_id: userId,
        game_id: game,
        style_id: style,
        mode_id: 0,
        page_number: page,
        page_size: 100,
        sort_by: 3
    });

    if (!firstTimeRes) {
        res.status(404).json({error: "Not found"});
        return;
    }

    const pageStart = (+start % 100)
    const pageEnd = (+end % 100)
    const firstTimes = firstTimeRes.data.data;

    const timeArr: Time[] = [];
    for (let i = pageStart; (i < firstTimes.length) && (i <= pageEnd); ++i) {
        const time = firstTimes[i];
        timeArr.push({
            map: time.map.display_name,
            username: time.user.username,
            time: time.time,
            date: time.date,
            game: time.game_id,
            style: time.style_id,
            updatedAt: time.updated_at,
            id: time.id
        });
    }

    const pageInfo = firstTimeRes.data.pagination;
    const pagination: Pagination = {
        page: pageInfo.page,
        pageSize: pageInfo.page_size,
        totalItems: onlyWR ? timeArr.length : pageInfo.total_items,
        totalPages: onlyWR ? 1 : pageInfo.total_pages
    };

    res.status(200).json({
        data: timeArr,
        pagination: pagination
    });
});

app.get("/api/map/times/:id", pagedRateLimitSettings, cache("5 minutes"), async (req, res) => {
    const mapId = req.params.id;
    const game = req.query.game;
    const style = req.query.style;
    const start = req.query.start;
    const end = req.query.end;

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

    if (!game || isNaN(+game) || Game[+game] === undefined) {
        res.status(400).json({error: "Invalid game"});
        return;
    }

    if (!style || isNaN(+style) || Style[+style] === undefined) {
        res.status(400).json({error: "Invalid style"});
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
        sort_by: 0
    });

    if (!firstTimeRes) {
        res.status(404).json({error: "Not found"});
        return;
    }

    const pageStart = (+start % 100)
    const pageEnd = (+end % 100)
    const firstTimes = firstTimeRes.data.data;

    const timeArr: Time[] = [];
    for (let i = pageStart; (i < firstTimes.length) && (i <= pageEnd); ++i) {
        const time = firstTimes[i];
        timeArr.push({
            map: time.map.display_name,
            username: time.user.username,
            time: time.time,
            date: time.date,
            game: time.game_id,
            style: time.style_id,
            updatedAt: time.updated_at,
            id: time.id,
            placement: (page * 100) + i + 1
        });
    }

    const pageInfo = firstTimeRes.data.pagination;
    const pagination: Pagination = {
        page: pageInfo.page,
        pageSize: pageInfo.page_size,
        totalItems: pageInfo.total_items,
        totalPages: pageInfo.total_pages
    };

    res.status(200).json({
        data: timeArr,
        pagination: pagination
    });
});

app.get("/api/maps", cache("1 hour"), rateLimitSettings, async (req, res) => {
    let i = 1;
    const maps: Map[] = [];
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
        for (const map of data) {
            maps.push({
                id: map.id,
                name: map.display_name,
                creator: map.creator,
                game: map.game_id,
                date: map.date
            });
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
    console.log(`Example app listening on port ${port}`);
});

async function getUserId(username: string): Promise<undefined | string> {
    const res = await tryPostRequest("https://users.roblox.com/v1/usernames/users", {
        usernames: [username] 
    });
    if (!res) return undefined;
    
    const data = res.data.data as any[];
    if (data.length === 0) return undefined;

    const user = data[0];
    return user.id.toString();
}

async function getUserData(userId: string): Promise<undefined | User> {
    const userReq = tryGetRequest("https://users.roblox.com/v1/users/" + userId);
    const thumbReq = tryGetRequest("https://thumbnails.roblox.com/v1/users/avatar-headshot", {
        userIds: userId,
        size: "180x180",
        format: "Png",
        isCircular: false
    })

    const userRes = await userReq;
    if (!userRes) return undefined;
    const user = userRes.data

    let url = "";
    const thumbRes = await thumbReq;
    if (thumbRes) {
        url = thumbRes.data.data[0].imageUrl
    }

    return {
        displayName: user.displayName,
        id: userId,
        username: user.name,
        joinedOn: user.created,
        thumbUrl: url
    };
}

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
