// The page a Discord bot's link opens (/link/:token), where the user links their Discord account to the Roblox
// account they're logged in with.

/** What the link page shows about the request */
export interface LinkPageInfo {
    // The API key's name, which is whatever asked for the link (like a Discord bot)
    appName: string
    // Discord IDs are strings, since they're too big for a JS number
    discordId: string
    discordUsername?: string
    discordAvatarUrl?: string
    expiresAt: string
    // What the Discord account is linked to now, which linking replaces
    currentRobloxId?: number
    currentRobloxUsername?: string
}

export interface LinkConfirmResult {
    discordId: string
    robloxId: number
    robloxUsername: string
    // Set when this replaced a link to a different Roblox account
    previousRobloxId?: number
}
