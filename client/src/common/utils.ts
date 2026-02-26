export function numDigits(x: number) {
    return (Math.log10((x ^ (x >> 31)) - (x >> 31)) | 0) + 1;
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function normalize(val: number, minVal: number, maxVal: number, newMin: number, newMax: number) {
  return newMin + (val - minVal) * (newMax - newMin) / (maxVal - minVal);
};

export type JsonPrimitive = string | number | boolean | null | undefined;

export type JsonObject = {
    [key: string]: JsonValue;
};

export type JsonArray = Array<JsonValue>;

export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export function clamp(x: number, lo: number, hi: number) {
    return Math.min(hi, Math.max(x, lo));
}