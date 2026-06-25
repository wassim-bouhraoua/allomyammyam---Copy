"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, User, X, Trash2, Camera } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import BackToHome from "@/components/auth/back-to-home";
import { getUserAvatarUrl } from "@/lib/defaults";
import { useTranslation } from "@/context/I18nContext";
import { getLocalizedSpecialty } from "@/lib/i18n";

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

export default function EditProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { locale, dict } = useTranslation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [bioEn, setBioEn] = useState("");
  const [bioAr, setBioAr] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);

  const [banner, setBanner] = useState<string | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);
  const [bannerFileError, setBannerFileError] = useState<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [isDragOverAvatar, setIsDragOverAvatar] = useState(false);
  const [isDragOverBanner, setIsDragOverBanner] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?from=/profile/edit");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhoneNumber(user.phoneNumber || "");
      setAvatar(user.avatar || null);
      setPreviewUrl(user.avatar || null);
      setCity(user.city || "");
      
      if (user.chefProfile) {
        setDisplayName(user.chefProfile.displayName || "");
        setCity(user.chefProfile.city || user.city || "");
        setBio(user.chefProfile.bio || "");
        setBioEn(user.chefProfile.bio_en || "");
        setBioAr(user.chefProfile.bio_ar || "");
        setSpecialties(user.chefProfile.specialties || []);
        setBanner(user.chefProfile.bannerUrl || null);
        setBannerPreviewUrl(user.chefProfile.bannerUrl || null);
      }
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[350px]">
        <Loader2 size={28} className="animate-spin text-orange-400" />
      </div>
    );
  }

  const processAvatarFile = (file: File) => {
    setFileError(null);
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setFileError(dict.editProfile.avatarError);
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError(dict.editProfile.avatarSizeError);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreviewUrl(base64);
      setAvatar(base64);
    };
    reader.onerror = () => {
      setFileError(dict.editProfile.avatarReadError);
    };
    reader.readAsDataURL(file);
  };

  const processBannerFile = (file: File) => {
    setBannerFileError(null);
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setBannerFileError(dict.editProfile.bannerError);
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setBannerFileError(dict.editProfile.bannerSizeError);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setBannerPreviewUrl(base64);
      setBanner(base64);
    };
    reader.onerror = () => {
      setBannerFileError(dict.editProfile.bannerReadError);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAvatarFile(file);
    }
  };

  const clearPhoto = () => {
    setPreviewUrl(null);
    setAvatar(null);
    setFileError(null);
    const input = document.getElementById("profile-photo-upload") as HTMLInputElement;
    if (input) input.value = "";
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processBannerFile(file);
    }
  };

  const handleDragOverAvatar = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverAvatar(true);
  };

  const handleDragLeaveAvatar = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverAvatar(false);
  };

  const handleDropAvatar = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverAvatar(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAvatarFile(file);
    }
  };

  const handleDragOverBanner = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverBanner(true);
  };

  const handleDragLeaveBanner = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverBanner(false);
  };

  const handleDropBanner = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverBanner(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processBannerFile(file);
    }
  };

  const clearBanner = () => {
    setBannerPreviewUrl(null);
    setBanner(null);
    setBannerFileError(null);
    const input = document.getElementById("profile-banner-upload") as HTMLInputElement;
    if (input) input.value = "";
  };

  function toggleSpecialty(s: string) {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  const isFormValid = () => {
    if (!user) return false;
    if (!firstName.trim() || !lastName.trim()) return false;
    if (user.role === "CHEF") {
      if (!displayName.trim() || !city.trim() || specialties.length === 0) {
        return false;
      }
    }
    return true;
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !isFormValid()) return;

    setError(null);
    setSaving(true);

    try {
      const payload: any = {
        firstName,
        lastName,
        phoneNumber: phoneNumber || null,
        avatar,
        city: city || null,
      };

      if (user.role === "CHEF") {
        payload.displayName = displayName;
        payload.city = city;
        payload.bio = bio;
        payload.bio_en = bioEn;
        payload.bio_ar = bioAr;
        payload.specialties = specialties;
        payload.banner = banner;
      }

      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? dict.editProfile.saveError);
        return;
      }

      await refreshUser();
      
      router.push("/profile");
      router.refresh();
    } catch {
      setError(dict.editProfile.unexpectedError);
    } finally {
      setSaving(false);
    }
  }

  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
  const inputCls = "h-12 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors w-full";
  const labelCls = "text-[11px] font-bold text-gray-400 uppercase tracking-wider";



  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-8">
      <BackToHome />
      {/* Header with back navigation */}
      <div className="flex items-center justify-between py-4 mb-2">
        <Link
          href="/profile"
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:text-orange-500 hover:border-orange-200 transition-all active:scale-95"
          aria-label={dict.common.back}
        >
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </Link>
        <h1 className="text-[18px] font-black text-gray-900 tracking-tight">{dict.editProfile.title}</h1>
        <div className="w-10" />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
          <p className="text-[12px] font-semibold text-red-600">{error}</p>
        </div>
      )}

      {/* Form container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-[0_2px_24px_rgba(0,0,0,0.07)] border border-gray-100 p-5 flex flex-col gap-5">
        
        {/* Photo Upload / Edit Section */}
        <div className="flex flex-col items-center py-2">
          <div
            onDragOver={handleDragOverAvatar}
            onDragLeave={handleDragLeaveAvatar}
            onDrop={handleDropAvatar}
            onClick={() => document.getElementById("profile-photo-upload")?.click()}
            className={`relative w-24 h-24 rounded-3xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-all mb-4 ${
              isDragOverAvatar
                ? "border-orange-500 bg-orange-50/50"
                : "border-gray-200 bg-gray-50 hover:bg-gray-100/70"
            }`}
          >
            {getUserAvatarUrl(previewUrl, user.role) ? (
              <img
                src={getUserAvatarUrl(previewUrl, user.role)!}
                alt="Avatar Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400">
                {initials ? (
                  <span className="text-[20px] font-bold leading-none mb-1">{initials}</span>
                ) : (
                  <User size={24} className="mb-0.5" />
                )}
                <span className="text-[8px] font-bold uppercase tracking-wider">{dict.editProfile.dropHere}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileChange}
              className="hidden"
              id="profile-photo-upload"
            />
            <label
              htmlFor="profile-photo-upload"
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-[12px] font-bold text-gray-700 cursor-pointer hover:bg-gray-100 active:scale-95 transition-all"
            >
              <Camera size={14} className="text-gray-500" />
              {dict.editProfile.choosePhoto}
            </label>
            {previewUrl && (
              <button
                type="button"
                onClick={clearPhoto}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-100 rounded-xl bg-red-50 text-[12px] font-bold text-red-600 hover:bg-red-100 active:scale-95 transition-all"
              >
                <Trash2 size={14} />
                {dict.editProfile.remove}
              </button>
            )}
          </div>
          {fileError && <p className="text-[11px] text-red-500 font-semibold mt-2 text-center">{fileError}</p>}
        </div>

        {/* First & Last Name Fields */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>{dict.editProfile.firstName}</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={dict.editProfile.firstName}
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>{dict.editProfile.lastName}</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={dict.editProfile.lastName}
              className={inputCls}
            />
          </div>
        </div>

        {/* Phone Field */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>{dict.editProfile.phone}</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+212 6 00 00 00 00"
            className={inputCls}
          />
        </div>

        {/* City Field for Customers */}
        {user.role !== "CHEF" && (
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>{dict.editProfile.city}</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={dict.editProfile.cityPlaceholder}
              className={inputCls}
            />
          </div>
        )}

        {/* Chef Profile Section */}
        {user?.role === "CHEF" && (
          <>
            <div className="border-t border-gray-100 pt-4 mt-2">
              <p className="text-[11px] font-extrabold text-orange-500 uppercase tracking-wider mb-4 border-b border-gray-50 pb-2">
                {dict.editProfile.chefProfileTitle}
              </p>
            </div>

            {/* Banner Upload Section */}
            <div className="flex flex-col gap-2 mb-2 bg-gray-50/50 rounded-2xl border border-gray-150 p-4">
              <label className={labelCls}>{dict.editProfile.chefBannerTitle}</label>
              
              <div
                onDragOver={handleDragOverBanner}
                onDragLeave={handleDragLeaveBanner}
                onDrop={handleDropBanner}
                onClick={() => document.getElementById("profile-banner-upload")?.click()}
                className={`relative w-full h-32 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-all ${
                  isDragOverBanner
                    ? "border-orange-500 bg-orange-50/50"
                    : "border-gray-200 bg-gray-50 hover:bg-gray-100/70"
                }`}
              >
                {bannerPreviewUrl ? (
                  <img src={bannerPreviewUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[12px] font-bold text-gray-400">
                    {dict.editProfile.dragDropBanner}
                  </span>
                )}
              </div>

              <div className="flex gap-2 mt-1">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleBannerFileChange}
                  className="hidden"
                  id="profile-banner-upload"
                />
                <label
                  htmlFor="profile-banner-upload"
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl bg-white text-[12px] font-bold text-gray-700 cursor-pointer hover:bg-gray-50 active:scale-95 transition-all"
                >
                  <Camera size={13} className="text-gray-500" />
                  {dict.editProfile.chooseBanner}
                </label>
                {bannerPreviewUrl && (
                  <button
                    type="button"
                    onClick={clearBanner}
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-100 rounded-xl bg-red-50 text-[12px] font-bold text-red-600 hover:bg-red-100 active:scale-95 transition-all"
                  >
                    <Trash2 size={13} />
                    {dict.editProfile.removeBanner}
                  </button>
                )}
              </div>
              {bannerFileError && <p className="text-[11px] text-red-500 font-semibold mt-1">{bannerFileError}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>{dict.editProfile.displayName}</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={dict.editProfile.chefNamePlaceholder}
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>{dict.editProfile.city}</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={dict.editProfile.cityPlaceholder}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>{dict.editProfile.bio}</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder={dict.editProfile.chefBioPlaceholder}
                  className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-750 text-[14px] text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-950/20 transition-colors resize-none w-full text-start"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>{dict.editProfile.bioEn}</label>
                <textarea
                  value={bioEn}
                  onChange={(e) => setBioEn(e.target.value)}
                  rows={3}
                  placeholder={dict.editProfile.chefBioPlaceholder}
                  className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-750 text-[14px] text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-950/20 transition-colors resize-none w-full text-start"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>{dict.editProfile.bioAr}</label>
                <textarea
                  value={bioAr}
                  onChange={(e) => setBioAr(e.target.value)}
                  rows={3}
                  placeholder={dict.editProfile.chefBioPlaceholder}
                  className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-750 text-[14px] text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-950/20 transition-colors resize-none w-full text-start"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className={labelCls}>{dict.editProfile.chefSpecialties}</label>
              <div className="flex flex-wrap gap-2">
                {SPECIALTY_OPTIONS.map((s) => {
                  const active = specialties.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSpecialty(s)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all active:scale-95 ${
                        active
                          ? "bg-orange-500 border-orange-500 text-white shadow-[0_2px_8px_rgba(255,138,0,0.30)]"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:border-orange-200"
                      }`}
                    >
                      {getLocalizedSpecialty(s, locale)}
                      {active && <X size={11} />}
                    </button>
                  );
                })}
              </div>
              {specialties.length > 0 && (
                <p className="text-[11px] text-orange-500 font-semibold mt-1">
                  {dict.editProfile.selectedCount.replace("{count}", String(specialties.length))}
                </p>
              )}
            </div>
          </>
        )}

        {/* Submit Actions */}
        <div className="flex flex-col gap-2 mt-4">
          <button
            type="submit"
            disabled={saving || !isFormValid()}
            className="h-12 rounded-2xl bg-orange-500 text-white font-extrabold text-[15px] shadow-[0_4px_14px_rgba(255,138,0,0.38)] transition-all duration-150 active:scale-[0.98] disabled:bg-gray-150 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                {dict.editProfile.saving}
              </>
            ) : (
              dict.editProfile.save
            )}
          </button>
          
          <Link
            href="/profile"
            className="h-12 rounded-2xl border border-gray-200 text-gray-700 font-bold text-[14px] flex items-center justify-center active:scale-[0.98] transition-transform hover:bg-gray-50"
          >
            {dict.editProfile.cancel}
          </Link>
        </div>

      </form>
    </div>
  );
}
