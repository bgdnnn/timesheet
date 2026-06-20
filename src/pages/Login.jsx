import React, { useEffect, useState } from 'react';
import { User as UserEntity } from "@/api/entities";
import { client } from "@/api/timesheetClient";
import { AlertCircle, LogIn, UserPlus } from "lucide-react";

export default function LoginPage() {
  const [signupEnabled, setSignupEnabled] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err === "signups_closed") {
      setErrorMsg("Signups are currently closed. Please contact the administrator at tinauca.bogdan@gmail.com.");
    } else if (err === "account_not_found") {
      setErrorMsg("No account found with this email. Please sign up first.");
    } else if (err) {
      setErrorMsg("Authentication failed. Please try again.");
    }

    client.fetchJson("/auth/signup-enabled")
      .then(res => {
        if (res && res.signup_enabled !== undefined) {
          setSignupEnabled(res.signup_enabled);
        }
      })
      .catch(err => console.error("Error loading signup status:", err));
  }, []);

  const handleLogin = () => {
    UserEntity.loginWithRedirect("/", "login");
  };

  const handleSignup = () => {
    UserEntity.loginWithRedirect("/", "signup");
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-slate-900 to-sky-900 px-4">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400 mb-2">Timesheet</h1>
        <p className="text-gray-300 text-sm mb-8">Work Hours & Earnings Tracker</p>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2 text-left">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:from-sky-400 hover:to-sky-500 active:scale-95 transition-all duration-200"
          >
            <LogIn className="h-4 w-4" />
            Log In with Google
          </button>

          {signupEnabled ? (
            <button
              onClick={handleSignup}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:from-sky-400 hover:to-sky-500 active:scale-95 transition-all duration-200"
            >
              <UserPlus className="h-4 w-4" />
              Sign Up with Google
            </button>
          ) : (
            <div className="mt-2 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs">
              Signups are currently closed. Please contact the administrator at <a href="mailto:tinauca.bogdan@gmail.com" className="underline hover:text-sky-200">tinauca.bogdan@gmail.com</a>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
