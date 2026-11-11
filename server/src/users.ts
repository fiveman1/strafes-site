import { tryGetCached, tryGetRequest, tryPostCached, tryPostRequest } from "./requests.js";
import { User, UserInfo, UserRef } from "shared";
import memCache from "memory-cache";
import { peekUsersToRoles } from "./roles.js";
import { AuthClient } from "./auth.js";
import { getUserInfo } from "./strafes_api/api.js";
import { UpstreamFailure } from "./upstream.js";

const cache: memCache.CacheClass<string, string> = new memCache.Cache();

// What setUserInfoForList fills in. A UserInfo, without needing the username.
type UserInfoTarget = Pick<UserInfo, "userId" | "userRoles" | "userCountry" | "userThumb">;

/** A user from a row that joined the users table, which has no username for anyone the site hasn't seen. */
export function userRef(userId: string | number, username: string | null | undefined): UserRef {
    return { userId: +userId, username: username ?? undefined };
}

/**
 * Fills in thumbnails, role colors, and countries, and usernames for anyone the site hasn't saved one for (like group
 * staff who've never used the site).
 */
export async function setUserRefInfo(authClient: AuthClient, users: UserRef[]) {
    await Promise.all([setUserInfoForList(authClient, users), setMissingUsernames(users)]);
}

export async function setUserInfoForList(client: AuthClient, users: UserInfoTarget[], largeThumbs?: boolean) {
    if (users.length < 1) {
        return;
    }

    await Promise.all([setProfileInfoForList(client, users), setUserThumbsForList(users, largeThumbs ?? false), setUserRolesForList(users)]);
}

async function setUserRolesForList(users: UserInfoTarget[]) {
    // Just badges, so whatever has loaded is fine
    const roles = peekUsersToRoles();

    for (const user of users) {
        user.userRoles = roles.get(user.userId);
    }
}

async function setProfileInfoForList(client: AuthClient, users: UserInfoTarget[]) {
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
    // "Completed" or "Blocked" (didn't pass moderation, with Roblox's placeholder image) are final. Anything else (like
    // "Pending" while Roblox renders it) comes without a usable image.
    state: string
    imageUrl: string | null
}

const THUMBNAIL_BATCH_SIZE = 100;

export async function setUserThumbsForList(users: { userId: number, userThumb?: string }[], largeThumbs: boolean) {
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

    // The endpoint takes at most 100 users per request. A failed batch only leaves its own users without a thumbnail.
    const ids = Array.from(notCachedIds);
    const batches: number[][] = [];
    for (let i = 0; i < ids.length; i += THUMBNAIL_BATCH_SIZE) {
        batches.push(ids.slice(i, i + THUMBNAIL_BATCH_SIZE));
    }

    const responses = await Promise.all(batches.map((batch) => tryGetRequest("Roblox", "https://thumbnails.roblox.com/v1/users/avatar-headshot", {
        userIds: batch,
        size: largeThumbs ? "180x180" : "75x75",
        format: "Webp",
        isCircular: false
    })));

    const idToThumb = new Map<number, string>();
    for (const thumbRes of responses) {
        // Best effort, a failed batch just goes without
        if (!thumbRes || thumbRes instanceof UpstreamFailure) {
            continue;
        }

        const data = thumbRes.data.data as ThumbnailData[];
        for (const thumbInfo of data) {
            // Not cached, so the next request tries again
            if ((thumbInfo.state !== "Completed" && thumbInfo.state !== "Blocked") || !thumbInfo.imageUrl) {
                continue;
            }
            idToThumb.set(thumbInfo.targetId, thumbInfo.imageUrl);
            cache.put(getUserThumbKey(thumbInfo.targetId, largeThumbs), thumbInfo.imageUrl, 4 * 60 * 60 * 1000); // 4 hours
        }
    }

    for (const user of users) {
        if (user.userThumb === undefined) {
            user.userThumb = idToThumb.get(user.userId);
        }
    }
}

function getUsernameKey(userId: number) {
    return `username,${userId}`;
}

const USERNAME_BATCH_SIZE = 100;
const USERNAME_CACHE_MS = 60 * 60 * 1000;

/** Looks up usernames from Roblox for the users that don't have one. */
export async function setMissingUsernames(users: { userId: number, username?: string }[]) {
    const missingIds = new Set<number>();
    for (const user of users) {
        if (user.username) continue;
        const cached = cache.get(getUsernameKey(user.userId));
        if (cached === null) {
            missingIds.add(user.userId);
        }
        else {
            user.username = cached;
        }
    }
    if (missingIds.size < 1) {
        return;
    }

    const ids = Array.from(missingIds);
    const idToName = new Map<number, string>();
    const batches: Promise<void>[] = [];
    for (let i = 0; i < ids.length; i += USERNAME_BATCH_SIZE) {
        batches.push((async () => {
            const res = await tryPostRequest("Roblox", "https://users.roblox.com/v1/users", {
                userIds: ids.slice(i, i + USERNAME_BATCH_SIZE),
                excludeBannedUsers: false
            });
            if (!res || res instanceof UpstreamFailure) {
                return;
            }
            for (const user of res.data.data as { id: number, name: string }[]) {
                idToName.set(user.id, user.name);
                cache.put(getUsernameKey(user.id), user.name, USERNAME_CACHE_MS);
            }
        })());
    }
    await Promise.all(batches);

    for (const user of users) {
        if (!user.username) {
            user.username = idToName.get(user.userId);
        }
    }
}

/** null if there's no user with that name. */
export async function getUserId(username: string): Promise<null | UpstreamFailure | number> {
    const res = await tryPostCached("Roblox", "https://users.roblox.com/v1/usernames/users", {
        usernames: [username]
    });
    if (!res) return null;
    if (res instanceof UpstreamFailure) return res;

    const data = res.data.data as ({ id: number })[];
    if (data.length === 0) return null;

    const user = data[0];
    return user.id;
}

/** null if there's no user with that ID. */
export async function getUserData(client: AuthClient, userId: number): Promise<null | UpstreamFailure | User> {
    const userReq = tryGetCached("Roblox", "https://users.roblox.com/v1/users/" + userId);
    const strafesUserReq = getUserInfo(userId);

    const partialUser: UserInfo = {
        userId: userId,
        username: ""
    };
    const setUserInfoPromise = setUserInfoForList(client, [partialUser], true);

    const userRes = await userReq;
    if (!userRes || userRes instanceof UpstreamFailure) return userRes;
    const user = userRes.data as { name: string, displayName: string, created: string };

    const strafesUserData = await strafesUserReq;
    await setUserInfoPromise;

    const userInfo: User = {
        userId: userId,
        username: user.name,
        displayName: user.displayName,
        joinedOn: user.created,
        userThumb: partialUser.userThumb,
        userRoles: partialUser.userRoles,
        userCountry: partialUser.userCountry
    };

    if (strafesUserData) {
        userInfo.status = strafesUserData.state_id;
        userInfo.muted = strafesUserData.muted;
    }

    return userInfo;
}