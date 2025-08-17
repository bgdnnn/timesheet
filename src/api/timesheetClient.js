// src/api/timesheetClient.js
import { api, filterQuery, setAccessToken } from "./apiClient";

// ---- Auth facade (matches your current usage) ----
const auth = {
  async me() {
    // GET /me -> { id, email, full_name, company?, wage?, role, created_date?, updated_date? }
    return api("/me");
  },

  async updateMyUserData(partial) {
    // PATCH /me with fields like { company, wage }
    return api("/me", { method: "PATCH", body: partial });
  },

  // Optional helpers to keep Layout.jsx happy:
  login() {
    // If you add a /login page in your SPA, redirect there:
    window.location.href = "/login";
  },

  loginWithRedirect(returnTo) {
    // Same idea; your future login page can read ?returnTo=
    const url = new URL("/login", window.location.origin);
    if (returnTo) url.searchParams.set("returnTo", returnTo);
    window.location.href = url.toString();
  },

  async passwordLogin(email, password) {
    // When backend exists: POST /auth/login -> { access_token, refresh_token }
    const tokens = await api("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    if (tokens && tokens.access_token) setAccessToken(tokens.access_token);
    return tokens;
  },

  async logout() {
    // If backend supports POST /auth/logout, you can call it. For now just clear token.
    setAccessToken("");
  },
};

// ---- Generic CRUD factories for your three entities ----
function makeEntityRoutes(basePath) {
  return {
    async filter(queryObj, sort) {
      // GET /<basePath>?..., matching your current .filter({ created_by }, "-created_date")
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

// ---- Integrations stubs (not used now) ----
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

// Export the same overall shape as your old client
export const client = {
  auth,
  entities,
  integrations,
};
