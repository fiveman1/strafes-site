import { RowDataPacket } from "mysql2/promise";
import { AUTH_POOL, SettingsRow } from "./oauth.js";
import { tryGetRequest } from "./requests.js";
import { UserInfo } from "shared";


export async function setUserInfoForList(users: UserInfo[]) {
    if (users.length < 1) {
        return;
    }

    await Promise.all([setProfileInfoForList(users), setUserThumbsForList(users)]);
}

async function setProfileInfoForList(users: UserInfo[]) {
    const query = `SELECT * FROM settings WHERE userId IN (?);`;
    const [rows] = await AUTH_POOL.query<(SettingsRow & RowDataPacket)[]>(query, [users.map((val) => val.userId)]);
    if (!rows) {
        return;
    }

    const userIdToSettings = new Map<number, SettingsRow>();
    for (const row of rows) {
        userIdToSettings.set(+row.userId, row);
    }

    for (const val of users) {
        const settings = userIdToSettings.get(+val.userId);
        if (settings) {
             val.userCountry = settings.countryCode ?? undefined;
        }
    }
}

export async function setUserThumbsForList(users: UserInfo[]) {
    const thumbRes = await tryGetRequest("https://thumbnails.roproxy.com/v1/users/avatar-headshot", {
        userIds: users.map((user) => user.userId),
        size: "75x75",
        format: "Webp",
        isCircular: false
    });

    if (!thumbRes) {
        return;
    }
    
    const idToThumb = new Map<number, string>();
    for (const thumbInfo of thumbRes?.data.data) {
        idToThumb.set(thumbInfo.targetId, thumbInfo.imageUrl);
    }

    for (const user of users) {
        user.userThumb = idToThumb.get(+user.userId);
    }
}