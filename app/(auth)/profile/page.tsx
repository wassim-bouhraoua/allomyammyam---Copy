"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail, Phone, ShieldCheck, ChefHat,
  LogOut, LogIn, UserPlus, Loader2, User, Pencil, UtensilsCrossed,
  Sun, Moon, Monitor,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import BackToHome from "@/components/auth/back-to-home";
import { useTheme } from "@/context/ThemeContext";

const ROLE_LABELS: Record<string, string> = {
  USER: "Customer", CHEF: "Chef", ADMIN: "Administrator",
};

const ROLE_COLORS: Record<string, string> = {
  USER:  "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30",
  CHEF:  "bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30",
  ADMIN: "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30",
};

function ThemeSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-3xl p-5 border border-gray-100 dark:border-neutral-700 shadow-[0_2px_24px_rgba(0,0,0,0.04)] flex flex-col gap-3.5">
      <div>
        <p className="text-[11px] font-extrabold text-gray-400 dark:text-neutral-400 uppercase tracking-wider">Appearance</p>
        <p className="text-[11px] text-gray-400 dark:text-neutral-500 mt-0.5">Choose how the interface looks on your device.</p>
      </div>
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-50 dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
        {(["light", "dark", "system"] as const).map((mode) => {
          const isActive = theme === mode;
          const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;
          return (
            <button
              key={mode}
              onClick={() => setTheme(mode)}
              className={`flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[11px] font-bold transition-all duration-150 ${
                isActive
                  ? "bg-white dark:bg-neutral-700 text-orange-500 dark:text-orange-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-neutral-200"
              }`}
            >
              <Icon size={15} />
              <span className="capitalize">{mode}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[350px]">
        <Loader2 size={28} className="animate-spin text-orange-400" />
      </div>
    );
  }

  // ── Unauthenticated ───────────────────────────────────────────────────────
  if (!user) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <BackToHome />
        <div className="w-20 h-20 rounded-3xl bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 flex items-center justify-center mb-6">
          <User size={32} className="text-gray-300 dark:text-neutral-500" />
        </div>
        <h1 className="text-[20px] font-black text-gray-900 dark:text-neutral-100 text-center">
          You&apos;re not signed in
        </h1>
        <p className="text-[13px] text-gray-400 dark:text-neutral-400 mt-2 text-center mb-8 leading-relaxed">
          Sign in to access your profile, track orders and more.
        </p>
        <div className="w-full flex flex-col gap-2.5 max-w-sm">
          <Link href="/login"
            className="h-12 rounded-2xl bg-orange-500 text-white font-extrabold text-[15px] shadow-[0_4px_14px_rgba(255,138,0,0.38)] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            <LogIn size={17} /> Sign In
          </Link>
          <Link href="/register"
            className="h-12 rounded-2xl bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-neutral-200 font-extrabold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            <UserPlus size={17} /> Create Account
          </Link>
          <Link href="/register-chef"
            className="h-12 rounded-2xl border border-orange-100 dark:border-orange-900/35 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            <ChefHat size={17} /> Join as a Chef
          </Link>
          <div className="mt-4 w-full">
            <ThemeSection />
          </div>
        </div>
      </main>
    );
  }

  // ── Authenticated ─────────────────────────────────────────────────────────
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short" })
    : "";

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex-1 flex flex-col">
      <BackToHome />

      {/* Banner */}
      <div className="bg-gradient-to-br from-orange-400 to-orange-600 px-5 pt-10 pb-20 lg:pb-16 text-white lg:rounded-2xl lg:mx-6 lg:mt-6">
        <p className="text-[12px] font-bold text-orange-100 uppercase tracking-wider mb-2">My Profile</p>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[26px] lg:text-[32px] font-black leading-none tracking-tight">
            {user.firstName} {user.lastName}
          </h1>
          
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mt-2">
            {/* Role Badge */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-bold uppercase tracking-wide">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>

            {/* Dot Separator */}
            <span className="w-1 h-1 rounded-full bg-white/40" />

            {/* Member Since */}
            <span className="text-[12px] text-orange-100 font-semibold">
              Member since {formattedDate}
            </span>

            {/* Orders count */}
            {user.ordersCount !== undefined && user.ordersCount > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span className="text-[12px] text-orange-100 font-semibold">
                  {user.ordersCount} {user.ordersCount === 1 ? "order" : "orders"}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content Wrapper */}
      <div className="px-4 lg:px-6 pb-8 lg:pb-6 flex-1">
        <div className="flex flex-col lg:flex-row gap-6 -mt-12 lg:-mt-8 relative z-10">
          
          {/* Left Column (Sidebar-like Card) */}
          <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
            
            {/* Identity card */}
            <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-[0_4px_28px_rgba(0,0,0,0.10)] border border-gray-50 dark:border-neutral-750 p-5 flex flex-col items-center lg:items-start text-center lg:text-left gap-4">
              <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-[0_4px_16px_rgba(255,138,0,0.40)] overflow-hidden relative">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[28px] font-black text-white select-none leading-none">
                    {initials}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${ROLE_COLORS[user.role] ?? "bg-gray-50 text-gray-600 border-gray-100"}`}>
                  {user.role === "CHEF"  && <ChefHat    size={9} />}
                  {user.role === "ADMIN" && <ShieldCheck size={9} />}
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
                <p className="text-[13px] text-gray-400 dark:text-neutral-400 mt-2 truncate w-full">{user.email}</p>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white dark:bg-neutral-800 lg:shadow-[0_4px_20px_rgba(0,0,0,0.05)] lg:border lg:border-gray-50 lg:border-neutral-750 lg:p-5 lg:rounded-3xl flex flex-col gap-3">
              <Link href="/profile/edit"
                className="w-full h-12 rounded-2xl bg-orange-500 text-white font-extrabold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-orange-600 shadow-[0_4px_14px_rgba(255,138,0,0.38)]">
                <Pencil size={15} />
                Edit Profile
              </Link>

              {user.role === "ADMIN" && (
                <Link href="/admin"
                  className="w-full h-12 rounded-2xl bg-purple-600 text-white font-extrabold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-purple-700 shadow-[0_4px_14px_rgba(147,51,234,0.38)]">
                  <ShieldCheck size={15} />
                  Admin Dashboard
                </Link>
              )}

              <button onClick={handleLogout}
                className="w-full h-12 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-neutral-300 font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-gray-100 dark:hover:bg-neutral-800">
                <LogOut size={15} className="text-gray-400" />
                Sign Out
              </button>
            </div>

            <ThemeSection />

          </div>

          {/* Right Column (Content Cards) */}
          <div className="flex-1 flex flex-col gap-4">
            
            {/* Account Details */}
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1 pl-1">
                Account details
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-2xl px-4 py-3.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 flex items-center justify-center flex-shrink-0">
                    <Mail size={14} className="text-orange-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-neutral-450 uppercase tracking-wide">Email</p>
                    <p className="text-[13px] font-semibold text-gray-900 dark:text-neutral-100 truncate mt-0.5">{user.email}</p>
                  </div>
                </div>

                {user.phoneNumber && (
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-2xl px-4 py-3.5">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 flex items-center justify-center flex-shrink-0">
                      <Phone size={14} className="text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 dark:text-neutral-450 uppercase tracking-wide">Phone</p>
                      <p className="text-[13px] font-semibold text-gray-900 dark:text-neutral-100 truncate mt-0.5">{user.phoneNumber}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chef Profile Details */}
            {user.role === "CHEF" && user.chefProfile && (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1 pl-1">
                  Chef profile details
                </p>

                <div className="flex flex-col gap-3.5 bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-3xl p-5 shadow-[0_2px_24px_rgba(0,0,0,0.06)]">
                  <div className="flex justify-between items-center border-b border-gray-100 dark:border-neutral-705 pb-3">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-neutral-450 uppercase tracking-wide">Display Name</p>
                      <p className="text-[14px] font-extrabold text-gray-900 dark:text-neutral-100 mt-0.5">{user.chefProfile.displayName}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      user.chefProfile.status === "APPROVED"
                        ? "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30"
                        : user.chefProfile.status === "SUSPENDED"
                        ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30"
                        : "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30"
                    }`}>
                      {user.chefProfile.status}
                    </span>
                  </div>

                  {user.chefProfile.city && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-neutral-450 uppercase tracking-wide">City</p>
                      <p className="text-[13px] font-semibold text-gray-800 dark:text-neutral-200 mt-0.5">{user.chefProfile.city}</p>
                    </div>
                  )}

                  {user.chefProfile.bio && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-neutral-450 uppercase tracking-wide">Bio</p>
                      <p className="text-[13px] text-gray-650 dark:text-neutral-300 mt-0.5 whitespace-pre-wrap leading-relaxed">{user.chefProfile.bio}</p>
                    </div>
                  )}

                  {user.chefProfile.specialties && user.chefProfile.specialties.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-neutral-450 uppercase tracking-wide mb-1.5">Specialties</p>
                      <div className="flex flex-wrap gap-1.5">
                        {user.chefProfile.specialties.map((s) => (
                          <span
                            key={s}
                            className="px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 text-orange-600 dark:text-orange-400 text-[11px] font-bold"
                          >
                            {s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Manage Dishes shortcut — chef only */}
            {user.role === "CHEF" && (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1 pl-1">
                  Dish Management
                </p>
                <Link
                  href="/profile/dishes"
                  className="flex items-center justify-between px-5 py-4 bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-3xl shadow-[0_2px_24px_rgba(0,0,0,0.06)] hover:border-orange-200 dark:hover:border-orange-900/30 hover:shadow-[0_4px_20px_rgba(255,138,0,0.10)] active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 flex items-center justify-center">
                      <UtensilsCrossed size={16} className="text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-gray-900 dark:text-neutral-100">Manage My Dishes</p>
                      <p className="text-[11px] text-gray-400 dark:text-neutral-450 mt-0.5">Create, edit and manage your menu</p>
                    </div>
                  </div>
                  <span className="text-gray-300 dark:text-neutral-600 text-[18px] font-light">›</span>
                </Link>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}