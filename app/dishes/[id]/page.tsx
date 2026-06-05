// app/dishes/[id]/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Work item: "5 - Détail d'un plat"
// Scope    : hero · dish info · chef info · nutrition · reviews · CTA · related
//
// Changes vs previous version:
//  - ChefRow: already uses Link, kept as-is
//  - Nutrition section added between chef and CTA
//  - Related dishes: ranked by tag overlap score then category, not just category
//  - MockDish.nutrition field consumed from updated mock-data
//  - Minor: removed stray Leaf import (unused), fixed border-green-100 typo on badge
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Clock,
  CheckCircle2,
  ShoppingBag,
  Flame,
  MapPin,
  ChevronRight,
  Plus,
  Minus,
  AlertCircle,
  Zap,
  Beef,
  Wheat,
  Droplets,
  Candy,
  Cookie
} from "lucide-react";

import BottomNav from "@/components/bottom-nav";
import DishCard from "@/components/dish-card";
import { mockDishes, type MockChefProfile, type NutritionFacts } from "@/lib/mock-data";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Review {
  id: string;
  authorName: string;
  initial: string;
  rating: number;
  comment: string;
  date: string;
  verifiedOrder: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Static mock reviews
// Replace with: prisma.review.findMany({ where: { dishId }, orderBy: { createdAt: "desc" } })
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_REVIEWS: Review[] = [
  {
    id: "r1",
    authorName: "Yasmine B.",
    initial: "Y",
    rating: 5,
    comment: "Arrived hot and well packed. The taste was exactly like home cooking — generous portion too.",
    date: "2 days ago",
    verifiedOrder: true,
  },
  {
    id: "r2",
    authorName: "Mehdi A.",
    initial: "M",
    rating: 5,
    comment: "Very authentic taste. Packaging was clean and sealed. Will definitely order again.",
    date: "5 days ago",
    verifiedOrder: true,
  },
  {
    id: "r3",
    authorName: "Salma R.",
    initial: "S",
    rating: 4,
    comment: "Portion size was generous and the seasoning was spot on. Delivery was on time.",
    date: "1 week ago",
    verifiedOrder: true,
  },
  {
    id: "r4",
    authorName: "Kamal H.",
    initial: "K",
    rating: 4,
    comment: "Great for a home-style meal. The sauce had real depth — nothing like restaurant shortcuts.",
    date: "2 weeks ago",
    verifiedOrder: false,
  },
];

const REVIEWS_PREVIEW = 2;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Score a candidate dish by relevance to the current dish */
function relevanceScore(
  current: { category: string; tags: string[]; chefId: string },
  candidate: { category: string; tags: string[]; chefId: string }
): number {
  let score = 0;
  if (candidate.category === current.category) score += 10;
  // shared tags each add 2 points
  const tagOverlap = candidate.tags.filter((t) => current.tags.includes(t)).length;
  score += tagOverlap * 2;
  // same chef gets a small nudge (variety is more important)
  if (candidate.chefId === current.chefId) score += 1;
  return score;
}

function ratingDistribution(avg: number): Record<number, number> {
  if (avg >= 4.8) return { 5: 80, 4: 15, 3: 3, 2: 1, 1: 1 };
  if (avg >= 4.5) return { 5: 60, 4: 30, 3: 7, 2: 2, 1: 1 };
  if (avg >= 4.0) return { 5: 45, 4: 35, 3: 12, 2: 5, 1: 3 };
  return { 5: 30, 4: 35, 3: 20, 2: 10, 1: 5 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Inlined sub-components
// ─────────────────────────────────────────────────────────────────────────────

function FadeImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const fallback =
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80&auto=format&fit=crop";
  return (
    <>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-gray-200" />}
      <Image
        src={error ? fallback : src}
        alt={alt}
        fill
        sizes="(max-width: 448px) 100vw, 448px"
        priority
        unoptimized
        className={`object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        onError={() => { setError(true); setLoaded(true); }}
      />
    </>
  );
}

function Stars({ rating, size = 11 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}
        />
      ))}
    </div>
  );
}

function InfoPill({ icon, label, accent = false }: { icon: React.ReactNode; label: string; accent?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${accent ? "bg-orange-50 border border-orange-100" : "bg-gray-50 border border-gray-100"}`}>
      {icon}
      <span className={`text-[12px] font-bold ${accent ? "text-orange-600" : "text-gray-700"}`}>{label}</span>
    </div>
  );
}

function TagChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-orange-50 border border-orange-100 text-[11px] font-semibold text-orange-600 capitalize">
      {label}
    </span>
  );
}

function QuantityStepper({ value, onChange, max }: { value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label="Decrease quantity"
        className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center transition-transform duration-150 active:scale-90 disabled:opacity-40"
      >
        <Minus size={14} className="text-gray-600" />
      </button>
      <span className="text-[16px] font-extrabold text-gray-900 min-w-[20px] text-center tabular-nums">
        {value}
      </span>
      <button
        onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}
        disabled={max !== undefined && value >= max}
        aria-label="Increase quantity"
        className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center shadow-[0_2px_10px_rgba(255,138,0,0.35)] transition-transform duration-150 active:scale-90 disabled:opacity-40"
      >
        <Plus size={14} className="text-white" />
      </button>
    </div>
  );
}

function ChefRow({ chef }: { chef: MockChefProfile }) {
  return (
    <Link
      href={`/chefs/${chef.id}`}
      className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100 transition-transform duration-150 active:scale-[0.98] active:bg-gray-100"
    >
      <div className="relative w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 bg-orange-100 shadow-sm">
        {chef.avatarUrl ? (
          <Image src={chef.avatarUrl} alt={chef.displayName} fill sizes="48px" unoptimized className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-black text-orange-600">{chef.displayName[0]}</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-extrabold text-gray-900 truncate">{chef.displayName}</p>
        </div>
        {chef.bio && <p className="text-[11px] text-gray-500 truncate mt-0.5">{chef.bio}</p>}
        <div className="flex items-center gap-2.5 mt-1">
          <span className="flex items-center gap-0.5">
            <Star size={10} className="text-amber-400 fill-amber-400" />
            <span className="text-[11px] font-bold text-gray-700">{chef.averageRating.toFixed(1)}</span>
            <span className="text-[11px] text-gray-400">({chef.totalReviews})</span>
          </span>
          {chef.city && (
            <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
              <MapPin size={9} className="text-orange-400" />
              {chef.city}
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
    </Link>
  );
}

/** Nutrition Facts section */
function NutritionSection({ nutrition }: { nutrition: NutritionFacts }) {
  const facts = [
    {
      icon: <Zap size={14} className="text-orange-500" />,
      label: "Calories",
      value: nutrition.calories,
      unit: "kcal",
    },
    {
      icon: <Beef size={14} className="text-orange-500" />,
      label: "Protein",
      value: nutrition.protein,
      unit: "g",
    },
    {
      icon: <Wheat size={14} className="text-orange-500" />,
      label: "Carbs",
      value: nutrition.carbs,
      unit: "g",
    },
    {
  icon: <Flame size={14} className="text-orange-500" />,
  label: "Fat",
  value: nutrition.fat,
  unit: "g",
},
   {
  icon: <Candy size={14} className="text-orange-500" />,
  label: "Sugar",
  value: nutrition.sugar,
  unit: "g",
},
  ];

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-[12px] font-extrabold text-gray-600 uppercase tracking-wider">
          Nutrition Facts
        </h2>

        <p className="text-[9px] text-gray-400 mt-0.5">
          Per serving
        </p>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {facts.map((f) => (
          <div
            key={f.label}
            className="flex flex-col items-center rounded-2xl border border-gray-100 bg-gray-50 px-2 py-3"
          >
            {/* Icon */}
            <div className="w-7 h-7 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center mb-2">
              {f.icon}
            </div>

            {/* Value + Unit */}
            <div className="text-center leading-none">
              <span className="text-[18px] font-black text-gray-900">
                {f.value}
              </span>

              <span className="text-[10px] font-bold text-gray-400 ml-1">
                {f.unit}
              </span>
            </div>

            {/* Label */}
            <span className="text-[10px] text-gray-500 mt-2">
              {f.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3.5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
          <span className="text-[12px] font-black text-orange-600">{review.initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-bold text-gray-900 truncate">{review.authorName}</span>
            <span className="text-[10px] text-gray-400 flex-shrink-0">{review.date}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Stars rating={review.rating} size={10} />
          </div>
          <p className="text-[12px] text-gray-600 leading-relaxed mt-1.5">{review.comment}</p>
        </div>
      </div>
    </div>
  );
}

function RatingBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold text-gray-500 w-3 text-right">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function DishDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const dish = mockDishes.find((d) => d.id === id);
  if (!dish) notFound();

  // ── Related dishes: ranked by tag overlap + category match ────────────────
  const related = mockDishes
    .filter((d) => d.id !== dish.id)
    .map((d) => ({
      dish: d,
      score: relevanceScore(
        { category: dish.category, tags: dish.tags, chefId: dish.chefId },
        { category: d.category, tags: d.tags, chefId: d.chefId }
      ),
    }))
    .filter(({ score }) => score > 0)          // at least 1 thing in common
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ dish }) => dish);
    
// ── Local state ───────────────────────────────────────────────────────────
const [qty, setQty] = useState(1);
const [added, setAdded] = useState(false);
const [showAllReviews, setShowAllReviews] = useState(false);

// ── Auth ──────────────────────────────────────────────────────────────────
const { user } = useAuth();
const router = useRouter();

const totalPrice = (dish.price * qty).toLocaleString("fr-MA");
const stockMax = dish.stockCount ?? undefined;

  function handleAddToCart() {
  if (!user) {
    router.push("/login?from=" + encodeURIComponent(window.location.pathname));
    return;
  }

  setAdded(true);
  setTimeout(() => setAdded(false), 2200);

  // TODO: dispatch to cart context / store
}

  const isSpicy = dish.tags.some((t) => ["spicy", "harissa"].includes(t.toLowerCase()));

  const availabilityLabel =
    !dish.isAvailable
      ? null
      : dish.stockCount !== null && dish.stockCount <= 3
      ? `Only ${dish.stockCount} portions left`
      : dish.stockCount !== null
      ? `${dish.stockCount} portions available`
      : "Available today";

  const dist = ratingDistribution(dish.averageRating);
  const visibleReviews = showAllReviews ? MOCK_REVIEWS : MOCK_REVIEWS.slice(0, REVIEWS_PREVIEW);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col relative shadow-[0_0_80px_rgba(0,0,0,0.07)]">
        <main className="flex-1 overflow-y-auto pb-[100px]">

          {/* ── Hero ──────────────────────────────────────────────────────── */}
          <div className="relative w-full bg-gray-100" style={{ height: 300 }}>
            {dish.imageUrl ? (
              <FadeImage src={dish.imageUrl} alt={dish.name} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl opacity-20">🍽️</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/20" />

            <Link
              href="/dishes"
              className="absolute top-5 left-4 w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition-transform duration-150 active:scale-95"
              aria-label="Go back"
            >
              <ArrowLeft size={18} className="text-gray-800" />
            </Link>

            <div className="absolute bottom-4 left-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-[11px] font-bold text-white uppercase tracking-wider">
                {dish.category.replace(/_/g, " ")}
              </span>
            </div>

            {!dish.isAvailable && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="bg-white rounded-2xl px-5 py-3 text-center shadow-lg">
                  <AlertCircle size={22} className="text-orange-500 mx-auto mb-1" />
                  <p className="text-[13px] font-extrabold text-gray-900">Sold Out</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Check back later</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Content card ──────────────────────────────────────────────── */}
          <div className="relative z-10 -mt-5 rounded-t-[28px] bg-white px-4 pt-5 pb-4">

            {/* Title + spicy badge */}
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-[21px] font-black text-gray-900 leading-tight flex-1">{dish.name}</h1>
              {isSpicy && (
                <span className="flex-shrink-0 mt-1 flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 border border-orange-100">
                  <Flame size={11} className="text-orange-500" />
                  <span className="text-[10px] font-bold text-orange-600">Spicy</span>
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-1.5">
              <Stars rating={dish.averageRating} size={12} />
              <span className="text-[12px] font-bold text-gray-700">{dish.averageRating.toFixed(1)}</span>
              <span className="text-[12px] text-gray-400">({dish.totalReviews.toLocaleString()} reviews)</span>
            </div>

            {/* Info pills */}
            <div className="flex items-center flex-wrap gap-2 mt-3">
              <InfoPill
                icon={<Clock size={12} className="text-gray-400" />}
                label={`Ready in ${dish.preparationTime} min`}
              />
              {availabilityLabel && (
                <InfoPill
                  icon={
                    <CheckCircle2
                      size={12}
                      className={availabilityLabel.startsWith("Only") ? "text-red-400" : "text-orange-500"}
                    />
                  }
                  label={availabilityLabel}
                  accent
                />
              )}
            </div>

            <p className="mt-2.5 text-[11px] text-gray-400 font-medium">🍳 Prepared fresh after your order</p>

            {/* ── Divider ───────────────────────────────────────────────── */}
            <div className="my-5 h-px bg-gray-100" />

            {/* ── Nutrition Facts — before description ──────────────────── */}
            <NutritionSection nutrition={dish.nutrition} />

            {/* ── Divider ───────────────────────────────────────────────── */}
            <div className="my-5 h-px bg-gray-100" />

            {dish.description && (
              <p className="text-[13px] leading-relaxed text-gray-600">{dish.description}</p>
            )}

            {dish.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {dish.tags.map((tag) => <TagChip key={tag} label={tag} />)}
              </div>
            )}

            {/* ── Divider ───────────────────────────────────────────────── */}
            <div className="my-5 h-px bg-gray-100" />

            {/* ── Chef ──────────────────────────────────────────────────── */}
            <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-2.5">
              Your chef
            </p>
            <ChefRow chef={dish.chef} />

            {/* ── Divider ───────────────────────────────────────────────── */}
            <div className="my-5 h-px bg-gray-100" />

            {/* ── Quantity + CTA ────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-4">
              <QuantityStepper value={qty} onChange={setQty} max={stockMax} />
              <div className="text-right">
                <p className="text-[11px] text-gray-400 font-medium">Total</p>
                <p className="text-[20px] font-black text-orange-600 leading-none">
                  {totalPrice} <span className="text-[13px]">MAD</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!dish.isAvailable}
              style={{ height: 52 }}
              className={[
                "w-full rounded-2xl flex items-center justify-center gap-2.5",
                "font-extrabold text-[15px] text-white",
                "transition-all duration-150 active:scale-[0.983]",
                !dish.isAvailable
                  ? "bg-gray-300 cursor-not-allowed"
                  : added
                  ? "bg-orange-400 shadow-[0_4px_18px_rgba(255,138,0,0.38)]"
                  : "bg-orange-500 shadow-[0_4px_18px_rgba(255,138,0,0.40)]",
              ].join(" ")}
            >
              {added ? (
                <><CheckCircle2 size={18} /> Added to cart!</>
              ) : !dish.isAvailable ? (
                "Sold Out"
              ) : (
                <><ShoppingBag size={18} /> Add to Cart · {totalPrice} MAD</>
              )}
            </button>

            {/* ── Divider ───────────────────────────────────────────────── */}
            <div className="my-5 h-px bg-gray-100" />

            {/* ── Reviews ───────────────────────────────────────────────── */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-[15px] font-extrabold text-gray-900">Reviews</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {dish.totalReviews.toLocaleString()} customer reviews
                </p>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span className="text-[13px] font-extrabold text-gray-800">{dish.averageRating.toFixed(1)}</span>
              </div>
            </div>

            {/* Rating summary */}
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center flex-shrink-0">
                <p className="text-[36px] font-black text-gray-900 leading-none">{dish.averageRating.toFixed(1)}</p>
                <div className="flex justify-center mt-1"><Stars rating={dish.averageRating} size={11} /></div>
                <p className="text-[10px] text-gray-400 mt-0.5">{dish.totalReviews} reviews</p>
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                {[5, 4, 3, 2, 1].map((star) => (
                  <RatingBar key={star} label={`${star}`} pct={dist[star]} />
                ))}
              </div>
            </div>

            {/* Review cards */}
            <div className="flex flex-col gap-2.5">
              {visibleReviews.map((r) => <ReviewCard key={r.id} review={r} />)}
            </div>

            {/* Expand / collapse */}
            {!showAllReviews && MOCK_REVIEWS.length > REVIEWS_PREVIEW && (
              <button
                onClick={() => setShowAllReviews(true)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-orange-200 bg-orange-50 transition-transform duration-150 active:scale-[0.98]"
              >
                <span className="text-[13px] font-bold text-orange-600">
                  Show all {MOCK_REVIEWS.length} reviews
                </span>
                <ChevronRight size={14} className="text-orange-500" />
              </button>
            )}
            {showAllReviews && (
              <button
                onClick={() => setShowAllReviews(false)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 transition-transform duration-150 active:scale-[0.98]"
              >
                <span className="text-[13px] font-bold text-gray-500">Show less</span>
              </button>
            )}

          </div>

          {/* ── Related dishes ────────────────────────────────────────────── */}
          {related.length > 0 && (
            <div className="mt-2 mb-4 px-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-[15px] font-extrabold text-gray-900">More like this</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">Similar dishes you might enjoy</p>
                </div>
                <Link
                  href={`/dishes?category=${dish.category}`}
                  className="flex items-center gap-0.5 text-[12px] font-bold text-orange-500 transition-opacity active:opacity-60"
                >
                  See all <ChevronRight size={13} />
                </Link>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-none">
                {related.map((d) => (
                  <div key={d.id} className="flex-shrink-0 scale-[0.92] origin-top-left" style={{ marginRight: -10 }}>
                    <DishCard dish={d} variant="vertical" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
        <BottomNav />
      </div>
    </div>
  );
}
