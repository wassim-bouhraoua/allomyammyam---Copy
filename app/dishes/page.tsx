"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import { DishCategory } from "@prisma/client";

import DishCard from "@/components/dish-card";
import BottomNav from "@/components/bottom-nav";
import SearchBar from "@/components/search-bar";
import { mockDishes, MockDish } from "@/lib/mock-data";

type CuisineChip =
  | { label: string; emoji: string; kind: "all" }
  | { label: string; emoji: string; kind: "category"; categories: DishCategory[] }
  | { label: string; emoji: string; kind: "tag"; tag: string };

const CUISINE_CHIPS: CuisineChip[] = [
  { label: "All",      emoji: "🍽️", kind: "all" },
  { label: "Moroccan", emoji: "🫕",  kind: "tag",      tag: "moroccan" },
  { label: "Indian",   emoji: "🍛",  kind: "tag",      tag: "indian" },
  { label: "Japanese", emoji: "🍣",  kind: "tag",      tag: "japanese" },
  { label: "Seafood",  emoji: "🦞",  kind: "category", categories: ["SEAFOOD"] },
];

type VibeChip =
  | { label: string; emoji: string; kind: "all" }
  | { label: string; emoji: string; kind: "tag"; tag: string }
  | { label: string; emoji: string; kind: "category"; categories: DishCategory[] };

const VIBE_CHIPS: VibeChip[] = [
  { label: "All",       emoji: "✨",  kind: "all" },
  { label: "Breakfast", emoji: "🍳",  kind: "category", categories: ["BREAKFAST", "BRUNCH"] },
  { label: "Dessert",   emoji: "🍰",  kind: "category", categories: ["DESSERT", "PASTRY", "CAKE", "ICE_CREAM"] },
  { label: "Grilled",   emoji: "🔥",  kind: "tag", tag: "grilled" },
  { label: "Spicy",     emoji: "🌶️", kind: "tag", tag: "spicy" },
  { label: "Vegan",     emoji: "🌱",  kind: "tag", tag: "vegan" },
  { label: "Light",     emoji: "🥗",  kind: "tag", tag: "light" },
  { label: "Meat",      emoji: "🥩",  kind: "tag", tag: "meat" },
];

type SortKey = "default" | "rating" | "price_asc" | "price_desc";

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "Recommended",   value: "default" },
  { label: "Top rated ⭐",  value: "rating" },
  { label: "Cheapest first", value: "price_asc" },
  { label: "Priciest first", value: "price_desc" },
];

const RATING_OPTIONS: { label: string; value: number }[] = [
  { label: "Any",  value: 0 },
  { label: "4.5+", value: 4.5 },
  { label: "4.7+", value: 4.7 },
  { label: "4.9+", value: 4.9 },
];

function matchesSearch(dish: MockDish, q: string): boolean {
  if (q.length === 0) return true;
  if (dish.name.toLowerCase().includes(q)) return true;
  if (dish.chef.displayName.toLowerCase().includes(q)) return true;
  return dish.tags.some((tag) => {
    const t = tag.toLowerCase();
    if (!t.startsWith(q)) return false;
    return t.length === q.length || !/[a-z]/.test(t[q.length]);
  });
}

function matchesChip(dish: MockDish, chip: CuisineChip | VibeChip): boolean {
  if (chip.kind === "all") return true;
  if (chip.kind === "tag") return dish.tags.includes(chip.tag);
  if (chip.kind === "category") return chip.categories.includes(dish.category);
  return true;
}

function chipCls(active: boolean): string {
  return `flex-shrink-0 text-[12px] font-semibold px-3.5 py-2 rounded-full transition-all duration-200 active:scale-95 whitespace-nowrap ${
    active
      ? "bg-orange-500 text-white shadow-[0_4px_12px_rgba(255,138,0,0.30)]"
      : "bg-orange-50 text-gray-700"
  }`;
}

export default function DishesPage() {
  const [query,        setQuery]        = useState("");
  const [cuisineIndex, setCuisineIndex] = useState(0);
  const [vibeIndex,    setVibeIndex]    = useState(0);
  const [minRating,    setMinRating]    = useState<number>(0);
  const [sortKey,      setSortKey]      = useState<SortKey>("default");
  const [showRefine,   setShowRefine]   = useState(false);

  const refineCount =
    (minRating > 0 ? 1 : 0) +
    (sortKey !== "default" ? 1 : 0);

  const filtered: MockDish[] = useMemo(() => {
    const q           = query.toLowerCase().trim();
    const cuisineChip = CUISINE_CHIPS[cuisineIndex];
    const vibeChip    = VIBE_CHIPS[vibeIndex];

    let result = mockDishes.filter((dish) => {
      if (dish.deletedAt !== null) return false;
      return matchesSearch(dish, q);
    });

    result = result.filter((dish) => matchesChip(dish, cuisineChip));
    result = result.filter((dish) => matchesChip(dish, vibeChip));

    if (minRating > 0) {
      result = result.filter((dish) => dish.averageRating >= minRating);
    }

    switch (sortKey) {
      case "rating":     return [...result].sort((a, b) => b.averageRating - a.averageRating);
      case "price_asc":  return [...result].sort((a, b) => a.price - b.price);
      case "price_desc": return [...result].sort((a, b) => b.price - a.price);
      default:           return result;
    }
  }, [query, cuisineIndex, vibeIndex, minRating, sortKey]);

  const resetAll = () => {
    setQuery("");
    setCuisineIndex(0);
    setVibeIndex(0);
    setMinRating(0);
    setSortKey("default");
    setShowRefine(false);
  };

  return (
    <div className="bg-[#FFF9F5] min-h-screen">
      <div className="max-w-6xl mx-auto min-h-screen flex gap-8 px-0 lg:px-8 lg:py-8">

        {/* ── Desktop left sidebar ─────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 gap-5 sticky top-8 self-start">

          {/* Back + title */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-9 h-9 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={16} className="text-gray-600" />
            </Link>
            <span className="text-[16px] font-black text-gray-900">Explore Dishes</span>
          </div>

          {/* Cuisine filter */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Cuisine
            </p>
            <div className="flex flex-col gap-1.5">
              {CUISINE_CHIPS.map((chip, i) => (
                <button
                  key={chip.label}
                  onClick={() => setCuisineIndex(i)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[13px] font-semibold transition-all duration-150 text-left ${
                    cuisineIndex === i
                      ? "bg-orange-500 text-white shadow-[0_2px_10px_rgba(255,138,0,0.30)]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-[16px] leading-none">{chip.emoji}</span>
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vibe filter */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Vibe
            </p>
            <div className="flex flex-col gap-1.5">
              {VIBE_CHIPS.map((chip, i) => (
                <button
                  key={chip.label}
                  onClick={() => setVibeIndex(i)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[13px] font-semibold transition-all duration-150 text-left ${
                    vibeIndex === i
                      ? "bg-orange-500 text-white shadow-[0_2px_10px_rgba(255,138,0,0.30)]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-[16px] leading-none">{chip.emoji}</span>
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort + rating */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 space-y-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                Sort by
              </p>
              <div className="flex flex-col gap-1.5">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortKey(opt.value)}
                    className={`px-3 py-2 rounded-2xl text-[13px] font-semibold transition-all text-left ${
                      sortKey === opt.value
                        ? "bg-orange-500 text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                Min. rating
              </p>
              <div className="flex flex-wrap gap-2">
                {RATING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMinRating(opt.value)}
                    className={chipCls(minRating === opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {refineCount > 0 && (
              <button
                onClick={() => { setMinRating(0); setSortKey("default"); }}
                className="text-[11px] font-semibold text-red-400 hover:text-red-500"
              >
                Reset refinements
              </button>
            )}
          </div>

        </aside>

        {/* ── Main column ──────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* ── Mobile shell — completely unchanged ──────────────────────── */}
          <div className="lg:hidden bg-white min-h-screen flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.07)]">
            <main className="flex-1 overflow-y-auto pb-[78px]">

              <header className="flex items-center gap-3 px-4 pt-5 pb-3">
                <Link
                  href="/"
                  className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors flex-shrink-0"
                >
                  <ArrowLeft size={17} className="text-gray-700" />
                </Link>
                <h1 className="text-[17px] font-bold text-gray-900 flex-1">Explore Dishes</h1>
                <span className="text-[12px] font-semibold text-gray-500">
                  {filtered.length} found
                </span>
              </header>

              <div className="flex items-center gap-2.5 px-4 mb-4">
                <SearchBar value={query} onChange={setQuery} />
                <button
                  onClick={() => setShowRefine((p) => !p)}
                  className={`relative w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-150 active:scale-95 ${
                    showRefine || refineCount > 0
                      ? "bg-orange-500 shadow-[0_4px_14px_rgba(255,138,0,0.38)]"
                      : "bg-gray-100"
                  }`}
                  aria-label="Refine results"
                >
                  <SlidersHorizontal
                    size={16}
                    className={showRefine || refineCount > 0 ? "text-white" : "text-gray-500"}
                  />
                  {refineCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-[14px] h-[14px] bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-[8px] font-black text-white leading-none">{refineCount}</span>
                    </span>
                  )}
                </button>
              </div>

              {showRefine && (
                <div className="mx-4 mb-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Sort by</p>
                    <div className="flex flex-wrap gap-2">
                      {SORT_OPTIONS.map((opt) => (
                        <button key={opt.value} onClick={() => setSortKey(opt.value)} className={chipCls(sortKey === opt.value)}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Min. rating</p>
                    <div className="flex gap-2">
                      {RATING_OPTIONS.map((opt) => (
                        <button key={opt.value} onClick={() => setMinRating(opt.value)} className={chipCls(minRating === opt.value)}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {refineCount > 0 && (
                    <button onClick={() => { setMinRating(0); setSortKey("default"); }} className="text-[11px] font-semibold text-red-400">
                      Reset refinements
                    </button>
                  )}
                </div>
              )}

              <div className="px-4 mb-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Cuisine</p>
              </div>
              <div className="flex gap-2 overflow-x-auto pl-4 pr-4 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {CUISINE_CHIPS.map((chip, i) => (
                  <button key={chip.label} onClick={() => setCuisineIndex(i)} className={`flex items-center gap-1.5 ${chipCls(cuisineIndex === i)}`}>
                    <span className="text-[14px] leading-none">{chip.emoji}</span>
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="px-4 mb-1 mt-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Vibe</p>
              </div>
              <div className="flex gap-2 overflow-x-auto pl-4 pr-4 pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {VIBE_CHIPS.map((chip, i) => (
                  <button key={chip.label} onClick={() => setVibeIndex(i)} className={`flex items-center gap-1.5 ${chipCls(vibeIndex === i)}`}>
                    <span className="text-[14px] leading-none">{chip.emoji}</span>
                    {chip.label}
                  </button>
                ))}
              </div>

              <MobileResults filtered={filtered} resetAll={resetAll} />
              <div className="h-4" />
            </main>
            <BottomNav />
          </div>

          {/* ── Desktop content ───────────────────────────────────────────── */}
          <div className="hidden lg:flex flex-col gap-5">

            {/* Desktop top bar — search + result count */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <SearchBar value={query} onChange={setQuery} />
              </div>
              <span className="text-[13px] font-semibold text-gray-500 flex-shrink-0">
                {filtered.length} dishes found
              </span>
            </div>

            {/* Results grid */}
            {filtered.length > 0 ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((dish) => (
                  <DishCard key={dish.id} dish={dish} variant="horizontal" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <p className="text-5xl mb-4">🍽️</p>
                <h3 className="text-[16px] font-bold text-gray-800 mb-2">Nothing matches</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed mb-6">
                  Try a different cuisine, vibe, or clear your search.
                </p>
                <button
                  onClick={resetAll}
                  className="bg-orange-500 text-white text-[13px] font-bold px-6 py-2.5 rounded-full shadow-[0_4px_12px_rgba(255,138,0,0.35)] hover:bg-orange-600 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}

            <div className="h-8" />
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Mobile result list — extracted to keep JSX readable ─────────────────── */
function MobileResults({
  filtered,
  resetAll,
}: {
  filtered: MockDish[];
  resetAll: () => void;
}) {
  if (filtered.length > 0) {
    return (
      <div className="px-4 flex flex-col gap-3 pt-1">
        {filtered.map((dish) => (
          <DishCard key={dish.id} dish={dish} variant="horizontal" />
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <p className="text-5xl mb-4">🍽️</p>
      <h3 className="text-[15px] font-bold text-gray-800 mb-1.5">Nothing matches</h3>
      <p className="text-[13px] text-gray-500 leading-relaxed">
        Try a different cuisine, vibe, or clear your search.
      </p>
      <button
        onClick={resetAll}
        className="mt-5 bg-orange-500 text-white text-[12px] font-bold px-6 py-2.5 rounded-full shadow-[0_4px_12px_rgba(255,138,0,0.35)] active:scale-95 transition-transform"
      >
        Clear all filters
      </button>
    </div>
  );
}