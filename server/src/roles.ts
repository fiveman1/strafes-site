import { getUserRoleWeight, StrafesUserRole, UserRole } from "shared";
import { getWithStatus } from "./requests.js";

const RBHOP_GROUP_ID = 2607715;
const STRAFES_NET_GROUP_ID = 6980477;

// How often a role's member list is refreshed once it's loaded
const REFRESH_MS = 60 * 60 * 1000;
// After a failed load, how long until the next try. It doubles with each failure in a row, up to the max.
const RETRY_BASE_MS = 30 * 1000;
const RETRY_MAX_MS = 15 * 60 * 1000;
// How long a caller that can't do without the roles waits for them to load the first time
const ROLE_WAIT_MS = 5000;

// Roblox allows 30 requests a minute to role member lists, shared by every group and role (and maybe by other sites
// going through roproxy). This stays under it.
const REQUEST_BUDGET = 25;
const BUDGET_WINDOW_MS = 60 * 1000;

/** Thrown when roles are needed but haven't loaded since the server started. */
export class RolesUnavailableError extends Error {
    constructor() {
        super("Couldn't check roles with Roblox, try again in a bit");
        this.name = "RolesUnavailableError";
    }
}

// Doesn't keep the process running, so scripts that import this can still exit
function sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms).unref());
}

function enumValues<T extends number>(values: Record<string, string | T>): T[] {
    return Object.values(values).filter((value): value is T => typeof value === "number");
}

// Request budget: when recent requests were sent, and when Roblox said to stop until (after a 429)
const recentRequests: number[] = [];
let blockedUntil = 0;

async function takeRequestSlot() {
    while (true) {
        const now = Date.now();
        while (recentRequests.length > 0 && recentRequests[0] <= now - BUDGET_WINDOW_MS) {
            recentRequests.shift();
        }
        const overBudget = recentRequests.length >= REQUEST_BUDGET ? recentRequests[0] + BUDGET_WINDOW_MS - now : 0;
        const wait = Math.max(blockedUntil - now, overBudget);
        if (wait <= 0) {
            recentRequests.push(now);
            return;
        }
        await sleep(wait);
    }
}

/** Everyone with the role, or how long Roblox asked to wait (if it said) when a page couldn't be loaded. */
async function loadRoleMembers(groupId: number, role: number): Promise<{ users: number[] } | { retryAfterMs: number | undefined }> {
    const users: number[] = [];
    let cursor: string | undefined;
    do {
        await takeRequestSlot();
        const result = await getWithStatus(`https://groups.roproxy.com/v1/groups/${groupId}/roles/${role}/users`, {
            limit: 100,
            cursor: cursor,
            sortOrder: "Asc"
        });
        if (!result.ok) {
            if (result.status === 429) {
                // The limit covers every role, so they all hold off
                blockedUntil = Math.max(blockedUntil, Date.now() + (result.retryAfterMs ?? RETRY_BASE_MS));
            }
            return { retryAfterMs: result.retryAfterMs };
        }

        const data = result.res.data as { nextPageCursor: string | null, data: { userId: number }[] };
        for (const user of data.data) {
            users.push(user.userId);
        }
        cursor = data.nextPageCursor ?? undefined;
    } while (cursor);

    return { users: users };
}

/**
 * One role's members, kept up to date in the background. A failed refresh keeps the last list, and tries again later,
 * backing off while it keeps failing.
 */
class RoleList {
    users: number[] | undefined;
    // Settles once the first load has been tried, whether or not it worked
    readonly firstAttempt: Promise<void>;
    private settleFirstAttempt: () => void = () => {};
    private failures = 0;

    constructor(readonly groupId: number, readonly role: number, private readonly onUpdate: () => void) {
        this.firstAttempt = new Promise((resolve) => this.settleFirstAttempt = resolve);
    }

    async keepFresh() {
        while (true) {
            let delay: number;
            try {
                const result = await loadRoleMembers(this.groupId, this.role);
                if ("users" in result) {
                    this.users = result.users;
                    this.failures = 0;
                    this.onUpdate();
                    delay = REFRESH_MS;
                }
                else {
                    delay = this.retryDelay(result.retryAfterMs);
                }
            }
            catch (err) {
                console.error(`Failed to load role ${this.role} in group ${this.groupId}:`, err);
                delay = this.retryDelay(undefined);
            }
            this.settleFirstAttempt();
            await sleep(delay);
        }
    }

    private retryDelay(retryAfterMs: number | undefined) {
        ++this.failures;
        const backoff = Math.min(RETRY_BASE_MS * 2 ** (this.failures - 1), RETRY_MAX_MS);
        // Spread out, so the roles that failed together don't all try again at once
        const delay = Math.max(backoff * (0.8 + Math.random() * 0.4), retryAfterMs ?? 0);
        console.warn(`Couldn't load role ${this.role} in group ${this.groupId}${this.users ? " (keeping the last list)" : ""}, trying again in ${Math.round(delay / 1000)}s`);
        return delay;
    }
}

const rbhopLists = new Map<UserRole, RoleList>();
const strafesLists = new Map<StrafesUserRole, RoleList>();
let usersToRoles = new Map<number, UserRole[]>();
let usersToStrafesRoles = new Map<number, StrafesUserRole>();

function rebuildUsersToRoles() {
    const roles = new Map<number, UserRole[]>();
    for (const [role, list] of rbhopLists) {
        for (const user of list.users ?? []) {
            const userRoles = roles.get(user);
            if (userRoles) {
                userRoles.push(role);
            }
            else {
                roles.set(user, [role]);
            }
        }
    }
    for (const userRoles of roles.values()) {
        userRoles.sort((a, b) => getUserRoleWeight(b) - getUserRoleWeight(a));
    }
    usersToRoles = roles;
}

function rebuildUsersToStrafesRoles() {
    const roles = new Map<number, StrafesUserRole>();
    for (const [role, list] of strafesLists) {
        for (const user of list.users ?? []) {
            roles.set(user, role);
        }
    }
    usersToStrafesRoles = roles;
}

let started = false;

/** Starts loading the roles in the background, if it hasn't already. Anything that reads them starts it too. */
export function startRoleRefresh() {
    if (started) return;
    started = true;

    for (const role of enumValues<UserRole>(UserRole)) {
        rbhopLists.set(role, new RoleList(RBHOP_GROUP_ID, role, rebuildUsersToRoles));
    }
    for (const role of enumValues<StrafesUserRole>(StrafesUserRole)) {
        strafesLists.set(role, new RoleList(STRAFES_NET_GROUP_ID, role, rebuildUsersToStrafesRoles));
    }
    for (const list of [...rbhopLists.values(), ...strafesLists.values()]) {
        void list.keepFresh();
    }
}

/** Waits (briefly) for the lists to have loaded at least once. Once they have, this doesn't wait. */
async function waitForLists(lists: RoleList[]) {
    if (lists.every((list) => list.users !== undefined)) return;
    // Stops waiting once each has had its first try, so a failure doesn't hold up every request for the full wait
    await Promise.race([Promise.all(lists.map((list) => list.firstAttempt)), sleep(ROLE_WAIT_MS)]);
    if (!lists.every((list) => list.users !== undefined)) {
        throw new RolesUnavailableError();
    }
}

/**
 * Users' Roblox Bhoppers roles, as far as is known right now. Roles that haven't loaded yet are missing, so only use
 * this where that's harmless, like name badges.
 */
export function peekUsersToRoles(): ReadonlyMap<number, UserRole[]> {
    startRoleRefresh();
    return usersToRoles;
}

/**
 * Users' Roblox Bhoppers roles, once the given roles (by default all of them) have loaded at least once. Throws
 * RolesUnavailableError if they haven't loaded since the server started.
 */
export async function loadUsersToRoles(roles?: Iterable<UserRole>): Promise<ReadonlyMap<number, UserRole[]>> {
    startRoleRefresh();
    const needed = roles ? Array.from(roles, (role) => rbhopLists.get(role)!) : Array.from(rbhopLists.values());
    await waitForLists(needed);
    return usersToRoles;
}

/** Users' StrafesNET group roles, once they've loaded at least once. Throws RolesUnavailableError if they haven't. */
export async function loadUsersToStrafesRoles(): Promise<ReadonlyMap<number, StrafesUserRole>> {
    startRoleRefresh();
    await waitForLists(Array.from(strafesLists.values()));
    return usersToStrafesRoles;
}
