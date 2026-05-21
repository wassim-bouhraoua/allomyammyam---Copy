"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Clock, MapPin } from "lucide-react";
import { MockDish } from "@/lib/mock-data";

interface DishCardProps {
  dish: MockDish;
  variant?: "vertical" | "horizontal";
}

export default function DishCard({ dish, variant = "vertical" }: DishCardProps) {
  const formattedPrice = `${dish.price} MAD`;
  const rating = dish.averageRating.toFixed(1);

  if (variant === "horizontal") {
    return (
      <Link href={`/dishes/${dish.id}`} className="block">
        <article className="flex gap-3 bg-white rounded-2xl p-3 shadow-[0_2px_16px_rgba(0,0,0,0.07)] border border-gray-50 active:scale-[0.985] transition-transform duration-150">
          {/* Image */}
          <div className="relative w-[84px] h-[84px] rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
            {dish.imageUrl && (
              <Image
                src={dish.imageUrl}
                alt={dish.name}
                fill
                sizes="84px"
                className="object-cover"
              />
            )}
            {!dish.isAvailable && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white text-[9px] font-bold uppercase tracking-wide">Sold out</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
            <div>
              <h3 className="text-[13px] font-bold text-gray-900 leading-snug truncate">{dish.name}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={9} className="text-emerald-500 flex-shrink-0" />
                <span className="text-[11px] text-gray-400 truncate">{dish.chef.displayName} · {dish.chef.city}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-0.5 text-[11px] font-semibold text-gray-700">
                  <Star size={10} className="text-amber-400 fill-amber-400" />
                  {rating}
                </span>
                <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                  <Clock size={9} className="text-gray-300" />
                  {dish.preparationTime}m
                </span>
              </div>
              <span className="text-[13px] font-extrabold text-emerald-600">{formattedPrice}</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // Vertical (default — used inside horizontal scroll sections)
  return (
    <Link href={`/dishes/${dish.id}`} className="block">
      <article className="w-[152px] flex-shrink-0 bg-white rounded-2xl overflow-hidden shadow-[0_2px_18px_rgba(0,0,0,0.09)] border border-gray-50 active:scale-[0.96] transition-transform duration-150">
        {/* Image */}
        <div className="relative w-full h-[112px] bg-gray-100 overflow-hidden">
          {dish.imageUrl && (
            <Image
              src={dish.imageUrl}
              alt={dish.name}
              fill
              sizes="152px"
              className="object-cover"
            />
          )}
          {/* Prep time pill */}
          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-0.5">
            <Clock size={8} className="text-white" />
            <span className="text-[9px] font-bold text-white">{dish.preparationTime}m</span>
          </div>
          {/* Unavailable overlay */}
          {!dish.isAvailable && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold uppercase tracking-wide">Sold out</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-2.5 pt-2">
          <h3 className="text-[12px] font-bold text-gray-900 leading-tight line-clamp-1">{dish.name}</h3>
          <div className="flex items-center gap-1 mt-1">
            {dish.chef.avatarUrl ? (
              <div className="relative w-3.5 h-3.5 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={dish.chef.avatarUrl}
                  alt={dish.chef.displayName}
                  fill
                  sizes="14px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-[7px] font-bold text-emerald-700">{dish.chef.displayName[0]}</span>
              </div>
            )}
            <span className="text-[10px] text-gray-400 truncate">{dish.chef.displayName}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-0.5">
              <Star size={9} className="text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-bold text-gray-700">{rating}</span>
            </div>
            <span className="text-[12px] font-extrabold text-emerald-600">{formattedPrice}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
