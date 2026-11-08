import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import { keyframes } from "@mui/material/styles";
import { CommentMarker, MarkerComment } from "../../../common/comments";
import { PlaybackTime } from "../../playback/playbackTime";
import CommentPreview from "./CommentPreview";

// How long a pop-up stays, in real time whatever the playback speed, and how long it takes to fade out at the end
const SHOW_MS = 5000;
const FADE_MS = 400;
const MAX_SHOWN = 3;
// A bigger jump than this between two updates is a seek, not playback passing a comment
const MAX_PLAYBACK_STEP = 1;

const slideIn = keyframes`
    from { transform: translateX(-12px); opacity: 0; }
    to { transform: none; opacity: 1; }
`;

interface Popup {
    key: number
    item: MarkerComment
    leaving: boolean
}

interface CommentPopupsProps {
    markers: CommentMarker[]
    time: PlaybackTime
    enabled: boolean
    // Whether the replay is playing on its own. Time moving otherwise is someone dragging or stepping through it.
    playing: boolean
    // Distance from the top of the player, in pixels
    top: number
}

/** Shows comments for a few seconds as playback passes their timestamps. */
function CommentPopups(props: CommentPopupsProps) {
    const { markers, time, enabled, playing, top } = props;
    const [popups, setPopups] = useState<Popup[]>([]);
    const markersRef = useRef(markers);
    const playingRef = useRef(playing);
    useEffect(() => {
        markersRef.current = markers;
        playingRef.current = playing;
    });

    useEffect(() => {
        if (!enabled) {
            setPopups([]);
            return;
        }

        let last = time.get();
        let nextKey = 0;
        const timers = new Set<ReturnType<typeof setTimeout>>();
        const later = (ms: number, fn: () => void) => {
            const timer = setTimeout(() => {
                timers.delete(timer);
                fn();
            }, ms);
            timers.add(timer);
        };

        const unsubscribe = time.subscribe((now) => {
            const previous = last;
            last = now;
            const step = now - previous;
            if (!playingRef.current || step <= 0 || step > MAX_PLAYBACK_STEP) return;

            const passed = markersRef.current.filter((marker) => marker.seconds > previous && marker.seconds <= now);
            if (passed.length === 0) return;

            const added: Popup[] = passed.flatMap((marker) => marker.comments).map((item) => ({
                key: nextKey++,
                item: item,
                leaving: false
            }));
            // Newest at the top, so the oldest leaving from the bottom doesn't move the others
            setPopups((old) => [...added, ...old].slice(0, MAX_SHOWN));
            for (const popup of added) {
                later(SHOW_MS - FADE_MS, () => setPopups((old) => old.map((other) => other.key === popup.key ? { ...other, leaving: true } : other)));
                later(SHOW_MS, () => setPopups((old) => old.filter((other) => other.key !== popup.key)));
            }
        });

        return () => {
            unsubscribe();
            for (const timer of timers) clearTimeout(timer);
        };
    }, [time, enabled]);

    if (popups.length === 0) {
        return null;
    }

    return (
        <Box
            aria-live="polite"
            sx={{
                position: "absolute",
                left: 8,
                top: top,
                transition: "top .2s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 0.75,
                maxWidth: "min(300px, 45%)",
                // Clicks go through to the player, which pauses on click
                pointerEvents: "none"
            }}>
            {popups.map((popup) => (
                <Box
                    key={popup.key}
                    sx={{
                        maxWidth: "100%",
                        animation: `${slideIn} 200ms ease-out`,
                        transition: `opacity ${FADE_MS}ms ease`,
                        opacity: popup.leaving ? 0 : 1,

                        "@media (prefers-reduced-motion: reduce)": {
                            animation: "none"
                        }
                    }}>
                    <CommentPreview {...popup.item} />
                </Box>
            ))}
        </Box>
    );
}

export default CommentPopups;
