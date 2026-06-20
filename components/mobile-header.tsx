"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getChefAvatarUrl } from "@/lib/defaults";

export default function MobileHeader() {
  const { user } = useAuth();

  // Determine initials and avatar dynamically from context
  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "Y";
  const avatar = user ? user.avatar : null;

  return (
    <header className="flex items-center justify-between px-4 pt-5 pb-3">
      {/* Brand logo & name */}
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shadow-[0_2px_8px_rgba(255,138,0,0.30)]">
          <span className="text-white text-xs font-black">A</span>
        </div>
        <span className="text-[15px] font-black text-foreground">AlloMyamMyam</span>
      </Link>

      {/* Location */}
      <button className="flex items-center gap-1">
        <MapPin size={12} className="text-orange-500 flex-shrink-0" fill="currentColor" />
        <span className="text-[12px] font-bold text-foreground max-w-[100px] truncate">
          Oujda
        </span>
      </button>

      {/* Profile link */}
      <Link
        href="/profile"
        className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm ring-2 ring-orange-200 active:scale-95 transition-transform overflow-hidden relative"
        aria-label="Profile"
      >
        <img
          src={getChefAvatarUrl(avatar)}
          alt="Profile"
          className="w-full h-full object-cover"
        />
      </Link>
    </header>
  );
}
