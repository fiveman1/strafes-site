import { allReplayReactions, LoginUser, REPLAY_REACTIONS, ReplayReaction, ReplayReactions, ReplayReactionsUpdate } from "shared";
// Twemoji by Twitter and other contributors (https://github.com/jdecked/twemoji), CC-BY 4.0
import goat from "../assets/twemoji/goat.svg";
import fire from "../assets/twemoji/fire.svg";
import thumbsup from "../assets/twemoji/thumbsup.svg";
import heart from "../assets/twemoji/heart.svg";
import skull from "../assets/twemoji/skull.svg";
import sob from "../assets/twemoji/sob.svg";
import interrobang from "../assets/twemoji/interrobang.svg";
import smoking from "../assets/twemoji/smoking.svg";

export const REACTION_IMAGES: Record<ReplayReaction, string> = {
    goat: goat,
    fire: fire,
    thumbsup: thumbsup,
    heart: heart,
    skull: skull,
    sob: sob,
    interrobang: interrobang,
    smoking: smoking
};

export function getReactionInfo(reaction: ReplayReaction) {
    return REPLAY_REACTIONS.find((info) => info.key === reaction)!;
}

function joinNames(names: string[]) {
    if (names.length <= 1) return names.join("");
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

/** e.g. "You, bhopper, and 3 others reacted with Goat" */
export function formatReactors(users: string[], count: number, reacted: boolean, loginUser: LoginUser | undefined, label: string) {
    const ownName = loginUser?.username.toLowerCase();
    // The server only sends the first few names, so the user might have reacted without being listed
    const names = users.map((name) => (reacted && name.toLowerCase() === ownName) ? "You" : name);
    const others = count - names.length;

    if (names.length === 0) {
        return `${count} ${count === 1 ? "person" : "people"} reacted with ${label}`;
    }
    if (others > 0) {
        names.push(others === 1 ? "1 other" : `${others} others`);
    }
    return `${joinNames(names)} reacted with ${label}`;
}

/** New totals from the live stream, keeping which ones the user has reacted with (the stream doesn't know who they are) */
export function mergeReactionUpdate(data: ReplayReactions | null | undefined, update: ReplayReactionsUpdate): ReplayReactions {
    const reacted = new Set(data?.reactions.filter((entry) => entry.reacted).map((entry) => entry.reaction));
    return {
        timeId: update.timeId,
        reactions: update.reactions.map((entry) => ({ ...entry, reacted: reacted.has(entry.reaction) }))
    };
}

/** The reactions as they'll be once the server applies the change, for showing it right away */
export function applyReaction(data: ReplayReactions, reaction: ReplayReaction, active: boolean, loginUser: LoginUser | undefined): ReplayReactions {
    const reactions = data.reactions.map((entry) => ({ ...entry, users: [...entry.users] }));
    const index = reactions.findIndex((entry) => entry.reaction === reaction);
    const existing = index >= 0 ? reactions[index] : undefined;
    const username = loginUser?.username;

    if (active) {
        if (existing?.reacted) return data;
        if (existing) {
            // Only list the user if everyone else is already listed, otherwise they'd jump ahead of earlier reactors
            if (username && existing.users.length === existing.count) {
                existing.users.push(username);
            }
            existing.count += 1;
            existing.reacted = true;
        }
        else {
            reactions.push({ reaction, count: 1, reacted: true, users: username ? [username] : [] });
            // Keep the display order
            reactions.sort((a, b) => allReplayReactions.indexOf(a.reaction) - allReplayReactions.indexOf(b.reaction));
        }
    }
    else {
        if (!existing?.reacted) return data;
        if (existing.count <= 1) {
            reactions.splice(index, 1);
        }
        else {
            existing.count -= 1;
            existing.reacted = false;
            const ownName = username?.toLowerCase();
            existing.users = existing.users.filter((name) => name.toLowerCase() !== ownName);
        }
    }

    return { ...data, reactions };
}
