// Current playback time, shared without React state.
// It changes every frame, and re-rendering the player that often is wasteful
// (and in dev builds React records a performance entry per render that is never freed),
// so the components that show it subscribe and update their DOM directly.
export interface PlaybackTime {
    get(): number
    set(time: number): void
    subscribe(listener: (time: number) => void): () => void
}

export function createPlaybackTime(initial: number): PlaybackTime {
    let time = initial;
    const listeners = new Set<(time: number) => void>();
    return {
        get: () => time,
        set(newTime: number) {
            if (newTime === time) return;
            time = newTime;
            for (const listener of listeners) {
                listener(time);
            }
        },
        subscribe(listener: (time: number) => void) {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        }
    };
}
