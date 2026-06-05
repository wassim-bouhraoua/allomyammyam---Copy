import BottomNav from "@/components/bottom-nav";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
 return (
  <div className="min-h-screen bg-[#FFF9F5] flex flex-col">
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 pb-[90px]">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>

    <BottomNav />
  </div>
);
}