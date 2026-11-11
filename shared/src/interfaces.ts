export interface UserInfo {
    userId: number
    username: string
    userRoles?: UserRole[]
    userCountry?: string
    userThumb?: string
}

// A user shown alongside something else, like a comment's author or a run's runner. Unlike UserInfo, the username
// is unset for users the site hasn't seen yet.
export interface UserRef extends Omit<UserInfo, "username"> {
    username?: string
}

export interface User extends UserInfo {
    displayName: string
    joinedOn: string
    status?: ModerationStatus
    muted?: boolean
}

export enum Game {
    testing = 0,
    bhop = 1,
    surf = 2,
    kz = 3,
    fly_trials = 5,
    all = 999
}

export enum Style {
    autohop = 1,
    scroll = 2,
    sideways = 3,
    hsw = 4,
    wonly = 5,
    aonly = 6,
    backwards = 7,
    faste = 8,
    low_gravity = 14,
    boost = 18,
    fly = 501,
    fly_sustain = 502,
    rocket = 503,
    strafe_3d = 504,
    rocket_strafe = 505,
    all = 999
}

export const allGames = [Game.bhop, Game.surf, Game.fly_trials, Game.kz, Game.testing] as const;
export const allGamesWithAll = [Game.bhop, Game.surf, Game.fly_trials, Game.kz, Game.testing, Game.all] as const;

export const allStyles = [Style.autohop, Style.scroll, Style.sideways, Style.hsw, Style.wonly, Style.aonly, Style.backwards, Style.faste,
Style.low_gravity, Style.boost, Style.fly, Style.fly_sustain, Style.rocket, Style.strafe_3d, Style.rocket_strafe] as const;
export const allStylesWithAll = [Style.autohop, Style.scroll, Style.sideways, Style.hsw, Style.wonly, Style.aonly, Style.backwards, Style.faste,
Style.low_gravity, Style.boost, Style.fly, Style.fly_sustain, Style.rocket, Style.strafe_3d, Style.rocket_strafe, Style.all] as const;

export const bhop_styles = [Style.autohop, Style.scroll, Style.sideways, Style.hsw, Style.wonly, Style.aonly, Style.backwards, Style.faste, Style.low_gravity, Style.boost] as const;
export const surf_styles = [Style.autohop, Style.sideways, Style.hsw, Style.wonly, Style.aonly, Style.backwards, Style.faste, Style.low_gravity, Style.boost] as const;
export const fly_trials_styles = [Style.fly, Style.fly_sustain, Style.rocket, Style.strafe_3d, Style.rocket_strafe] as const;

export interface Rank extends UserInfo, Partial<WRCount> {
    id: number
    style: Style
    game: Game
    rank: number
    skill: number
    placement?: number
}

export interface Time extends UserInfo {
    map: string
    mapId: number
    time: number
    date: string
    game: Game
    style: Style
    id: string
    course: number
    hasBot: boolean
    placement?: number
    wrDiff?: number
}

export interface Replay extends Time {
    views: number
    compareTimeId?: string
}

export interface Pagination {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
}

export interface Map {
    id: number
    name: string
    creator: string
    game: Game
    date: string
    smallThumb?: string
    largeThumb?: string
    /** Base64 ThumbHash of the thumbnail, decoded client-side into a blurry placeholder */
    thumbHash?: string
    modes: number
    loadCount: number
    tier?: number
    votes: {
        unweighted: number[]
        weighted: number[]
    }
}

export enum TimeSortBy {
    TimeAsc = 0,
    TimeDesc = 1,
    DateAsc = 2,
    DateDesc = 3
}

export enum RankSortBy {
    RankAsc = 1,
    SkillAsc = 2
}

export enum LeaderboardSortBy {
    MainAsc,
    MainDesc,
    BonusAsc,
    BonusDesc
}

export enum ModerationStatus {
    Default = 0,
    Whitelisted = 1,
    Blacklisted = 2,
    Pending = 3,
    Hidden = 4
}

// A search result, or just what was typed (no userId) when it's looked up by username
export interface UserSearchData extends Omit<UserInfo, "userId"> {
    userId?: number
    previousUsernames?: string[] | null
}

export interface UserSearchDataComplete extends UserSearchData {
    userId: number
    previousUsernames: string[] | null
}

export enum UserRole {
    Faste = 17639145,
    MapMaker = 17307028,
    ContentCreator = 717561008,
    MapAdmin = 108480632,
    ChatMod = 135242269,
    InGameMod = 17720479,
    InGameHeadMod = 108511840,
    Dev = 99336516,
    DatabaseMan = 44154401,
    GameCreator = 17295536,
}

export function getUserRoleWeight(role: UserRole) {
    switch (role) {
        case UserRole.Faste:
            return 10;
        case UserRole.MapMaker:
            return 0;
        case UserRole.ContentCreator:
            return 5;
        case UserRole.MapAdmin:
            return 15;
        case UserRole.ChatMod:
            return 20;
        case UserRole.InGameMod:
            return 25;
        case UserRole.InGameHeadMod:
            return 30;
        case UserRole.Dev:
            return 40;
        case UserRole.DatabaseMan:
            return 99;
        case UserRole.GameCreator:
            return 100;
    }
}

export enum StrafesUserRole {
    MapCouncil = 230094155,
    MapAdmin = 230586111,
    MapAccess = 44311204
}

export interface LeaderboardCount extends UserInfo {
    count: number
    bonusCount: number
    earliestTime: Time
    latestTime: Time
}

export interface WRCount {
    mainWrs: number
    bonusWrs: number
}

export interface LoginUser {
    userId: number
    username: string
    displayName: string
    createdAt: number
    profileUrl: string
    thumbnailUrl: string
}

export interface LoginUserWithInfo extends LoginUser {
    settings: SettingsValues | undefined
    // Unset for users who can't moderate comments
    commentRole?: CommentRole
}

export interface SettingsValues {
    defaultGame: Game
    defaultStyle: Style
    maxDaysRelativeDates: number
    theme: "dark" | "light"
    country: string | undefined
}

export interface TierVoteEligibility {
    moderationStatus: ModerationStatus
    bhopCompletions: number
    surfCompletions: number
}

export function isEligibleForVoting(info: TierVoteEligibility, game: Game) {
    return info.moderationStatus === ModerationStatus.Whitelisted ||
        (game === Game.bhop && info.bhopCompletions >= 20) ||
        (game === Game.surf && info.surfCompletions >= 20);
}

export interface MapTierInfo {
    mapId: number
    userId: number
    tier: number
    updatedAt: string
    weight: number
}

export enum GameControls {
    MoveForward = 1 << 0,
    MoveLeft = 1 << 1,
    MoveBack = 1 << 2,
    MoveRight = 1 << 3,
    MoveUp = 1 << 4,
    MoveDown = 1 << 5,
    LookUp = 1 << 6,
    LookLeft = 1 << 7,
    LookDown = 1 << 8,
    LookRight = 1 << 9,
    Jump = 1 << 10,
    Crouch = 1 << 11,
    Sprint = 1 << 12,
    Zoom = 1 << 13,
    Use = 1 << 14,
    Action1 = 1 << 15,
    Action2 = 1 << 16
}

// Display order of reactions. Keys are what's stored in the DB, so don't rename them.
export const REPLAY_REACTIONS = [
    { key: "goat", emoji: "🐐", label: "Goat" },
    { key: "fire", emoji: "🔥", label: "Fire" },
    { key: "thumbsup", emoji: "👍", label: "Thumbs up" },
    { key: "heart", emoji: "❤️", label: "Heart" },
    { key: "skull", emoji: "💀", label: "Skull" },
    { key: "sob", emoji: "😭", label: "Sob" },
    { key: "interrobang", emoji: "⁉️", label: "Interrobang" },
    { key: "smoking", emoji: "🚬", label: "Smoking" }
] as const;

export type ReplayReaction = typeof REPLAY_REACTIONS[number]["key"];
// How many different reactions one user can add to one replay
export const MAX_REACTIONS_PER_USER = 3;
export const allReplayReactions: readonly ReplayReaction[] = REPLAY_REACTIONS.map((reaction) => reaction.key);

export interface ReplayReactionCount {
    reaction: ReplayReaction
    count: number
    // Whether the logged in user has added this reaction
    reacted: boolean
    // Usernames of the first few users who reacted, in order. The rest are only counted.
    users: string[]
}

export interface ReplayReactions {
    timeId: string
    reactions: ReplayReactionCount[]
}

// What the live stream sends: the same for every viewer, so it leaves out whether they reacted
export type ReplayReactionTotal = Omit<ReplayReactionCount, "reacted">;

export interface ReplayReactionsUpdate {
    timeId: string
    reactions: ReplayReactionTotal[]
}

// Comments
export const MAX_COMMENT_LENGTH = 300;
export const MAX_COMMENT_REPORT_NOTE_LENGTH = 200;
export const MAX_COMMENT_MODERATION_REASON_LENGTH = 500;

export type ReplayCommentStatus = "visible" | "pending" | "hidden" | "deleted";
export type CommentHiddenBy = "runner" | "moderator";
export const COMMENT_REPORT_REASONS = ["hate", "harassment", "spam", "other"] as const;
export type CommentReportReason = typeof COMMENT_REPORT_REASONS[number];
export type CommentRole = "moderator" | "admin";
// How top-level comments are ordered. Replies are always oldest first.
export const COMMENT_SORTS = ["new", "old", "top"] as const;
export type CommentSort = typeof COMMENT_SORTS[number];
export const DEFAULT_COMMENT_SORT: CommentSort = "new";

export interface ReplayComment extends UserInfo {
    id: string
    timeId: string
    // Set on replies; always a top-level comment
    parentId?: string
    // Who a reply to a reply was answering
    replyToUsername?: string
    // Seconds into the run, unset for a comment about the whole run
    replaySeconds?: number
    body: string
    // Anything but "visible" only reaches the author and moderators
    status: Exclude<ReplayCommentStatus, "deleted">
    hiddenBy?: CommentHiddenBy
    createdAt: string
    likes: number
    // Whether the logged in user liked / reported it
    liked: boolean
    reported: boolean
    // A removed top-level comment, kept so its replies have something to sit under. Its author and body are blank.
    removed: boolean
    // Set when the runner has since beaten the run this was posted on, so its timestamp points at a different run
    previousRun?: CommentRun
    // Oldest first. Always empty on replies.
    replies: ReplayComment[]
}

export interface CommentRun {
    // ms
    time: number
    date: string
}

export interface ReplayComments {
    timeId: string
    sort: CommentSort
    // Top-level comments, in the order of sort
    comments: ReplayComment[]
}

// What the live stream sends. Comments in it are the same for every viewer, so liked and reported are always false.
export interface ReplayCommentRemoved {
    timeId: string
    commentId: string
}

export interface ReplayCommentLikes {
    timeId: string
    likes: { commentId: string, likes: number }[]
}

// Moderation

/** The replay a comment is on, as lists of comments (the inbox and the mod portal) show it. */
export interface CommentReplay {
    timeId: string
    mapId: number
    mapName?: string
    game: Game
    style: Style
    course: number
    // ms, of the run the time holds now. A comment may have been made on an earlier one the runner has since beaten.
    time: number
    runner: UserRef
}

/** A comment as lists of comments (the inbox and the mod portal) show it. */
export interface CommentExcerpt {
    id: string
    // Empty when removed
    body: string
    replaySeconds?: number
    author: UserRef
    // Deleted, hidden, or waiting for review, so the viewer doesn't get to see what it said
    removed?: boolean
}

export interface ModCommentReport {
    reporter: UserRef
    reason: CommentReportReason
    note?: string
    createdAt: string
    resolved: boolean
}

export interface ModComment {
    id: string
    timeId: string
    parentId?: string
    replaySeconds?: number
    body: string
    status: ReplayCommentStatus
    hiddenBy?: CommentHiddenBy
    createdAt: string
    statusChangedAt?: string
    author: UserRef
    replay: CommentReplay
    // For a reply, the comment it answered
    repliedTo?: CommentExcerpt
    openReports: number
    // Newest first, resolved ones included
    reports: ModCommentReport[]
}

export interface CommentBan {
    id: string
    user: UserRef
    reason: string
    bannedBy: UserRef
    createdAt: string
    // Unset for a permanent ban
    expiresAt?: string
}

export interface CommentModerator {
    user: UserRef
    role: CommentRole
    // config: COMMENT_ADMIN_IDS, group: a staff role in the Roblox Bhoppers group, granted: added on the site
    source: "config" | "group" | "granted"
    grantedBy?: number
    grantedAt?: string
}

export type CommentModerationAction = "hide" | "restore" | "approve" | "dismiss_reports" | "ban" | "unban" | "grant_mod" | "revoke_mod";

export interface CommentModerationLogEntry {
    id: string
    actor: UserRef
    action: CommentModerationAction
    commentId?: string
    target?: UserRef
    reason?: string
    createdAt: string
    // The comment the action was on, as it is now
    comment?: ModComment
}
