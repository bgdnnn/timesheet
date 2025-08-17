// src/api/apiClient.js
const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  (typeof window !== "undefined" && window.__API_BASE__) ||
  "";

function buildURL(path, params = {}) {
  const url = new URL(
    path.replace(/^\//, ""),
    API_BASE || window.location.origin
  );
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    if (typeof v === "object") {
      // flatten {a:1,b:2} -> a=1&b=2 for filter
      for (const [kk, vv] of Object.entries(v)) {
        if (vv !== undefined && vv !== null && vv !== "") sp.append(kk, vv);
      }
    } else {
      sp.append(k, v);
    }
  }
  const qs = sp.toString();
  if (qs) url.search = qs;
  return url.toString();
}

export function getAccessToken() {
  try {
    return localStorage.getItem("accessToken") || "";
  } catch {
    return "";
  }
}

export function setAccessToken(token) {
  try {
    if (token) localStorage.setItem("accessToken", token);
    else localStorage.removeItem("accessToken");
  } catch {
    // ignore
  }
}

export async function api(
  path,
  { method = "GET", headers = {}, body, query } = {}
) {
  const token = getAccessToken();
  const url = buildURL(path, query);

  const res = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include", // harmless if backend doesn’t use cookies
  });

  // Try to parse JSON; fall back to text
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const err = new Error(
      (data && (data.detail || data.message)) ||
        `HTTP ${res.status} ${res.statusText}`
    );
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

/**
 * Helper that turns .filter(queryObj, sortStr) args into query params.
 * Example: filter({created_by: email}, "-created_date") -> ?created_by=email&sort=-created_date
 */
export function filterQuery(queryObj, sort) {
  const q = { ...(queryObj || {}) };
  if (sort) q.sort = sort;
  return q;
}
