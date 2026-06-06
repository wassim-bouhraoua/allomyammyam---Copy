import BottomNav from "@/components/bottom-nav";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FFF9F5] flex">

      {/* ── Left decorative panel — desktop only ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 flex-col justify-between p-12 relative overflow-hidden sticky top-0 h-screen">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-white/10 rounded-full blur-3xl" />

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white font-black text-lg">A</span>
            </div>
            <span className="text-white font-black text-xl tracking-tight">AlloMyamMyam</span>
          </div>
          <h2 className="text-white font-black text-[42px] leading-[1.1] tracking-tight mb-5">
            Homemade food,<br />delivered fresh.
          </h2>
          <p className="text-orange-100 text-[16px] leading-relaxed max-w-sm">
            Order authentic dishes from talented home chefs in your city. Real food, real people.
          </p>
        </div>

        {/* Social proof */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex -space-x-2">
              {["Y","K","S","M"].map((l, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-white/30 border-2 border-orange-400 flex items-center justify-center">
                  <span className="text-white text-[11px] font-black">{l}</span>
                </div>
              ))}
            </div>
            <p className="text-orange-100 text-[13px]">
              <span className="text-white font-bold">2,400+</span> happy customers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4 fill-yellow-300" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-orange-100 text-[13px]">4.9 average rating</span>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col min-h-screen lg:overflow-y-auto">

        {/* Mobile */}
        <div className="lg:hidden bg-white min-h-screen flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.07)] max-w-md mx-auto w-full">
          <main className="flex-1 px-5 pt-6 pb-[78px]">
            {children}
          </main>
          <BottomNav />
        </div>

        {/* Desktop */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-12">
          <div className="w-full max-w-[420px]">
            {children}
          </div>
        </div>

      </div>
    </div>
  );
}
