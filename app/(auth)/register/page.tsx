"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, UtensilsCrossed, X, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import BackToHome from "@/components/auth/back-to-home";
import { useGoogleSignIn } from "@/hooks/useGoogleSignIn";
import { useTranslation } from "@/context/I18nContext";

export default function RegisterPage() {
  const { locale, dict } = useTranslation();
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
      setFileError(dict.auth.register.validImageError);
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError(dict.auth.register.photoSizeError);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      setForm(prev => ({ ...prev, avatar: reader.result as string }));
    };
    reader.onerror = () => {
      setFileError(dict.auth.register.fileReadError);
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
            {dict.auth.register.welcomeGraphicTitle}
          </h2>
          <p className="text-[14px] text-orange-50/90 leading-relaxed font-medium max-w-sm">
            {dict.auth.register.welcomeGraphicDesc}
          </p>
        </div>

        <p className="text-[11px] text-orange-100/70 font-semibold relative z-10">
          © 2026 AlloMyamMyam. {locale === "ar" ? "جميع الحقوق محفوظة." : locale === "en" ? "All rights reserved." : "Tous droits réservés."}
        </p>
      </div>

      {/* Right side: Registration Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 py-8 lg:p-10 lg:overflow-y-auto">
        <BackToHome />

        {/* Header */}
        <div className="flex flex-col items-center pt-8 pb-6">
          <div className="w-16 h-16 rounded-3xl bg-orange-500 flex lg:hidden items-center justify-center shadow-[0_6px_20px_rgba(255,138,0,0.40)] mb-5">
            <UtensilsCrossed size={28} className="text-white" />
          </div>
          <h1 className="text-[24px] font-black text-foreground tracking-tight">{dict.auth.register.title}</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">{dict.auth.register.orderHomemade}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
            <p className="text-[12px] font-semibold text-red-600">{error}</p>
          </div>
        )}

        {/* Google Sign-in Card */}
        <div className="bg-card rounded-3xl shadow-[0_2px_24px_rgba(0,0,0,0.07)] border border-border p-5 mb-3 flex flex-col gap-3">
          <div id="google-signin-button" className="w-full flex justify-center min-h-[40px]" />
          <div className="flex items-center gap-2.5 my-0.5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{dict.auth.register.orRegisterWithEmail}</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card rounded-3xl shadow-[0_2px_24px_rgba(0,0,0,0.07)] border border-border p-5 flex flex-col gap-4">

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1.5 text-start">
              <label className={labelCls}>{dict.auth.fields.firstName}</label>
              <input type="text" autoComplete="given-name" required
                value={form.firstName} onChange={set("firstName")}
                placeholder={locale === "ar" ? "ياسين" : "Yassine"} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5 text-start">
              <label className={labelCls}>{dict.auth.fields.lastName}</label>
              <input type="text" autoComplete="family-name" required
                value={form.lastName} onChange={set("lastName")}
                placeholder={locale === "ar" ? "العلمي" : "Alami"} className={inputCls} />
            </div>
          </div>

          {/* Upload Profile Photo */}
          <div className="flex flex-col gap-1.5 text-start">
            <label className={labelCls}>{dict.auth.register.uploadPhoto}</label>
            <div className="flex items-center gap-3">
              {/* Preview */}
              <div className="relative w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-muted-foreground/50" />
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
                  className="inline-flex items-center px-4 py-2 border border-border rounded-xl bg-secondary text-[12px] font-bold text-foreground cursor-pointer hover:bg-secondary/80 active:scale-95 transition-all"
                >
                  {dict.auth.register.choosePhoto}
                </label>
                {fileError && <p className="text-[11px] text-red-500 font-semibold mt-1">{fileError}</p>}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-start">
            <label className={labelCls}>{dict.auth.fields.email}</label>
            <input type="email" autoComplete="email" required
              value={form.email} onChange={set("email")}
              placeholder="you@example.com" className={inputCls} />
          </div>

          <div className="flex flex-col gap-1.5 text-start">
            <label className={labelCls}>
              {dict.auth.fields.phone} <span className="normal-case text-muted-foreground font-normal">({locale === "ar" ? "اختياري" : locale === "en" ? "optional" : "facultatif"})</span>
            </label>
            <input type="tel" autoComplete="tel"
              value={form.phoneNumber} onChange={set("phoneNumber")}
              placeholder="+212 6 00 00 00 00" className={inputCls} />
          </div>

          <div className="flex flex-col gap-1.5 text-start">
            <label className={labelCls}>{dict.auth.fields.password}</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} autoComplete="new-password"
                required minLength={8}
                value={form.password} onChange={set("password")}
                placeholder={locale === "ar" ? "8 أحرف على الأقل" : locale === "en" ? "Min. 8 characters" : "Au moins 8 caractères"} className={`${inputCls} ${locale === "ar" ? "pl-12 pr-4" : "pr-12 pl-4"}`} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className={`absolute top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors ${locale === "ar" ? "left-3" : "right-3"}`}
                aria-label={showPw ? (locale === "ar" ? "إخفاء" : "Hide") : (locale === "ar" ? "عرض" : "Show")}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">{dict.auth.register.passwordHint}</p>
          </div>

          <button type="submit" disabled={loading}
            className="h-12 rounded-2xl bg-orange-500 text-white font-extrabold text-[15px] shadow-[0_4px_14px_rgba(255,138,0,0.38)] transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1">
            {loading
              ? <><Loader2 size={17} className="animate-spin" /> {dict.auth.register.creatingAccount}</>
              : dict.auth.register.submit
            }
          </button>

        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] text-muted-foreground font-medium">{dict.auth.register.alreadyMember}</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="flex flex-col gap-2.5">
          <Link href="/login"
            className="h-12 rounded-2xl border border-border text-foreground bg-secondary/20 hover:bg-secondary/40 font-bold text-[14px] flex items-center justify-center active:scale-[0.98] transition-transform hover:border-orange-300 hover:text-orange-500">
            {dict.auth.chef.signIn}
          </Link>
          <Link href="/register-chef"
            className="h-12 rounded-2xl border border-orange-100 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold text-[14px] flex items-center justify-center active:scale-[0.98] transition-transform">
            {dict.auth.register.joinAsChefInstead}
          </Link>
        </div>

      </div>
    </div>
  );
}