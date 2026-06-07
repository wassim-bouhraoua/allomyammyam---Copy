import Link from "next/link";
import { MapPin, Search, SlidersHorizontal } from "lucide-react";

import BottomNav from "@/components/bottom-nav";
import HeroBanner from "@/components/hero-banner";
import HomeSection from "@/components/home-section";
import DishCard from "@/components/dish-card";
import ChefCard from "@/components/chef-card";
import MobileHeader from "@/components/mobile-header";

import { todayNewDishes, mockChefs } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <div className="bg-[#FFF9F5] min-h-screen">

      {/* ── Desktop: two-column shell. Mobile: single column. ── */}
      <div className="max-w-6xl mx-auto min-h-screen flex gap-8 px-0 lg:px-8 lg:py-8">

        {/* ── Left sidebar — desktop only ─────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 gap-6 sticky top-8 self-start">

          {/* Brand */}
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-[0_4px_12px_rgba(255,138,0,0.38)]">
              <span className="text-white text-sm font-black">A</span>
            </div>
            <span className="text-[17px] font-black text-gray-900">AlloMyamMyam</span>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-1">
            {[
              { label: "Home", href: "/" },
              { label: "Dishes", href: "/dishes" },
              { label: "Orders", href: "/orders" },
              { label: "Profile", href: "/profile" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="px-4 py-2.5 rounded-2xl text-[14px] font-semibold text-gray-600 hover:bg-white hover:text-orange-500 hover:shadow-sm transition-all duration-150"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Location pill */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <MapPin size={13} className="text-orange-500 flex-shrink-0" fill="currentColor" />
            <span className="text-[13px] font-bold text-gray-700 truncate">Oujda, Oriental</span>
          </div>
        </aside>

        {/* ── Main content column ──────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Mobile shell — unchanged */}
          <div className="lg:hidden bg-white min-h-screen flex flex-col relative shadow-[0_0_80px_rgba(0,0,0,0.07)]">
            <main className="flex-1 overflow-y-auto pb-[78px]">
              <MobileHeader />
              <SearchBar />
              <HeroBanner />
              <HomeSections />
            </main>
            <BottomNav />
          </div>

          {/* Desktop content — no mobile chrome ─────────────────────────── */}
          <div className="hidden lg:block">
            <DesktopSearchBar />
            <HeroBanner />
            <HomeSections />
            {/* Bottom padding so last section doesn't hug viewport edge */}
            <div className="h-12" />
          </div>

        </div>

        {/* ── Right panel — desktop only ───────────────────────────────────── */}
        <aside className="hidden xl:flex flex-col w-72 flex-shrink-0 gap-4 sticky top-8 self-start">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-3">
              Top Chefs
            </p>
            <div className="flex flex-col gap-3">
              {mockChefs.slice(0, 4).map((chef) => (
                <ChefCard key={chef.id} chef={chef} />
              ))}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}

/* ─── Extracted shared sections ─────────────────────────────────────────── */



function SearchBar() {
  return (
    <div className="flex items-center gap-2.5 px-4 mb-4">
      <Link
        href="/dishes"
        className="flex-1 flex items-center gap-2.5 bg-gray-100 rounded-2xl px-4 h-11 active:bg-gray-200 transition-colors"
      >
        <Search size={15} className="text-gray-500 flex-shrink-0" />
        <span className="text-sm text-gray-500 font-medium">Search dishes or chefs...</span>
      </Link>
      <Link
        href="/dishes"
        className="w-11 h-11 rounded-2xl bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-[0_4px_14px_rgba(255,138,0,0.38)] active:scale-95 transition-transform duration-150"
        aria-label="Filter dishes"
      >
        <SlidersHorizontal size={17} className="text-white" />
      </Link>
    </div>
  );
}

function DesktopSearchBar() {
  return (
    <div className="flex items-center gap-3 mb-6">
      <Link
        href="/dishes"
        className="flex-1 flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 h-12 hover:border-orange-300 transition-colors shadow-sm"
      >
        <Search size={16} className="text-gray-400 flex-shrink-0" />
        <span className="text-[14px] text-gray-400 font-medium">Search dishes or chefs...</span>
      </Link>
      <Link
        href="/dishes"
        className="h-12 px-5 rounded-2xl bg-orange-500 flex items-center gap-2 flex-shrink-0 shadow-[0_4px_14px_rgba(255,138,0,0.38)] hover:bg-orange-600 transition-colors"
        aria-label="Filter dishes"
      >
        <SlidersHorizontal size={16} className="text-white" />
        <span className="text-[14px] font-bold text-white">Filter</span>
      </Link>
    </div>
  );
}

function HomeSections() {
  return (
    <>
      <HomeSection
        title="New Today Arrivals"
        subtitle="Fresh dishes added today"
        href="/dishes?filter=new"
      >
        {todayNewDishes.map((dish) => (
          <DishCard key={dish.id} dish={dish} variant="vertical" />
        ))}
      </HomeSection>

      <HomeSection
        title="Top Rated"
        subtitle="Highest rated dishes on the platform"
        href="/dishes?filter=top-rated"
      >
        {todayNewDishes
          .slice()
          .sort((a, b) => b.averageRating - a.averageRating)
          .map((dish) => (
            <DishCard key={dish.id} dish={dish} variant="vertical" />
          ))}
      </HomeSection>

      {/* Booking Restaurant — hidden on desktop (moved to right sidebar) */}
      <div className="lg:hidden">
        <HomeSection
          title="Booking Restaurant"
          subtitle="Check your city nearby restaurants"
          href="/restaurants"
          scrollable={false}
        >
          {mockChefs.slice(0, 4).map((chef) => (
            <ChefCard key={chef.id} chef={chef} />
          ))}
        </HomeSection>
      </div>
    </>
  );
}