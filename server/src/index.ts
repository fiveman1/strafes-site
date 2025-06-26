import axios from "axios";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "shared/interfaces";

const app = express();
const port = process.env.PORT ?? "8080";
const dirName = path.dirname(fileURLToPath(import.meta.url))
const buildDir = path.join(dirName, "../../client/build/");

app.use("/static", express.static(path.join(buildDir, "/static")));

app.get("/api/username", async (req, res) => {
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

app.get("/api/user/:id", async (req, res) => {
    const userId = req.params.id;
    if (isNaN(+userId) || +userId < 1) {
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

app.get("*splat", (req, res) => {
    res.sendFile("index.html", {root: buildDir})
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

async function getUserId(username: string): Promise<undefined | User> {
    const res = await tryPostRequest("https://users.roblox.com/v1/usernames/users", {
        usernames: [username] 
    });
    if (!res) return undefined;
    
    const data = res.data.data as any[];
    if (data.length === 0) return undefined;

    const user = data[0];
    return user.id
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
        id: user.id,
        username: user.name,
        joinedOn: user.created,
        thumbUrl: url
    };
}

async function tryGetRequest(url: string, params?: any) {
    try {
        return await axios.get(url, {params: params, timeout: 5000});
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
