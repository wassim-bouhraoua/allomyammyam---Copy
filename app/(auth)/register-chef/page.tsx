"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ChefHat, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const SPECIALTY_OPTIONS = [
  "Moroccan",
  "Indian",
  "Japanese",
  "Mediterranean",
  "Seafood",
  "Grill",
  "Vegan",
  "Pastry",
  "Breakfast",
  "Soups",
];

export default function RegisterChefPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
    displayName: "",
    bio: "",
    city: "",
  });
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set(field: keyof typeof form) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function toggleSpecialty(s: string) {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (specialties.length === 0) {
      setError("Please select at least one specialty.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-chef", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, specialties }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        return;
      }
      await refreshUser();
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-[28px] shadow-[0_2px_32px_rgba(0,0,0,0.08)] border border-gray-50 px-6 py-8">
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center shadow-[0_4px_16px_rgba(255,138,0,0.38)] mb-4">
          <ChefHat size={26} className="text-white" />
        </div>
        <h1 className="text-[22px] font-black text-gray-900">Join as a Chef</h1>
        <p className="text-[13px] text-gray-400 mt-1 text-center">
          Share your home cooking with the city
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-2xl bg-red-50 border border-red-100">
          <p className="text-[12px] font-semibold text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">

        {/* Personal info */}
        <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mt-1">
          Personal Info
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-wide">
              First name
            </label>
            <input
              type="text"
              autoComplete="given-name"
              required
              value={form.firstName}
              onChange={set("firstName")}
              placeholder="Fatima"
              className="h-12 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-gray-600 uppercase tracking-wide">
              Last name
            </label>
            <input
              type="text"
              autoComplete="family-name"
              required
              value={form.lastName}
              onChange={set("lastName")}
              placeholder="Zahra"
              className="h-12 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-bold text-gray-600 uppercase tracking-wide">
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={set("email")}
            placeholder="chef@example.com"
            className="h-12 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-bold text-gray-600 uppercase tracking-wide">
            Phone number
          </label>
          <input
            type="tel"
            autoComplete="tel"
            value={form.phoneNumber}
            onChange={set("phoneNumber")}
            placeholder="+212 6 00 00 00 00"
            className="h-12 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-bold text-gray-600 uppercase tracking-wide">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              value={form.password}
              onChange={set("password")}
              placeholder="Min. 8 characters"
              className="w-full h-12 px-4 pr-12 rounded-2xl bg-gray-50 border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Chef profile */}
        <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mt-3">
          Chef Profile
        </p>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-bold text-gray-600 uppercase tracking-wide">
            Display name
          </label>
          <input
            type="text"
            required
            value={form.displayName}
            onChange={set("displayName")}
            placeholder="Chef Fatima"
            className="h-12 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-bold text-gray-600 uppercase tracking-wide">
            City
          </label>
          <input
            type="text"
            required
            value={form.city}
            onChange={set("city")}
            placeholder="Casablanca"
            className="h-12 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-bold text-gray-600 uppercase tracking-wide">
            Bio
          </label>
          <textarea
            value={form.bio}
            onChange={set("bio")}
            rows={3}
            placeholder="Tell customers about your cooking style…"
            className="px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors resize-none"
          />
        </div>

        {/* Specialties */}
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-bold text-gray-600 uppercase tracking-wide">
            Specialties
          </label>
          <div className="flex flex-wrap gap-2">
            {SPECIALTY_OPTIONS.map((s) => {
              const active = specialties.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSpecialty(s)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${
                    active
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "bg-gray-50 border-gray-200 text-gray-600"
                  }`}
                >
                  {s}
                  {active && <X size={11} />}
                </button>
              );
            })}
          </div>
          {specialties.length > 0 && (
            <p className="text-[11px] text-orange-500 font-semibold">
              {specialties.length} selected
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-3 h-12 rounded-2xl bg-orange-500 text-white font-extrabold text-[15px] shadow-[0_4px_14px_rgba(255,138,0,0.38)] transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 size={17} className="animate-spin" /> Submitting…</>
          ) : (
            "Submit Application"
          )}
        </button>

        <p className="text-[11px] text-gray-400 text-center mt-1">
          Your profile will be reviewed before going live.
        </p>
      </form>

      <div className="mt-5 flex flex-col items-center gap-2">
        <p className="text-[13px] text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-orange-500 font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}