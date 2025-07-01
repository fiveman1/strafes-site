export interface User {
    displayName: string
    id: string
    username: string
    joinedOn: string
    thumbUrl: string
}

export enum Game {
    bhop = 1,
    surf = 2
}

export enum Style {
    autohop = 1,
    scroll = 2,
    sideways = 3,
    hsw = 4,
    wonly = 5,
    aonly = 6,
    backwards = 7,
    faste = 8
}

export interface RankData {
    style: Style
    game: Game
    rank: number
    skill: number
    userId: string
}

export interface Time {
    map: string
    mapId: number
    username: string
    userId: number
    time: string
    date: string
    game: Game
    style: Style
    updatedAt: string
    id: number
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
}

export enum SortBy {
    TimeAsc = 0,
    TimeDesc = 1,
    DateAsc = 2,
    DateDesc = 3
}