import React, { lazy, Suspense, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router";
import Box from '@mui/material/Box';
import App from './App';
import Home from './components/Home';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Terms from './components/Terms';
import Privacy from './components/Privacy';
import { NotFoundPage, RouteErrorPage } from './components/ErrorPage';
import { loadCompare, loadGlobals, loadMapsHome, loadMapsPage, loadRanks, loadReplays, loadSettings, loadUsers, prefetchCommonRouteModules } from './routeModules';

const Users = lazy(loadUsers);
const Ranks = lazy(loadRanks);
const Globals = lazy(loadGlobals);
const MapsPage = lazy(loadMapsPage);
const Compare = lazy(loadCompare);
const Settings = lazy(loadSettings);
const MapsHome = lazy(loadMapsHome);
const Replays = lazy(loadReplays);

function withSuspense(Component: React.LazyExoticComponent<React.ComponentType>) {
    return function SuspendedRoute() {
        return (
            <Suspense fallback={
                <Box
                    sx={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 1300,
                        pointerEvents: "none",
                        backgroundColor: "rgba(8, 9, 17, 0.01)",
                        animation: "routeLoadingBlur 620ms ease-in-out infinite alternate"
                    }}
                />
            }>
                <Component />
            </Suspense>
        );
    };
}

const LazyUsers = withSuspense(Users);
const LazyRanks = withSuspense(Ranks);
const LazyGlobals = withSuspense(Globals);
const LazyMapsPage = withSuspense(MapsPage);
const LazyCompare = withSuspense(Compare);
const LazySettings = withSuspense(Settings);
const LazyMapsHome = withSuspense(MapsHome);
const LazyReplays = withSuspense(Replays);

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 10 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1
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
                    { index: true, Component: LazyUsers },
                    { path: ":id", Component: LazyUsers }
                ]
            },
            { 
                path: "maps", 
                children: [
                    { index: true, Component: LazyMapsHome },
                    { path: ":id", Component: LazyMapsPage }
                ]
            },
            { path: "ranks", Component: LazyRanks },
            { path: "globals", Component: LazyGlobals },
            { path: "compare", Component: LazyCompare },
            { path: "terms", Component: Terms },
            { path: "privacy", Component: Privacy },
            { path: "settings", Component: LazySettings },
            { path: "replays/:id", Component: LazyReplays },
            { path: "*", Component: NotFoundPage }
        ]
    }
]);

export default function Index() {
    useEffect(() => {
        if ("requestIdleCallback" in window) {
            const idleId = window.requestIdleCallback(prefetchCommonRouteModules, { timeout: 3000 });
            return () => window.cancelIdleCallback(idleId);
        }

        const timeoutId = window.setTimeout(prefetchCommonRouteModules, 1200);
        return () => window.clearTimeout(timeoutId);
    }, []);

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
