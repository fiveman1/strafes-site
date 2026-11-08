import { englishRecommendedTransformers, RegExpMatcher } from "obscenity";
import { commentLength, MAX_COMMENT_LENGTH, normalizeComment } from "shared";
import { blockedWords, flaggedWords } from "./words.js";

const blockedMatcher = new RegExpMatcher({ ...blockedWords.build(), ...englishRecommendedTransformers });
const flaggedMatcher = new RegExpMatcher({ ...flaggedWords.build(), ...englishRecommendedTransformers });

// Three or more single characters split by spaces or punctuation, like "n i g g e r" or "k.y.s"
const SPACED_LETTERS = /(?<![^\s.\-_*])[^\s.\-_*](?:[\s.\-_*]+[^\s.\-_*]){2,}(?![^\s.\-_*])/gu;
const SEPARATORS = /[\s.\-_*]+/u;
// Longer than any word on the lists
const MAX_SPACED_WORD = 12;

export type CommentCheck = "ok" | "flagged" | "blocked";

/**
 * Every word a run of spaced-out letters could be hiding. Where a word starts and ends isn't clear ("u k y s"), so
 * it's every stretch of 3 or more letters.
 */
function spacedOutWords(text: string): string[] {
    const words: string[] = [];
    for (const [run] of text.matchAll(SPACED_LETTERS)) {
        const letters = run.split(SEPARATORS);
        for (let start = 0; start + 3 <= letters.length; start++) {
            for (let end = start + 3; end <= Math.min(letters.length, start + MAX_SPACED_WORD); end++) {
                words.push(letters.slice(start, end).join(""));
            }
        }
    }
    return words;
}

/** Checks an already normalized comment against the word lists. */
export function checkComment(text: string): CommentCheck {
    const words = spacedOutWords(text);
    const texts = words.length > 0 ? [text, words.join(" ")] : [text];
    if (texts.some((t) => blockedMatcher.hasMatch(t))) {
        return "blocked";
    }
    if (texts.some((t) => flaggedMatcher.hasMatch(t))) {
        return "flagged";
    }
    return "ok";
}

export type CommentBodyResult = { error: string } | { body: string, check: Exclude<CommentCheck, "blocked"> };

/** Normalizes, length-checks and filters a comment body. */
export function prepareCommentBody(text: string): CommentBodyResult {
    const body = normalizeComment(text);
    if (body === "") {
        return { error: "Your comment is empty" };
    }
    if (commentLength(body) > MAX_COMMENT_LENGTH) {
        return { error: `Comments can be at most ${MAX_COMMENT_LENGTH} characters` };
    }

    const check = checkComment(body);
    if (check === "blocked") {
        // Deliberately vague, so it doesn't help anyone work out what gets through
        return { error: "This comment can't be posted" };
    }
    return { body: body, check: check };
}
