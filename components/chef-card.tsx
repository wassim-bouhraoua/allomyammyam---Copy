"use client";
import Image from "next/image";
import { Star, MapPin } from "lucide-react";
import { MockChefProfile } from "@/lib/mock-data";

interface ChefCardProps {
  chef: MockChefProfile;
  onBook?: (id: string) => void;
}

export default function ChefCard({ chef, onBook }: ChefCardProps) {
  const rating = chef.averageRating.toFixed(1);
  const specialtiesLabel = chef.specialties
    .slice(0, 2)
    .map((s) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()))
    .join(" · ");

  return (
    <article className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-[0_2px_14px_rgba(0,0,0,0.07)] border border-gray-50">
      {/* Chef thumbnail — banner as background, avatar as overlay */}
      <div className="relative w-[68px] h-[68px] rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
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
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-white overflow-hidden shadow-sm">
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
          className={`absolute top-1.5 left-1.5 w-2 h-2 rounded-full border-[1.5px] border-white ${
            chef.isAvailable ? "bg-emerald-500" : "bg-gray-400"
          }`}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[13px] font-bold text-gray-900 truncate">{chef.displayName}</h3>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin size={9} className="text-emerald-500 flex-shrink-0" />
          <span className="text-[11px] text-gray-400 truncate">{chef.city}</span>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <Star size={9} className="text-amber-400 fill-amber-400" />
          <span className="text-[11px] font-semibold text-gray-700">{rating}</span>
          <span className="text-[10px] text-gray-400">· {specialtiesLabel}</span>
        </div>
      </div>

      {/* Book button */}
      <button
        onClick={() => onBook?.(chef.id)}
        disabled={!chef.isAvailable}
        className={`flex-shrink-0 text-[11px] font-bold px-4 py-2 rounded-xl transition-all duration-150 active:scale-95 ${
          chef.isAvailable
            ? "bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.35)]"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        {chef.isAvailable ? "Book" : "Closed"}
      </button>
    </article>
  );
}
