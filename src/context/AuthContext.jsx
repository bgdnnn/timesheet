// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User as UserEntity } from "@/api/entities";
import { setAuthNavigateHandler } from "@/api/timesheetClient";
import {
  clearStoredSession,
  getCachedUser,
  getSessionExpiry,
  isSessionExpired,
  saveReturnTo,
  setStoredSession,
} from "@/utils/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Synchronous initialization based on cached metadata
  const [sessionExpired, setSessionExpired] = useState(() => isSessionExpired() === true);
  const [user, setUser] = useState(() => (isSessionExpired() ? null : getCachedUser()));
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (isSessionExpired()) return false;
    return localStorage.getItem("ts_authenticated") === "true";
  });
  const [isChecking, setIsChecking] = useState(!user && !sessionExpired);

  const lastCheckTimeRef = useRef(0);
  const inFlightRef = useRef(false);
  const expiryTimerRef = useRef(null);

  // Register router navigate function for API 401 handling
  useEffect(() => {
    setAuthNavigateHandler((path) => {
      navigate(path, { replace: true });
    });
  }, [navigate]);

  // Handle session expiration immediately (no page refresh required)
  const handleSessionExpired = useCallback(() => {
    console.warn("[Auth] Session expired. Redirecting to login immediately.");
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
    
    // Save where user was so they can return after re-authenticating
    if (location.pathname && !location.pathname.startsWith("/login")) {
      saveReturnTo(location.pathname + location.search);
    }

    clearStoredSession();
    setUser(null);
    setIsAuthenticated(false);
    setSessionExpired(true);
    setIsChecking(false);

    if (!location.pathname.startsWith("/login")) {
      navigate("/login", { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  // Schedule exact timer for when the session will expire
  const scheduleExpiryTimer = useCallback((expiryMs) => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }

    if (!expiryMs) return;

    const msUntilExpiry = expiryMs - Date.now();
    if (msUntilExpiry <= 0) {
      handleSessionExpired();
      return;
    }

    // Set timer to expire at the exact timestamp
    expiryTimerRef.current = setTimeout(() => {
      console.warn("[Auth] Token lifetime expired while active.");
      handleSessionExpired();
    }, msUntilExpiry);
  }, [handleSessionExpired]);

  // Verify session with backend (/me)
  const checkSession = useCallback(async (force = false) => {
    // Check local expiry first - if expired locally, don't even wait for network
    if (isSessionExpired() === true) {
      handleSessionExpired();
      return null;
    }

    const now = Date.now();
    // Throttle checks unless forced (at least 15s between calls)
    if (!force && now - lastCheckTimeRef.current < 15000) {
      return user;
    }

    if (inFlightRef.current) return user;
    inFlightRef.current = true;

    try {
      const data = await UserEntity.me();
      lastCheckTimeRef.current = Date.now();
      setUser(data);
      setIsAuthenticated(true);
      setSessionExpired(false);
      setStoredSession(data);

      const exp = getSessionExpiry();
      if (exp) {
        scheduleExpiryTimer(exp);
      }

      return data;
    } catch (err) {
      console.warn("[Auth] Session verification check failed:", err);
      if (err.status === 401 || String(err.message).includes("401")) {
        handleSessionExpired();
      }
      return null;
    } finally {
      inFlightRef.current = false;
      setIsChecking(false);
    }
  }, [handleSessionExpired, scheduleExpiryTimer, user]);

  // Initial mount verification
  useEffect(() => {
    if (isSessionExpired() === true) {
      handleSessionExpired();
      return;
    }

    // Initial check on mount
    checkSession(true);

    const initialExp = getSessionExpiry();
    if (initialExp) {
      scheduleExpiryTimer(initialExp);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Lifecycle resume detection: visibilitychange, focus, pageshow, online
  useEffect(() => {
    const handleResume = () => {
      // 1. Synchronous check: if token expiration timestamp has passed, immediately kick to login!
      if (isSessionExpired() === true) {
        handleSessionExpired();
        return;
      }

      // 2. If app is now visible/focused, check session with server
      if (document.visibilityState === "visible") {
        checkSession(false);
      }
    };

    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("focus", handleResume);
    window.addEventListener("pageshow", handleResume);
    window.addEventListener("online", handleResume);

    // Listen to custom 401 event dispatched by API client
    const handleCustomExpired = () => {
      handleSessionExpired();
    };
    window.addEventListener("timesheet:session-expired", handleCustomExpired);

    // Periodic safety interval (every 10 seconds while tab is open)
    const interval = setInterval(() => {
      if (isSessionExpired() === true) {
        handleSessionExpired();
      }
    }, 10000);

    return () => {
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("focus", handleResume);
      window.removeEventListener("pageshow", handleResume);
      window.removeEventListener("online", handleResume);
      window.removeEventListener("timesheet:session-expired", handleCustomExpired);
      clearInterval(interval);
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
      }
    };
  }, [checkSession, handleSessionExpired]);

  const logout = useCallback(async () => {
    try {
      await UserEntity.logout();
    } catch {}
    handleSessionExpired();
  }, [handleSessionExpired]);

  const value = {
    user,
    setUser,
    isAuthenticated,
    isChecking,
    checkSession,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
