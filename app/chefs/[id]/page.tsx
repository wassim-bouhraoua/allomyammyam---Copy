import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Star, MapPin, ChefHat, Calendar, AlertCircle } from "lucide-react";
import BottomNav from "@/components/bottom-nav";
import DishCard from "@/components/dish-card";
import { getDishImageUrl } from "@/lib/upload";
import { getChefBannerUrl, getChefAvatarUrl } from "@/lib/defaults-server";

interface ResolvedChef {
  id: string;
  displayName: string;
  bio: string | null;
  city: string | null;
  specialties: string[];
  bannerUrl: string;
  avatarUrl: string;
  averageRating: number;
  totalReviews: number;
  isAvailable: boolean;
  createdAt: Date;
  status: string;
}

export default async function ChefProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let chef: ResolvedChef | null = null;
  let chefDishes: any[] = [];

  const dbChef = await prisma.chefProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          avatar: true,
          createdAt: true,
        },
      },
    },
  });

  if (dbChef) {
    chef = {
      id: dbChef.id,
      displayName: dbChef.displayName,
      bio: dbChef.bio,
      city: dbChef.city,
      specialties: dbChef.specialties,
      bannerUrl: getChefBannerUrl(dbChef.bannerUrl),
      avatarUrl: getChefAvatarUrl(dbChef.avatarUrl || dbChef.user.avatar),
      averageRating: dbChef.averageRating,
      totalReviews: dbChef.totalReviews,
      isAvailable: dbChef.isAvailable,
      createdAt: dbChef.createdAt,
      status: dbChef.status,
    };
    const dbDishes = await prisma.dish.findMany({
      where: {
        chefId: dbChef.id,
        deletedAt: null,
        isAvailable: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    chefDishes = dbDishes.map((dish) => ({
      id: dish.id,
      name: dish.name,
      price: Number(dish.price),
      category: dish.category,
      imageUrl: getDishImageUrl(dish.imageUrl),
      averageRating: dish.averageRating,
      preparationTime: dish.preparationTime,
      isAvailable: dish.isAvailable,
      chef: {
        displayName: dbChef.displayName,
        city: dbChef.city,
        avatarUrl: getChefAvatarUrl(dbChef.avatarUrl || dbChef.user.avatar),
        isAvailable: dbChef.isAvailable,
      },
    }));
  }

  if (!chef) {
    notFound();
  }

  const rating = chef.averageRating.toFixed(1);
  const formattedDate = new Date(chef.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-background flex justify-center py-0 lg:py-12">
      <div className="w-full max-w-md lg:max-w-6xl bg-background lg:bg-card min-h-screen lg:min-h-0 lg:rounded-[32px] flex flex-col relative shadow-[0_0_80px_rgba(0,0,0,0.07)] lg:border lg:border-border overflow-hidden pb-[78px] transition-all duration-300">
        
        {/* Banner Section */}
        <div className="relative h-48 lg:h-64 w-full bg-gray-100 flex-shrink-0">
          <Image
            src={chef.bannerUrl}
            alt={chef.displayName}
            fill
            priority
            unoptimized
            className="object-cover"
          />
          {/* Blur Overlay */}
          <div className="absolute inset-0 bg-black/15" />

          {/* Floating Back Button */}
          <Link
            href="/"
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center text-foreground hover:text-orange-500 shadow-sm active:scale-95 transition-transform border border-border/40"
          >
            <ArrowLeft size={18} />
          </Link>
        </div>

        {/* Hero Area */}
        <div className="px-4 lg:px-8 -mt-10 lg:-mt-14 relative z-10">
          <div className="bg-card rounded-3xl p-6 lg:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.05)] border border-border">
            {/* Mobile layout: single column. Desktop layout: two columns */}
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* LEFT COLUMN: Profile info (Avatar, Name, City, Member Since, Rating details) */}
              <div className="flex-1 lg:max-w-md flex flex-col items-center lg:items-start text-center lg:text-left lg:border-r lg:border-border lg:pr-8">
                
                {/* Avatar container */}
                <div className="relative w-24 h-24 lg:w-28 lg:h-28 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-[0_8px_24px_rgba(255,138,0,0.25)] overflow-hidden border-4 border-card mb-4 -mt-16 lg:-mt-22">
                  <Image
                    src={chef.avatarUrl}
                    alt={chef.displayName}
                    fill
                    sizes="(max-width: 768px) 96px, 112px"
                    unoptimized
                    className="object-cover"
                  />
                </div>

                {/* Name & Badge */}
                <div className="flex flex-wrap items-center gap-2 mb-1 justify-center lg:justify-start">
                  <h1 className="text-[22px] lg:text-[26px] font-black text-foreground tracking-tight">
                    {chef.displayName}
                  </h1>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400">
                    <ChefHat size={14} />
                  </span>
                  
                  {/* Status badge */}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    chef.status === "APPROVED"
                      ? "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30"
                      : chef.status === "SUSPENDED"
                      ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30"
                      : "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30"
                  }`}>
                    {chef.status}
                  </span>
                </div>

                {/* City */}
                {chef.city && (
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
                    <MapPin size={14} className="text-orange-500" />
                    <span className="text-[13px] font-semibold">{chef.city}</span>
                  </div>
                )}

                {/* Stats quick row for mobile, detailed on desktop */}
                <div className="flex items-center gap-3 text-muted-foreground text-[12px] font-semibold mb-4 lg:mb-5">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span className="text-foreground font-bold">{rating}</span>
                    <span className="text-muted-foreground">({chef.totalReviews})</span>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-border" />
                  <div className="flex items-center gap-1">
                    <Calendar size={13} className="text-muted-foreground" />
                    <span>Since {formattedDate}</span>
                  </div>
                </div>

                {/* Specialties Badges */}
                {chef.specialties.length > 0 && (
                  <div className="w-full">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 text-center lg:text-left">
                      Specialties
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                      {chef.specialties.map((s) => (
                        <span
                          key={s}
                          className="px-3 py-1 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 hover:bg-orange-50 border border-orange-100/80 dark:border-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-extrabold uppercase tracking-wide transition-colors"
                        >
                          {s.replace(/_/g, " ").toLowerCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* RIGHT COLUMN: Bio / About & Marketplace Stats */}
              <div className="flex-1 flex flex-col justify-between pt-2">
                
                {/* About Chef section */}
                <div>
                  <h2 className="text-[16px] lg:text-[18px] font-extrabold text-foreground tracking-tight mb-3">
                    About Chef {chef.displayName.replace(/^chef\s+/i, "")}
                  </h2>
                  {chef.bio ? (
                    <p className="text-[14px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {chef.bio}
                    </p>
                  ) : (
                    <p className="text-[13px] text-muted-foreground italic">
                      No bio available for this chef yet.
                    </p>
                  )}
                </div>

                {/* Chef Statistics Panel */}
                <div className="grid grid-cols-3 gap-4 bg-secondary/40 dark:bg-secondary/15 rounded-2xl p-4 mt-6 border border-border">
                  <div className="flex flex-col items-center justify-center text-center">
                    <span className="text-[18px] lg:text-[22px] font-black text-foreground">
                      {chefDishes.length}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                      Dishes
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center text-center border-l border-r border-border">
                    <span className="text-[18px] lg:text-[22px] font-black text-orange-600 flex items-center gap-0.5">
                      {rating}
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                      Rating
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center text-center">
                    <span className="text-[18px] lg:text-[22px] font-black text-foreground">
                      {chef.totalReviews}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                      Reviews
                    </span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* Chef Unavailable Status Banner */}
        {!chef.isAvailable && (
          <div className="px-4 lg:px-8 mt-4 z-10">
            <div className="flex items-center gap-3 bg-secondary/80 border border-border rounded-2xl p-4 text-muted-foreground shadow-sm">
              <AlertCircle size={20} className="text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Currently Not Accepting Orders</p>
                <p className="text-[12px] mt-0.5">This chef is offline. You can still browse the menu, but placing orders is temporarily disabled.</p>
              </div>
            </div>
          </div>
        )}

        {/* Menu Section */}
        <div className="px-4 lg:px-8 mt-8 pb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between pl-1">
            <h2 className="text-[18px] lg:text-[20px] font-black text-foreground tracking-tight">
              Menu Dishes
            </h2>
            <span className="text-[11px] font-extrabold bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {chefDishes.length} {chefDishes.length === 1 ? "dish" : "dishes"}
            </span>
          </div>

          {chefDishes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {chefDishes.map((dish) => (
                <DishCard key={dish.id} dish={dish} variant="horizontal" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6 bg-card border border-border rounded-3xl shadow-sm text-center">
              <AlertCircle size={32} className="text-muted-foreground/50 mb-3" />
              <p className="text-[14px] font-extrabold text-foreground">No dishes available</p>
              <p className="text-[12px] text-muted-foreground mt-1 max-w-[240px]">
                This chef has not posted any dishes yet.
              </p>
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
