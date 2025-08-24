import Layout from "./Layout.jsx";

import WeekView from "./WeekView";

import Projects from "./Projects";

import Hotels from "./Hotels";

import Expenses from "./Expenses";
import Receipts from "./Receipts";
import Earnings from "./Earnings";
import AdminPage from "./Admin";

import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';

const PAGES = {
    
    WeekView: WeekView,
    
    Projects: Projects,
    
    Hotels: Hotels,

    Earnings: Earnings,
    Admin: AdminPage,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<WeekView />} />
                
                
                <Route path="/WeekView" element={<WeekView />} />
                
                <Route path="/Projects" element={<Projects />} />
                
                <Route path="/Hotels" element={<Hotels />} />

                <Route path="/expenses" element={<Expenses />} />
                
                <Route path="/receipts" element={<Receipts />} />
                <Route path="/earnings" element={<Earnings />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/login" element={<Navigate to="/" replace />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}