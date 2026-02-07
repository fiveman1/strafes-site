import { RowDataPacket } from "mysql2/promise";
import { AUTH_POOL, SettingsRow } from "./oauth.js";
import { tryGetRequest } from "./requests.js";
import { UserInfo } from "shared";
import memCache from "memory-cache";
import { getAllUsersToRoles } from "./roles.js";

const cache: memCache.CacheClass<string, string> = new memCache.Cache();

export async function setUserInfoForList(users: UserInfo[], largeThumbs?: boolean) {
    if (users.length < 1) {
        return;
    }

    await Promise.all([setProfileInfoForList(users), setUserThumbsForList(users, largeThumbs ?? false), setUserRolesForList(users)]);
}

async function setUserRolesForList(users: UserInfo[]) {
    const roles = await getAllUsersToRoles();

    for (const user of users) {
        user.userRole = roles.get(user.userId);
    }
}

async function setProfileInfoForList(users: UserInfo[]) {
    const userIds = Array.from(new Set<string>(users.map((val) => val.userId)));
    
    const query = `SELECT * FROM settings WHERE userId IN (?);`;
    const [rows] = await AUTH_POOL.query<(SettingsRow & RowDataPacket)[]>(query, [userIds]);
    if (!rows) {
        return;
    }

    const userIdToSettings = new Map<number, SettingsRow>();
    for (const row of rows) {
        userIdToSettings.set(+row.userId, row);
    }

    for (const user of users) {
        const settings = userIdToSettings.get(+user.userId);
        if (settings?.countryCode) {
             user.userCountry = settings.countryCode;
        }
    }
}

function getUserThumbKey(userId: string | number, largeThumbs: boolean) {
    return `userThumb,${largeThumbs},${userId}`;
}

export interface ThumbnailData {
    targetId: number
    imageUrl: string
}

export async function setUserThumbsForList(users: UserInfo[], largeThumbs: boolean) {
    const notCachedIds = new Set<string>();

    for (const user of users) {
        const userId = user.userId;
        const cacheThumb = cache.get(getUserThumbKey(userId, largeThumbs));
        if (cacheThumb === null) {
            notCachedIds.add(userId);
        }
        else {
            user.userThumb = cacheThumb;
        }
    }

    if (notCachedIds.size < 1) {
        return;
    }

    const thumbRes = await tryGetRequest("https://thumbnails.roproxy.com/v1/users/avatar-headshot", {
        userIds: Array.from(notCachedIds),
        size: largeThumbs ? "180x180" : "75x75",
        format: "Webp",
        isCircular: false
    });

    if (!thumbRes) {
        return;
    }

    const data = thumbRes.data.data as ThumbnailData[];
    
    const idToThumb = new Map<number, string>();
    for (const thumbInfo of data) {
        idToThumb.set(thumbInfo.targetId, thumbInfo.imageUrl);
        cache.put(getUserThumbKey(thumbInfo.targetId, largeThumbs), thumbInfo.imageUrl, 4 * 60 * 60 * 1000); // 4 hours
    }

    for (const user of users) {
        if (user.userThumb === undefined) {
            user.userThumb = idToThumb.get(+user.userId);
        }
    }
}