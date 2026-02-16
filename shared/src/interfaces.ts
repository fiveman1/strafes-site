export interface UserInfo {
    userId: number
    username: string
    userRole?: UserRole
    userCountry?: string
    userThumb?: string
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
    Style.low_gravity, Style.fly, Style.fly_sustain, Style.rocket, Style.strafe_3d, Style.rocket_strafe] as const;
export const allStylesWithAll = [Style.autohop, Style.scroll, Style.sideways, Style.hsw, Style.wonly, Style.aonly, Style.backwards, Style.faste, 
    Style.low_gravity, Style.fly, Style.fly_sustain, Style.rocket, Style.strafe_3d, Style.rocket_strafe, Style.all] as const;

export const bhop_styles = [Style.autohop, Style.scroll, Style.sideways, Style.hsw, Style.wonly, Style.aonly, Style.backwards, Style.faste, Style.low_gravity] as const;
export const surf_styles = [Style.autohop, Style.sideways, Style.hsw, Style.wonly, Style.aonly, Style.backwards, Style.faste, Style.low_gravity] as const;
export const fly_trials_styles = [Style.fly, Style.fly_sustain, Style.rocket, Style.strafe_3d, Style.rocket_strafe] as const;

export interface Rank extends UserInfo {
    id: number
    style: Style
    game: Game
    rank: number
    skill: number
    mainWrs?: number
    bonusWrs?: number
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
    placement?: number
    wrDiff?: number
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
    modes: number
    loadCount: number
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

export interface UserSearchData {
    username: string
    userId?: number
    previousUsernames?: string[] | null
    userThumb?: string
}

export interface UserSearchDataComplete extends UserSearchData {
    userId: number
    previousUsernames: string[] | null
    userThumb?: string
}

export enum UserRole {
    Faste = 17639145,
    MapMaker = 17307028,
    MapAdmin = 108480632,
    ChatMod = 135242269,
    InGameMod = 17720479,
    InGameHeadMod = 108511840,
    Dev = 99336516,
    DatabaseMan = 44154401,
    GameCreator = 17295536
}

export interface LeaderboardCount extends UserInfo {
    count: number
    bonusCount: number
    earliestTime: Time
    latestTime: Time
}

export interface LoginUser {
    userId: number
    username: string
    displayName: string
    createdAt: number
    profileUrl: string
    thumbnailUrl: string
}

export interface SettingsValues {
    defaultGame: Game
    defaultStyle: Style
    maxDaysRelativeDates: number
    theme: "dark" | "light"
    country: string | undefined
}