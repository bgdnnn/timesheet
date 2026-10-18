import Layout from "./Layout.jsx";
import WeekView from "./WeekView";
import Projects from "./Projects";
import Hotels from "./Hotels";
import Expenses from "./Expenses";
import Receipts from "./Receipts";
import Earnings from "./Earnings";
import PayslipFiles from "./PayslipFiles";
import Trainings from "./Trainings";
import ConstructionDetails from "./ConstructionDetails";
import Holidays from "./Holidays";
import AdminPage from "./Admin";
import LoginPage from "./Login";

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function Pages() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                        path="/*"
                        element={
                            <ProtectedRoute>
                                <MainApp />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </AuthProvider>
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
                <Route path="/construction-details" element={<ConstructionDetails />} />
                <Route path="/holidays" element={<Holidays />} />
                <Route path="/admin" element={<AdminPage />} />
            </Route>
        </Routes>
    );
}
