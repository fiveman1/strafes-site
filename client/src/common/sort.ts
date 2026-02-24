import { Game, Map, NO_TIER } from "shared";
import { MapTimesSort } from "./states";

export function sortMapsByName(a: Map, b: Map) {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    if (nameA === nameB) {
        return a.id - b.id;
    }
    return nameA > nameB ? 1 : -1
}

function dateCompareFunc(a: Map, b: Map, isAsc: boolean) {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA === dateB) {
        return sortMapsByName(a, b);
    }
    return isAsc ? dateB - dateA : dateA - dateB;
}

export function sortAndFilterMaps(maps: Map[], filterGame: Game, filterTiers: Set<number>, sort: MapTimesSort) {
    if (filterGame !== Game.all) {
        maps = maps.filter((map) => map.game === filterGame);
    }

    maps = maps.filter((map) => filterTiers.has(map.tier ?? NO_TIER));

    let compareFunc: (a: Map, b: Map) => number;
    switch (sort) {
        case "nameAsc":
            compareFunc = sortMapsByName;
            break;
        case "nameDesc":
            compareFunc = (a, b) => sortMapsByName(a, b) * -1;
            break;
        case "creatorAsc":
            compareFunc = (a, b) => a.creator === b.creator ? sortMapsByName(a, b) : a.creator.toLowerCase() > b.creator.toLowerCase() ? 1 : -1;
            break;
        case "creatorDesc":
            compareFunc = (a, b) => a.creator === b.creator ? sortMapsByName(a, b) : a.creator.toLowerCase() < b.creator.toLowerCase() ? 1 : -1;
            break;
        case "dateAsc":
            compareFunc = (a, b) => dateCompareFunc(a, b, true);
            break;
        case "dateDesc":
            compareFunc = (a, b) => dateCompareFunc(a, b, false);
            break;
        case "countAsc":
            compareFunc = (a, b) => a.loadCount === b.loadCount ? sortMapsByName(a, b) : b.loadCount - a.loadCount;
            break;
        case "countDesc":
            compareFunc = (a, b) => a.loadCount === b.loadCount ? sortMapsByName(a, b) : a.loadCount - b.loadCount;
            break;
        case "tierAsc":
            compareFunc = (a, b) => a.tier === b.tier ? sortMapsByName(a, b) : (a.tier ?? 99) - (b.tier ?? 99);
            break;
        case "tierDesc":
            compareFunc = (a, b) => a.tier === b.tier ? sortMapsByName(a, b) : (b.tier ?? -99) - (a.tier ?? -99);
            break;
    }

    maps.sort(compareFunc);
    return maps;
}

export function filterMapsBySearch(options: Map[], inputValue: string): Map[] {
    const filteredMaps: Map[] = [];
    const alreadyFilteredMaps = new Set<number>();
    const search = inputValue.toLowerCase();

    // Exact map name matches
    for (const map of options) {
        if (!alreadyFilteredMaps.has(map.id) && map.name.toLowerCase().startsWith(search)) {
            filteredMaps.push(map);
            alreadyFilteredMaps.add(map.id);
        }
    }

    // Near map name matches
    for (const map of options) {
        if (!alreadyFilteredMaps.has(map.id) && map.name.toLowerCase().includes(search)) {
            filteredMaps.push(map);
            alreadyFilteredMaps.add(map.id);
        }
    }

    // Exact creator matches
    for (const map of options) {
        if (!alreadyFilteredMaps.has(map.id) && map.creator.toLowerCase().startsWith(search)) {
            filteredMaps.push(map);
            alreadyFilteredMaps.add(map.id);
        }
    }

    // Near creator matches
    for (const map of options) {
        if (!alreadyFilteredMaps.has(map.id) && map.creator.toLowerCase().includes(search)) {
            filteredMaps.push(map);
            alreadyFilteredMaps.add(map.id);
        }
    }

    return filteredMaps;
}