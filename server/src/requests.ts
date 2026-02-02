import axios from "axios";
import memoize from 'memoize';
import { exit } from "process";

const STRAFES_KEY = process.env.STRAFES_KEY;
if (!STRAFES_KEY) {
    console.error("Missing StrafesNET API key");
    exit(1);
}

const IS_DEBUG = process.env.DEBUG === "true";
const DISABLE_ROPROXY = process.env.DISABLE_ROPROXY === "true";

export const tryGetCached = memoize(tryGetRequest, {cacheKey: JSON.stringify, maxAge: 5 * 60 * 1000});
export const tryPostCached = memoize(tryPostRequest, {cacheKey: JSON.stringify, maxAge: 5 * 60 * 1000});
export const tryGetStrafes = memoize(tryGetStrafesCore, {cacheKey: JSON.stringify, maxAge: 5 * 60 * 1000});
export const tryGetMaps = memoize(tryGetMapsCore, {cacheKey: JSON.stringify, maxAge: 60 * 60 * 1000});

async function tryGetStrafesCore(end_of_url: string, params?: any) {
    const headers = {
        "X-API-Key": STRAFES_KEY
    };
    return await tryGetRequest(`https://api.strafes.net/api/v1/${end_of_url}`, params, headers);
}

async function tryGetMapsCore(end_of_url: string, params?: any) {
    const headers = {
        "X-API-Key": STRAFES_KEY
    };
    return await tryGetRequest(`https://maps.strafes.net/public-api/v1/${end_of_url}`, params, headers);
}

export async function tryGetRequest(url: string, params?: any, headers?: any) {
    if (DISABLE_ROPROXY) {
        url = url.replace("roproxy.com", "roblox.com");
    }
    try {
        return await axios.get(url, {params: params, headers: headers, timeout: 10000});
    } 
    catch (err) {
        if (IS_DEBUG) {
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
        if (IS_DEBUG) {
            console.log(err);
        }
        return undefined;
    }
}