import { tryGetRequest } from "./requests.js";
import { UserInfo } from "shared";
import memCache from "memory-cache";
import { getAllUsersToRoles } from "./roles.js";
import { AuthClient } from "./auth.js";

const cache: memCache.CacheClass<string, string> = new memCache.Cache();

export async function setUserInfoForList(client: AuthClient, users: UserInfo[], largeThumbs?: boolean) {
    if (users.length < 1) {
        return;
    }

    await Promise.all([setProfileInfoForList(client, users), setUserThumbsForList(users, largeThumbs ?? false), setUserRolesForList(users)]);
}

async function setUserRolesForList(users: UserInfo[]) {
    const roles = await getAllUsersToRoles();

    for (const user of users) {
        user.userRole = roles.get(user.userId);
    }
}

async function setProfileInfoForList(client: AuthClient, users: UserInfo[]) {
    const userIds = Array.from(new Set<string>(users.map((val) => val.userId)));
    
    const userIdToSettings = await client.loadSettingsFromDBMulti(userIds);
    if (!userIdToSettings) {
        return;
    }

    for (const user of users) {
        const settings = userIdToSettings.get(user.userId);
        if (settings?.country) {
             user.userCountry = settings.country;
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

    const thumbRes = await tryGetRequest("https://thumbnails.roblox.com/v1/users/avatar-headshot", {
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