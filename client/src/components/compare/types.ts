import { Style, UserInfo } from "shared";
import { pink, purple, green, orange, blue } from "@mui/material/colors";

export const MAX_ENTRIES = 4;
export const ITEMS_PER_PAGE = 20;
export const TIE_COLOR = blue["A400"];
export const ENTRY_COLORS = [pink["A400"], purple["A700"], green["A400"], orange["A400"]];

export interface CompareEntry {
    userId: string
    style: Style
}

export interface CompareTimeInfo {
    map: string
    mapId: number
    mapThumb?: string
    times: CompareTime[]
}

export interface CompareTime extends UserInfo {
    userColor: string
    time: number
    date: string
    id: string
    style: Style
    entryIndex: number
}

function getEntryKey(entry: CompareEntry) {
    return `${entry.userId}:${entry.style}`;
}

export function serializeEntries(entries: CompareEntry[]): string {
    return entries.map(getEntryKey).join(",");
}

export function deserializeEntries(raw: string): CompareEntry[] {
    if (!raw) return [];
    return raw.split(",")
        .map(part => {
            const [userId, styleStr] = part.split(":");
            const style = Number(styleStr);
            if (!userId || isNaN(style)) return null;
            return { userId, style: style as Style };
        })
        .filter((e): e is CompareEntry => e !== null)
        .slice(0, MAX_ENTRIES);
}

export function isDuplicateEntry(entries: CompareEntry[], userId: string, style: Style): boolean {
    return entries.some(e => e.userId === userId && e.style === style);
}

export function findDuplicateEntries(entries: CompareEntry[]): CompareEntry[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const entry of entries) {
        const key = getEntryKey(entry);
        if (seen.has(key)) {
            duplicates.add(key);
        }
        seen.add(key);
    }
    return Array.from(duplicates).map(key => {
        const [userId, style] = key.split(":");
        return { userId: userId, style: +style };
    });
}

export function hasDuplicateEntries(entries: CompareEntry[]): boolean {
    const seen = new Set<string>();
    for (const entry of entries) {
        const key = getEntryKey(entry);
        if (seen.has(key)) return true;
        seen.add(key);
    }
    return false;
}

export function getSliceCount(numEntries: number): number {
    // N "wins" slices + 1 "tie" slice + N "exclusive" slices
    return numEntries * 2 + 1;
}

export function getWinSliceIndex(entryIndex: number): number {
    return entryIndex;
}

export function getTieSliceIndex(numEntries: number): number {
    return numEntries;
}

export function getExclusiveSliceIndex(entryIndex: number, numEntries: number): number {
    return numEntries + 1 + entryIndex;
}

export function shouldIncludeTimes(
    times: CompareTime[],
    numEntries: number,
    filterSlice: number
): boolean {
    const tieIndex = getTieSliceIndex(numEntries);

    // Win slice for entry i
    if (filterSlice < numEntries) {
        if (times.length < 2) return false;
        const best = times[0];
        const second = times[1];
        return best.entryIndex === filterSlice && best.time !== second.time;
    }

    // Tie slice
    if (filterSlice === tieIndex) {
        return times.length >= 2 && times[0].time === times[1].time;
    }

    // Exclusive slice for entry i
    const exclusiveEntryIndex = filterSlice - numEntries - 1;
    if (exclusiveEntryIndex >= 0 && exclusiveEntryIndex < numEntries) {
        return times.length === 1 && times[0].entryIndex === exclusiveEntryIndex;
    }

    return true;
}

export function diffSortVal(a: CompareTimeInfo, b: CompareTimeInfo, isAsc: boolean): number {
    if (a.times.length === 1 && b.times.length === 1) {
        return a.map < b.map ? -1 : 1;
    }
    else if (a.times.length === 1) {
        return 1;
    }
    else if (b.times.length === 1) {
        return -1;
    }
    const diffA = +a.times[0].time - +a.times[1].time;
    const diffB = +b.times[0].time - +b.times[1].time;
    return isAsc ? diffB - diffA : diffA - diffB;
}

export function getMostRecentDate(info: CompareTimeInfo): number {
    let date: number | undefined;
    for (const time of info.times) {
        const timeDate = new Date(time.date);
        if (!date || timeDate.getTime() > date) {
            date = timeDate.getTime();
        }
    }
    return date ?? 0;
}
