"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail, Phone, ShieldCheck, ChefHat,
  LogOut, LogIn, UserPlus, Loader2, User, Settings,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/bottom-nav";

const ROLE_LABELS: Record<string, string> = {
  USER: "Customer", CHEF: "Chef", ADMIN: "Administrator",
};
const ROLE_COLORS: Record<string, string> = {
  USER:  "bg-blue-50 text-blue-600 border-blue-100",
  CHEF:  "bg-orange-50 text-orange-600 border-orange-100",
  ADMIN: "bg-purple-50 text-purple-600 border-purple-100",
};

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Shell>
        <div className="flex-1 flex items-center justify-center pb-[78px]">
          <Loader2 size={28} className="animate-spin text-orange-400" />
        </div>
      </Shell>
    );
  }

  // ── Unauthenticated ───────────────────────────────────────────────────────
  if (!user) {
    return (
      <Shell>
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-[78px] text-center">
          <div className="w-20 h-20 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center mb-6">
            <User size={30} className="text-gray-300" />
          </div>
          <h1 className="text-[22px] font-black text-gray-900">Not signed in</h1>
          <p className="text-[13px] text-gray-400 mt-2 mb-8 max-w-xs leading-relaxed">
            Sign in to access your profile, track orders, and more.
          </p>
          <div className="w-full max-w-xs flex flex-col gap-3">
            <Link href="/login"
              className="h-12 rounded-2xl bg-orange-500 text-white font-extrabold text-[15px] shadow-[0_4px_14px_rgba(255,138,0,0.38)] flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-orange-600">
              <LogIn size={17} /> Sign In
            </Link>
            <Link href="/register"
              className="h-12 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:border-orange-400 hover:text-orange-500">
              <UserPlus size={17} /> Create Account
            </Link>
            <Link href="/register-chef"
              className="h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-orange-100">
              <ChefHat size={17} /> Join as a Chef
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  // ── Authenticated ─────────────────────────────────────────────────────────
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <Shell>
      <main className="flex-1 overflow-y-auto pb-[78px]">

        {/* Orange banner */}
        <div className="bg-gradient-to-br from-orange-400 to-orange-600 px-5 pt-10 pb-24 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[13px] font-semibold text-orange-100 mb-1">My Profile</p>
              <h1 className="text-[28px] font-black text-white leading-tight tracking-tight">
                {user.firstName}<br />{user.lastName}
              </h1>
            </div>
            <button className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Settings size={18} className="text-white" />
            </button>
          </div>
        </div>

        {/* Identity card — overlaps banner */}
        <div className="px-4 -mt-14 mb-6">
          <div className="bg-white rounded-3xl shadow-[0_4px_32px_rgba(0,0,0,0.12)] border border-gray-50 p-5">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-[0_6px_20px_rgba(255,138,0,0.40)]">
                <span className="text-[28px] font-black text-white select-none leading-none">
                  {initials}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-black text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[13px] text-gray-400 truncate mt-0.5">{user.email}</p>
                <span className={`inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${ROLE_COLORS[user.role] ?? "bg-gray-50 text-gray-600 border-gray-100"}`}>
                  {user.role === "CHEF"  && <ChefHat    size={9} />}
                  {user.role === "ADMIN" && <ShieldCheck size={9} />}
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Account details */}
        <div className="px-4 mb-6">
          <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">
            Account Details
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Mail size={15} className="text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</p>
                <p className="text-[13px] font-semibold text-gray-900 truncate mt-0.5">{user.email}</p>
              </div>
            </div>

            {user.phoneNumber && (
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5">
                <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Phone size={15} className="text-orange-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</p>
                  <p className="text-[13px] font-semibold text-gray-900 truncate mt-0.5">{user.phoneNumber}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sign out */}
        <div className="px-4">
          <button onClick={handleLogout}
            className="w-full h-12 rounded-2xl bg-gray-100 text-gray-600 font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-red-50 hover:text-red-500 group">
            <LogOut size={15} className="text-gray-400 group-hover:text-red-400 transition-colors" />
            Sign Out
          </button>
        </div>

      </main>
    </Shell>
  );
}

// ── Shared shell — mobile max-w + desktop two-col ─────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FFF9F5] lg:flex lg:items-stretch">

      {/* Mobile */}
      <div className="lg:hidden max-w-md mx-auto bg-white min-h-screen w-full flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.07)]">
        {children}
        <BottomNav />
      </div>

      {/* Desktop — centered max-w card */}
      <div className="hidden lg:flex flex-1 items-start justify-center pt-12 px-8">
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-[0_4px_40px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden flex flex-col min-h-[600px]">
          {children}
        </div>
      </div>

    </div>
  );
}
