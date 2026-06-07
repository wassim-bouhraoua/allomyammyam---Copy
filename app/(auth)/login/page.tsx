"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, UtensilsCrossed } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    const google = (window as any).google;
    if (google) {
      initGoogleSignIn();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.id = "google-gsi-script";
      script.onload = () => {
        initGoogleSignIn();
      };
      document.body.appendChild(script);
    }
  }, []);

  function initGoogleSignIn() {
    const google = (window as any).google;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (google && clientId) {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredentialResponse,
      });

      const btnContainer = document.getElementById("google-signin-button");
      if (btnContainer) {
        google.accounts.id.renderButton(btnContainer, {
          theme: "outline",
          size: "large",
          width: Math.floor(btnContainer.getBoundingClientRect().width) || 376,
        });
      }
    }
  }

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

  const inputCls = "h-12 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors w-full";
  const labelCls = "text-[11px] font-bold text-gray-400 uppercase tracking-wider";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col min-h-full px-4 pt-4">

      {/* Brand header */}
      <div className="flex flex-col items-center pt-8 pb-6">
        <div className="w-16 h-16 rounded-3xl bg-orange-500 flex items-center justify-center shadow-[0_6px_20px_rgba(255,138,0,0.40)] mb-5">
          <UtensilsCrossed size={28} className="text-white" />
        </div>
        <h1 className="text-[24px] font-black text-gray-900 tracking-tight">Welcome back</h1>
        <p className="text-[13px] text-gray-400 mt-1.5">Sign in to continue ordering</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
          <p className="text-[12px] font-semibold text-red-600">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-3xl shadow-[0_2px_24px_rgba(0,0,0,0.07)] border border-gray-100 p-5 flex flex-col gap-4">

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
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
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
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">or sign in with</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <div id="google-signin-button" className="w-full flex justify-center min-h-[40px]" />

      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-[11px] text-gray-400 font-medium">or</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Footer CTAs */}
      <div className="flex flex-col gap-2.5 pb-8">
        <Link
          href="/register"
          className="h-12 rounded-2xl border border-gray-200 text-gray-700 font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:border-orange-300 hover:text-orange-500"
        >
          Create an account
        </Link>
        <Link
          href="/register-chef"
          className="h-12 rounded-2xl border border-orange-100 bg-orange-50 text-orange-600 font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          Join as a Chef
        </Link>
      </div>

    </form>
  );
}