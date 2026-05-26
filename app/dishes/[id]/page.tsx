// app/dishes/[id]/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Work item: "5 - Détail d'un plat"
// Scope    : hero · dish info · chef info · reviews · quantity + add-to-cart · related
// Data     : mockDishes — replace .find() with prisma.dish.findUnique({ include: { chef: true } })
// Deps     : only @/lib/mock-data · @/components/bottom-nav · @/components/dish-card
//            (both already exist in the project)
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Star,
  Clock,
  CheckCircle2,
  ShoppingBag,
  Flame,
  Leaf,
  MapPin,
  ChevronRight,
  Plus,
  Minus,
  AlertCircle,
} from "lucide-react";

import BottomNav from "@/components/bottom-nav";
import DishCard from "@/components/dish-card";
import { mockDishes, type MockChefProfile } from "@/lib/mock-data";

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
// Replace with: prisma.review.findMany({ where: { dishId }, take: 5 })
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_REVIEWS: Review[] = [
  {
    id: "r1",
    authorName: "Yasmine B.",
    initial: "Y",
    rating: 5,
    comment:
      "Arrived hot and well packed. The taste was exactly like home cooking — generous portion too.",
    date: "2 days ago",
    verifiedOrder: true,
  },
  {
    id: "r2",
    authorName: "Mehdi A.",
    initial: "M",
    rating: 5,
    comment:
      "Very authentic taste. Packaging was clean and sealed. Will definitely order again.",
    date: "5 days ago",
    verifiedOrder: true,
  },
  {
    id: "r3",
    authorName: "Salma R.",
    initial: "S",
    rating: 4,
    comment:
      "Portion size was generous and the seasoning was spot on. Delivery was on time.",
    date: "1 week ago",
    verifiedOrder: true,
  },
  {
    id: "r4",
    authorName: "Kamal H.",
    initial: "K",
    rating: 4,
    comment:
      "Great for a home-style meal. The sauce had real depth — nothing like restaurant shortcuts.",
    date: "2 weeks ago",
    verifiedOrder: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components (inlined — zero external import risk)
// ─────────────────────────────────────────────────────────────────────────────

/** Mirrors DishCard's ImageWithFade exactly */
function FadeImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const fallback =
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80&auto=format&fit=crop";
  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}
      <Image
        src={error ? fallback : src}
        alt={alt}
        fill
        sizes="(max-width: 448px) 100vw, 448px"
        priority
        unoptimized
        className={`object-cover transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => { setError(true); setLoaded(true); }}
      />
    </>
  );
}

/** Filled star row */
function Stars({ rating, size = 11 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={
            i <= Math.round(rating)
              ? "text-amber-400 fill-amber-400"
              : "text-gray-200 fill-gray-200"
          }
        />
      ))}
    </div>
  );
}

/** Orange or gray info pill */
function InfoPill({
  icon,
  label,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
        accent
          ? "bg-orange-50 border border-orange-100"
          : "bg-gray-50 border border-gray-100"
      }`}
    >
      {icon}
      <span
        className={`text-[12px] font-bold ${
          accent ? "text-orange-600" : "text-gray-700"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

/** Orange tag chip */
function TagChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-orange-50 border border-orange-100 text-[11px] font-semibold text-orange-600 capitalize">
      {label}
    </span>
  );
}

/** +/− quantity stepper */
function QuantityStepper({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        aria-label="Decrease quantity"
        className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
      >
        <Minus size={14} className="text-gray-600" />
      </button>
      <span className="text-[16px] font-extrabold text-gray-900 min-w-[20px] text-center tabular-nums">
        {value}
      </span>
      <button
        onClick={() =>
          onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)
        }
        disabled={max !== undefined && value >= max}
        aria-label="Increase quantity"
        className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center shadow-[0_2px_10px_rgba(255,138,0,0.35)] active:scale-95 transition-transform disabled:opacity-40"
      >
        <Plus size={14} className="text-white" />
      </button>
    </div>
  );
}

/** Chef card row */
function ChefRow({ chef }: { chef: MockChefProfile }) {
  return (
    <Link
      href={`/chefs/${chef.id}`}
      className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100 active:bg-gray-100 transition-colors"
    >
      {/* Avatar */}
      <div className="relative w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 bg-orange-100 shadow-sm">
        {chef.avatarUrl ? (
          <Image
            src={chef.avatarUrl}
            alt={chef.displayName}
            fill
            sizes="48px"
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-black text-orange-600">
              {chef.displayName[0]}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-extrabold text-gray-900 truncate">
            {chef.displayName}
          </p>
          {chef.status === "APPROVED" && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-orange-100 text-[9px] font-bold text-orange-600 uppercase tracking-wide flex-shrink-0">
              ✓ Pro
            </span>
          )}
        </div>
        {chef.bio && (
          <p className="text-[11px] text-gray-500 truncate mt-0.5">{chef.bio}</p>
        )}
        <div className="flex items-center gap-2.5 mt-1">
          <span className="flex items-center gap-0.5">
            <Star size={10} className="text-amber-400 fill-amber-400" />
            <span className="text-[11px] font-bold text-gray-700">
              {chef.averageRating.toFixed(1)}
            </span>
            <span className="text-[11px] text-gray-400">
              ({chef.totalReviews})
            </span>
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

/** Single review card */
function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3.5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
          <span className="text-[12px] font-black text-orange-600">
            {review.initial}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-bold text-gray-900 truncate">
              {review.authorName}
            </span>
            <span className="text-[10px] text-gray-400 flex-shrink-0">
              {review.date}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Stars rating={review.rating} size={10} />
            {review.verifiedOrder && (
              <span className="text-[9px] font-bold text-green-600 bg-green-50 border border-green-100 rounded-full px-1.5 py-0.5 uppercase tracking-wide">
                ✓ Verified order
              </span>
            )}
          </div>
          <p className="text-[12px] text-gray-600 leading-relaxed mt-1.5">
            {review.comment}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Rating distribution bar */
function RatingBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold text-gray-500 w-3 text-right">
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Plausible distribution from average — replace with real groupBy in prod */
function ratingDistribution(avg: number): Record<number, number> {
  if (avg >= 4.8) return { 5: 80, 4: 15, 3: 3, 2: 1, 1: 1 };
  if (avg >= 4.5) return { 5: 60, 4: 30, 3: 7, 2: 2, 1: 1 };
  if (avg >= 4.0) return { 5: 45, 4: 35, 3: 12, 2: 5, 1: 3 };
  return { 5: 30, 4: 35, 3: 20, 2: 10, 1: 5 };
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

  // ── Data (swap for prisma.dish.findUnique) ────────────────────────────────
  const dish = mockDishes.find((d) => d.id === id);
  if (!dish) notFound();

  const related = mockDishes
    .filter((d) => d.id !== dish.id && d.category === dish.category)
    .slice(0, 6);

  // ── Local state ───────────────────────────────────────────────────────────
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const totalPrice = (dish.price * qty).toLocaleString("fr-MA");
  const stockMax = dish.stockCount ?? undefined;

  function handleAddToCart() {
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
    // TODO: dispatch to cart context / store
  }

  // ── Dietary flags ─────────────────────────────────────────────────────────
  const isSpicy = dish.tags.some((t) =>
    ["spicy", "harissa"].includes(t.toLowerCase())
  );
  const isVegan =
    dish.tags.some((t) =>
      ["vegan", "vegetarian"].includes(t.toLowerCase())
    ) && !dish.tags.includes("meat");

  // ── Availability copy ─────────────────────────────────────────────────────
  const availabilityLabel =
    !dish.isAvailable
      ? null
      : dish.stockCount !== null && dish.stockCount <= 3
      ? `Only ${dish.stockCount} portions left`
      : dish.stockCount !== null
      ? `${dish.stockCount} portions available`
      : "Available today";

  const dist = ratingDistribution(dish.averageRating);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col relative shadow-[0_0_80px_rgba(0,0,0,0.07)]">
        <main className="flex-1 overflow-y-auto pb-[100px]">

          {/* ─── Hero ──────────────────────────────────────────────────────── */}
          <div className="relative w-full bg-gray-100" style={{ height: 300 }}>
            {dish.imageUrl ? (
              <FadeImage src={dish.imageUrl} alt={dish.name} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl opacity-20">🍽️</span>
              </div>
            )}

            {/* Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/15" />

            {/* Back */}
            <Link
              href="/dishes"
              className="absolute top-5 left-4 w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.12)] active:scale-95 transition-transform duration-150"
              aria-label="Go back"
            >
              <ArrowLeft size={18} className="text-gray-800" />
            </Link>

            {/* Category badge */}
            <div className="absolute bottom-4 left-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-[11px] font-bold text-white uppercase tracking-wider">
                {dish.category.replace(/_/g, " ")}
              </span>
            </div>

            {/* Sold out */}
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

          {/* ─── Content card ──────────────────────────────────────────────── */}
          <div className="relative z-10 -mt-5 rounded-t-[28px] bg-white px-4 pt-5 pb-4">

            {/* Title + dietary icons */}
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-[21px] font-black text-gray-900 leading-tight flex-1">
                {dish.name}
              </h1>
              <div className="flex items-center gap-1.5 flex-shrink-0 pt-1">
                {isSpicy && (
                  <span title="Spicy" className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center">
                    <Flame size={12} className="text-red-500" />
                  </span>
                )}
                {isVegan && (
                  <span title="Vegan / Vegetarian" className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center">
                    <Leaf size={12} className="text-green-500" />
                  </span>
                )}
              </div>
            </div>

            {/* Rating summary */}
            <div className="flex items-center gap-2 mt-1.5">
              <Stars rating={dish.averageRating} size={12} />
              <span className="text-[12px] font-bold text-gray-700">
                {dish.averageRating.toFixed(1)}
              </span>
              <span className="text-[12px] text-gray-400">
                ({dish.totalReviews.toLocaleString()} reviews)
              </span>
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
                      className={
                        availabilityLabel.startsWith("Only")
                          ? "text-red-400"
                          : "text-orange-500"
                      }
                    />
                  }
                  label={availabilityLabel}
                  accent
                />
              )}
            </div>

            {/* Trust nudge */}
            <p className="mt-2.5 text-[11px] text-gray-400 font-medium">
              🍳 Prepared fresh after your order
            </p>

            {/* Description */}
            {dish.description && (
              <p className="mt-3.5 text-[13px] leading-relaxed text-gray-600">
                {dish.description}
              </p>
            )}

            {/* Tags */}
            {dish.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {dish.tags.map((tag) => (
                  <TagChip key={tag} label={tag} />
                ))}
              </div>
            )}

            {/* ── Divider ────────────────────────────────────────────────── */}
            <div className="my-5 h-px bg-gray-100" />

            {/* ── Chef ───────────────────────────────────────────────────── */}
            <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-2.5">
              Your chef
            </p>
            <ChefRow chef={dish.chef} />

            {/* ── Divider ────────────────────────────────────────────────── */}
            <div className="my-5 h-px bg-gray-100" />

            {/* ── Reviews ────────────────────────────────────────────────── */}
            <h2 className="text-[15px] font-extrabold text-gray-900 mb-3">
              Reviews
            </h2>

            {/* Summary */}
            <div className="flex items-center gap-4 mb-4">
              {/* Big score */}
              <div className="text-center flex-shrink-0">
                <p className="text-[38px] font-black text-gray-900 leading-none">
                  {dish.averageRating.toFixed(1)}
                </p>
                <div className="flex justify-center mt-1">
                  <Stars rating={dish.averageRating} size={11} />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {dish.totalReviews} reviews
                </p>
              </div>

              {/* Distribution bars */}
              <div className="flex-1 flex flex-col gap-1.5">
                {[5, 4, 3, 2, 1].map((star) => (
                  <RatingBar key={star} label={`${star}`} pct={dist[star]} />
                ))}
              </div>
            </div>

            {/* Review cards */}
            <div className="flex flex-col gap-2.5">
              {MOCK_REVIEWS.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>

            {/* ── Divider ────────────────────────────────────────────────── */}
            <div className="my-5 h-px bg-gray-100" />

            {/* ── Quantity + CTA ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-4">
              <QuantityStepper value={qty} onChange={setQty} max={stockMax} />
              <div className="text-right">
                <p className="text-[11px] text-gray-400 font-medium">Total</p>
                <p className="text-[20px] font-black text-orange-600 leading-none">
                  {totalPrice}{" "}
                  <span className="text-[13px]">MAD</span>
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
                "transition-all duration-200 active:scale-[0.985]",
                !dish.isAvailable
                  ? "bg-gray-300 cursor-not-allowed"
                  : added
                  ? "bg-green-500 shadow-[0_4px_18px_rgba(34,197,94,0.38)]"
                  : "bg-orange-500 shadow-[0_4px_18px_rgba(255,138,0,0.40)]",
              ].join(" ")}
            >
              {added ? (
                <>
                  <CheckCircle2 size={18} />
                  Added to cart!
                </>
              ) : !dish.isAvailable ? (
                "Sold Out"
              ) : (
                <>
                  <ShoppingBag size={18} />
                  Add to Cart · {totalPrice} MAD
                </>
              )}
            </button>
          </div>

          {/* ─── Related dishes ────────────────────────────────────────────── */}
          {related.length > 0 && (
            <div className="mt-2 mb-4 px-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-[15px] font-extrabold text-gray-900">
                    More like this
                  </h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Same category · different flavours
                  </p>
                </div>
                <Link
                  href={`/dishes?category=${dish.category}`}
                  className="flex items-center gap-0.5 text-[12px] font-bold text-orange-500"
                >
                  See all <ChevronRight size={13} />
                </Link>
              </div>

              {/* Horizontal scroll — same pattern as HomeSection */}
              <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-none">
                {related.map((d) => (
                  <DishCard key={d.id} dish={d} variant="vertical" />
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
