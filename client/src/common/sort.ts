import { Map } from "shared";

export function sortMapsByName(a: Map, b: Map) {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    if (nameA === nameB) {
        return a.id - b.id;
    }
    return nameA > nameB ? 1 : -1
}