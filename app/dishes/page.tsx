"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import DishCard from "@/components/dish-card";
import BottomNav from "@/components/bottom-nav";
import { mockDishes, MockDish } from "@/lib/mock-data";
import { DishCategory } from "@prisma/client";

const CATEGORY_FILTERS: { label: string; value: DishCategory | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Main", value: "MAIN_COURSE" },
  { label: "Rice", value: "RICE_AND_GRAINS" },
  { label: "Meat", value: "MEAT" },
  { label: "Seafood", value: "SEAFOOD" },
  { label: "Salad", value: "SALAD" },
  { label: "Dessert", value: "DESSERT" },
  { label: "Breakfast", value: "BREAKFAST" },
  { label: "Soup", value: "SOUP" },
];

export default function DishesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<DishCategory | "ALL">("ALL");

  const filtered: MockDish[] = useMemo(() => {
    const q = query.toLowerCase();
    return mockDishes.filter((dish) => {
      const matchesQuery =
        q.length === 0 ||
        dish.name.toLowerCase().includes(q) ||
        dish.chef.displayName.toLowerCase().includes(q) ||
        (dish.description?.toLowerCase().includes(q) ?? false);
      const matchesCategory = category === "ALL" || dish.category === category;
      return matchesQuery && matchesCategory && dish.deletedAt === null;
    });
  }, [query, category]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col relative shadow-[0_0_80px_rgba(0,0,0,0.07)]">
        <main className="flex-1 overflow-y-auto pb-[78px]">

          <header className="flex items-center gap-3 px-4 pt-5 pb-3">
            <Link href="/" className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors flex-shrink-0">
              <ArrowLeft size={17} className="text-gray-700" />
            </Link>
            <h1 className="text-[17px] font-bold text-gray-900 flex-1">All Dishes</h1>
            <span className="text-[12px] font-semibold text-gray-400">{filtered.length} found</span>
          </header>

          <div className="flex items-center gap-2.5 px-4 mb-3">
            <div className="flex-1 flex items-center gap-2.5 bg-gray-100 rounded-2xl px-4 h-11 focus-within:ring-2 focus-within:ring-emerald-300 transition-all">
              <Search size={15} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search dishes or chefs..."
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none font-medium"
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pl-4 pr-4 pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`flex-shrink-0 text-[11px] font-bold px-4 py-2 rounded-full transition-all duration-200 active:scale-95 ${
                  category === cat.value
                    ? "bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.35)]"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {filtered.length > 0 ? (
            <div className="px-4 flex flex-col gap-3 pt-1">
              {filtered.map((dish) => <DishCard key={dish.id} dish={dish} variant="horizontal" />)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
              <p className="text-4xl mb-4">🍽️</p>
              <h3 className="text-[15px] font-bold text-gray-800 mb-1.5">No dishes found</h3>
              <p className="text-[13px] text-gray-400 leading-relaxed">Try a different search term or select another category.</p>
              <button
                onClick={() => { setQuery(""); setCategory("ALL"); }}
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