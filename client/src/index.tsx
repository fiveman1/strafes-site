import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router";
import App from './App';
import Home from './components/Home';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotFoundPage, RouteErrorPage } from './components/ErrorPage';

// Routes other than the home page are split into their own chunks, so heavy dependencies
// like the data grid, charts, and replay player only download when a page needs them.
function lazyRoute(load: () => Promise<{ default: React.ComponentType }>) {
    return async () => ({ Component: (await load()).default });
}

// React's dev build records a performance entry, with a diff of the props, for every component render whose props changed,
// and the browser keeps them all. Resizing the replay player renders a lot, which grew that to gigabytes.
// Nothing else here uses measures, and a Performance recording still captures them as they're made.
if (import.meta.env.DEV) {
    setInterval(() => performance.clearMeasures(), 10_000);
}

// After a deploy, an open tab still references the old build's chunks, which no longer exist.
// Reload to pick up the new build, but not more than once a minute in case the chunk is really missing.
// The error still propagates, so the route error page shows "Update ready" until the reload happens
// (or stays up if the reload was skipped).
window.addEventListener("vite:preloadError", () => {
    let lastReload = 0;
    try {
        lastReload = Number(sessionStorage.getItem("chunkReloadAt")) || 0;
    }
    catch {
        // sessionStorage can be unavailable; reloading is still the best option
    }
    if (Date.now() - lastReload < 60_000) {
        return;
    }
    try {
        sessionStorage.setItem("chunkReloadAt", String(Date.now()));
    }
    catch {
        // see above
    }
    window.location.reload();
});

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 10 * 60 * 1000, // Queries persist in memory for 10 minutes at a time by default
            refetchOnWindowFocus: false
        }
    }
});

const router = createBrowserRouter([
    {
        path: "/",
        Component: App,
        ErrorBoundary: RouteErrorPage,
        children: [
            { index: true, Component: Home },
            {
                path: "users",
                children: [
                    { index: true, lazy: lazyRoute(() => import("./components/Users")) },
                    { path: ":id", lazy: lazyRoute(() => import("./components/Users")) }
                ]
            },
            {
                path: "maps",
                children: [
                    { index: true, lazy: lazyRoute(() => import("./components/MapsHome")) },
                    { path: ":id", lazy: lazyRoute(() => import("./components/MapsPage")) }
                ]
            },
            { path: "ranks", lazy: lazyRoute(() => import("./components/Ranks")) },
            { path: "globals", lazy: lazyRoute(() => import("./components/Globals")) },
            { path: "compare", lazy: lazyRoute(() => import("./components/Compare")) },
            { path: "terms", lazy: lazyRoute(() => import("./components/Terms")) },
            { path: "privacy", lazy: lazyRoute(() => import("./components/Privacy")) },
            { path: "settings", lazy: lazyRoute(() => import("./components/Settings")) },
            { path: "replays/:id", lazy: lazyRoute(() => import("./components/Replays")) },
            { path: "*", Component: NotFoundPage }
        ]
    }
]);

export default function Index() {
    return (
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    </React.StrictMode>
    );
}

root.render(
    <Index />
);
