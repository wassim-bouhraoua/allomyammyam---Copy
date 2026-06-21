"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Star, Clock, MapPin, Plus, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
export interface DishCardData {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string | null;
  averageRating: number;
  preparationTime: number;
  isAvailable: boolean;
  chef: {
    displayName: string;
    city: string | null;
    avatarUrl?: string | null;
    isAvailable: boolean;
  };
}

interface DishCardProps {
  dish: DishCardData;
  variant?: "vertical" | "horizontal" | "grid";
}

// ─────────────────────────────────────────────────────────────────────────────
// ImageWithFade
// Wraps Next.js <Image> with an opacity transition on load.
// Eliminates the abrupt placeholder→image "pop" that reads as instability.
// The gray background (set on the parent container) shows while loading.
// ─────────────────────────────────────────────────────────────────────────────
function ImageWithFade({
  src,
  alt,
  sizes,
  priority = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // fallback image if Unsplash fails
  const fallback =
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80&auto=format&fit=crop";

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-secondary" />
      )}

      <Image
        src={error ? fallback : src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized
        className={`object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
      />
    </>
  );
}

export default function DishCard({ dish, variant = "vertical" }: DishCardProps) {
  const formattedPrice = `${dish.price} MAD`;
  const rating = dish.averageRating.toFixed(1);

  const { user } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push("/login?from=" + encodeURIComponent(window.location.pathname));
      return;
    }

    setAdding(true);
    try {
      const res = await addToCart(dish.id, 1, {
        name: dish.name,
        price: dish.price,
        imageUrl: dish.imageUrl,
        category: dish.category,
        isAvailable: dish.isAvailable,
        chef: { displayName: dish.chef.displayName }
      });
      if (res.success) {
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }
    } catch (err) {
      console.error("Failed to quick add to cart:", err);
    } finally {
      setAdding(false);
    }
  };

  // ── Horizontal variant — used in the dishes listing page ─────────────────
  if (variant === "horizontal") {
    return (
      <Link href={`/dishes/${dish.id}`} className="block">
        {/*
          overflow-hidden is NOT on this article — it would clip the
          active:scale shadow. Only the image container clips.
        */}
        <article className="flex gap-3 bg-card rounded-2xl p-3 shadow-[0_2px_16px_rgba(0,0,0,0.07)] border border-border active:scale-[0.985] transition-transform duration-150">

          {/* Image container
              - explicit w/h in px locks the aspect ratio regardless of content
              - flex-shrink-0 prevents the container from narrowing under text pressure
              - overflow-hidden here only, not on article
              - bg-gray-100 is the loading skeleton color
          */}
          <div className="relative w-[84px] h-[84px] rounded-xl overflow-hidden flex-shrink-0 bg-secondary">
            {dish.imageUrl ? (
              <ImageWithFade
                src={dish.imageUrl}
                alt={dish.name}
                sizes="84px"
              />
            ) : (
              // No-image fallback — emoji centered on gray background
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl opacity-30">🍽️</span>
              </div>
            )}
            {!dish.chef.isAvailable ? (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl p-1">
                <span className="text-white text-[8px] font-bold uppercase tracking-wider bg-neutral-600/95 px-1 py-0.5 rounded-md text-center leading-tight">
                  Chef Unavailable
                </span>
              </div>
            ) : !dish.isAvailable ? (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                <span className="text-white text-[9px] font-bold uppercase tracking-widest">
                  Sold out
                </span>
              </div>
            ) : null}
          </div>

          {/* Content
              min-w-0 is critical — prevents flex children from overflowing
              when dish name or chef name is long.
          */}
          <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
            <div>
              <h3 className="text-[13px] font-bold text-foreground leading-snug truncate">
                {dish.name}
              </h3>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={9} className="text-orange-500 flex-shrink-0" />
                <span className="text-[11px] text-muted-foreground truncate">
                  {dish.chef.displayName} · {dish.chef.city}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-0.5 text-[11px] font-semibold text-foreground">
                  <Star size={10} className="text-amber-400 fill-amber-400" />
                  {rating}
                </span>
                <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                  <Clock size={9} className="text-gray-300" />
                  {dish.preparationTime}m
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-extrabold text-orange-600">
                  {formattedPrice}
                </span>
                {dish.isAvailable && dish.chef.isAvailable && (
                  <button
                    onClick={handleQuickAdd}
                    disabled={adding}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                      added
                        ? "bg-green-500 text-white shadow-md shadow-green-500/20"
                        : "bg-orange-500 text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 hover:scale-105 active:scale-95"
                    }`}
                    aria-label="Quick add to cart"
                  >
                    {adding ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : added ? (
                      <Check size={11} strokeWidth={3} />
                    ) : (
                      <Plus size={11} strokeWidth={3} />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

        </article>
      </Link>
    );
  }

  // ── Original Vertical variant — used in horizontal scroll sections on homepage ─────
  if (variant === "vertical") {
    return (
      <Link href={`/dishes/${dish.id}`} className="block">
        {/*
          Key fix: overflow-hidden removed from article.
          It was clipping the box-shadow during active:scale on mobile.
          Each internal zone handles its own clipping.
        */}
        <article className="w-[152px] flex-shrink-0 bg-card rounded-2xl shadow-[0_2px_18px_rgba(0,0,0,0.09)] border border-border hover:-translate-y-0.5 active:scale-[0.97] transition-transform duration-150">

          {/* Image container
              - rounded-t-2xl matches article top radius since article no longer clips
              - aspect-ratio as inline style is the most reliable cross-browser fallback
                for fixed-height containers with fill images on mobile Safari
              - overflow-hidden here only
          */}
          <div
            className="relative w-full rounded-t-2xl overflow-hidden bg-secondary"
            style={{ height: "112px" }}
          >
            {dish.imageUrl ? (
              <ImageWithFade
                src={dish.imageUrl}
                alt={dish.name}
                sizes="200px"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl opacity-25">🍽️</span>
              </div>
            )}

            {/* Prep time pill */}
            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-0.5">
              <Clock size={8} className="text-white" />
              <span className="text-[9px] font-bold text-white">{dish.preparationTime}m</span>
            </div>

            {/* Availability overlays */}
            {!dish.chef.isAvailable ? (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white text-[9px] font-bold uppercase tracking-wider bg-neutral-600/95 px-2 py-0.5 rounded-md">
                  Chef Unavailable
                </span>
              </div>
            ) : !dish.isAvailable ? (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-[9px] font-bold uppercase tracking-widest">
                  Sold out
                </span>
              </div>
            ) : null}
          </div>

          {/* Content — explicit padding so nothing collapses */}
          <div className="p-2.5 pt-2">
            <h3 className="text-[12px] font-bold text-foreground leading-tight line-clamp-1">
              {dish.name}
            </h3>

            {/* Chef row */}
            <div className="flex items-center gap-1 mt-1">
              <div className="relative w-3.5 h-3.5 rounded-full overflow-hidden flex-shrink-0 bg-orange-100/50 dark:bg-orange-950/30">
                {dish.chef.avatarUrl ? (
                  <Image
                    src={dish.chef.avatarUrl}
                    alt={dish.chef.displayName}
                    fill
                    sizes="14px"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-orange-700">
                    {dish.chef.displayName[0]}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground truncate">
                {dish.chef.displayName}
              </span>
            </div>

            {/* Rating + price row */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-0.5">
                <Star size={9} className="text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-bold text-foreground">{rating}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="flex items-baseline gap-[2px] whitespace-nowrap">
                  <span className="text-[12px] font-extrabold text-orange-600">{dish.price}</span>
                  <span className="text-[9px] font-bold text-orange-400">MAD</span>
                </span>
                {dish.isAvailable && dish.chef.isAvailable && (
                  <button
                    onClick={handleQuickAdd}
                    disabled={adding}
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                      added
                        ? "bg-green-500 text-white shadow-sm"
                        : "bg-orange-500 text-white shadow-sm hover:bg-orange-600 hover:scale-105 active:scale-95"
                    }`}
                    aria-label="Quick add to cart"
                  >
                    {adding ? (
                      <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : added ? (
                      <Check size={9} strokeWidth={3} />
                    ) : (
                      <Plus size={9} strokeWidth={3} />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

        </article>
      </Link>
    );
  }

  // ── Grid variant — responsive and used only by desktop explorer page ─────
  return (
    <Link href={`/dishes/${dish.id}`} className="block w-full">
      <article className="w-[152px] lg:w-full flex-shrink-0 lg:flex-shrink bg-card rounded-2xl shadow-[0_2px_18px_rgba(0,0,0,0.09)] border border-border hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-150">

        {/* Image container
            - rounded-t-2xl matches article top radius since article no longer clips
            - aspect-ratio as inline style is the most reliable cross-browser fallback
              for fixed-height containers with fill images on mobile Safari
            - overflow-hidden here only
        */}
        <div
          className="relative w-full rounded-t-2xl overflow-hidden bg-secondary h-28 lg:h-48"
        >
          {dish.imageUrl ? (
            <ImageWithFade
              src={dish.imageUrl}
              alt={dish.name}
              sizes="(max-width: 1024px) 200px, 400px"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl opacity-25">🍽️</span>
            </div>
          )}

          {/* Prep time pill */}
          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-0.5">
            <Clock size={8} className="text-white" />
            <span className="text-[9px] font-bold text-white">{dish.preparationTime}m</span>
          </div>

          {/* Availability overlays */}
          {!dish.chef.isAvailable ? (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold uppercase tracking-wider bg-neutral-600/95 px-2.5 py-1 rounded-md">
                Chef Unavailable
              </span>
            </div>
          ) : !dish.isAvailable ? (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold uppercase tracking-widest">
                Sold out
              </span>
            </div>
          ) : null}
        </div>

        {/* Content — explicit padding so nothing collapses */}
        <div className="p-2.5 lg:p-4 pt-2">
          <h3 className="text-[12px] lg:text-[15px] font-bold text-foreground leading-tight line-clamp-1">
            {dish.name}
          </h3>

          {/* Chef row */}
          <div className="flex items-center gap-1 lg:gap-1.5 mt-1 lg:mt-2">
            <div className="relative w-3.5 h-3.5 lg:w-5 lg:h-5 rounded-full overflow-hidden flex-shrink-0 bg-orange-100/50 dark:bg-orange-950/30">
              {dish.chef.avatarUrl ? (
                <Image
                  src={dish.chef.avatarUrl}
                  alt={dish.chef.displayName}
                  fill
                  sizes="(max-width: 1024px) 14px, 20px"
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-[7px] lg:text-[10px] font-bold text-orange-700">
                  {dish.chef.displayName[0]}
                </span>
              )}
            </div>
            <span className="text-[10px] lg:text-[12px] text-muted-foreground truncate">
              {dish.chef.displayName}
            </span>
          </div>

          {/* Rating + price row */}
          <div className="flex items-center justify-between mt-2 lg:mt-3">
            <div className="flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-[10px] lg:text-[12px] font-bold text-foreground">{rating}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-baseline gap-[2px] whitespace-nowrap">
                <span className="text-[12px] lg:text-[16px] font-extrabold text-orange-600">{dish.price}</span>
                <span className="text-[9px] lg:text-[11px] font-bold text-orange-400">MAD</span>
              </span>
              {dish.isAvailable && dish.chef.isAvailable && (
                <button
                  onClick={handleQuickAdd}
                  disabled={adding}
                  className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    added
                      ? "bg-green-500 text-white shadow-md shadow-green-500/20"
                      : "bg-orange-500 text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 hover:scale-105 active:scale-95"
                  }`}
                  aria-label="Quick add to cart"
                >
                  {adding ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : added ? (
                    <Check className="w-2.5 h-2.5 lg:w-3 lg:h-3" strokeWidth={3} />
                  ) : (
                    <Plus className="w-2.5 h-2.5 lg:w-3 lg:h-3" strokeWidth={3} />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

      </article>
    </Link>
  );
}
