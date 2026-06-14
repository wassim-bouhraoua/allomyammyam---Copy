import BottomNav from "@/components/bottom-nav";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FFF9F5] flex items-center justify-center py-0 lg:py-12">
      <div className="w-full max-w-md lg:max-w-4xl bg-white min-h-screen lg:min-h-0 lg:rounded-[32px] flex flex-col relative shadow-[0_0_80px_rgba(0,0,0,0.07)] lg:border lg:border-gray-100/50 overflow-hidden lg:overflow-visible transition-all duration-300">
        <main className="flex-1 overflow-y-auto pb-[78px]">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}