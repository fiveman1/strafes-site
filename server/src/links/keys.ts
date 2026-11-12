import { createHash, randomBytes } from "crypto";

/** Bit flags on api_keys.permissions. The values match rbhopdog-verify's, so imported keys keep what they had. */
export const Permission = {
    // Roblox -> Discord lookups. Discord -> Roblox is public.
    LOOKUP: 1 << 0,
    // Creating link requests and unlinking. Was EDIT on the old API.
    LINK: 1 << 1
} as const;

export type PermissionName = keyof typeof Permission;

export const PERMISSION_NAMES = Object.keys(Permission) as PermissionName[];

export function hasPermission(permissions: number, permission: number) {
    return (permissions & permission) === permission;
}

export function formatPermissions(permissions: number) {
    const names = PERMISSION_NAMES.filter((name) => hasPermission(permissions, Permission[name]));
    return names.length > 0 ? names.join(",").toLowerCase() : "none";
}

/** "lookup,link" to the bit flags. Throws on a name it doesn't know. */
export function parsePermissions(list: string) {
    let permissions = 0;
    for (const name of list.split(",").map((part) => part.trim().toUpperCase()).filter((part) => part)) {
        if (!(name in Permission)) {
            throw new Error(`Unknown permission "${name.toLowerCase()}" (expected ${PERMISSION_NAMES.join(", ").toLowerCase()})`);
        }
        permissions |= Permission[name as PermissionName];
    }
    return permissions;
}

/** SHA-256, hex. For API keys and link tokens, which are random enough that a slow hash wouldn't add anything. */
export function sha256(value: string) {
    return createHash("sha256").update(value).digest("hex");
}

// The prefix makes keys easy to recognize, in logs or for secret scanners. Imported keys don't have it.
const KEY_PREFIX = "sfk_";

export function generateApiKey() {
    return KEY_PREFIX + randomBytes(24).toString("base64url");
}

export function generateWebhookSecret() {
    return "whsec_" + randomBytes(24).toString("base64url");
}

/** The secret part of a link URL */
export function generateLinkToken() {
    return randomBytes(32).toString("base64url");
}
