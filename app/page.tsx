import Link from "next/link";
import { MapPin, Search, SlidersHorizontal } from "lucide-react";

import BottomNav from "@/components/bottom-nav";
import HeroBanner from "@/components/hero-banner";
import HomeSection from "@/components/home-section";
import DishCard from "@/components/dish-card";
import ChefCard from "@/components/chef-card";

import {
  todayNewDishes,
  mockChefs,
} from "@/lib/mock-data";

export default function HomePage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col relative shadow-[0_0_80px_rgba(0,0,0,0.07)]">
        
        <main className="flex-1 overflow-y-auto pb-[78px]">

          {/* ───────────────── Header ───────────────── */}
          <header className="flex items-center justify-between px-4 pt-5 pb-3">
            
            {/* Menu button */}
            <button
              className="flex flex-col gap-[5px] p-1 -ml-1"
              aria-label="Menu"
            >
              <span className="block w-[18px] h-[2px] bg-gray-800 rounded-full" />
              <span className="block w-3 h-[2px] bg-gray-800 rounded-full" />
              <span className="block w-[18px] h-[2px] bg-gray-800 rounded-full" />
            </button>

            {/* Location */}
            <button className="flex items-center gap-1.5">
              <MapPin
                size={13}
                className="text-emerald-500 flex-shrink-0"
                fill="currentColor"
              />
              <span className="text-[13px] font-bold text-gray-800 max-w-[140px] truncate">
                Oujda, Oriental
              </span>
            </button>

            {/* Profile */}
            <button
              className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm ring-[2.5px] ring-emerald-200"
              aria-label="Profile"
            >
              <span className="text-white text-sm font-black select-none">
                Y
              </span>
            </button>

          </header>

          {/* ───────────────── Search ───────────────── */}
          <div className="flex items-center gap-2.5 px-4 mb-4">

            <Link
              href="/dishes"
              className="flex-1 flex items-center gap-2.5 bg-gray-100 rounded-2xl px-4 h-11 active:bg-gray-200 transition-colors"
            >
              <Search
                size={15}
                className="text-gray-400 flex-shrink-0"
              />

              <span className="text-sm text-gray-400 font-medium">
                Search dishes or chefs...
              </span>
            </Link>

            <Link
              href="/dishes"
              className="w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-[0_4px_14px_rgba(16,185,129,0.38)] active:scale-95 transition-transform duration-150"
              aria-label="Filter dishes"
            >
              <SlidersHorizontal
                size={17}
                className="text-white"
              />
            </Link>

          </div>

          {/* ───────────────── Hero Banner ───────────────── */}
          <HeroBanner />

          {/* ───────────────── New Today ───────────────── */}
          <HomeSection
            title="New Today Arrivals"
            subtitle="Fresh dishes added today"
            href="/dishes?filter=new"
          >
            {todayNewDishes.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                variant="vertical"
              />
            ))}
          </HomeSection>

          {/* ───────────────── Top Rated ───────────────── */}
          <HomeSection
            title="Top Rated"
            subtitle="Highest rated dishes on the platform"
            href="/dishes?filter=top-rated"
          >
            {todayNewDishes
              .slice()
              .sort((a, b) => b.averageRating - a.averageRating)
              .map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  variant="vertical"
                />
              ))}
          </HomeSection>

          {/* ───────────────── Booking Restaurant ───────────────── */}
          <HomeSection
            title="Booking Restaurant"
            subtitle="Check your city nearby restaurants"
            href="/restaurants"
            scrollable={false}
          >
            {mockChefs.slice(0, 4).map((chef) => (
              <ChefCard
                key={chef.id}
                chef={chef}
              />
            ))}
          </HomeSection>

        </main>

        {/* ───────────────── Bottom Navigation ───────────────── */}
        <BottomNav />

      </div>
    </div>
  );
}