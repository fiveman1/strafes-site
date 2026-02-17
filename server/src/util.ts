// utils.ts

export function calcRank(rank: number) {
    return Math.floor((1 - rank) * 19) + 1;
}

export const IS_DEV_MODE = process.env.NODE_ENV === "development";