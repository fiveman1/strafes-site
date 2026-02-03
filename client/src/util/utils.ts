export function numDigits(x: number) {
    return (Math.log10((x ^ (x >> 31)) - (x >> 31)) | 0) + 1;
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function normalize(val: number, minVal: number, maxVal: number, newMin: number, newMax: number) {
  return newMin + (val - minVal) * (newMax - newMin) / (maxVal - minVal);
};