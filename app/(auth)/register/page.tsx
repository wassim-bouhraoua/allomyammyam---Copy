"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "", phoneNumber: "",
  });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (f: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(p => ({ ...p, [f]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Registration failed."); return; }
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
  const labelCls = "text-[12px] font-bold text-gray-500 uppercase tracking-widest";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">

      {/* Header */}
      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shadow-[0_4px_14px_rgba(255,138,0,0.40)] mb-5">
          <UserPlus size={22} className="text-white" />
        </div>
        <h1 className="text-[26px] font-black text-gray-900 tracking-tight leading-tight">
          Create account
        </h1>
        <p className="text-[14px] text-gray-400 mt-1">Order homemade food from local chefs</p>
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
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label className={labelCls}>First name</label>
            <input type="text" autoComplete="given-name" required
              value={form.firstName} onChange={set("firstName")}
              placeholder="Yassine" className={inputCls} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelCls}>Last name</label>
            <input type="text" autoComplete="family-name" required
              value={form.lastName} onChange={set("lastName")}
              placeholder="Alami" className={inputCls} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelCls}>Email</label>
          <input type="email" autoComplete="email" required
            value={form.email} onChange={set("email")}
            placeholder="you@example.com" className={inputCls} />
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelCls}>
            Phone{" "}
            <span className="normal-case font-normal text-gray-400 tracking-normal">(optional)</span>
          </label>
          <input type="tel" autoComplete="tel"
            value={form.phoneNumber} onChange={set("phoneNumber")}
            placeholder="+212 6 00 00 00 00" className={inputCls} />
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelCls}>Password</label>
          <div className="relative">
            <input type={showPw ? "text" : "password"} autoComplete="new-password"
              required minLength={8}
              value={form.password} onChange={set("password")}
              placeholder="Min. 8 characters" className={`${inputCls} pr-12`} />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showPw ? "Hide" : "Show"}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 pl-1">At least 8 characters</p>
        </div>
      </div>

      {/* Submit */}
      <button type="submit" disabled={loading}
        className="h-[52px] rounded-2xl bg-orange-500 text-white font-extrabold text-[15px] shadow-[0_4px_20px_rgba(255,138,0,0.40)] transition-all duration-150 active:scale-[0.98] hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6">
        {loading
          ? <><Loader2 size={17} className="animate-spin" /> Creating account…</>
          : "Create Account"
        }
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">already a member?</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      <div className="flex flex-col gap-3">
        <Link href="/login"
          className="h-12 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold text-[14px] flex items-center justify-center transition-all active:scale-[0.98] hover:border-orange-400 hover:text-orange-500">
          Sign In
        </Link>
        <Link href="/register-chef"
          className="h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 font-bold text-[14px] flex items-center justify-center transition-all active:scale-[0.98] hover:bg-orange-100">
          Join as a Chef instead
        </Link>
      </div>

    </form>
  );
}
