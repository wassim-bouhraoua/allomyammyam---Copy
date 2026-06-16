"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Star, Clock, MapPin } from "lucide-react";
interface DishCardProps {
  dish: {
    id: string;
    name: string;
    price: number | string;
    averageRating: number;
    imageUrl: string | null;
    isAvailable: boolean;
    preparationTime: number;
    chef: {
      displayName: string;
      city: string | null;
      avatarUrl: string | null;
    };
  };
  variant?: "vertical" | "horizontal";
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
        <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-neutral-800" />
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

  // ── Horizontal variant — used in the dishes listing page ─────────────────
  if (variant === "horizontal") {
    return (
      <Link href={`/dishes/${dish.id}`} className="block">
        {/*
          overflow-hidden is NOT on this article — it would clip the
          active:scale shadow. Only the image container clips.
        */}
        <article className="flex gap-4 bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-[0_2px_16px_rgba(0,0,0,0.07)] border border-gray-50 dark:border-neutral-700 active:scale-[0.985] transition-transform duration-150">

          {/* Image container
              - explicit w/h in px locks the aspect ratio regardless of content
              - flex-shrink-0 prevents the container from narrowing under text pressure
              - overflow-hidden here only, not on article
              - bg-gray-100 is the loading skeleton color
          */}
          <div className="relative w-[112px] h-[112px] rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-neutral-900">
            {dish.imageUrl ? (
              <ImageWithFade
                src={dish.imageUrl}
                alt={dish.name}
                sizes="112px"
              />
            ) : (
              // No-image fallback — emoji centered on gray background
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl opacity-30">🍽️</span>
              </div>
            )}
            {!dish.isAvailable && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                <span className="text-white text-[10px] font-bold uppercase tracking-widest">
                  Sold out
                </span>
              </div>
            )}
          </div>

          {/* Content
              min-w-0 is critical — prevents flex children from overflowing
              when dish name or chef name is long.
          */}
          <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
            <div>
              <h3 className="text-[14px] font-bold text-gray-900 dark:text-neutral-100 leading-snug line-clamp-2">
                {dish.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin size={10} className="text-orange-500 flex-shrink-0" />
                <span className="text-[12px] text-gray-500 dark:text-neutral-400 truncate">
                  {dish.chef.displayName} · {dish.chef.city}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 mt-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex items-center gap-0.5 text-[12px] font-semibold text-gray-700 dark:text-neutral-300 flex-shrink-0">
                  <Star size={11} className="text-amber-400 fill-amber-400" />
                  {rating}
                </span>
                <span className="flex items-center gap-0.5 text-[12px] text-gray-500 dark:text-neutral-400 min-w-0 truncate">
                  <Clock size={10} className="text-gray-300 flex-shrink-0" />
                  <span className="truncate">{dish.preparationTime}m</span>
                </span>
              </div>
              <span className="text-[14px] font-extrabold text-orange-600 whitespace-nowrap flex-shrink-0 text-right">
                {formattedPrice}
              </span>
            </div>
          </div>

        </article>
      </Link>
    );
  }

  // ── Vertical variant — used in horizontal scroll sections on homepage ─────
  return (
    <Link href={`/dishes/${dish.id}`} className="block">
      {/*
        Key fix: overflow-hidden removed from article.
        It was clipping the box-shadow during active:scale on mobile.
        Each internal zone handles its own clipping.
      */}
      <article className="w-[152px] flex-shrink-0 bg-white dark:bg-neutral-800 rounded-2xl shadow-[0_2px_18px_rgba(0,0,0,0.09)] border border-gray-50 dark:border-neutral-700 hover:-translate-y-0.5 active:scale-[0.97] transition-transform duration-150">

        {/* Image container
            - rounded-t-2xl matches article top radius since article no longer clips
            - aspect-ratio as inline style is the most reliable cross-browser fallback
              for fixed-height containers with fill images on mobile Safari
            - overflow-hidden here only
        */}
        <div
          className="relative w-full rounded-t-2xl overflow-hidden bg-gray-100 dark:bg-neutral-900"
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

          {/* Sold out overlay */}
          {!dish.isAvailable && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold uppercase tracking-widest">
                Sold out
              </span>
            </div>
          )}
        </div>

        {/* Content — explicit padding so nothing collapses */}
        <div className="p-2.5 pt-2">
          <h3 className="text-[12px] font-bold text-gray-900 dark:text-neutral-100 leading-tight line-clamp-1">
            {dish.name}
          </h3>

          {/* Chef row */}
          <div className="flex items-center gap-1 mt-1">
            <div className="relative w-3.5 h-3.5 rounded-full overflow-hidden flex-shrink-0 bg-orange-100">
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
            <span className="text-[10px] text-gray-500 dark:text-neutral-400 truncate">
              {dish.chef.displayName}
            </span>
          </div>

          {/* Rating + price row */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-0.5">
              <Star size={9} className="text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-bold text-gray-700 dark:text-neutral-350">{rating}</span>
            </div>
            <span className="flex items-baseline gap-[2px] whitespace-nowrap">
              <span className="text-[12px] font-extrabold text-orange-600">{dish.price}</span>
              <span className="text-[9px] font-bold text-orange-400">MAD</span>
            </span>
          </div>
        </div>

      </article>
    </Link>
  );
}
