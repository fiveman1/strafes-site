import { useEffect, useRef } from "react";
import { getReplayStreamURL } from "./api";

// One live connection per replay, shared by everything on the page that listens to it (reactions, comments), so they
// don't each hold a socket open. It's only open while the tab is visible, and EventSource reconnects by itself.

export type ReplayStreamEvent = "reactions" | "comment" | "comment_removed" | "comment_likes";
const EVENTS: ReplayStreamEvent[] = ["reactions", "comment", "comment_removed", "comment_likes"];

type EventListener = (data: string) => void;
type OpenListener = () => void;

interface Stream {
    source: EventSource | undefined
    listeners: Map<ReplayStreamEvent, Set<EventListener>>
    openListeners: Set<OpenListener>
    subscribers: number
}

const streams = new Map<string, Stream>();

// EventSource gives up for good on a bad response (like a 502 during a deploy), so after that we try again ourselves
const RECONNECT_MS = 15 * 1000;

function connect(timeId: string, stream: Stream) {
    if (stream.source) return;
    const source = new EventSource(getReplayStreamURL(timeId));
    source.addEventListener("error", () => {
        if (source.readyState !== EventSource.CLOSED || stream.source !== source) return;
        stream.source = undefined;
        setTimeout(() => {
            if (streams.get(timeId) === stream && document.visibilityState === "visible") {
                connect(timeId, stream);
            }
        }, RECONNECT_MS);
    });
    for (const event of EVENTS) {
        source.addEventListener(event, (message: MessageEvent<string>) => {
            for (const listener of stream.listeners.get(event) ?? []) {
                listener(message.data);
            }
        });
    }
    // Fires on every (re)connect
    source.addEventListener("open", () => {
        for (const listener of stream.openListeners) {
            listener();
        }
    });
    stream.source = source;
}

function disconnect(stream: Stream) {
    stream.source?.close();
    stream.source = undefined;
}

if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
        for (const [timeId, stream] of streams) {
            if (document.visibilityState === "visible") connect(timeId, stream);
            else disconnect(stream);
        }
    });
}

function acquire(timeId: string): Stream {
    let stream = streams.get(timeId);
    if (!stream) {
        stream = { source: undefined, listeners: new Map(), openListeners: new Set(), subscribers: 0 };
        streams.set(timeId, stream);
    }
    stream.subscribers += 1;
    if (document.visibilityState === "visible") {
        connect(timeId, stream);
    }
    return stream;
}

function release(timeId: string, stream: Stream) {
    stream.subscribers -= 1;
    if (stream.subscribers <= 0) {
        disconnect(stream);
        streams.delete(timeId);
    }
}

/**
 * Calls the handler with each event's data for the replay. onOpen runs on every (re)connect, which is when anything
 * missed while disconnected should be fetched. Handlers can change between renders without reconnecting.
 */
export function useReplayStream(
    timeId: string,
    handlers: Partial<Record<ReplayStreamEvent, EventListener>>,
    onOpen?: OpenListener
) {
    const handlersRef = useRef(handlers);
    const onOpenRef = useRef(onOpen);
    useEffect(() => {
        handlersRef.current = handlers;
        onOpenRef.current = onOpen;
    });

    useEffect(() => {
        const stream = acquire(timeId);
        const added: [ReplayStreamEvent, EventListener][] = [];
        for (const event of EVENTS) {
            const listener: EventListener = (data) => handlersRef.current[event]?.(data);
            let set = stream.listeners.get(event);
            if (!set) {
                set = new Set();
                stream.listeners.set(event, set);
            }
            set.add(listener);
            added.push([event, listener]);
        }
        const openListener = () => onOpenRef.current?.();
        stream.openListeners.add(openListener);

        return () => {
            for (const [event, listener] of added) {
                stream.listeners.get(event)?.delete(listener);
            }
            stream.openListeners.delete(openListener);
            release(timeId, stream);
        };
    }, [timeId]);
}
