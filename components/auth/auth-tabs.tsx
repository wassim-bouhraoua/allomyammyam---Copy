"use client";

import Link from "next/link";

interface AuthTabsProps {
  activeTab: "login" | "register";
}

import { useTranslation } from "@/context/I18nContext";

export default function AuthTabs({ activeTab }: AuthTabsProps) {
  const isLogin = activeTab === "login";
  const { dict } = useTranslation();

  const baseTabClass = "flex-1 text-center py-3 text-[14px] font-bold transition-all relative";
  const activeClass = "text-orange-500";
  const inactiveClass = "text-gray-400 hover:text-gray-600";

  return (
    <div className="flex border-b border-gray-100 mb-6">
      <Link
        href="/register"
        className={`${baseTabClass} ${!isLogin ? activeClass : inactiveClass}`}
      >
        {dict.auth.register.title}
        {!isLogin && (
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-[3px] bg-orange-500 rounded-t-full" />
        )}
      </Link>
      <Link
        href="/login"
        className={`${baseTabClass} ${isLogin ? activeClass : inactiveClass}`}
      >
        {dict.profile.signIn}
        {isLogin && (
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-orange-500 rounded-t-full" />
        )}
      </Link>
    </div>
  );
}
