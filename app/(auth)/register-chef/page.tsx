"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ChefHat, X, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const SPECIALTY_OPTIONS = [
  "Moroccan","Indian","Japanese","Mediterranean",
  "Seafood","Grill","Vegan","Pastry","Breakfast","Soups",
];

export default function RegisterChefPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    password: "", phoneNumber: "", displayName: "", bio: "", city: "",
  });
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (field: keyof typeof form) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const toggleSpecialty = (s: string) =>
    setSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!specialties.length) { setError("Please select at least one specialty."); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/register-chef", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, specialties }),
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
  const labelCls  = "text-[12px] font-bold text-gray-500 uppercase tracking-widest";
  const sectionCls = "text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-4";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">

      {/* Header */}
      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shadow-[0_4px_14px_rgba(255,138,0,0.40)] mb-5">
          <ChefHat size={22} className="text-white" />
        </div>
        <h1 className="text-[26px] font-black text-gray-900 tracking-tight leading-tight">
          Become a Chef
        </h1>
        <p className="text-[14px] text-gray-400 mt-1">Share your cooking with your city</p>
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

      {/* ── Personal Info ── */}
      <p className={sectionCls}>Personal Info</p>
      <div className="flex flex-col gap-4 mb-7">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label className={labelCls}>First name</label>
            <input type="text" autoComplete="given-name" required
              value={form.firstName} onChange={set("firstName")}
              placeholder="Fatima" className={inputCls} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelCls}>Last name</label>
            <input type="text" autoComplete="family-name" required
              value={form.lastName} onChange={set("lastName")}
              placeholder="Zahra" className={inputCls} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelCls}>Email</label>
          <input type="email" autoComplete="email" required
            value={form.email} onChange={set("email")}
            placeholder="chef@example.com" className={inputCls} />
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelCls}>
            Phone <span className="normal-case font-normal text-gray-400 tracking-normal">(optional)</span>
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
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 mb-7" />

      {/* ── Chef Profile ── */}
      <p className={sectionCls}>Chef Profile</p>
      <div className="flex flex-col gap-4 mb-7">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label className={labelCls}>Display name</label>
            <input type="text" required
              value={form.displayName} onChange={set("displayName")}
              placeholder="Chef Fatima" className={inputCls} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelCls}>City</label>
            <input type="text" required
              value={form.city} onChange={set("city")}
              placeholder="Casablanca" className={inputCls} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelCls}>Bio</label>
          <textarea value={form.bio} onChange={set("bio")} rows={3}
            placeholder="Tell customers about your cooking style…"
            className="px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all resize-none w-full" />
        </div>

        {/* Specialties */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className={labelCls}>Specialties</label>
            {specialties.length > 0 && (
              <span className="text-[11px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                {specialties.length} selected
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {SPECIALTY_OPTIONS.map(s => {
              const active = specialties.includes(s);
              return (
                <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold border transition-all duration-150 active:scale-95 ${
                    active
                      ? "bg-orange-500 border-orange-500 text-white shadow-[0_2px_10px_rgba(255,138,0,0.30)]"
                      : "bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-500"
                  }`}>
                  {active && <Check size={11} strokeWidth={3} />}
                  {s}
                  {active && <X size={11} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Submit */}
      <button type="submit" disabled={loading}
        className="h-[52px] rounded-2xl bg-orange-500 text-white font-extrabold text-[15px] shadow-[0_4px_20px_rgba(255,138,0,0.40)] transition-all duration-150 active:scale-[0.98] hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3">
        {loading
          ? <><Loader2 size={17} className="animate-spin" /> Submitting…</>
          : "Submit Application"
        }
      </button>

      <p className="text-[12px] text-gray-400 text-center mb-7">
        Your profile will be reviewed before going live.
      </p>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">already have an account?</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      <Link href="/login"
        className="h-12 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold text-[14px] flex items-center justify-center transition-all active:scale-[0.98] hover:border-orange-400 hover:text-orange-500 mb-2">
        Sign In
      </Link>

    </form>
  );
}
