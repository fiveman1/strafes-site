import { createQueryKeyStore } from "@lukemorales/query-key-factory";
import { getAllTimesForUser, getBotFileURL, getCompletionsForUser, getCurrentMapTierVote, getLeaderboardPage, getLoggedInUser, getMapFileURL, getMaps, getNumWRsForUser, getRanks, getReplayById, getReplayComments, getReplayReactions, getModQueue, searchModComments, getInbox, getInboxCount, getModLog, getCommentBans, getCommentModerators, ModCommentSearch, getTimeData, getUserData, getUserIdFromName, getUserRank, getVotingInfo, searchByUsername } from "./api";
import { CommentSort, Game, LeaderboardSortBy, LoginUser, RankSortBy, Style, TimeSortBy, UserSearchData } from "shared";

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
            onlyWR?: boolean,
            filterGames?: Game[]
        ) => ({
            queryKey: [game, filterGames ? filterGames.toSorted() : undefined, style, userId, mapId, onlyWR, course, sortBy, start, end],
            queryFn: () => getTimeData(start, end, sortBy, course, game, filterGames, style, userId, mapId, onlyWR)
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
            queryFn: () => getVotingInfoWrapper(user),
            staleTime: Infinity
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
    },
    replays: {
        replay: (timeId: string) => ({
            queryKey: [timeId],
            queryFn: () => getReplayById(timeId)
        }),
        // userId is in the key since "reacted" depends on who's logged in
        reactions: (timeId: string, userId: number | undefined) => ({
            queryKey: [timeId, userId],
            queryFn: () => getReplayReactions(timeId),
            staleTime: 30 * 1000
        }),
        // userId is in the key since liked, reported, and what's included depend on who's logged in
        comments: (timeId: string, userId: number | undefined, sort: CommentSort) => ({
            queryKey: [timeId, userId, sort],
            queryFn: () => getReplayComments(timeId, sort),
            staleTime: 30 * 1000
        }),
        botURL: (timeId: string) => ({
            queryKey: [timeId],
            queryFn: () => getBotFileURL(timeId),
            staleTime: 60 * 1000
        }),
        mapURL: (mapId: number) => ({
            queryKey: [mapId],
            queryFn: () => getMapFileURL(mapId),
            staleTime: 60 * 1000
        })
    },
    // userId is in the keys so another account's inbox never shows after switching
    inbox: {
        items: (userId: number | undefined) => ({
            queryKey: [userId],
            queryFn: () => getInbox()
        }),
        count: (userId: number | undefined) => ({
            queryKey: [userId],
            queryFn: () => getInboxCount()
        })
    },
    mod: {
        queue: {
            queryKey: null,
            queryFn: () => getModQueue()
        },
        comments: (search: ModCommentSearch) => ({
            queryKey: [search],
            queryFn: () => searchModComments(search)
        }),
        log: (page: number) => ({
            queryKey: [page],
            queryFn: () => getModLog(page)
        }),
        bans: {
            queryKey: null,
            queryFn: () => getCommentBans()
        },
        moderators: {
            queryKey: null,
            queryFn: () => getCommentModerators()
        }
    }
});