import { tryGetCached, tryGetRequest, tryPostCached } from "./requests.js";
import { User, UserInfo } from "shared";
import memCache from "memory-cache";
import { getAllUsersToRoles } from "./roles.js";
import { AuthClient } from "./auth.js";
import { getUserInfo } from "./strafes_api/api.js";

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
    const userIds = Array.from(new Set<number>(users.map((val) => val.userId)));
    
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
    const notCachedIds = new Set<number>();

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
            user.userThumb = idToThumb.get(user.userId);
        }
    }
}

export async function getUserId(username: string): Promise<undefined | number> {
    const res = await tryPostCached("https://users.roblox.com/v1/usernames/users", {
        usernames: [username]
    });
    if (!res) return undefined;

    const data = res.data.data as ({ id: number })[];
    if (data.length === 0) return undefined;

    const user = data[0];
    return user.id;
}

export async function getUserData(client: AuthClient, userId: number): Promise<undefined | User> {
    const userReq = tryGetCached("https://users.roblox.com/v1/users/" + userId);
    const strafesUserReq = getUserInfo(userId);

    const partialUser: UserInfo = {
        userId: userId,
        username: ""
    };
    const setUserInfoPromise = setUserInfoForList(client, [partialUser], true);

    const userRes = await userReq;
    if (!userRes) return undefined;
    const user = userRes.data as { name: string, displayName: string, created: string };

    const strafesUserData = await strafesUserReq;
    await setUserInfoPromise;

    const userInfo: User = {
        userId: userId,
        username: user.name,
        displayName: user.displayName,
        joinedOn: user.created,
        userThumb: partialUser.userThumb,
        userRole: partialUser.userRole,
        userCountry: partialUser.userCountry
    };

    if (strafesUserData) {
        userInfo.status = strafesUserData.state_id;
        userInfo.muted = strafesUserData.muted;
    }

    return userInfo;
}