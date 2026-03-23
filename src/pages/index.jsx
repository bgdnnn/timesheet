import Layout from "./Layout.jsx";
import WeekView from "./WeekView";
import Projects from "./Projects";
import Hotels from "./Hotels";
import Expenses from "./Expenses";
import Receipts from "./Receipts";
import Earnings from "./Earnings";
import PayslipFiles from "./PayslipFiles";
import Trainings from "./Trainings";
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
        <Routes>
            <Route element={<Layout />}>
                <Route index element={<WeekView />} />
                <Route path="/weekview" element={<WeekView />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/hotels" element={<Hotels />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/receipts" element={<Receipts />} />
                <Route path="/earnings" element={<Earnings />} />
                <Route path="/payslips" element={<PayslipFiles />} />
                <Route path="/trainings" element={<Trainings />} />
                <Route path="/admin" element={<AdminPage />} />
            </Route>
        </Routes>
    );
}
