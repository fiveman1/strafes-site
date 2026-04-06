import { createQueryKeyStore } from "@lukemorales/query-key-factory";
import { getUserData, searchByUsername } from "./api";
import { UserSearchData } from "shared";

export const queries = createQueryKeyStore({
    users: {
        byUsername: (username: string, callback?: (usernames: UserSearchData[]) => void) => ({
            queryKey: [username],
            queryFn: () => searchByUsername(username).then(callback),
        }),
        byId: (userId: string | undefined) => ({
            queryKey: [userId],
            queryFn: async () => {return (await getUserData(userId) ?? null)}
        })
    }
});