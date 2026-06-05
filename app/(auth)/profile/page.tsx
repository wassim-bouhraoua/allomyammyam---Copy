"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  ChefHat,
  LogOut,
  LogIn,
  UserPlus,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/bottom-nav";

const ROLE_LABELS: Record<string, string> = {
  USER: "Customer",
  CHEF: "Chef",
  ADMIN: "Administrator",
};

const ROLE_COLORS: Record<string, string> = {
  USER: "bg-blue-50 text-blue-600 border-blue-100",
  CHEF: "bg-orange-50 text-orange-600 border-orange-100",
  ADMIN: "bg-purple-50 text-purple-600 border-purple-100",
};

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col relative shadow-[0_0_80px_rgba(0,0,0,0.07)]">
          <main className="flex-1 flex items-center justify-center pb-[78px]">
            <Loader2 size={28} className="animate-spin text-orange-400" />
          </main>
          <BottomNav />
        </div>
      </div>
    );
  }

  // ── Unauthenticated ───────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col relative shadow-[0_0_80px_rgba(0,0,0,0.07)]">
          <main className="flex-1 flex flex-col items-center justify-center px-6 pb-[78px] gap-6">

            {/* Icon */}
            <div className="w-20 h-20 rounded-[28px] bg-gray-100 flex items-center justify-center">
              <User size={36} className="text-gray-300" />
            </div>

            <div className="text-center">
              <h1 className="text-[20px] font-black text-gray-900">
                You&apos;re not signed in
              </h1>
              <p className="text-[13px] text-gray-400 mt-2">
                Sign in to access your profile, orders and more.
              </p>
            </div>

            <div className="w-full flex flex-col gap-3">
              <Link
                href="/login"
                className="h-12 rounded-2xl bg-orange-500 text-white font-extrabold text-[15px] shadow-[0_4px_14px_rgba(255,138,0,0.38)] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <LogIn size={18} />
                Sign In
              </Link>
              <Link
                href="/register"
                className="h-12 rounded-2xl bg-gray-100 text-gray-800 font-extrabold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <UserPlus size={18} />
                Create Account
              </Link>
              <Link
                href="/register-chef"
                className="h-12 rounded-2xl border-2 border-orange-200 text-orange-600 font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <ChefHat size={18} />
                Join as a Chef
              </Link>
            </div>

          </main>
          <BottomNav />
        </div>
      </div>
    );
  }

  // ── Authenticated ─────────────────────────────────────────────────────────
  const initials =
  `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();
  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col relative shadow-[0_0_80px_rgba(0,0,0,0.07)]">
        <main className="flex-1 overflow-y-auto pb-[78px]">

          {/* Header banner */}
          <div className="bg-gradient-to-br from-orange-400 to-orange-600 px-4 pt-12 pb-16">
            <h1 className="text-[18px] font-black text-white">My Profile</h1>
          </div>

          {/* Avatar card — overlaps banner */}
          <div className="px-4 -mt-10">
            <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.08)] border border-gray-50 p-4 flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-[0_4px_14px_rgba(255,138,0,0.35)]">
                <span className="text-[22px] font-black text-white select-none">
                  {initials}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-black text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[12px] text-gray-500 truncate mt-0.5">
                  {user.email}
                </p>
                {/* Role badge */}
                <span
                  className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${
                    ROLE_COLORS[user.role] ?? "bg-gray-50 text-gray-600 border-gray-100"
                  }`}
                >
                  {user.role === "CHEF" && <ChefHat size={9} className="mr-1" />}
                  {user.role === "ADMIN" && <ShieldCheck size={9} className="mr-1" />}
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Info rows */}
          <div className="px-4 mt-4 flex flex-col gap-3">

            <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
              Account details
            </p>

            {/* Email */}
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0">
                <Mail size={15} className="text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  Email
                </p>
                <p className="text-[13px] font-semibold text-gray-900 truncate mt-0.5">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Phone */}
            {user.phoneNumber && (
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0">
                  <Phone size={15} className="text-orange-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    Phone
                  </p>
                  <p className="text-[13px] font-semibold text-gray-900 truncate mt-0.5">
                    {user.phoneNumber}
                  </p>
                </div>
              </div>
            )}

            {/* Role */}
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={15} className="text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  Role
                </p>
                <p className="text-[13px] font-semibold text-gray-900 mt-0.5">
                  {ROLE_LABELS[user.role] ?? user.role}
                </p>
              </div>
            </div>

          </div>

          {/* Actions */}
          <div className="px-4 mt-6 flex flex-col gap-3">
            <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
              Actions
            </p>

            <button
              onClick={handleLogout}
              className="h-12 rounded-2xl bg-gray-100 text-gray-700 font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <LogOut size={16} className="text-gray-500" />
              Sign Out
            </button>
          </div>

        </main>
        <BottomNav />
      </div>
    </div>
  );
}