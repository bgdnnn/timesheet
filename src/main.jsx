import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
) 
if (typeof window !== "undefined" && window.location.hash.includes("access_token=")) {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const token = params.get("access_token");
  if (token) {
    localStorage.setItem("accessToken", token);
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}