import apicache from "apicache";
import axios from "axios";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { Game, RankData, Style, User } from "./interfaces";
import { exit } from "process";

const app = express();
const port = process.env.PORT ?? "8080";
const cache = apicache.middleware;

const STRAFES_KEY = process.env.STRAFES_KEY;
if (!STRAFES_KEY) {
    console.error("Missing StrafesNET API key");
    exit(1);
}

const dirName = path.dirname(fileURLToPath(import.meta.url))
const buildDir = path.join(dirName, "../../client/build/");

app.use("/static", express.static(path.join(buildDir, "/static")));

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

function validateUserId(userId: string) {
    return !isNaN(+userId) && +userId > 0;
}

app.get("/api/user/:id", cache("1 hour"), async (req, res) => {
    const userId = req.params.id;
    if (!validateUserId(userId)) {
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

app.get("/api/user/rank/:id", cache("1 hour"), async (req, res) => {
    const userId = req.params.id;
    const game = req.query.game;
    const style = req.query.style;

    if (!validateUserId(userId)) {
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
        "game_id": game,
        "style_id": style,
        "mode_id": 0
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

app.get("*splat", (req, res) => {
    res.sendFile("index.html", {root: buildDir})
})

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

async function tryGetStrafes(end_of_url: string, params?: any) {
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
        console.log(err);
        return undefined;
    }
}

async function tryPostRequest(url: string, params?: any) {
    try {
        return await axios.post(url, params, {timeout: 5000});
    } 
    catch (err) {
        console.log(err);
        return undefined;
    }
}
