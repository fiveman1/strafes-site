import axios from "axios";
import memoize from 'memoize';
import { IS_DEV_MODE } from "./util.js";

const DISABLE_ROPROXY = process.env.DISABLE_ROPROXY === "true";

export const tryGetCached = memoize(tryGetRequest, {cacheKey: JSON.stringify, maxAge: 5 * 60 * 1000});
export const tryPostCached = memoize(tryPostRequest, {cacheKey: JSON.stringify, maxAge: 5 * 60 * 1000});

export async function tryGetRequest(url: string, params?: any, headers?: any) {
    if (DISABLE_ROPROXY) {
        url = url.replace("roproxy.com", "roblox.com");
    }
    try {
        return await axios.get(url, {params: params, headers: headers, timeout: 10000});
    } 
    catch (err) {
        if (IS_DEV_MODE) {
            console.log(err);
        }
        return undefined;
    }
}

export async function tryPostRequest(url: string, params?: any) {
    try {
        return await axios.post(url, params, {timeout: 5000});
    } 
    catch (err) {
        if (IS_DEV_MODE) {
            console.log(err);
        }
        return undefined;
    }
}