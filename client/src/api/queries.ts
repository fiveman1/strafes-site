import { createQueryKeyStore } from "@lukemorales/query-key-factory";
import { getAllTimesForUser, getCompletionsForUser, getCurrentMapTierVote, getLeaderboardPage, getLoggedInUser, getMaps, getNumWRsForUser, getRanks, getTimeData, getUserData, getUserIdFromName, getUserRank, getVotingInfo, searchByUsername } from "./api";
import { Game, LeaderboardSortBy, LoginUser, RankSortBy, Style, TimeSortBy, UserSearchData } from "shared";

async function queryByUserSearch(search: UserSearchData) {
    if (search.userId !== undefined) {
        return search.userId;
    }
    return await getUserIdFromName(search.username);
}

async function getVotingInfoWrapper(user: LoginUser | undefined | null) {
    if (!user) return null;
    return await getVotingInfo();
}

async function getMapTierVoteWrapper(user: LoginUser | undefined, mapId: number) {
    if (!user) return null;
    return await getCurrentMapTierVote(mapId);
}

export const queries = createQueryKeyStore({
    users: {
        search: (username: string) => ({
            queryKey: [username.toLowerCase()],
            queryFn: () => searchByUsername(username)
        }),
        fromId: (userId: string | undefined) => ({
            queryKey: [userId],
            queryFn: () => getUserData(userId)
        }),
        fromSearch: (search: UserSearchData) => ({
            queryKey: [search.userId, search.username.toLowerCase()],
            queryFn: () =>  queryByUserSearch(search)
        }),
        rank: (userId: string, game: Game, style: Style) => ({
            queryKey: [userId, game, style],
            queryFn: () => getUserRank(userId, game, style)
        }),
        completions: (userId: string, game: Game, style: Style) => ({
            queryKey: [userId, game, style],
            queryFn: () => getCompletionsForUser(userId, game, style)
        }),
        wrCount: (userId: string, game: Game, style: Style) => ({
            queryKey: [userId, game, style],
            queryFn: () => getNumWRsForUser(userId, game, style)
        }),
        allTimes: (userId: string, game: Game, style: Style) => ({
            queryKey: [userId, game, style],
            queryFn: () => getAllTimesForUser(userId, game, style)
        }),
    },
    times: {
        times: (
            start: number | string, 
            end: number | string, 
            sortBy: TimeSortBy, 
            course: number,
            game?: Game, 
            style?: Style, 
            userId?: string, 
            mapId?: string, 
            onlyWR?: boolean
        ) => ({
            queryKey: [game, style, userId, mapId, onlyWR, course, sortBy, start, end],
            queryFn: () => getTimeData(start, end, sortBy, course, game, style, userId, mapId, onlyWR)
        })
    },
    wrs: {
        leaderboards: (start: number | string, end: number | string, game: Game, style: Style, sort: LeaderboardSortBy) => ({
            queryKey: [game, style, sort, start, end],
            queryFn: () => getLeaderboardPage(start, end, game, style, sort)
        })
    },
    ranks: {
        ranks: (start: number | string, end: number | string, sortBy: RankSortBy, game: Game, style: Style) => ({
            queryKey: [game, style, sortBy, start, end],
            queryFn: () => getRanks(start, end, sortBy, game, style)
        })
    },
    auth: {
        user: {
            queryKey: null,
            queryFn: () => getLoggedInUser()
        },
        voteEligibility: (user: LoginUser | undefined | null) => ({
            queryKey: [user?.userId],
            queryFn: () => getVotingInfoWrapper(user)
        })
    },
    maps: {
        maps: {
            queryKey: null,
            queryFn: () => getMaps()
        },
        tierVote: (user: LoginUser | undefined, mapId: number) => ({
            queryKey: [user?.userId, mapId],
            queryFn: () => getMapTierVoteWrapper(user, mapId)
        })
    }
});