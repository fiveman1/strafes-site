import vine from "@vinejs/vine";
import { allGames, allGamesWithAll, allStyles, allStylesWithAll, LeaderboardSortBy, RankSortBy, TimeSortBy } from "shared";

function formatIntEnum(val: unknown) {
    return typeof val === "string" ? +val : val;
}

export const game = () => vine.enum(allGames).parse(formatIntEnum);
export const gameOrAll = () => vine.enum(allGamesWithAll).parse(formatIntEnum);
export const style = () => vine.enum(allStyles).parse(formatIntEnum);
export const styleOrAll = () => vine.enum(allStylesWithAll).parse(formatIntEnum);
export const timesSort = () => vine.enum([TimeSortBy.DateAsc, TimeSortBy.DateDesc, TimeSortBy.TimeAsc, TimeSortBy.TimeDesc]).parse(formatIntEnum);
export const leaderboardSort = () => vine.enum([LeaderboardSortBy.BonusAsc, LeaderboardSortBy.BonusDesc, LeaderboardSortBy.MainAsc, LeaderboardSortBy.MainDesc]).parse(formatIntEnum);
export const rankSort = () => vine.enum([RankSortBy.RankAsc, RankSortBy.SkillAsc]).parse(formatIntEnum);

export const idValidator = vine.create({
    id: vine.number().withoutDecimals().nonNegative()
});

export const usernameValidator = vine.create({
    username: vine.string().maxLength(50)
});