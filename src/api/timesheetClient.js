// src/api/timesheetClient.js

const BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

function getAccessToken() {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken") ||
    null
  );
}

async function fetchJson(path, { method = "GET", headers = {}, body, signal } = {}) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const token = getAccessToken();

  const resp = await fetch(url, {
    method,
    credentials: "include",
    headers: {
      ...(body != null && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body == null || body instanceof FormData ? body : JSON.stringify(body),
    signal,
  });

  if (!resp.ok) {
    let detail = "";
    try { detail = await resp.text(); } catch {}
    throw new Error(`HTTP ${resp.status} ${resp.statusText}${detail ? ` — ${detail}` : ""}`);
  }

  const ct = resp.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await resp.json();
  return await resp.text();
}

/* ---------- AUTH ---------- */
const auth = {
  async me() {
    return fetchJson("/me");
  },

  async updateMyUserData(payload) {
    return fetchJson("/me", { method: "PUT", body: payload });
  },

  loginWithRedirect(returnTo) {
    const rt = encodeURIComponent(returnTo || window.location.href);
    window.location.assign(`${BASE}/auth/google/login?returnTo=${rt}`);
  },

  async logout() {
    console.log("Starting logout process...");
    try {
      // Use regular fetch as we are expecting a redirect, not JSON
      const response = await fetch(`${BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      // After this call, the browser should be redirected by the server.
      // The code below might not even run if the redirect is immediate.
      console.log("Backend logout call status:", response.status);
    } catch (e) {
      console.error("Backend logout call failed:", e);
    }
    console.log("Clearing all localStorage.");
    localStorage.clear();
    console.log("Logout process finished.");
  },
};

/* ---------- GENERIC ENTITY MAKER ---------- */
function mkEntity(path) {
  const base = path.replace(/\/+$/, "");
  return {
    async list(sort) {
      const qs = sort ? `?sort=${encodeURIComponent(sort)}` : "";
      return fetchJson(`${base}${qs}`);
    },
    async filter(query = {}, sort) {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.append(k, String(v));
      });
      if (sort) params.set("sort", sort);
      const qs = params.toString() ? `?${params.toString()}` : "";
      return fetchJson(`${base}${qs}`);
    },
    async get(id) {
      return fetchJson(`${base}/${encodeURIComponent(id)}`);
    },
    async create(data) {
      return fetchJson(base, { method: "POST", body: data });
    },
    async update(id, data) {
      return fetchJson(`${base}/${encodeURIComponent(id)}`, { method: "PUT", body: data });
    },
    async remove(id) {
      return fetchJson(`${base}/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  };
}

/* ---------- ENTITIES ---------- */
const entities = {
  Project: mkEntity("/projects"),
  TimeEntry: {
    ...mkEntity("/time-entries"),
    async delete(id) {
      return mkEntity("/time-entries").remove(id);
    },
  },
  Hotel: mkEntity("/hotels"),

  /* ---- Receipts ----
   * Backend (as implemented earlier):
   *   GET    /receipts?created_by=...&sort=created_at_desc
   *   POST   /receipts/upload  (FormData: file, receipt_date, notes?)
   *   GET    /receipts/:id/file  (binary)
   *   DELETE /receipts/:id
   */
  Receipts: {
    async list(query = {}, sort = "created_at_desc") {
      return mkEntity("/receipts").filter(query, sort);
    },
    async upload({ file, receipt_date, notes }) {
      const fd = new FormData();
      fd.append("file", file);
      if (receipt_date) fd.append("receipt_date", receipt_date);
      if (notes != null) fd.append("notes", notes);
      return fetchJson("/receipts/upload", { method: "POST", body: fd });
    },
    fileUrl(id) {
      // Uses cookies for auth; no need to fetch blob if your server accepts cookie auth
      return `${BASE}/receipts/${encodeURIComponent(id)}/file`;
    },
    async remove(id) {
      return mkEntity("/receipts").remove(id);
    },
  },
};

/* ---------- DOMAIN CLIENTS ---------- */
const Payslips = {
  async forWeek(weekStart /* yyyy-MM-dd */) {
    const qs = new URLSearchParams({ week_start: weekStart });
    return fetchJson(`/payslips/for-week?${qs.toString()}`);
  },
  
};

const WeeklyEarnings = {
  async forWeek(weekStart /* yyyy-MM-dd */) {
    const qs = new URLSearchParams({ week_start: weekStart });
    return fetchJson(`/earnings/for-week?${qs.toString()}`);
  },
  async recalculate() {
    return fetchJson("/earnings/recalculate", { method: "POST" });
  },
};

export const client = {
  baseUrl: BASE,
  fetchJson,
  auth,
  entities,
  Payslips,
  WeeklyEarnings,
};

export default client;