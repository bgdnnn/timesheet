// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App.jsx";
import "@/index.css";

// Keep API base available both via Vite and a global (for scripts)
if (!window.__API_BASE__) {
  window.__API_BASE__ =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_BASE) ||
    "";
}

// Pull access_token from the URL fragment once after OAuth redirect
(function syncTokenFromHash() {
  const raw = window.location.hash || "";
  if (!raw.startsWith("#")) return;
  const params = new URLSearchParams(raw.slice(1));
  const token = params.get("access_token");
  if (token) {
    localStorage.setItem("access_token", token); // <— IMPORTANT: snake_case
    window.dispatchEvent(new Event("token-changed"));
    // Remove the hash so we don't repeat this on refresh
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search
    );
  }
})();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
