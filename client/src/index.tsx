import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router";
import App from './App';
import Home from './components/Home';
import Maps from './components/Maps';
import Users from './components/Users';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

function Index() {


    return (
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />}>
                    <Route index element={<Home />} />
                    <Route path="users" element={<Users />}> 
                        <Route path=":id" element={<Users />} />
                    </Route>
                    <Route path="maps" element={<Maps />} />
                </Route>
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
    );
}

root.render(
    <Index />
);