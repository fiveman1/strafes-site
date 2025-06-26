import axios from "axios";
import { User } from "../../../shared/interfaces";

async function tryGetRequest(url: string, params?: any) {
    try {
        return await axios.get("/api/" + url, {params: params, timeout: 5000});
    } 
    catch (err) {
        console.log(err);
        return undefined;
    }
}

export async function getUserIdFromName(username: string): Promise<number | undefined> {
    const params = {
        username: username
    };
    
    const res = await tryGetRequest("username", params);
    if (!res) return undefined;

    return res.data.id;
}

export async function getUserData(userId: string): Promise<User | undefined> {
    const res = await tryGetRequest("user/" + userId);
    if (!res) return undefined;

    return res.data as User;
}