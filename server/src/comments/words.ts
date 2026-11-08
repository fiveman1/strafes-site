import { DataSet, englishDataset, EnglishProfaneWord, parseRawPattern } from "obscenity";

// The word lists for comments. Casual swearing is fine; slurs and hate aren't.
//
// The matcher (obscenity) handles leetspeak, look-alike letters and repeated letters, so a pattern only needs the
// plain spelling. Repeated letters collapse to one before matching, except b, e, o, l, s and g, which collapse to
// two: write "kill", not "kil", and "kys", not "kyys". In a pattern, "|" is a word boundary and "[x]" is optional.
// Spaced-out letters like "n i g g e r" are joined up before checking (see filter.ts).

type WordMetadata = { originalWord: string };

// Words from obscenity's English list that get a comment rejected. Everything else in that list (swearing, sexual
// words) is allowed. Left out on purpose: "negro" (Spanish/Portuguese for "black").
const BLOCKED_ENGLISH_WORDS: ReadonlySet<EnglishProfaneWord> = new Set<EnglishProfaneWord>([
    "abeed",
    "abo",
    "africoon",
    "arabush",
    "boonga",
    "chingchong",
    "chink",
    "dyke",
    "fag",
    "kike",
    "nigger",
    "tranny"
]);

// Words from that list that send a comment to review instead, since they're often thrown around loosely
const FLAGGED_ENGLISH_WORDS: ReadonlySet<EnglishProfaneWord> = new Set<EnglishProfaneWord>([
    "retard",
    "spastic"
]);

function fromEnglishDataset(words: ReadonlySet<EnglishProfaneWord>) {
    // The cast is safe: the English dataset's metadata is the same shape with a narrower string type
    return new DataSet<WordMetadata>()
        .addAll(englishDataset as unknown as DataSet<WordMetadata>)
        .removePhrasesIf((phrase) => !words.has(phrase.metadata?.originalWord as EnglishProfaneWord));
}

function addWords(dataSet: DataSet<WordMetadata>, words: Record<string, string[]>) {
    for (const [word, patterns] of Object.entries(words)) {
        dataSet.addPhrase((phrase) => {
            phrase.setMetadata({ originalWord: word });
            for (const raw of patterns) phrase.addPattern(parseRawPattern(raw));
            return phrase;
        });
    }
    return dataSet;
}

// Our own, for what the English list misses. Short ones only match as whole words, so "raccoon" and "Pakistan" are fine.
const BLOCKED_WORDS: Record<string, string[]> = {
    beaner: ["beaner"],
    coon: ["|coon|", "|coons|"],
    gook: ["|gook|", "|gooks|"],
    paki: ["|paki|", "|pakis|"],
    raghead: ["raghead"],
    spic: ["|spic|", "|spics|"],
    towelhead: ["towelhead"],
    wetback: ["wetback"]
};

const SELF_HARM_VERBS = ["kill", "neck", "hang", "|end", "unalive"];

const FLAGGED_WORDS: Record<string, string[]> = {
    kys: ["|kys|"],
    "kill yourself": SELF_HARM_VERBS.flatMap((verb) => [`${verb} [yo]urself`, `${verb} [yo]ur self`])
};

/** Rejected outright. */
export const blockedWords = addWords(fromEnglishDataset(BLOCKED_ENGLISH_WORDS), BLOCKED_WORDS);

/** Posted, but only visible to the author and moderators until a moderator approves it. */
export const flaggedWords = addWords(fromEnglishDataset(FLAGGED_ENGLISH_WORDS), FLAGGED_WORDS);
