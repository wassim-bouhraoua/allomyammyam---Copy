"use client";

import { useState, type FormEvent } from "react";
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

  const inputCls =
    "h-12 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all w-full";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">

      {/* Header */}
      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shadow-[0_4px_14px_rgba(255,138,0,0.40)] mb-5">
          <UtensilsCrossed size={22} className="text-white" />
        </div>
        <h1 className="text-[26px] font-black text-gray-900 tracking-tight leading-tight">
          Welcome back
        </h1>
        <p className="text-[14px] text-gray-400 mt-1">Sign in to continue ordering</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-2.5">
          <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <span className="text-red-500 text-[10px] font-black">!</span>
          </div>
          <p className="text-[13px] font-semibold text-red-600">{error}</p>
        </div>
      )}

      {/* Fields */}
      <div className="flex flex-col gap-4 mb-5">
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">
            Email
          </label>
          <input
            type="email" autoComplete="email" required
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">
            Password
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"} autoComplete="current-password" required
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" className={`${inputCls} pr-12`}
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showPw ? "Hide" : "Show"}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button type="submit" disabled={loading}
        className="h-[52px] rounded-2xl bg-orange-500 text-white font-extrabold text-[15px] shadow-[0_4px_20px_rgba(255,138,0,0.40)] transition-all duration-150 active:scale-[0.98] hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6">
        {loading
          ? <><Loader2 size={17} className="animate-spin" /> Signing in…</>
          : "Sign In"
        }
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Secondary CTAs */}
      <div className="flex flex-col gap-3">
        <Link href="/register"
          className="h-12 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold text-[14px] flex items-center justify-center transition-all active:scale-[0.98] hover:border-orange-400 hover:text-orange-500">
          Create an account
        </Link>
        <Link href="/register-chef"
          className="h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 font-bold text-[14px] flex items-center justify-center transition-all active:scale-[0.98] hover:bg-orange-100">
          Join as a Chef
        </Link>
      </div>

    </form>
  );
}
