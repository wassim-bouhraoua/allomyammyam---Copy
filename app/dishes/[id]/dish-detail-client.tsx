"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
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
import { useTranslation } from "@/context/I18nContext";
import { getLocalizedName, getLocalizedDescription, getLocalizedBio } from "@/lib/i18n";


export interface NutritionFacts {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  sugar: number | null;
}

export interface DetailDish {
  id: string;
  name: string;
  name_en?: string | null;
  name_ar?: string | null;
  description: string | null;
  description_en?: string | null;
  description_ar?: string | null;
  price: number;
  category: string;
  imageUrl: string | null;
  averageRating: number;
  totalReviews: number;
  isAvailable: boolean;
  stockCount: number | null;
  preparationTime: number;
  tags: string[];
  nutrition?: NutritionFacts;
  chef: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    bannerUrl: string | null;
    bio: string | null;
    bio_en?: string | null;
    bio_ar?: string | null;
    averageRating: number;
    totalReviews: number;
    city: string | null;
    isAvailable: boolean;
  };
}

interface Review {
  id: string;
  authorName: string;
  initial: string;
  rating: number;
  comment: string;
  date: string;
  verifiedOrder: boolean;
}

const REVIEWS_PREVIEW = 2;

function relevanceScore(
  current: { category: string; tags: string[]; chefId: string },
  candidate: { category: string; tags: string[]; chefId: string }
): number {
  let score = 0;
  if (candidate.category === current.category) score += 10;
  const tagOverlap = candidate.tags.filter((t) => current.tags.includes(t)).length;
  score += tagOverlap * 2;
  if (candidate.chefId === current.chefId) score += 1;
  return score;
}

function ratingDistribution(avg: number): Record<number, number> {
  if (avg >= 4.8) return { 5: 80, 4: 15, 3: 3, 2: 1, 1: 1 };
  if (avg >= 4.5) return { 5: 60, 4: 30, 3: 7, 2: 2, 1: 1 };
  if (avg >= 4.0) return { 5: 45, 4: 35, 3: 12, 2: 5, 1: 3 };
  return { 5: 30, 4: 35, 3: 20, 2: 10, 1: 5 };
}

function FadeImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const fallback =
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80&auto=format&fit=crop";
  return (
    <>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-neutral-850" />}
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
          className={i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-200 dark:text-neutral-700 fill-gray-200 dark:fill-neutral-700"}
        />
      ))}
    </div>
  );
}

function InfoPill({ icon, label, accent = false }: { icon: React.ReactNode; label: string; accent?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${accent ? "bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30" : "bg-gray-50 dark:bg-neutral-850 border border-gray-100 dark:border-neutral-750"}`}>
      {icon}
      <span className={`text-[12px] font-bold ${accent ? "text-orange-600 dark:text-orange-400" : "text-gray-700 dark:text-neutral-300"}`}>{label}</span>
    </div>
  );
}

function TagChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 text-[11px] font-semibold text-orange-600 dark:text-orange-400 capitalize">
      {label}
    </span>
  );
}

function QuantityStepper({ value, onChange, max, disabled = false }: { value: number; onChange: (v: number) => void; max?: number; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={disabled || value <= 1}
        aria-label="Decrease quantity"
        className="w-9 h-9 rounded-full border-2 border-gray-200 dark:border-neutral-700 flex items-center justify-center transition-transform duration-150 active:scale-90 disabled:opacity-40"
      >
        <Minus size={14} className="text-gray-600 dark:text-neutral-455" />
      </button>
      <span className="text-[16px] font-extrabold text-gray-900 dark:text-neutral-100 min-w-[20px] text-center tabular-nums">
        {value}
      </span>
      <button
        onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}
        disabled={disabled || (max !== undefined && value >= max)}
        aria-label="Increase quantity"
        className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center shadow-[0_2px_10px_rgba(255,138,0,0.35)] transition-transform duration-150 active:scale-90 disabled:opacity-40"
      >
        <Plus size={14} className="text-white" />
      </button>
    </div>
  );
}

function ChefRow({ chef }: { chef: DetailDish["chef"] }) {
  const { locale } = useTranslation();
  const localizedBio = getLocalizedBio(chef, locale);

  return (
    <Link
      href={`/chefs/${chef.id}`}
      className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 transition-transform duration-150 active:scale-[0.98] active:bg-gray-105 dark:active:bg-neutral-950"
    >
      <div className="relative w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 bg-orange-100 dark:bg-orange-950/40 shadow-sm">
        {chef.avatarUrl ? (
          <Image src={chef.avatarUrl} alt={chef.displayName} fill sizes="48px" unoptimized className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-black text-orange-600 dark:text-orange-455">{chef.displayName[0]}</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-extrabold text-gray-900 dark:text-neutral-100 truncate">{chef.displayName}</p>
        </div>
        {localizedBio && <p className="text-[11px] text-gray-500 dark:text-neutral-400 truncate mt-0.5">{localizedBio}</p>}
        <div className="flex items-center gap-2.5 mt-1">
          <span className="flex items-center gap-0.5">
            <Star size={10} className="text-amber-400 fill-amber-400" />
            <span className="text-[11px] font-bold text-gray-700 dark:text-neutral-300">{chef.averageRating.toFixed(1)}</span>
            <span className="text-[11px] text-gray-400 dark:text-neutral-500">({chef.totalReviews})</span>
          </span>
          {chef.city && (
            <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
              <MapPin size={9} className="text-orange-400" />
              {chef.city}
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={15} className="text-gray-300 flex-shrink-0 rtl:rotate-180" />
    </Link>
  );
}

function NutritionSection({ nutrition }: { nutrition?: NutritionFacts }) {
  const { dict } = useTranslation();
  const facts = [
    {
      icon: <Zap size={10} className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-orange-500" />,
      label: dict.dishDetail.nutrition.calories,
      value: nutrition?.calories,
      unit: "kcal",
    },
    {
      icon: <Beef size={10} className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-orange-500" />,
      label: dict.dishDetail.nutrition.protein,
      value: nutrition?.protein,
      unit: "g",
    },
    {
      icon: <Wheat size={10} className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-orange-500" />,
      label: dict.dishDetail.nutrition.carbs,
      value: nutrition?.carbs,
      unit: "g",
    },
    {
      icon: <Flame size={10} className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-orange-500" />,
      label: dict.dishDetail.nutrition.fat,
      value: nutrition?.fat,
      unit: "g",
    },
    {
      icon: <Candy size={10} className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-orange-500" />,
      label: dict.dishDetail.nutrition.sugar,
      value: nutrition?.sugar,
      unit: "g",
    },
  ];

  return (
    <section>
      <div className="mb-3 text-start">
        <h2 className="text-[12px] font-extrabold text-gray-600 dark:text-neutral-455 uppercase tracking-wider">
          {dict.dishDetail.nutrition.title}
        </h2>
        <p className="text-[9px] text-gray-400 dark:text-neutral-500 mt-0.5">{dict.dishDetail.nutrition.sub}</p>
      </div>

      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {facts.map((f) => (
          <div
            key={f.label}
            className="flex flex-col items-center rounded-2xl border border-gray-100 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 px-0.5 py-1.5 sm:px-2 sm:py-3 min-w-0"
          >
            <div className="w-[22px] h-[22px] sm:w-7 sm:h-7 rounded-full bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 flex items-center justify-center mb-1 sm:mb-1.5 flex-shrink-0">
              {f.icon}
            </div>
            <div className="flex flex-col items-center text-center leading-none">
              <span className="text-[11px] sm:text-[18px] font-black text-gray-900 dark:text-neutral-100 leading-none">
                {f.value !== undefined && f.value !== null ? f.value : "—"}
              </span>
              <span className="text-[7.5px] sm:text-[10px] font-bold text-gray-400 dark:text-neutral-500 mt-0.5 leading-none">{f.unit}</span>
            </div>
            <span className="text-[8px] sm:text-[10px] text-gray-500 dark:text-neutral-455 mt-1 sm:mt-1.5 text-center truncate w-full tracking-tight">{f.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const { locale } = useTranslation();
  const formattedDate = new Date(review.date).toLocaleDateString(
    locale === "ar" ? "ar-EG" : locale === "fr" ? "fr-FR" : "en-US",
    { year: "numeric", month: "short", day: "numeric" }
  );

  return (
    <div className="bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-3.5 text-start">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center flex-shrink-0">
          <span className="text-[12px] font-black text-orange-600 dark:text-orange-400">{review.initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-bold text-gray-900 dark:text-neutral-100 truncate">{review.authorName}</span>
            <span className="text-[10px] text-gray-400 dark:text-neutral-500 flex-shrink-0">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Stars rating={review.rating} size={10} />
          </div>
          <p className="text-[12px] text-gray-600 dark:text-neutral-300 leading-relaxed mt-1.5">{review.comment}</p>
        </div>
      </div>
    </div>
  );
}

function RatingBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold text-gray-500 dark:text-neutral-450 w-3 text-right">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function DishDetailClient({
  dish,
  related,
  reviews = [],
}: {
  dish: DetailDish;
  related: any[];
  reviews?: Review[];
}) {
  const { dict, locale } = useTranslation();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { user } = useAuth();
  const { cartItems, addToCart, cartCount } = useCart();
  const router = useRouter();

  const existingItem = cartItems.find((item) => item.dish.id === dish.id);
  const existingQty = existingItem ? existingItem.quantity : 0;

  const remainingStock = dish.stockCount !== null ? Math.max(0, dish.stockCount - existingQty) : null;
  const isOutOfStock = dish.stockCount !== null && existingQty >= dish.stockCount;
  const maxStepperQty = remainingStock !== null ? remainingStock : undefined;

  // Adjust selected quantity if it exceeds remaining stock
  useEffect(() => {
    if (remainingStock !== null) {
      if (remainingStock === 0) {
        setQty(0);
      } else if (qty > remainingStock) {
        setQty(remainingStock);
      } else if (qty === 0 && remainingStock > 0) {
        setQty(1);
      }
    }
  }, [remainingStock, qty]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const totalPrice = (dish.price * qty).toLocaleString(locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en-US");

  async function handleAddToCart() {
    if (!user) {
      router.push("/login?from=" + encodeURIComponent(window.location.pathname));
      return;
    }

    if (qty <= 0) return;

    try {
      const result = await addToCart(dish.id, qty, {
        name: getLocalizedName(dish, locale),
        price: dish.price,
        imageUrl: dish.imageUrl,
        category: dish.category,
        isAvailable: dish.isAvailable,
        chef: { displayName: dish.chef.displayName }
      });
      if (result.success) {
        setAdded(true);
        setTimeout(() => setAdded(false), 2200);
      } else {
        showToast(result.error ?? dict.cart.toast.addFailed, "error");
      }
    } catch {
      showToast(dict.common.errorTitle, "error");
    }
  }

  const isSpicy = dish.tags.some((t) => ["spicy", "harissa"].includes(t.toLowerCase()));

  const availabilityLabel =
    !dish.isAvailable
      ? null
      : dish.stockCount !== null && dish.stockCount <= 3
      ? dict.dishDetail.stock.low.replace("{count}", String(dish.stockCount))
      : dish.stockCount !== null
      ? dict.dishDetail.stock.available.replace("{count}", String(dish.stockCount))
      : dict.dishDetail.stock.today;

  const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (reviews.length > 0) {
    reviews.forEach((r) => {
      const star = Math.round(r.rating);
      if (star >= 1 && star <= 5) {
        dist[star] = (dist[star] || 0) + 1;
      }
    });
    // Convert counts to percentages
    [5, 4, 3, 2, 1].forEach((star) => {
      dist[star] = Math.round((dist[star] / reviews.length) * 100);
    });
  }

  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, REVIEWS_PREVIEW);

  return (
    <div className="bg-background min-h-screen flex justify-center py-0 lg:py-12">
      <div className="w-full max-w-md lg:max-w-5xl bg-white dark:bg-neutral-900 min-h-screen lg:min-h-0 lg:rounded-[32px] flex flex-col relative shadow-[0_0_80px_rgba(0,0,0,0.07)] lg:border lg:border-gray-100/50 dark:lg:border-neutral-800 overflow-hidden transition-all duration-300">
        
        <Link
          href="/dishes"
          className="absolute top-5 start-4 w-10 h-10 rounded-2xl bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm flex items-center justify-center shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition-transform duration-150 active:scale-95 z-20"
          aria-label="Go back"
        >
          <ArrowLeft size={18} className="text-gray-800 dark:text-neutral-200 rtl:rotate-180" />
        </Link>

        <main className="flex-1 overflow-y-auto pb-[100px] lg:pb-6">
          
          <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6">
            
            <div className="w-full lg:w-[48%] flex flex-col gap-6">
              
              <div className="relative w-full h-[300px] lg:h-[360px] bg-gray-100 dark:bg-neutral-800 overflow-hidden flex-shrink-0 rounded-2xl shadow-sm">
                {dish.imageUrl ? (
                  <FadeImage src={dish.imageUrl} alt={getLocalizedName(dish, locale)} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl opacity-20">🍽️</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/20" />
                          <div className="absolute bottom-4 start-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-[11px] font-bold text-white uppercase tracking-wider">
                    {dict.dishes.categories[dish.category.toLowerCase()] || dish.category.replace(/_/g, " ")}
                  </span>
                </div>

                {!dish.isAvailable && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl">
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl px-5 py-3 text-center shadow-lg">
                      <AlertCircle size={22} className="text-orange-500 mx-auto mb-1" />
                      <p className="text-[13px] font-extrabold text-gray-900 dark:text-neutral-100">{dict.common.soldOut}</p>
                      <p className="text-[11px] text-gray-500 dark:text-neutral-450 mt-0.5">{dict.dishDetail.stock.checkBackLater}</p>
                    </div>
                  </div>
                )}
              </div>

              {dish.description && (
                <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-gray-100/80 dark:border-neutral-700 shadow-[0_2px_18px_rgba(0,0,0,0.03)] text-start">
                  <h2 className="text-[11px] font-extrabold text-gray-400 dark:text-neutral-400 uppercase tracking-wider mb-2">
                    {dict.dishDetail.about}
                  </h2>
                  <p className="text-[13px] leading-relaxed text-gray-600 dark:text-neutral-300">{getLocalizedDescription(dish, locale)}</p>
                  
                  {dish.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3.5">
                      {dish.tags.map((tag) => <TagChip key={tag} label={dict.dishes.tags[tag.toLowerCase()] || tag} />)}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white dark:bg-neutral-800 rounded-2xl p-3.5 sm:p-5 border border-gray-100/80 dark:border-neutral-700 shadow-[0_2px_18px_rgba(0,0,0,0.03)]">
                <NutritionSection nutrition={dish.nutrition} />
              </div>

            </div>

            <div className="flex-1 flex flex-col gap-6 text-start">
              
              <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-gray-100/80 dark:border-neutral-700 shadow-[0_2px_18px_rgba(0,0,0,0.03)]">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-[21px] lg:text-[25px] font-black text-gray-900 dark:text-neutral-100 leading-tight flex-1">
                    {getLocalizedName(dish, locale)}
                  </h1>
                  {isSpicy && (
                    <span className="flex-shrink-0 mt-1 flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
                      <Flame size={11} className="text-orange-500" />
                      <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">{dict.dishes.tags.spicy}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <Stars rating={dish.averageRating} size={12} />
                  <span className="text-[13px] font-bold text-gray-700 dark:text-neutral-300">{dish.averageRating.toFixed(1)}</span>
                  <span className="text-[12px] text-gray-400 dark:text-neutral-50">({dict.dishDetail.stars.reviewsCount.replace('{count}', dish.totalReviews.toLocaleString())})</span>
                </div>

                <div className="flex items-center flex-wrap gap-2 mt-3.5">
                  <InfoPill
                    icon={<Clock size={12} className="text-gray-400" />}
                    label={dict.dishDetail.readyIn.replace("{time}", String(dish.preparationTime))}
                  />
                  {availabilityLabel && (
                    <InfoPill
                      icon={
                        <CheckCircle2
                          size={12}
                          className={availabilityLabel.startsWith("Only") || availabilityLabel.startsWith("Plus") || availabilityLabel.startsWith("متبقي") ? "text-red-400" : "text-orange-500"}
                        />
                      }
                      label={availabilityLabel}
                      accent
                    />
                  )}
                </div>
                <p className="mt-2.5 text-[11px] text-gray-400 font-semibold">🍳 {dict.dishDetail.freshNotice}</p>
              </div>

              <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-gray-100/80 dark:border-neutral-700 shadow-[0_2px_18px_rgba(0,0,0,0.03)]">
                <p className="text-[11px] font-extrabold text-gray-400 dark:text-neutral-400 uppercase tracking-wider mb-2.5">
                  {dict.dishDetail.chef}
                </p>
                <ChefRow chef={dish.chef} />
              </div>

              <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-gray-100/80 dark:border-neutral-700 shadow-[0_2px_18px_rgba(0,0,0,0.03)] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <QuantityStepper value={qty} onChange={setQty} max={maxStepperQty} disabled={!dish.chef.isAvailable || isOutOfStock} />
                  <div className="text-end">
                    <p className="text-[11px] text-gray-400 dark:text-neutral-455 font-bold uppercase tracking-wider">{dict.cart.totalPrice}</p>
                    <p className="text-[22px] font-black text-orange-600 leading-none mt-0.5">
                      {totalPrice} <span className="text-[13px] font-extrabold font-black text-orange-600">{dict.common.currency}</span>
                    </p>
                  </div>
                </div>

                {!dish.chef.isAvailable && (
                  <p className="text-[12px] font-medium text-muted-foreground text-center">
                    {dict.dishDetail.actions.chefUnavailable}
                  </p>
                )}

                <div className="flex gap-2.5">
                  <button
                    onClick={handleAddToCart}
                    disabled={!dish.isAvailable || !dish.chef.isAvailable || isOutOfStock}
                    style={{ height: 52 }}
                    className={[
                      "flex-1 rounded-2xl flex items-center justify-center gap-2.5",
                      "font-extrabold text-[15px] text-white transition-all duration-150 active:scale-[0.983]",
                      (!dish.isAvailable || !dish.chef.isAvailable || isOutOfStock)
                        ? "bg-gray-300 dark:bg-neutral-700 cursor-not-allowed text-gray-500"
                        : added
                        ? "bg-orange-400 shadow-[0_4px_18px_rgba(255,138,0,0.38)]"
                        : "bg-orange-500 shadow-[0_4px_18px_rgba(255,138,0,0.40)]",
                    ].join(" ")}
                  >
                    {added ? (
                      <><CheckCircle2 size={18} /> {dict.dishDetail.actions.added}</>
                    ) : !dish.chef.isAvailable ? (
                      dict.common.chefUnavailableShort
                    ) : !dish.isAvailable ? (
                      dict.common.soldOut
                    ) : isOutOfStock ? (
                      dict.dishDetail.actions.maxInCart
                    ) : (
                      <><ShoppingBag size={18} /> {dict.dishDetail.actions.addToCart.replace('{price}', totalPrice)}</>
                    )}
                  </button>

                  <Link
                    href="/cart"
                    style={{ height: 52 }}
                    className="px-5 rounded-2xl border border-border flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground font-extrabold text-[14px] bg-card hover:bg-secondary active:scale-[0.98] transition-all flex-shrink-0 relative"
                    aria-label="View Cart"
                  >
                    <ShoppingBag size={16} />
                    <span>{dict.dishDetail.actions.cart}</span>
                    {cartCount > 0 && (
                      <span className="bg-orange-500 text-white font-extrabold text-[10px] min-w-[20px] h-[20px] px-1 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-900 animate-in zoom-in duration-200 ml-0.5">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </div>
              </div>

            </div>

          </div>

          <div className="px-4 lg:px-6 flex flex-col gap-6">
            
            <div className="h-px bg-gray-105 dark:bg-neutral-800" />

            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-gray-100/80 dark:border-neutral-700 shadow-[0_2px_18px_rgba(0,0,0,0.03)] text-start">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-[15px] font-extrabold text-gray-900 dark:text-neutral-100">{dict.dishDetail.reviews}</h2>
                  <p className="text-[11px] text-gray-400 dark:text-neutral-400 mt-0.5">
                    {dict.dishDetail.customerReviews.replace('{count}', dish.totalReviews.toLocaleString())}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span className="text-[13px] font-extrabold text-gray-800 dark:text-neutral-200">{dish.averageRating.toFixed(1)}</span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 mb-5">
                <div className="text-center flex-shrink-0 bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-3 flex flex-col items-center justify-center min-w-[110px]">
                  <p className="text-[32px] font-black text-gray-900 dark:text-neutral-100 leading-none">
                    {dish.averageRating.toFixed(1)}
                  </p>
                  <div className="flex justify-center mt-1.5"><Stars rating={dish.averageRating} size={10} /></div>
                  <p className="text-[9px] text-gray-400 mt-1 font-semibold uppercase tracking-wider">
                    {dict.dishDetail.stars.reviewsCount.replace('{count}', String(dish.totalReviews))}
                  </p>
                </div>
                <div className="flex-1 flex flex-col gap-1.5 justify-center">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <RatingBar key={star} label={`${star}`} pct={dist[star]} />
                  ))}
                </div>
              </div>

              {reviews.length === 0 ? (
                <p className="text-[13px] text-gray-500 dark:text-neutral-400 text-center py-4">
                  {dict.dishDetail.noReviews}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {visibleReviews.map((r) => <ReviewCard key={r.id} review={r} />)}
                </div>
              )}

              {!showAllReviews && reviews.length > REVIEWS_PREVIEW && (
                <button
                  onClick={() => setShowAllReviews(true)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-orange-200 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-950/20 transition-transform duration-150 active:scale-[0.98]"
                >
                  <span className="text-[13px] font-bold text-orange-600 dark:text-orange-400">
                    {dict.dishDetail.stars.showAllReviews.replace('{count}', String(reviews.length))}
                  </span>
                  <ChevronRight size={14} className="text-orange-500 rtl:rotate-180" />
                </button>
              )}
              {showAllReviews && reviews.length > REVIEWS_PREVIEW && (
                <button
                  onClick={() => setShowAllReviews(false)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-gray-200 dark:border-neutral-750 bg-gray-50 dark:bg-neutral-800 transition-transform duration-150 active:scale-[0.98]"
                >
                  <span className="text-[13px] font-bold text-gray-500 dark:text-neutral-400">{dict.dishDetail.stars.showLess}</span>
                </button>
              )}
            </div>

            {related.length > 0 && (
              <div className="border-t border-gray-100 dark:border-neutral-800 pt-6 pb-2 text-start">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-[15px] font-extrabold text-gray-900 dark:text-neutral-100">{dict.dishDetail.related.title}</h2>
                    <p className="text-[11px] text-gray-400 dark:text-neutral-400 mt-0.5">{dict.dishDetail.related.sub}</p>
                  </div>
                  <Link
                    href={`/dishes?category=${dish.category}`}
                    className="flex items-center gap-0.5 text-[12px] font-bold text-orange-500 transition-opacity active:opacity-60"
                  >
                    {dict.dishDetail.related.seeAll} <ChevronRight size={13} className="rtl:rotate-180" />
                  </Link>
                </div>

                <div className="flex gap-3.5 overflow-x-auto pb-4 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-none">
                  {related.map((d) => (
                    <div key={d.id} className="flex-shrink-0">
                      <DishCard dish={d} variant="vertical" />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </main>
        {toast && (
          <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
            toast.type === "success"
              ? "bg-green-50/90 dark:bg-green-950/90 border-green-200 dark:border-green-900/30 text-green-800 dark:text-green-300"
              : "bg-red-50/90 dark:bg-red-950/90 border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-300"
          }`}>
            {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span className="text-[13px] font-bold">{toast.message}</span>
          </div>
        )}

        <BottomNav />
      </div>
    </div>
  );
}
