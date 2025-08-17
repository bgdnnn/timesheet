// src/api/timesheetClient.js
import { api, filterQuery, setAccessToken } from "./apiClient";

// Read API base from Vite env at build time
const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  "";

// ---- Auth facade ----
const auth = {
  async me() {
    return api("/me");
  },

  async updateMyUserData(partial) {
    return api("/me", { method: "PATCH", body: partial });
  },

  // Launch Google OAuth on the backend
  login() {
    const returnTo = window.location.href;
    window.location.href = `${API_BASE}/auth/google/login?returnTo=${encodeURIComponent(returnTo)}`;
  },

  loginWithRedirect(returnTo) {
    const r = returnTo || window.location.href;
    window.location.href = `${API_BASE}/auth/google/login?returnTo=${encodeURIComponent(r)}`;
  },

  // Optional: local password login (unused if you only do Google)
  async passwordLogin(email, password) {
    const tokens = await api("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    if (tokens && tokens.access_token) setAccessToken(tokens.access_token);
    return tokens;
  },

  async logout() {
    setAccessToken("");
  },
};

// ---- CRUD factory ----
function makeEntityRoutes(basePath) {
  return {
    async filter(queryObj, sort) {
      return api(`/${basePath}`, { query: filterQuery(queryObj, sort) });
    },
    async create(data) {
      return api(`/${basePath}`, { method: "POST", body: data });
    },
    async update(id, data) {
      return api(`/${basePath}/${id}`, { method: "PATCH", body: data });
    },
    async delete(id) {
      return api(`/${basePath}/${id}`, { method: "DELETE" });
    },
  };
}

const entities = {
  Project: makeEntityRoutes("projects"),
  TimeEntry: makeEntityRoutes("time-entries"),
  Hotel: makeEntityRoutes("hotels"),
};

// ---- Integrations stubs ----
function notImplemented(name) {
  return () => {
    throw new Error(`${name} not implemented (Base44 removed)`);
  };
}
const integrations = {
  Core: {
    InvokeLLM: notImplemented("InvokeLLM"),
    SendEmail: notImplemented("SendEmail"),
    UploadFile: notImplemented("UploadFile"),
    GenerateImage: notImplemented("GenerateImage"),
    ExtractDataFromUploadedFile: notImplemented("ExtractDataFromUploadedFile"),
  },
};

export const client = { auth, entities, integrations };
