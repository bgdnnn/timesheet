// src/api/auth.js
export function loginWithRedirect(returnTo) {
  const base = import.meta.env.VITE_API_BASE; // e.g. https://api.timesheet.home-clouds.com
  const url = `${base}/auth/google/login?returnTo=${encodeURIComponent(returnTo || window.location.href)}`;
  window.location.assign(url); // full navigation so cookies get set properly
}
