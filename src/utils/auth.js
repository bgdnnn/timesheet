// src/utils/auth.js

const EXPIRY_KEY = "ts_session_expires_at";
const AUTH_FLAG_KEY = "ts_authenticated";
const USER_CACHE_KEY = "ts_user_cache";
const RETURN_TO_KEY = "ts_return_to";

/**
 * Read cookie value by name
 */
export function getCookie(name) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : "";
}

/**
 * Remove cookie by name
 */
export function deleteCookie(name) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  const domain = window.location.hostname.replace(/^[^.]+\./, ".");
  if (domain && domain.includes(".")) {
    document.cookie = `${name}=; Path=/; Domain=${domain}; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
  }
}

/**
 * Get session expiry timestamp in milliseconds
 */
export function getSessionExpiry() {
  try {
    const localExp = localStorage.getItem(EXPIRY_KEY);
    if (localExp) {
      const ms = Number(localExp);
      if (!isNaN(ms) && ms > 0) return ms;
    }

    const cookieExp = getCookie("ts_session_exp");
    if (cookieExp) {
      const sec = Number(cookieExp);
      if (!isNaN(sec) && sec > 0) return sec * 1000;
    }
  } catch {
    // ignore storage access errors
  }
  return null;
}

/**
 * Check if the session is expired.
 * Returns true if expiry timestamp is in the past.
 * Returns false if expiry timestamp is strictly in the future.
 * Returns null if no expiry timestamp is known.
 */
export function isSessionExpired() {
  const expiry = getSessionExpiry();
  if (expiry === null) return null;
  return Date.now() >= expiry;
}

/**
 * Store session information on successful login or /me verification
 */
export function setStoredSession(user) {
  try {
    localStorage.setItem(AUTH_FLAG_KEY, "true");
    if (user?.session_expires_at) {
      const ms = user.session_expires_at * 1000;
      localStorage.setItem(EXPIRY_KEY, String(ms));
    } else {
      // Default to 60 minutes if backend didn't specify
      const currentExp = getSessionExpiry();
      if (!currentExp || isSessionExpired()) {
        const fallbackExp = Date.now() + 60 * 60 * 1000;
        localStorage.setItem(EXPIRY_KEY, String(fallbackExp));
      }
    }
    if (user) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    }
  } catch (e) {
    console.warn("Failed to store session metadata in localStorage", e);
  }
}

/**
 * Get cached user data if session is not expired
 */
export function getCachedUser() {
  if (isSessionExpired()) return null;
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Clear session data on logout or 401 expiration
 */
export function clearStoredSession() {
  try {
    localStorage.removeItem(EXPIRY_KEY);
    localStorage.removeItem(AUTH_FLAG_KEY);
    localStorage.removeItem(USER_CACHE_KEY);
    localStorage.removeItem("ts_token");
    deleteCookie("ts_session_exp");
  } catch (e) {
    console.warn("Failed to clear session storage", e);
  }
}

/**
 * Store target route before redirecting to login
 */
export function saveReturnTo(path) {
  try {
    if (path && !path.startsWith("/login")) {
      sessionStorage.setItem(RETURN_TO_KEY, path);
    }
  } catch {}
}

/**
 * Get and clear target route after login
 */
export function popReturnTo() {
  try {
    const target = sessionStorage.getItem(RETURN_TO_KEY);
    sessionStorage.removeItem(RETURN_TO_KEY);
    return target && !target.startsWith("/login") ? target : "/";
  } catch {
    return "/";
  }
}
