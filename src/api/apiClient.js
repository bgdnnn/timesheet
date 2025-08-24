// src/api/apiClient.js
const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  (typeof window !== "undefined" && window.__API_BASE__) ||
  "";

export function buildURL(path, params = {}) {
  const url = new URL(path.replace(/^\//, ""), API_BASE);
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const qs = sp.toString();
  if (qs) url.search = qs;
  return url.toString();
}

function authHeaders() {
  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("access_token")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* keep text */
  }
  if (!res.ok) {
    const msg = data && data.detail ? data.detail : text || res.statusText;
    const err = new Error(msg);
    err.status = res.status;
    err.body = data || text;
    throw err;
  }
  return data;
}

export async function get(path, params) {
  const url = buildURL(path, params);
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
    credentials: "include",
  });
  return handle(res);
}

export async function post(path, body, isForm = false) {
  const url = buildURL(path);
  const init = {
    method: "POST",
    headers: {
      ...authHeaders(),
    },
    credentials: "include",
    body: isForm ? body : JSON.stringify(body),
  };
  if (!isForm) init.headers["Content-Type"] = "application/json";
  const res = await fetch(url, init);
  return handle(res);
}

export async function put(path, body) {
  const url = buildURL(path);
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    credentials: "include",
    body: JSON.stringify(body),
  });
  return handle(res);
}

export async function del(path) {
  const url = buildURL(path);
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      ...authHeaders(),
    },
    credentials: "include",
  });
  return handle(res);
}

export function filterQuery(queryObj, sort) {
  const q = { ...(queryObj || {}) };
  if (sort) q.sort = sort;
  return q;
}
