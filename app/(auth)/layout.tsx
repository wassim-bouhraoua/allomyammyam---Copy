"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/bottom-nav";
import DesktopNavLinks from "@/components/desktop-nav-links";
import LocationPill from "@/components/location-pill";
import LanguageSwitcher from "@/components/language-switcher";
import MobileHeader from "@/components/mobile-header";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isAuthForm =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/register-chef" ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register");

  if (isAuthForm) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-0 lg:py-12">
        <div className="w-full max-w-md lg:max-w-4xl bg-background lg:bg-card min-h-screen lg:min-h-0 lg:rounded-[32px] flex flex-col relative shadow-[0_0_80px_rgba(0,0,0,0.07)] lg:border lg:border-border overflow-hidden lg:overflow-visible transition-all duration-300">
          <main className="flex-1 overflow-y-auto pb-[78px]">
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* ── Two-column Shell (Desktop) / Vertical Stack (Mobile) ── */}
      <div className="max-w-[90rem] mx-auto min-h-screen flex gap-8 px-0 lg:px-8 lg:py-8">

        {/* ── Left Sidebar (Desktop Only) ── */}
        <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 gap-6 sticky top-8 self-start">
          {/* Brand */}
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-[0_4px_12px_rgba(255,138,0,0.38)]">
              <span className="text-white text-sm font-black">A</span>
            </div>
            <span className="text-[17px] font-black text-foreground">AlloMyamMyam</span>
          </div>
          <DesktopNavLinks />
          <LocationPill />
          <LanguageSwitcher />
        </aside>

        {/* ── Main Column ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Mobile Header (standard mobile navigation header) */}
          <div className="lg:hidden">
            <MobileHeader />
          </div>

          {/* Content container */}
          <main className="flex-1 pb-[90px] lg:pb-12">
            {children}
          </main>
          <BottomNav />
        </div>

      </div>
    </div>
  );
}