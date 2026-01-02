export interface User {
    displayName: string
    id: string
    username: string
    joinedOn: string
    thumbUrl: string
    status?: ModerationStatus
    muted?: boolean
}

export enum Game {
    bhop = 1,
    surf = 2,
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

export const bhop_styles = [Style.autohop, Style.scroll, Style.sideways, Style.hsw, Style.wonly, Style.aonly, Style.backwards, Style.faste, Style.low_gravity];
export const surf_styles = [Style.autohop, Style.sideways, Style.hsw, Style.wonly, Style.aonly, Style.backwards, Style.faste, Style.low_gravity];
export const fly_trials_styles = [Style.fly, Style.fly_sustain, Style.rocket, Style.strafe_3d, Style.rocket_strafe];

export interface Rank {
    id: number
    style: Style
    game: Game
    rank: number
    skill: number
    username: string
    userId: string
    placement?: number
}

export interface Time {
    map: string
    mapId: number
    username: string
    userId: number
    time: number
    date: string
    game: Game
    style: Style
    updatedAt: string
    id: string
    course: number
    placement?: number
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
    modes: number,
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

export enum ModerationStatus {
    Default = 0,
    Whitelisted = 1,
    Blacklisted = 2,
    Pending = 3,
    Hidden = 4
}

export interface UserSearchData {
    username: string,
    id?: string,
    previousUsernames?: string[]
}