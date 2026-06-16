"use client";
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin } from "lucide-react";
interface ChefCardProps {
  chef: {
    id: string;
    displayName: string;
    bannerUrl: string | null;
    avatarUrl: string | null;
    isAvailable: boolean;
    city: string | null;
    averageRating: number;
    specialties: string[];
  };
  onBook?: (id: string) => void;
}

export default function ChefCard({ chef, onBook }: ChefCardProps) {
  const rating = chef.averageRating.toFixed(1);
  const specialtiesLabel = chef.specialties
    .slice(0, 2)
    .map((s) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()))
    .join(" · ");

  return (
    <article className="flex items-center gap-3 bg-white dark:bg-neutral-800 rounded-2xl p-3 shadow-[0_2px_14px_rgba(0,0,0,0.07)] border border-gray-50 dark:border-neutral-700">
      <Link
        href={`/chefs/${chef.id}`}
        className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-90 transition-opacity active:scale-[0.99]"
      >
        {/* Chef thumbnail — banner as background, avatar as overlay */}
        <div className="relative w-[68px] h-[68px] rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-neutral-900">
          {chef.bannerUrl && (
            <Image
              src={chef.bannerUrl}
              alt={chef.displayName}
              fill
              sizes="68px"
              className="object-cover"
            />
          )}
          {/* Avatar overlay */}
          {chef.avatarUrl && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-white dark:border-neutral-800 overflow-hidden shadow-sm">
              <Image
                src={chef.avatarUrl}
                alt={chef.displayName}
                fill
                sizes="28px"
                className="object-cover"
              />
            </div>
          )}
          {/* Availability dot */}
          <div
            className={`absolute top-1.5 left-1.5 w-2 h-2 rounded-full border-[1.5px] border-white dark:border-neutral-800 ${
              chef.isAvailable ? "bg-orange-500" : "bg-gray-400"
            }`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-bold text-gray-900 dark:text-neutral-100 truncate">{chef.displayName}</h3>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={9} className="text-orange-500 flex-shrink-0" />
            <span className="text-[11px] text-gray-500 dark:text-neutral-400 truncate">{chef.city}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Star size={9} className="text-amber-400 fill-amber-400" />
            <span className="text-[11px] font-semibold text-gray-700 dark:text-neutral-300">{rating}</span>
            <span className="text-[10px] text-gray-500 dark:text-neutral-400">· {specialtiesLabel}</span>
          </div>
        </div>
      </Link>

      {/* Book button */}
      <button
        onClick={() => onBook?.(chef.id)}
        disabled={!chef.isAvailable}
        className={`flex-shrink-0 text-[11px] font-bold px-4 py-2 rounded-xl transition-all duration-150 active:scale-95 ${
          chef.isAvailable
            ? "bg-orange-500 text-white shadow-[0_4px_12px_rgba(255,138,0,0.35)]"
            : "bg-gray-100 dark:bg-neutral-900 text-gray-500 dark:text-neutral-600 cursor-not-allowed"
        }`}
      >
        {chef.isAvailable ? "Book" : "Closed"}
      </button>
    </article>
  );
}
