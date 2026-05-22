"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Star, SlidersHorizontal } from "lucide-react";
import { DishCategory } from "@prisma/client";

import DishCard from "@/components/dish-card";
import BottomNav from "@/components/bottom-nav";
import SearchBar from "@/components/search-bar";
import { mockDishes, MockDish } from "@/lib/mock-data";

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY CHIPS
// Each chip maps a human-readable cuisine label to one or more DishCategory
// enum values. The filtering logic checks dish.category against the array.
// Prisma enums and backend shape are untouched.
// ─────────────────────────────────────────────────────────────────────────────
const CUISINE_CHIPS: {
  label: string;
  emoji: string;
  categories: (DishCategory | "ALL")[];
}[] = [
  { label: "All",       emoji: "🍽️",  categories: ["ALL"] },
  { label: "Moroccan",  emoji: "🫕",  categories: ["MAIN_COURSE", "SOUP"] },
  { label: "Seafood",   emoji: "🦞",  categories: ["SEAFOOD"] },
  { label: "Grilled",   emoji: "🔥",  categories: ["MEAT"] },
  { label: "Asian",     emoji: "🍜",  categories: ["RICE_AND_GRAINS", "ASIAN"] },
  { label: "Salads",    emoji: "🥗",  categories: ["SALAD", "VEGAN"] },
  { label: "Dessert",   emoji: "🍰",  categories: ["DESSERT", "CAKE", "ICE_CREAM", "PASTRY"] },
  { label: "Breakfast", emoji: "🍳",  categories: ["BREAKFAST", "BRUNCH"] },
];

// ─────────────────────────────────────────────────────────────────────────────
// SORT OPTIONS — always visible as chips below the category row
// ─────────────────────────────────────────────────────────────────────────────
type SortKey = "default" | "rating" | "price_asc" | "price_desc";

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "Recommended", value: "default" },
  { label: "Top rated ⭐", value: "rating" },
  { label: "Cheapest",    value: "price_asc" },
  { label: "Priciest",    value: "price_desc" },
];

// ─────────────────────────────────────────────────────────────────────────────
// RATING OPTIONS — behind the toggle (power-user refinement)
// ─────────────────────────────────────────────────────────────────────────────
const RATING_OPTIONS: { label: string; value: number }[] = [
  { label: "Any rating", value: 0 },
  { label: "4.5+",       value: 4.5 },
  { label: "4.7+",       value: 4.7 },
  { label: "4.9+",       value: 4.9 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared chip style helper — keeps button classes DRY
// ─────────────────────────────────────────────────────────────────────────────
function chipClass(active: boolean) {
  return `flex-shrink-0 text-[12px] font-semibold px-4 py-2 rounded-full transition-all duration-200 active:scale-95 ${
    active
      ? "bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.32)]"
      : "bg-gray-100 text-gray-500"
  }`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function DishesPage() {
  // ── State (unchanged from previous implementation) ───────────────────────
  const [query,       setQuery]       = useState("");
  const [chipIndex,   setChipIndex]   = useState(0);   // index into CUISINE_CHIPS
  const [minRating,   setMinRating]   = useState<number>(0);
  const [sortKey,     setSortKey]     = useState<SortKey>("default");
  const [showRating,  setShowRating]  = useState(false);

  // How many secondary filters are active (for the badge)
  const activeSecondaryCount = minRating > 0 ? 1 : 0;

  // ── Filtering pipeline: search → category → rating → sort ───────────────
  const filtered: MockDish[] = useMemo(() => {
    const q          = query.toLowerCase().trim();
    const chip       = CUISINE_CHIPS[chipIndex];
    const isAll      = chip.categories.includes("ALL");

    // 1. search + soft-delete guard
    let result = mockDishes.filter((dish) => {
      if (dish.deletedAt !== null) return false;
      if (q.length === 0) return true;
      return (
        dish.name.toLowerCase().includes(q) ||
        dish.chef.displayName.toLowerCase().includes(q) ||
        (dish.description?.toLowerCase().includes(q) ?? false) ||
        dish.tags.some((t) => t.toLowerCase().includes(q))
      );
    });

    // 2. cuisine / category
    if (!isAll) {
      result = result.filter((dish) =>
        (chip.categories as string[]).includes(dish.category)
      );
    }

    // 3. minimum rating
    if (minRating > 0) {
      result = result.filter((dish) => dish.averageRating >= minRating);
    }

    // 4. sort — always spread before sorting to never mutate
    switch (sortKey) {
      case "rating":     return [...result].sort((a, b) => b.averageRating - a.averageRating);
      case "price_asc":  return [...result].sort((a, b) => a.price - b.price);
      case "price_desc": return [...result].sort((a, b) => b.price - a.price);
      default:           return result;
    }
  }, [query, chipIndex, minRating, sortKey]);

  // ── Reset everything ─────────────────────────────────────────────────────
  const resetAll = () => {
    setQuery("");
    setChipIndex(0);
    setMinRating(0);
    setSortKey("default");
    setShowRating(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col relative shadow-[0_0_80px_rgba(0,0,0,0.07)]">
        <main className="flex-1 overflow-y-auto pb-[78px]">

          {/* ── Header ───────────────────────────────────────────────────── */}
          <header className="flex items-center gap-3 px-4 pt-5 pb-3">
            <Link
              href="/"
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={17} className="text-gray-700" />
            </Link>
            <h1 className="text-[17px] font-bold text-gray-900 flex-1">
              All Dishes
            </h1>
            <span className="text-[12px] font-semibold text-gray-400">
              {filtered.length} found
            </span>
          </header>

          {/* ── Search + rating toggle ────────────────────────────────────── */}
          <div className="flex items-center gap-2.5 px-4 mb-4">
            <SearchBar value={query} onChange={setQuery} />

            {/* Rating filter toggle — only secondary/power filters hide here */}
            <button
              onClick={() => setShowRating((prev) => !prev)}
              className={`relative w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-150 active:scale-95 ${
                showRating || activeSecondaryCount > 0
                  ? "bg-emerald-500 shadow-[0_4px_14px_rgba(16,185,129,0.38)]"
                  : "bg-gray-100"
              }`}
              aria-label="Rating filter"
            >
              <Star
                size={16}
                className={showRating || activeSecondaryCount > 0 ? "text-white" : "text-gray-500"}
                fill={showRating || activeSecondaryCount > 0 ? "currentColor" : "none"}
              />
              {activeSecondaryCount > 0 && (
                <span className="absolute -top-1 -right-1 w-[14px] h-[14px] bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-[8px] font-black text-white leading-none">
                    {activeSecondaryCount}
                  </span>
                </span>
              )}
            </button>
          </div>

          {/* ── Rating filter panel (secondary / power-user) ──────────────── */}
          {showRating && (
            <div className="mx-4 mb-4 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  Min. rating
                </p>
                {minRating > 0 && (
                  <button
                    onClick={() => setMinRating(0)}
                    className="text-[10px] font-semibold text-emerald-500 active:opacity-70"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                {RATING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMinRating(opt.value)}
                    className={chipClass(minRating === opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Cuisine discovery chips ───────────────────────────────────── */}
          <div className="flex gap-2 overflow-x-auto pl-4 pr-4 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {CUISINE_CHIPS.map((chip, i) => {
              const active = chipIndex === i;
              return (
                <button
                  key={chip.label}
                  onClick={() => setChipIndex(i)}
                  className={`flex-shrink-0 flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-full transition-all duration-200 active:scale-95 ${
                    active
                      ? "bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.32)]"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <span className="text-[13px] leading-none">{chip.emoji}</span>
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* ── Sort chips — always visible, browsing-level control ───────── */}
          <div className="flex gap-2 overflow-x-auto pl-4 pr-4 pt-2.5 pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortKey(opt.value)}
                className={chipClass(sortKey === opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* ── Result list ───────────────────────────────────────────────── */}
          {filtered.length > 0 ? (
            <div className="px-4 flex flex-col gap-3 pt-1">
              {filtered.map((dish) => (
                <DishCard key={dish.id} dish={dish} variant="horizontal" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
              <p className="text-4xl mb-4">🍽️</p>
              <h3 className="text-[15px] font-bold text-gray-800 mb-1.5">
                No dishes found
              </h3>
              <p className="text-[13px] text-gray-400 leading-relaxed">
                Try a different search, cuisine, or loosen your filters.
              </p>
              <button
                onClick={resetAll}
                className="mt-5 bg-emerald-500 text-white text-[12px] font-bold px-6 py-2.5 rounded-full shadow-[0_4px_12px_rgba(16,185,129,0.35)] active:scale-95 transition-transform"
              >
                Clear filters
              </button>
            </div>
          )}

          <div className="h-4" />
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
