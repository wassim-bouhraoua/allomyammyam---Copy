"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, User, X, Trash2, Camera } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  // UI / Preview states
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?from=/profile/edit");
    }
  }, [user, authLoading, router]);

  // Initialize form fields when user loads
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhoneNumber(user.phoneNumber || "");
      setAvatar(user.avatar || null);
      setPreviewUrl(user.avatar || null);
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[350px]">
        <Loader2 size={28} className="animate-spin text-orange-400" />
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setFileError("Please upload a valid image (JPG, JPEG, PNG, WEBP).");
      return;
    }

    // Validate size (2MB limit)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError("Photo size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreviewUrl(base64);
      setAvatar(base64);
    };
    reader.onerror = () => {
      setFileError("Error reading file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPreviewUrl(null);
    setAvatar(null);
    setFileError(null);
    const input = document.getElementById("profile-photo-upload") as HTMLInputElement;
    if (input) input.value = "";
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phoneNumber: phoneNumber || null,
          avatar,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to update profile.");
        return;
      }

      // Refresh the context so new initials, names and avatar propagate everywhere
      await refreshUser();
      
      router.push("/profile");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
  const inputCls = "h-12 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors w-full";
  const labelCls = "text-[11px] font-bold text-gray-400 uppercase tracking-wider";

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-8">
      {/* Header with back navigation */}
      <div className="flex items-center justify-between py-4 mb-2">
        <Link
          href="/profile"
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:text-orange-500 hover:border-orange-200 transition-all active:scale-95"
          aria-label="Back to profile"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-[18px] font-black text-gray-900 tracking-tight">Edit Profile</h1>
        <div className="w-10" /> {/* Spacer to center the title */}
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
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-[0_8px_24px_rgba(255,138,0,0.30)] overflow-hidden mb-4">
            {previewUrl ? (
              <img src={previewUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[34px] font-black text-white select-none leading-none">
                {initials || <User size={34} />}
              </span>
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
              Choose Photo
            </label>
            {previewUrl && (
              <button
                type="button"
                onClick={clearPhoto}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-100 rounded-xl bg-red-50 text-[12px] font-bold text-red-600 hover:bg-red-100 active:scale-95 transition-all"
              >
                <Trash2 size={14} />
                Remove
              </button>
            )}
          </div>
          {fileError && <p className="text-[11px] text-red-500 font-semibold mt-2 text-center">{fileError}</p>}
        </div>

        {/* First & Last Name Fields */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>First name</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Last name</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              className={inputCls}
            />
          </div>
        </div>

        {/* Phone Field */}
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Phone number (optional)</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+212 6 00 00 00 00"
            className={inputCls}
          />
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col gap-2 mt-2">
          <button
            type="submit"
            disabled={saving}
            className="h-12 rounded-2xl bg-orange-500 text-white font-extrabold text-[15px] shadow-[0_4px_14px_rgba(255,138,0,0.38)] transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Saving Changes…
              </>
            ) : (
              "Save Changes"
            )}
          </button>
          
          <Link
            href="/profile"
            className="h-12 rounded-2xl border border-gray-200 text-gray-700 font-bold text-[14px] flex items-center justify-center active:scale-[0.98] transition-transform hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>

      </form>
    </div>
  );
}
