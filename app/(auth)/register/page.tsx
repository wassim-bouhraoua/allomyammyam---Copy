"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, UtensilsCrossed, X, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import BackToHome from "@/components/auth/back-to-home";
import { useGoogleSignIn } from "@/hooks/useGoogleSignIn";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "", phoneNumber: "", avatar: "",
  });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        setError(data.error ?? "Google sign-up failed.");
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setFileError("Please upload a valid image (JPG, JPEG, PNG, WEBP).");
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError("Photo size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      setForm(prev => ({ ...prev, avatar: reader.result as string }));
    };
    reader.onerror = () => {
      setFileError("Error reading file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPreviewUrl(null);
    setFileError(null);
    setForm(prev => ({ ...prev, avatar: "" }));
    const input = document.getElementById("profile-photo-upload") as HTMLInputElement;
    if (input) input.value = "";
  };

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

  const inputCls = "h-12 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors w-full";
  const labelCls = "text-[11px] font-bold text-gray-400 uppercase tracking-wider";

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-8">
      <BackToHome />

      {/* Header */}
      <div className="flex flex-col items-center pt-8 pb-6">
        <div className="w-16 h-16 rounded-3xl bg-orange-500 flex items-center justify-center shadow-[0_6px_20px_rgba(255,138,0,0.40)] mb-5">
          <UtensilsCrossed size={28} className="text-white" />
        </div>
        <h1 className="text-[24px] font-black text-gray-900 tracking-tight">Create account</h1>
        <p className="text-[13px] text-gray-400 mt-1.5">Order homemade food from local chefs</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
          <p className="text-[12px] font-semibold text-red-600">{error}</p>
        </div>
      )}

      {/* Google Sign-in Card */}
      <div className="bg-white rounded-3xl shadow-[0_2px_24px_rgba(0,0,0,0.07)] border border-gray-100 p-5 mb-3 flex flex-col gap-3">
        <div id="google-signin-button" className="w-full flex justify-center min-h-[40px]" />
        <div className="flex items-center gap-2.5 my-0.5">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">or register with email</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-[0_2px_24px_rgba(0,0,0,0.07)] border border-gray-100 p-5 flex flex-col gap-4">

        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>First name</label>
            <input type="text" autoComplete="given-name" required
              value={form.firstName} onChange={set("firstName")}
              placeholder="Yassine" className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Last name</label>
            <input type="text" autoComplete="family-name" required
              value={form.lastName} onChange={set("lastName")}
              placeholder="Alami" className={inputCls} />
          </div>
        </div>

        {/* Upload Profile Photo */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Upload Profile Photo (Optional)</label>
          <div className="flex items-center gap-3">
            {/* Preview */}
            <div className="relative w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-gray-300" />
              )}
              {previewUrl && (
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity"
                  aria-label="Remove photo"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {/* Input */}
            <div className="flex-1 min-w-0">
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleFileChange}
                className="hidden"
                id="profile-photo-upload"
              />
              <label
                htmlFor="profile-photo-upload"
                className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-[12px] font-bold text-gray-700 cursor-pointer hover:bg-gray-100 active:scale-95 transition-all"
              >
                Choose Photo
              </label>
              {fileError && <p className="text-[11px] text-red-500 font-semibold mt-1">{fileError}</p>}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Email</label>
          <input type="email" autoComplete="email" required
            value={form.email} onChange={set("email")}
            placeholder="you@example.com" className={inputCls} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>
            Phone <span className="normal-case text-gray-400 font-normal">(optional)</span>
          </label>
          <input type="tel" autoComplete="tel"
            value={form.phoneNumber} onChange={set("phoneNumber")}
            placeholder="+212 6 00 00 00 00" className={inputCls} />
        </div>

        <div className="flex flex-col gap-1.5">
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
          <p className="text-[11px] text-gray-400">At least 8 characters</p>
        </div>

        <button type="submit" disabled={loading}
          className="h-12 rounded-2xl bg-orange-500 text-white font-extrabold text-[15px] shadow-[0_4px_14px_rgba(255,138,0,0.38)] transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1">
          {loading
            ? <><Loader2 size={17} className="animate-spin" /> Creating account…</>
            : "Create Account"
          }
        </button>

      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-[11px] text-gray-400 font-medium">already a member?</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      <div className="flex flex-col gap-2.5">
        <Link href="/login"
          className="h-12 rounded-2xl border border-gray-200 text-gray-700 font-bold text-[14px] flex items-center justify-center active:scale-[0.98] transition-transform hover:border-orange-300 hover:text-orange-500">
          Sign In
        </Link>
        <Link href="/register-chef"
          className="h-12 rounded-2xl border border-orange-100 bg-orange-50 text-orange-600 font-bold text-[14px] flex items-center justify-center active:scale-[0.98] transition-transform">
          Join as a Chef instead
        </Link>
      </div>

    </div>
  );
}