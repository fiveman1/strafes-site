export type PrefetchableRoute = "users" | "globals" | "maps" | "ranks" | "compare";

export const loadUsers = () => import("./components/Users");
export const loadRanks = () => import("./components/Ranks");
export const loadGlobals = () => import("./components/Globals");
export const loadMapsPage = () => import("./components/MapsPage");
export const loadMapsHome = () => import("./components/MapsHome");
export const loadCompare = () => import("./components/Compare");
export const loadSettings = () => import("./components/Settings");
export const loadReplays = () => import("./components/Replays");

const commonRouteLoaders: Record<PrefetchableRoute, () => Promise<unknown>> = {
    users: loadUsers,
    globals: loadGlobals,
    maps: () => Promise.all([loadMapsHome(), loadMapsPage()]),
    ranks: loadRanks,
    compare: loadCompare
};

export function prefetchRouteModule(route: PrefetchableRoute) {
    void commonRouteLoaders[route]().catch(() => undefined);
}

export function prefetchCommonRouteModules() {
    void Promise.allSettled(Object.values(commonRouteLoaders).map((load) => load()));
}
