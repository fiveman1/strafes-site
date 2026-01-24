import memoize from "memoize";
import { UserRole } from "./interfaces.js";
import { tryGetRequest } from "./requests.js";

const RBHOP_GROUP_ID = 2607715;

async function getUsersWithRole(role: UserRole): Promise<number[]> {
    let cursor = "";
    const users : number[] = [];
    do {
        const res = await tryGetRequest(`https://groups.roproxy.com/v1/groups/${RBHOP_GROUP_ID}/roles/${role}/users`, {
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
            users.push(user.userId);
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
            const users = await getUsersWithRole(role);
            for (const user of users) {
                roles.set(user, role);
            }
        };
        promises.push(promise());
    }

    await Promise.all(promises);
    return roles;
}
