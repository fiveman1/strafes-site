// utils.ts

export function safeQuoteText(str: string) {
    return str.replaceAll("\"", "&quot;");
}

export function calcRank(rank: number) {
    return Math.floor((1 - rank) * 19) + 1;
}

export function validatePositiveInt(value: any) {
    return !isNaN(+value) && +value > 0;
}