import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserEntity } from "@/api/entities";
import { client } from "@/api/timesheetClient";
import { useAuth } from "@/context/AuthContext";
import { popReturnTo, isSessionExpired } from "@/utils/auth";
import { AlertCircle, LogIn, UserPlus, Clock, ShieldCheck, ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isChecking } = useAuth();
  const [signupEnabled, setSignupEnabled] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // If already authenticated and session not expired, redirect to app
    if (isAuthenticated && !isChecking && isSessionExpired() === false) {
      const returnTo = popReturnTo();
      navigate(returnTo, { replace: true });
    }
  }, [isAuthenticated, isChecking, navigate]);

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
    const returnTo = popReturnTo();
    UserEntity.loginWithRedirect(returnTo, "login");
  };

  const handleSignup = () => {
    const returnTo = popReturnTo();
    UserEntity.loginWithRedirect(returnTo, "signup");
  };

  return (
    <div className="workflow-login min-h-screen flex items-center justify-center px-5 py-12 overflow-x-hidden">
      <div className="wf-ambient" aria-hidden="true" />
      <div className="wf-login-grid" aria-hidden="true" />
      <div className="w-full max-w-5xl grid lg:grid-cols-2 items-center gap-16 lg:gap-24">
        <div className="hidden lg:block">
          <div className="flex items-center gap-3 mb-16">
            <div className="wf-brand-mark rounded-2xl p-3"><Clock className="w-6 h-6" /></div>
            <span className="font-bold text-2xl tracking-tight">WorkFlow<span className="text-teal-300">.</span></span>
          </div>
          <p className="wf-topline mb-5">Time well spent</p>
          <h2 className="text-6xl font-semibold tracking-[-0.055em] leading-[1.06]">Your time.<br /><span className="text-teal-200">Your progress.</span></h2>
          <p className="text-slate-400 text-base leading-relaxed mt-6 max-w-sm">A clearer view of your working week. Keep your hours, earnings and documents together, in one place.</p>
          <div className="flex gap-3 mt-9 text-xs text-slate-400">
            {["Hours", "Earnings", "Documents"].map(label => <span key={label} className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.025]">{label}</span>)}
          </div>
        </div>
        <div className="wf-login-card rounded-[28px] p-7 sm:p-10 w-full max-w-md mx-auto">
        <div className="wf-brand-mark rounded-2xl w-12 h-12 flex items-center justify-center mb-7"><Clock className="w-6 h-6" /></div>
        <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-teal-300/80 mb-3">Your WorkFlow workspace</p>
        <h1 className="text-3xl font-semibold tracking-[-0.045em] leading-tight mb-3">Your week<br />starts here<span className="text-teal-300">.</span></h1>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">Sign in to manage your time and see your progress.</p>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2 text-left">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Button
            onClick={handleLogin}
            className="w-full h-12 rounded-xl"
          >
            <LogIn className="h-4 w-4" />
            Log In with Google
            <ArrowUpRight className="ml-auto" />
          </Button>

          {signupEnabled ? (
            <Button
              variant="outline"
              onClick={handleSignup}
              className="w-full h-12 rounded-xl"
            >
              <UserPlus className="h-4 w-4" />
              Sign Up with Google
            </Button>
          ) : (
            <div className="mt-2 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs">
              Signups are currently closed. Please contact the administrator at <a href="mailto:tinauca.bogdan@gmail.com" className="underline hover:text-sky-200">tinauca.bogdan@gmail.com</a>.
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 justify-center border-t border-white/[0.07] pt-5 mt-7 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-300/60" />
          Secure sign-in with Google
        </div>
        </div>
      </div>
    </div>
  );
}
