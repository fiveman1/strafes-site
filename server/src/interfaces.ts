export interface User {
    displayName: string,
    id: string,
    username: string,
    joinedOn: string,
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
    style: Style,
    game: Game,
    rank: number,
    skill: number,
    userId: string
}