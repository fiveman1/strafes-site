import memoize from "memoize";
import { StrafesUserRole, UserRole } from "shared";
import { tryGetRequest } from "./requests.js";

const RBHOP_GROUP_ID = 2607715;
const STRAFES_NET_GROUP_ID = 6980477;

async function getUsersWithRole(role: number, groupId: number): Promise<number[]> {
    let cursor = "";
    const users : number[] = [];
    do {
        const res = await tryGetRequest(`https://groups.roproxy.com/v1/groups/${groupId}/roles/${role}/users`, {
            limit: 100,
            cursor: cursor ? cursor : undefined,
            sortOrder: "Asc"
        });
        
        if (!res) {
            break;
        }
        
        const data = res.data;
        cursor = data.nextPageCursor;
        for (const user of data.data) {
            users.push(user.userId as number);
        }

    } while (cursor);
    
    return users;
}

export const getAllUsersToRoles = memoize(getAllUsersToRolesCore, {maxAge: 60 * 60 * 1000});
async function getAllUsersToRolesCore(): Promise<Map<number, UserRole>> {
    const roles = new Map<number, UserRole>();

    const promises = [];
    for (const role of Object.values(UserRole)) {
        if (typeof role === "string") {
            continue;
        }
        
        const promise = async () => {
            const users = await getUsersWithRole(role, RBHOP_GROUP_ID);
            for (const user of users) {
                roles.set(user, role);
            }
        };
        promises.push(promise());
    }

    await Promise.all(promises);
    return roles;
}

export const getAllUsersToStrafesRoles = memoize(getAllUsersToStrafesRolesCore, {maxAge: 60 * 60 * 1000});
async function getAllUsersToStrafesRolesCore(): Promise<Map<number, StrafesUserRole>> {
    const roles = new Map<number, StrafesUserRole>();

    const promises = [];
    for (const role of Object.values(StrafesUserRole)) {
        if (typeof role === "string") {
            continue;
        }
        
        const promise = async () => {
            const users = await getUsersWithRole(role, STRAFES_NET_GROUP_ID);
            for (const user of users) {
                roles.set(user, role);
            }
        };
        promises.push(promise());
    }

    await Promise.all(promises);
    return roles;
}