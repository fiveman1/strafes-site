// Comment text cleanup, the same on the client (for the length counter) and the server

// Zero-width characters, bidi controls, and other invisible format characters, besides the zero-width joiner and tags
const INVISIBLE_CHARS = /[\p{Cf}\u034F\u115F\u1160\u3164\uFFA0](?<![\u200D\u{E0020}-\u{E007F}])/gu;
// The zero-width joiner, except between two emoji (it's how 👨‍👩‍👧 and 👩🏽‍💻 are built), so it can't hide inside a word
const STRAY_JOINERS = /(?<!\p{Extended_Pictographic}[\u{1F3FB}-\u{1F3FF}\uFE0F]?)\u200D|\u200D(?!\p{Extended_Pictographic})/gu;
// Tag characters, except in the flags that are built from them, like England's
const STRAY_TAGS = /(\u{1F3F4}[\u{E0020}-\u{E007E}]+\u{E007F})|[\u{E0020}-\u{E007F}]/gu;
// Control characters other than \n
const CONTROL_CHARS = /[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g;
// More than two combining marks on one letter is zalgo text, not an accent
const STACKED_MARKS = /(\p{M}{2})\p{M}+/gu;
// The same character more than 5 times in a row
const REPEATED_CHARS = /(.)\1{5,}/gu;
const MAX_LINES = 3;

/** Cleans up a comment before it's checked and stored. Can return an empty string. */
export function normalizeComment(text: string): string {
    let result = text
        .normalize("NFKC")
        .replace(/\r\n?/g, "\n")
        .replace(INVISIBLE_CHARS, "")
        .replace(STRAY_JOINERS, "")
        .replace(STRAY_TAGS, (_, flag: string | undefined) => flag ?? "")
        .replace(CONTROL_CHARS, "")
        .replace(STACKED_MARKS, "$1")
        .replace(REPEATED_CHARS, (_, char: string) => char.repeat(5));

    // Keep at most MAX_LINES non-empty lines, and join the rest onto the last one
    const lines = result.split("\n").map((line) => line.trim()).filter((line) => line !== "");
    if (lines.length > MAX_LINES) {
        lines.splice(MAX_LINES - 1, lines.length, lines.slice(MAX_LINES - 1).join(" "));
    }
    result = lines.join("\n");

    // Runs of spaces down to one
    return result.replace(/[^\S\n]+/g, " ").trim();
}

/** Length in characters as a person counts them, so an emoji is 1 and not 2. */
export function commentLength(text: string) {
    return Array.from(text).length;
}

/** Orders comment IDs, which are decimal strings from AUTO_INCREMENT that can be too big for a number. */
export function compareCommentIds(a: string, b: string) {
    return a.length - b.length || (a < b ? -1 : a > b ? 1 : 0);
}
