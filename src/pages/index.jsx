import Layout from "./Layout.jsx";
import WeekView from "./WeekView";
import Projects from "./Projects";
import Hotels from "./Hotels";
import Expenses from "./Expenses";
import Receipts from "./Receipts";
import Earnings from "./Earnings";
import AdminPage from "./Admin";
import LoginPage from "./Login";

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

export default function Pages() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/*" element={<MainApp />} />
            </Routes>
        </Router>
    );
}

function MainApp() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<WeekView />} />
                <Route path="/WeekView" element={<WeekView />} />
                <Route path="/Projects" element={<Projects />} />
                <Route path="/Hotels" element={<Hotels />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/receipts" element={<Receipts />} />
                <Route path="/earnings" element={<Earnings />} />
                <Route path="/admin" element={<AdminPage />} />
            </Routes>
        </Layout>
    );
}