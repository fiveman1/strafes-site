import { getUserRoleWeight, StrafesUserRole, UserRole } from "shared";
import { tryGetRequest } from "./requests.js";
import { sleep } from "./util.js";

const RBHOP_GROUP_ID = 2607715;
const STRAFES_NET_GROUP_ID = 6980477;

// How often the lists are refreshed, and how soon to try again when a refresh couldn't load every page
const REFRESH_MS = 60 * 60 * 1000;
const RETRY_MS = 5 * 60 * 1000;

/**
 * Caches a group's role list. Only the first call waits for it; after that the last list is returned straight away
 * and refreshed in the background. An incomplete list is only used until a complete one loads.
 */
function cachedRoleList<T>(load: () => Promise<{ value: T, complete: boolean }>): () => Promise<T> {
    let value: T | undefined;
    let complete = false;
    let refreshedAt = 0;
    let refreshing: Promise<T> | undefined;

    const refresh = () => {
        refreshing ??= load()
            .then((result) => {
                if (result.complete || !complete) {
                    value = result.value;
                    complete = result.complete;
                }
                return value as T;
            })
            .finally(() => {
                refreshedAt = Date.now();
                refreshing = undefined;
            });
        return refreshing;
    };

    return () => {
        const stale = Date.now() - refreshedAt > (complete ? REFRESH_MS : RETRY_MS);
        if (value === undefined) {
            return refresh();
        }
        if (stale) {
            refresh().catch((err) => console.error("Failed to refresh group roles:", err));
        }
        return Promise.resolve(value);
    };
}

/** Everyone with the role. complete is false if a page couldn't be loaded. */
async function getUsersWithRole(role: number, groupId: number): Promise<{ users: number[], complete: boolean }> {
    let cursor = "";
    const users : number[] = [];
    do {
        let res = await tryGetRequest(`https://groups.roproxy.com/v1/groups/${groupId}/roles/${role}/users`, {
            limit: 100,
            cursor: cursor ? cursor : undefined,
            sortOrder: "Asc"
        });
        
        if (!res) {
            await sleep(500);
            res = await tryGetRequest(`https://groups.roproxy.com/v1/groups/${groupId}/roles/${role}/users`, {
                limit: 100,
                cursor: cursor ? cursor : undefined,
                sortOrder: "Asc"
            });
        }

        if (!res) {
            return { users: users, complete: false };
        }
        
        const data = res.data;
        cursor = data.nextPageCursor;
        for (const user of data.data) {
            users.push(user.userId as number);
        }

    } while (cursor);
    
    return { users: users, complete: true };
}

export const getAllUsersToRoles = cachedRoleList(getAllUsersToRolesCore);
async function getAllUsersToRolesCore() {
    const roles = new Map<number, UserRole[]>();
    let complete = true;

    const promises = [];
    for (const role of Object.values(UserRole)) {
        if (typeof role === "string") {
            continue;
        }
        
        const promise = async () => {
            const result = await getUsersWithRole(role, RBHOP_GROUP_ID);
            complete &&= result.complete;
            for (const user of result.users) {
                const userRoles = roles.get(user);
                if (userRoles) {
                    userRoles.push(role);
                    userRoles.sort((a, b) => getUserRoleWeight(b) - getUserRoleWeight(a));
                }
                else {
                    roles.set(user, [role]);
                }
            }
        };
        promises.push(promise());
    }

    await Promise.all(promises);
    return { value: roles, complete: complete };
}

export const getAllUsersToStrafesRoles = cachedRoleList(getAllUsersToStrafesRolesCore);
async function getAllUsersToStrafesRolesCore() {
    const roles = new Map<number, StrafesUserRole>();
    let complete = true;

    const promises = [];
    for (const role of Object.values(StrafesUserRole)) {
        if (typeof role === "string") {
            continue;
        }
        
        const promise = async () => {
            const result = await getUsersWithRole(role, STRAFES_NET_GROUP_ID);
            complete &&= result.complete;
            for (const user of result.users) {
                roles.set(user, role);
            }
        };
        promises.push(promise());
    }

    await Promise.all(promises);
    return { value: roles, complete: complete };
}
