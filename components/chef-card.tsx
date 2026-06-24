"use client";
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin } from "lucide-react";
import { getChefAvatarUrl } from "@/lib/defaults";

import { useTranslation } from "@/context/I18nContext";

export interface ChefCardData {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  isAvailable: boolean;
  city: string | null;
  averageRating: number;
  specialties: string[];
}

interface ChefCardProps {
  chef: ChefCardData;
}

export default function ChefCard({ chef }: ChefCardProps) {
  const { dict } = useTranslation();
  const rating = chef.averageRating.toFixed(1);
  const specialtiesLabel = chef.specialties
    .slice(0, 2)
    .map((s) => s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()))
    .join(" · ");

  return (
    <Link href={`/chefs/${chef.id}`} className="block group">
      <article className="flex items-center gap-3 bg-card rounded-2xl p-3 shadow-[0_2px_14px_rgba(0,0,0,0.07)] border border-border transition-all duration-150 hover:shadow-[0_4px_22px_rgba(0,0,0,0.12)] hover:border-orange-200 dark:hover:border-neutral-800 active:scale-[0.99] cursor-pointer">
        {/* Chef thumbnail — avatar as main image */}
        <div className="relative w-[68px] h-[68px] rounded-xl overflow-hidden flex-shrink-0 bg-secondary">
          <Image
            src={getChefAvatarUrl(chef.avatarUrl)}
            alt={chef.displayName}
            fill
            sizes="68px"
            className="object-cover"
          />
          {/* Availability dot */}
          <div
            className={`absolute top-1.5 left-1.5 w-2 h-2 rounded-full border-[1.5px] border-card ${
              chef.isAvailable ? "bg-green-500" : "bg-gray-400"
            }`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-bold text-foreground truncate">{chef.displayName}</h3>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={9} className="text-orange-500 flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground truncate">{chef.city}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Star size={9} className="text-amber-400 fill-amber-400" />
            <span className="text-[11px] font-semibold text-foreground">{rating}</span>
            <span className="text-[10px] text-muted-foreground">· {specialtiesLabel}</span>
          </div>
        </div>

        {/* View Menu badge (styled span to avoid nesting button inside link) */}
        <span
          className={`flex-shrink-0 text-[11px] font-bold px-4 py-2 rounded-xl transition-all duration-150 ${
            chef.isAvailable
              ? "bg-orange-500 text-white shadow-[0_4px_12px_rgba(255,138,0,0.30)] group-hover:bg-orange-600 group-hover:shadow-[0_4px_14px_rgba(255,138,0,0.40)]"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          {chef.isAvailable ? dict.common.view : dict.common.closed}
        </span>
      </article>
    </Link>
  );
}
