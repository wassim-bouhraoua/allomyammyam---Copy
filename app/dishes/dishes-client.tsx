"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, SlidersHorizontal, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { DishCategory } from "@prisma/client";

import DishCard from "@/components/dish-card";
import BottomNav from "@/components/bottom-nav";
import SearchBar from "@/components/search-bar";
import { CUISINE_CHIPS_DEFS, VIBE_CHIPS_DEFS } from "@/lib/dish-tags";

export interface ExploreDish {
  id: string;
  name: string;
  price: number;
  category: DishCategory;
  imageUrl: string | null;
  averageRating: number;
  preparationTime: number;
  tags: string[];
  isAvailable: boolean;
  deletedAt: Date | null;
  chef: {
    displayName: string;
    city: string | null;
    avatarUrl: string | null;
    isAvailable: boolean;
  };
}

type CuisineChip =
  | { label: string; emoji: string; kind: "all" }
  | { label: string; emoji: string; kind: "category"; categories: DishCategory[] }
  | { label: string; emoji: string; kind: "tag"; tag: string };

const CUISINE_CHIPS = CUISINE_CHIPS_DEFS as CuisineChip[];

type VibeChip =
  | { label: string; emoji: string; kind: "all" }
  | { label: string; emoji: string; kind: "tag"; tag: string }
  | { label: string; emoji: string; kind: "category"; categories: DishCategory[] };

const VIBE_CHIPS = VIBE_CHIPS_DEFS as VibeChip[];

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

function matchesSearch(dish: ExploreDish, q: string): boolean {
  if (q.length === 0) return true;
  if (dish.name.toLowerCase().includes(q)) return true;
  if (dish.chef.displayName.toLowerCase().includes(q)) return true;
  return dish.tags.some((tag) => {
    const t = tag.toLowerCase();
    if (!t.startsWith(q)) return false;
    return t.length === q.length || !/[a-z]/.test(t[q.length]);
  });
}

function matchesChip(dish: ExploreDish, chip: CuisineChip | VibeChip): boolean {
  if (chip.kind === "all") return true;
  if (chip.kind === "tag") return dish.tags.includes(chip.tag);
  if (chip.kind === "category") {
    const categoryMatches = chip.categories.includes(dish.category);
    const tagMatches = dish.tags.some((t) => t.toLowerCase() === chip.label.toLowerCase());
    return categoryMatches || tagMatches;
  }
  return true;
}

function chipCls(active: boolean): string {
  return `flex-shrink-0 text-[12px] font-semibold px-3.5 py-2 rounded-full transition-all duration-200 active:scale-95 whitespace-nowrap ${
    active
      ? "bg-orange-500 text-white shadow-[0_4px_12px_rgba(255,138,0,0.30)]"
      : "bg-secondary text-foreground"
  }`;
}

export default function DishesClient({ initialDishes }: { initialDishes: ExploreDish[] }) {
  const [query,        setQuery]        = useState("");
  const [cuisineIndex, setCuisineIndex] = useState(0);
  const [vibeIndex,    setVibeIndex]    = useState(0);
  const [minRating,    setMinRating]    = useState<number>(0);
  const [sortKey,      setSortKey]      = useState<SortKey>("default");
  const [showRefine,   setShowRefine]   = useState(false);

  const { cartCount } = useCart();

  const refineCount =
    (minRating > 0 ? 1 : 0) +
    (sortKey !== "default" ? 1 : 0);

  const filtered: ExploreDish[] = useMemo(() => {
    const q           = query.toLowerCase().trim();
    const cuisineChip = CUISINE_CHIPS[cuisineIndex];
    const vibeChip    = VIBE_CHIPS[vibeIndex];

    let result = initialDishes.filter((dish) => {
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
  }, [initialDishes, query, cuisineIndex, vibeIndex, minRating, sortKey]);

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-6xl mx-auto min-h-screen flex gap-8 px-0 lg:px-8 lg:py-8">

        {/* ── Desktop left sidebar ─────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 gap-5 sticky top-8 self-start">

          {/* Back + title */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-9 h-9 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <ArrowLeft size={16} className="text-foreground" />
            </Link>
            <span className="text-[16px] font-black text-foreground">Explore Dishes</span>
          </div>

          {/* Cuisine filter */}
          <div className="bg-card rounded-3xl border border-border shadow-sm p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
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
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <span className="text-[16px] leading-none">{chip.emoji}</span>
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vibe filter */}
          <div className="bg-card rounded-3xl border border-border shadow-sm p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
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
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <span className="text-[16px] leading-none">{chip.emoji}</span>
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort + rating */}
          <div className="bg-card rounded-3xl border border-border shadow-sm p-4 space-y-4">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">
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
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">
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

          {/* ── Mobile shell ──────────────────────── */}
          <div className="lg:hidden bg-background min-h-screen flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.07)]">
            <main className="flex-1 overflow-y-auto pb-[78px]">

              <header className="flex items-center gap-3 px-4 pt-5 pb-3">
                <Link
                  href="/"
                  className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center active:bg-secondary/80 transition-colors flex-shrink-0"
                >
                  <ArrowLeft size={17} className="text-foreground" />
                </Link>
                <h1 className="text-[17px] font-bold text-foreground flex-1">Explore Dishes</h1>
                <span className="text-[12px] font-semibold text-muted-foreground">
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
                      : "bg-secondary"
                  }`}
                  aria-label="Refine results"
                >
                  <SlidersHorizontal
                    size={16}
                    className={showRefine || refineCount > 0 ? "text-white" : "text-muted-foreground"}
                  />
                  {refineCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-[14px] h-[14px] bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-[8px] font-black text-white leading-none">{refineCount}</span>
                    </span>
                  )}
                </button>

                <Link
                  href="/cart"
                  className="w-11 h-11 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform relative text-muted-foreground"
                  aria-label="View Cart"
                >
                  <ShoppingBag size={18} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white font-extrabold text-[8px] min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-900 animate-in zoom-in duration-200">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>

              {showRefine && (
                <div className="mx-4 mb-4 p-4 bg-secondary rounded-2xl border border-border space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Sort by</p>
                    <div className="flex flex-wrap gap-2">
                      {SORT_OPTIONS.map((opt) => (
                        <button key={opt.value} onClick={() => setSortKey(opt.value)} className={chipCls(sortKey === opt.value)}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Min. rating</p>
                    <div className="flex flex-wrap gap-2">
                      {RATING_OPTIONS.map((opt) => (
                        <button key={opt.value} onClick={() => setMinRating(opt.value)} className={chipCls(minRating === opt.value)}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {refineCount > 0 && (
                    <button
                      onClick={() => { setMinRating(0); setSortKey("default"); }}
                      className="text-[11px] font-bold text-red-500 active:text-red-650"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              )}

              {/* Horizontal filter chips lists */}
              <div className="flex flex-col gap-2.5 mb-4">
                {/* Cuisine */}
                <div className="flex items-center gap-2 overflow-x-auto px-4 scrollbar-none">
                  {CUISINE_CHIPS.map((chip, i) => (
                    <button key={chip.label} onClick={() => setCuisineIndex(i)} className={chipCls(cuisineIndex === i)}>
                      <span>{chip.emoji}</span> <span className="ml-1">{chip.label}</span>
                    </button>
                  ))}
                </div>
                {/* Vibe */}
                <div className="flex items-center gap-2 overflow-x-auto px-4 scrollbar-none">
                  {VIBE_CHIPS.map((chip, i) => (
                    <button key={chip.label} onClick={() => setVibeIndex(i)} className={chipCls(vibeIndex === i)}>
                      <span>{chip.emoji}</span> <span className="ml-1">{chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid or Empty */}
              <div className="px-4">
                {filtered.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {filtered.map((dish) => (
                      <DishCard key={dish.id} dish={dish} variant="horizontal" />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <span className="text-4xl">🍽️</span>
                    <p className="text-[14px] font-extrabold text-foreground mt-3">No dishes found</p>
                    <p className="text-[12px] text-muted-foreground mt-1 max-w-[220px]">
                      Try adjusting your search query or filters.
                    </p>
                  </div>
                )}
              </div>

            </main>
            <BottomNav />
          </div>

          {/* ── Desktop view ────────────────────────────────────────────── */}
          <div className="hidden lg:block">
            {/* Header + Search bar */}
            <div className="flex items-center justify-between mb-6 gap-4">
              <div className="flex-1 flex items-center gap-3">
                <SearchBar value={query} onChange={setQuery} />
                <Link
                  href="/cart"
                  className="w-12 h-12 rounded-2xl border border-border flex items-center justify-center hover:bg-secondary relative text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  aria-label="View Cart"
                >
                  <ShoppingBag size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white font-extrabold text-[9px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-900 animate-in zoom-in duration-200">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>
              <span className="text-[13px] font-extrabold text-muted-foreground uppercase tracking-widest flex-shrink-0">
                {filtered.length} dishes found
              </span>
            </div>

            {/* List or Empty */}
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((dish) => (
                  <DishCard key={dish.id} dish={dish} variant="grid" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 bg-card border border-border rounded-3xl shadow-sm text-center">
                <span className="text-5xl">🍽️</span>
                <p className="text-[16px] font-black text-foreground mt-4">No dishes match filters</p>
                <p className="text-[13px] text-muted-foreground mt-1 max-w-sm">
                  We couldn't find any dishes matching those parameters. Try clearing some filters or searching for something else.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
