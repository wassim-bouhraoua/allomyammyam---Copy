"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, UtensilsCrossed } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import BackToHome from "@/components/auth/back-to-home";
import { useGoogleSignIn } from "@/hooks/useGoogleSignIn";

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  useGoogleSignIn(handleGoogleCredentialResponse);

  async function handleGoogleCredentialResponse(response: any) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Google login failed.");
        return;
      }
      await refreshUser();
      const from = new URLSearchParams(window.location.search).get("from");
      router.push(from || "/");
      router.refresh();
    } catch {
      setError("Google authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Login failed."); return; }
      await refreshUser();
      const from = new URLSearchParams(window.location.search).get("from");
      router.push(from || "/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "h-12 px-4 rounded-2xl bg-secondary border border-border text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors w-full";
  const labelCls = "text-[11px] font-bold text-muted-foreground uppercase tracking-wider";

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen lg:min-h-0">
      
      {/* Left side: Premium Welcome Graphic (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-400 to-orange-600 text-white p-10 flex-col justify-between relative overflow-hidden select-none">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-black/10 rounded-full blur-3xl" />

        <div className="flex items-center gap-2 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <UtensilsCrossed size={18} className="text-white" />
          </div>
          <span className="font-black text-[18px] tracking-tight">AlloMyamMyam</span>
        </div>

        <div className="my-auto relative z-10">
          <h2 className="text-[32px] font-black leading-tight tracking-tight mb-4">
            Order delicious home-cooked meals.
          </h2>
          <p className="text-[14px] text-orange-50/90 leading-relaxed font-medium max-w-sm">
            Discover passionate local chefs preparing healthy, fresh, and authentic food delivered straight to your door.
          </p>
        </div>

        <p className="text-[11px] text-orange-100/70 font-semibold relative z-10">
          © 2026 AlloMyamMyam. All rights reserved.
        </p>
      </div>

      {/* Right side: Login Form */}
      <form onSubmit={handleSubmit} className="w-full lg:w-1/2 flex flex-col justify-center px-4 py-8 lg:p-10">
        <BackToHome />

        {/* Brand header */}
        <div className="flex flex-col items-center pt-8 pb-6">
          <div className="w-16 h-16 rounded-3xl bg-orange-500 flex lg:hidden items-center justify-center shadow-[0_6px_20px_rgba(255,138,0,0.40)] mb-5">
            <UtensilsCrossed size={28} className="text-white" />
          </div>
          <h1 className="text-[24px] font-black text-foreground tracking-tight">Welcome back</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">Sign in to continue ordering</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
            <p className="text-[12px] font-semibold text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-card rounded-3xl shadow-[0_2px_24px_rgba(0,0,0,0.07)] border border-border p-5 flex flex-col gap-4">

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Email</label>
            <input
              type="email" autoComplete="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"} autoComplete="current-password" required
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" className={`${inputCls} pr-12`}
              />
              <button
                type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPw ? "Hide" : "Show"}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-12 rounded-2xl bg-orange-500 text-white font-extrabold text-[15px] shadow-[0_4px_14px_rgba(255,138,0,0.38)] transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
          >
            {loading
              ? <><Loader2 size={17} className="animate-spin" /> Signing in…</>
              : "Sign In"
            }
          </button>

          <div className="flex items-center gap-2.5 my-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">or sign in with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div id="google-signin-button" className="w-full flex justify-center min-h-[40px]" />

        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] text-muted-foreground font-medium">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Footer CTAs */}
        <div className="flex flex-col gap-2.5 pb-8">
          <Link
            href="/register"
            className="h-12 rounded-2xl border border-border text-foreground font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:border-orange-300 hover:text-orange-500"
          >
            Create an account
          </Link>
          <Link
            href="/register-chef"
            className="h-12 rounded-2xl border border-orange-100 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            Join as a Chef
          </Link>
        </div>

      </form>
    </div>
  );
}