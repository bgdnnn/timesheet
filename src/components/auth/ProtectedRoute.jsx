// src/components/auth/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { isSessionExpired } from "@/utils/auth";
import { Clock } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isChecking } = useAuth();
  const location = useLocation();

  // Instant synchronous check: If session token is expired, do NOT render the protected content
  if (isSessionExpired() === true) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Not authenticated and finished initial check -> redirect to login
  if (!isAuthenticated && !isChecking) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Still verifying on cold start -> show loading screen instead of flashing stale menu
  if (isChecking && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-sky-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-600 shadow-xl shadow-blue-500/20 animate-pulse">
            <Clock className="h-8 w-8 text-white" />
          </div>
          <div className="w-8 h-8 border-3 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-xs font-medium tracking-wide">Validating session...</p>
        </div>
      </div>
    );
  }

  return children;
}
