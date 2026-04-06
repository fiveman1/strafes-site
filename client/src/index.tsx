import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router";
import App from './App';
import Home from './components/Home';
import Users from './components/Users';
import Ranks from './components/Ranks';
import Globals from './components/Globals';
import MapsPage from './components/MapsPage';
import Compare from './components/Compare';
import Terms from './components/Terms';
import Privacy from './components/Privacy';
import Settings from './components/Settings';
import MapsHome from './components/MapsHome';
import Replays from './components/Replays';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000 // Queries persist in memory for 5 minutes at a time by default
        }
    }
});

const router = createBrowserRouter([
    {
        path: "/",
        Component: App,
        children: [
            { index: true, Component: Home },
            { 
                path: "users", 
                children: [
                    { index: true, Component: Users },
                    { path: ":id", Component: Users }
                ]
            },
            { 
                path: "maps", 
                children: [
                    { index: true, Component: MapsHome },
                    { path: ":id", Component: MapsPage }
                ]
            },
            { path: "ranks", Component: Ranks },
            { path: "globals", Component: Globals },
            { path: "compare", Component: Compare },
            { path: "terms", Component: Terms },
            { path: "privacy", Component: Privacy },
            { path: "settings", Component: Settings },
            { path: "replays/:id", Component: Replays }
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