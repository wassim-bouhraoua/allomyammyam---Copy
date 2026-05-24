"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import { DishCategory } from "@prisma/client";

import DishCard from "@/components/dish-card";
import BottomNav from "@/components/bottom-nav";
import SearchBar from "@/components/search-bar";
import { mockDishes, MockDish } from "@/lib/mock-data";

// ─────────────────────────────────────────────────────────────────────────────
// CUISINE CHIPS — "Where does this food come from?"
//
// Filter by dish.category (Prisma enum). Each chip maps to one or more
// DishCategory values that users mentally associate with that cuisine.
//
// Separation rationale:
//   "Moroccan" and "Indian" are kept separate even though both are technically
//   "world cuisine" — users hold a clear mental model of each.
//   "Japanese" is its own chip because sushi/ramen is a distinct craving.
//   "Mediterranean" covers Italian-style pasta and lighter European dishes.
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// VIBE CHIPS — "What mood / moment am I in?"
//
// These cross cuisine boundaries intentionally — "Grilled" applies to
// Moroccan kofta AND Japanese teriyaki AND seafood.
// Filtering by tag is the only semantically correct approach here.
//
// "Vibe" chips AND with the cuisine chip — selecting "Moroccan" + "Grilled"
// returns dishes that are both moroccan-tagged AND grilled-tagged.
// ─────────────────────────────────────────────────────────────────────────────
type VibeChip =
  | { label: string; emoji: string; kind: "all" }
  | { label: string; emoji: string; kind: "tag"; tag: string }
  | { label: string; emoji: string; kind: "category"; categories: DishCategory[] };

const VIBE_CHIPS: VibeChip[] = [
  { label: "All",       emoji: "✨",  kind: "all" },

  { label: "Breakfast", emoji: "🍳", kind: "category", categories: ["BREAKFAST", "BRUNCH"] },

  { label: "Dessert",   emoji: "🍰", kind: "category", categories: ["DESSERT", "PASTRY", "CAKE", "ICE_CREAM"] },

  { label: "Grilled",   emoji: "🔥", kind: "tag", tag: "grilled" },

  { label: "Spicy",     emoji: "🌶️", kind: "tag", tag: "spicy" },

  { label: "Vegan",     emoji: "🌱", kind: "tag", tag: "vegan" },

  { label: "Light",     emoji: "🥗", kind: "tag", tag: "light" },

  { label: "Meat",      emoji: "🥩", kind: "tag", tag: "meat" },
];

// ─────────────────────────────────────────────────────────────────────────────
// SORT + RATING — behind the refine toggle (power-user controls)
// Sort is a refinement step, not a discovery step. Keeping it hidden by
// default removes visual clutter and lets the chip rows breathe.
// ─────────────────────────────────────────────────────────────────────────────
type SortKey = "default" | "rating" | "price_asc" | "price_desc";

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "Recommended", value: "default" },
  { label: "Top rated ⭐", value: "rating" },
  { label: "Cheapest first", value: "price_asc" },
  { label: "Priciest first", value: "price_desc" },
];

const RATING_OPTIONS: { label: string; value: number }[] = [
  { label: "Any", value: 0 },
  { label: "4.5+", value: 4.5 },
  { label: "4.7+", value: 4.7 },
  { label: "4.9+", value: 4.9 },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH MATCHING — priority-gated, no description
//
// Fields checked in order:
//   1. dish name     — substring ok (user is typing a dish they know)
//   2. chef name     — lets users search "Chef Priya", "Yuki", etc.
//   3. tags          — word-start match only (prevents "chick"→"chickpeas")
//
// Description is excluded: it's invisible on cards, causes false positives,
// and searching unseen text breaks the "I found what I expected" contract.
// ─────────────────────────────────────────────────────────────────────────────
function matchesSearch(dish: MockDish, q: string): boolean {
  if (q.length === 0) return true;
  if (dish.name.toLowerCase().includes(q)) return true;
  if (dish.chef.displayName.toLowerCase().includes(q)) return true;
  // Word-start tag matching: "grille" → "grilled" ✅, "chick" → "chickpeas" ❌
  return dish.tags.some((tag) => {
    const t = tag.toLowerCase();
    if (!t.startsWith(q)) return false;
    // Accept full match OR boundary right after q (non-letter = hyphen, end, etc.)
    return t.length === q.length || !/[a-z]/.test(t[q.length]);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Chip filter helper — reused for both cuisine and vibe chip types
// ─────────────────────────────────────────────────────────────────────────────
function matchesChip(dish: MockDish, chip: CuisineChip | VibeChip): boolean {
  if (chip.kind === "all") return true;
  if (chip.kind === "tag") return dish.tags.includes(chip.tag);
  if (chip.kind === "category") return chip.categories.includes(dish.category);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared chip class helper
// ─────────────────────────────────────────────────────────────────────────────
function chipCls(active: boolean): string {
  return `flex-shrink-0 text-[12px] font-semibold px-3.5 py-2 rounded-full transition-all duration-200 active:scale-95 whitespace-nowrap ${
    active
      ? "bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.30)]"
      : "bg-gray-100 text-gray-600"
  }`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function DishesPage() {
  const [query,        setQuery]        = useState("");
  const [cuisineIndex, setCuisineIndex] = useState(0);
  const [vibeIndex,    setVibeIndex]    = useState(0);
  const [minRating,    setMinRating]    = useState<number>(0);
  const [sortKey,      setSortKey]      = useState<SortKey>("default");
  const [showRefine,   setShowRefine]   = useState(false);

  // Badge: how many non-default refinements are active
  const refineCount =
    (minRating > 0 ? 1 : 0) +
    (sortKey !== "default" ? 1 : 0);

  // ── Filtering pipeline ───────────────────────────────────────────────────
  // Order: search → cuisine chip → vibe chip → rating → sort
  // Cuisine AND vibe are independent dimensions — both must match.
  const filtered: MockDish[] = useMemo(() => {
    const q           = query.toLowerCase().trim();
    const cuisineChip = CUISINE_CHIPS[cuisineIndex];
    const vibeChip    = VIBE_CHIPS[vibeIndex];

    // 1. soft-delete guard + search
    let result = mockDishes.filter((dish) => {
      if (dish.deletedAt !== null) return false;
      return matchesSearch(dish, q);
    });

    // 2. cuisine filter
    result = result.filter((dish) => matchesChip(dish, cuisineChip));

    // 3. vibe filter (AND with cuisine — independent dimension)
    result = result.filter((dish) => matchesChip(dish, vibeChip));

    // 4. minimum rating
    if (minRating > 0) {
      result = result.filter((dish) => dish.averageRating >= minRating);
    }

    // 5. sort — always spread, never mutate source array
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
              Explore Dishes
            </h1>
            <span className="text-[12px] font-semibold text-gray-400">
              {filtered.length} found
            </span>
          </header>

          {/* ── Search + refine toggle ────────────────────────────────────── */}
          <div className="flex items-center gap-2.5 px-4 mb-4">
            <SearchBar value={query} onChange={setQuery} />

            {/* Refine button — sort + rating live here, not in the main flow */}
            <button
              onClick={() => setShowRefine((p) => !p)}
              className={`relative w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-150 active:scale-95 ${
                showRefine || refineCount > 0
                  ? "bg-emerald-500 shadow-[0_4px_14px_rgba(16,185,129,0.38)]"
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

          {/* ── Refine panel — sort + rating (collapsible) ───────────────── */}
          {showRefine && (
            <div className="mx-4 mb-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">

              {/* Sort */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Sort by
                </p>
                <div className="flex flex-wrap gap-2">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSortKey(opt.value)}
                      className={chipCls(sortKey === opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Min. rating
                </p>
                <div className="flex gap-2">
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

              {/* Reset link */}
              {refineCount > 0 && (
                <button
                  onClick={() => { setMinRating(0); setSortKey("default"); }}
                  className="text-[11px] font-semibold text-red-400 active:opacity-70"
                >
                  Reset refinements
                </button>
              )}
            </div>
          )}

          {/* ── Cuisine chips — "Where is it from?" ──────────────────────── */}
          <div className="px-4 mb-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Cuisine
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto pl-4 pr-4 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {CUISINE_CHIPS.map((chip, i) => (
              <button
                key={chip.label}
                onClick={() => setCuisineIndex(i)}
                className={`flex-shrink-0 flex items-center gap-1.5 ${chipCls(cuisineIndex === i)}`}
              >
                <span className="text-[14px] leading-none">{chip.emoji}</span>
                {chip.label}
              </button>
            ))}
          </div>

          {/* ── Vibe chips — "What am I in the mood for?" ────────────────── */}
          <div className="px-4 mb-1 mt-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Vibe
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto pl-4 pr-4 pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {VIBE_CHIPS.map((chip, i) => (
              <button
                key={chip.label}
                onClick={() => setVibeIndex(i)}
                className={`flex-shrink-0 flex items-center gap-1.5 ${chipCls(vibeIndex === i)}`}
              >
                <span className="text-[14px] leading-none">{chip.emoji}</span>
                {chip.label}
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
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
              <p className="text-5xl mb-4">🍽️</p>
              <h3 className="text-[15px] font-bold text-gray-800 mb-1.5">
                Nothing matches
              </h3>
              <p className="text-[13px] text-gray-400 leading-relaxed">
                Try a different cuisine, vibe, or clear your search.
              </p>
              <button
                onClick={resetAll}
                className="mt-5 bg-emerald-500 text-white text-[12px] font-bold px-6 py-2.5 rounded-full shadow-[0_4px_12px_rgba(16,185,129,0.35)] active:scale-95 transition-transform"
              >
                Clear all filters
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
