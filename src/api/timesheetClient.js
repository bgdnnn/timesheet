// src/api/timesheetClient.js

const BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

function getAccessToken() {
  const token = localStorage.getItem("ts_token");
  if (token) return token;
  
  const cookie = document.cookie.split('; ').find(row => row.startsWith('access_token='));
  return cookie ? cookie.split('=')[1] : "";
}

async function fetchJson(path, { method = "GET", headers = {}, body, signal } = {}) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  
  const token = getAccessToken();

  const options = {
    method,
    credentials: "include",
    headers: {
      ...(body != null && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body == null || body instanceof FormData ? body : JSON.stringify(body),
    signal,
  };

  try {
    const resp = await fetch(url, options);

    if (!resp.ok) {
      if (resp.status === 401) {
          console.warn("Unauthorized: Session likely expired. Redirecting to login.");
          // Clear any local tokens
          localStorage.removeItem("ts_token");
          // Force redirect to login page if not already there
          if (!window.location.pathname.includes("/login")) {
              window.location.assign("/login");
          }
      }
      const text = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${text}`);
    }

    const ct = resp.headers.get("content-type") || "";
    if (ct.includes("application/json")) return await resp.json();
    return await resp.text();
  } catch (err) {
    console.error(`Fetch failure for ${path}:`, err);
    throw err;
  }
}

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
    try { await fetchJson("/auth/logout", { method: "POST" }); } catch {}
    localStorage.clear();
    window.location.assign("/login");
  },
};

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

export const client = {
  baseUrl: BASE,
  fetchJson,
  auth,
  entities: {
    Project: {
      ...mkEntity("/projects"),
      async archive(id) { return fetchJson(`/projects/${encodeURIComponent(id)}/archive`, { method: "POST" }); },
      async restore(id) { return fetchJson(`/projects/${encodeURIComponent(id)}/restore`, { method: "POST" }); },
    },
    TimeEntry: {
      ...mkEntity("/time-entries"),
      async delete(id) { return mkEntity("/time-entries").remove(id); },
    },
    Hotel: mkEntity("/hotels"),
    Receipts: {
      async list(query = {}, sort = "created_at_desc") { return mkEntity("/receipts").filter(query, sort); },
      async upload({ file, receipt_date, notes }) {
        const fd = new FormData();
        fd.append("file", file);
        if (receipt_date) fd.append("receipt_date", receipt_date);
        if (notes != null) fd.append("notes", notes);
        return fetchJson("/receipts/upload", { method: "POST", body: fd });
      },
      fileUrl(id) { return `${BASE}/receipts/${encodeURIComponent(id)}/file`; },
      async remove(id) { return mkEntity("/receipts").remove(id); },
    },
    Trainings: {
      async list() { return fetchJson("/trainings"); },
      async upload({ file, name, expiry_date }) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("name", name);
        fd.append("expiry_date", expiry_date);
        return fetchJson("/trainings/upload", { method: "POST", body: fd });
      },
      fileUrl(id) { return `${BASE}/trainings/${encodeURIComponent(id)}/file`; },
      downloadUrl(id) { return `${BASE}/trainings/${encodeURIComponent(id)}/download`; },
      async update(id, data) {
        return fetchJson(`/trainings/${encodeURIComponent(id)}`, { method: "PATCH", body: data });
      },
      async remove(id) { return fetchJson(`/trainings/${encodeURIComponent(id)}`, { method: "DELETE" }); },
    },
  },
  earnings: {
    async forWeek(weekStart) {
      const qs = new URLSearchParams({ week_start: weekStart });
      return fetchJson(`/earnings/for-week?${qs.toString()}`);
    },
    async recalculate() { return fetchJson("/earnings/recalculate", { method: "POST" }); },
    async calculateWeek(payload) { return fetchJson("/earnings/calculate-week", { method: "POST", body: payload }); },
    async updateWeekWage(payload) { return fetchJson("/earnings/for-week", { method: "PATCH", body: payload }); },
  },
};

export default client;