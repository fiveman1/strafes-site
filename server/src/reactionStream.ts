import { Request, Response } from "express";
import { ReplayReactionsUpdate } from "shared";
import { GlobalsClient } from "./globals.js";
import { getReactionsForReplay } from "./reactions.js";

// Live reaction updates over Server-Sent Events. Everything lives in memory, which works because the site runs as one
// process. With more than one, each would only hear about reactions made through itself.

// Cloudflare drops proxied connections that send nothing for 100 seconds, and nginx's default proxy_read_timeout is 60
const HEARTBEAT_MS = 30 * 1000;
// A burst of reactions on one replay goes out as one update
const BROADCAST_DELAY_MS = 250;
// Each stream holds a socket open, so don't let one client (or everyone together) hold too many
const MAX_STREAMS_PER_IP = 10;
const MAX_STREAMS = 5000;

const streamsByTime = new Map<string, Set<Response>>();
const streamCountByIp = new Map<string, number>();
let streamCount = 0;

// Replays with an update waiting to go out
const pendingBroadcasts = new Set<string>();
// Bumped for every update, so a slow query can't send older totals after newer ones
const broadcastVersions = new Map<string, number>();

function writeEvent(res: Response, update: ReplayReactionsUpdate) {
    res.write(`event: reactions\ndata: ${JSON.stringify(update)}\n\n`);
}

async function loadUpdate(client: GlobalsClient, timeId: string): Promise<ReplayReactionsUpdate> {
    // No user, since this goes to everyone
    const reactions = await getReactionsForReplay(client, timeId, undefined);
    return {
        timeId: timeId,
        reactions: reactions.reactions.map(({ reaction, count, users }) => ({ reaction, count, users }))
    };
}

setInterval(() => {
    for (const streams of streamsByTime.values()) {
        for (const res of streams) {
            // A comment line, which EventSource ignores
            res.write(": ping\n\n");
        }
    }
}, HEARTBEAT_MS).unref();

export async function openReactionStream(client: GlobalsClient, req: Request, res: Response, timeId: string) {
    const ip = req.ip ?? "";
    const ipCount = streamCountByIp.get(ip) ?? 0;
    if (ipCount >= MAX_STREAMS_PER_IP || streamCount >= MAX_STREAMS) {
        res.status(429).send("Too many open streams");
        return;
    }

    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        // no-transform so nothing in between holds the stream back to compress it
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        // Tells nginx not to buffer this response
        "X-Accel-Buffering": "no"
    });

    let streams = streamsByTime.get(timeId);
    if (!streams) {
        streams = new Set();
        streamsByTime.set(timeId, streams);
    }
    streams.add(res);
    streamCountByIp.set(ip, ipCount + 1);
    streamCount += 1;

    // res, not req: req's close can fire as soon as the request has been read, rather than when the client leaves
    res.on("close", () => {
        const current = streamsByTime.get(timeId);
        current?.delete(res);
        if (current?.size === 0) {
            streamsByTime.delete(timeId);
            broadcastVersions.delete(timeId);
        }

        const count = (streamCountByIp.get(ip) ?? 1) - 1;
        if (count > 0) {
            streamCountByIp.set(ip, count);
        }
        else {
            streamCountByIp.delete(ip);
        }
        streamCount -= 1;
    });

    // Wait 5 seconds before reconnecting after a drop
    res.write("retry: 5000\n\n");

    // Start with the current totals, which covers anything missed between the page's fetch and now, or while reconnecting
    try {
        const update = await loadUpdate(client, timeId);
        if (!res.writableEnded) {
            writeEvent(res, update);
        }
    }
    catch (err) {
        console.error("Failed to load reactions for stream:", err);
    }
}

/** Sends the replay's new totals to everyone watching it, shortly, so changes close together go out as one update. */
export function broadcastReactions(client: GlobalsClient, timeId: string) {
    if (!streamsByTime.has(timeId) || pendingBroadcasts.has(timeId)) {
        return;
    }
    pendingBroadcasts.add(timeId);

    setTimeout(async () => {
        pendingBroadcasts.delete(timeId);
        const version = (broadcastVersions.get(timeId) ?? 0) + 1;
        broadcastVersions.set(timeId, version);

        let update: ReplayReactionsUpdate;
        try {
            update = await loadUpdate(client, timeId);
        }
        catch (err) {
            console.error("Failed to load reactions for broadcast:", err);
            return;
        }

        if (broadcastVersions.get(timeId) !== version) {
            // A newer update started while this one was loading
            return;
        }
        for (const res of streamsByTime.get(timeId) ?? []) {
            writeEvent(res, update);
        }
    }, BROADCAST_DELAY_MS);
}
