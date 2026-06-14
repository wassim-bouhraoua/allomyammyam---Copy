import { prisma } from "@/lib/prisma";
import { mockChefs, mockDishes } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Star, MapPin, ChefHat, Calendar, MessageSquare, AlertCircle } from "lucide-react";
import BottomNav from "@/components/bottom-nav";
import DishCard from "@/components/dish-card";
import { getAvatarUrl } from "@/lib/upload";

interface ResolvedChef {
  id: string;
  displayName: string;
  bio: string | null;
  city: string | null;
  specialties: string[];
  bannerUrl: string | null;
  avatarUrl: string | null;
  averageRating: number;
  totalReviews: number;
  isAvailable: boolean;
  createdAt: Date;
}

export default async function ChefProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const mockChef = mockChefs.find((c) => c.id === id);
  let chef: ResolvedChef | null = null;
  let chefDishes: any[] = [];

  if (mockChef) {
    chef = {
      id: mockChef.id,
      displayName: mockChef.displayName,
      bio: mockChef.bio,
      city: mockChef.city,
      specialties: mockChef.specialties,
      bannerUrl: mockChef.bannerUrl,
      avatarUrl: mockChef.avatarUrl,
      averageRating: mockChef.averageRating,
      totalReviews: mockChef.totalReviews,
      isAvailable: mockChef.isAvailable,
      createdAt: mockChef.createdAt,
    };
    chefDishes = mockDishes.filter((d) => d.chefId === id);
  } else {
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
        bannerUrl: dbChef.bannerUrl || "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
        avatarUrl: getAvatarUrl(dbChef.avatarUrl || dbChef.user.avatar),
        averageRating: dbChef.averageRating,
        totalReviews: dbChef.totalReviews,
        isAvailable: dbChef.isAvailable,
        createdAt: dbChef.createdAt,
      };
      chefDishes = [];
    }
  }

  if (!chef) {
    notFound();
  }

  const rating = chef.averageRating.toFixed(1);
  const initials = chef.displayName[0]?.toUpperCase() || "C";
  const formattedDate = new Date(chef.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-[#FFF9F5] flex justify-center py-0 lg:py-12">
      <div className="w-full max-w-md lg:max-w-6xl bg-white min-h-screen lg:min-h-0 lg:rounded-[32px] flex flex-col relative shadow-[0_0_80px_rgba(0,0,0,0.07)] lg:border lg:border-gray-100/50 overflow-hidden pb-[78px] transition-all duration-300">
        
        {/* Banner Section */}
        <div className="relative h-48 lg:h-64 w-full bg-gray-100 flex-shrink-0">
          <Image
            src={chef.bannerUrl || "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80"}
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
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-800 hover:text-orange-500 shadow-sm active:scale-95 transition-transform"
          >
            <ArrowLeft size={18} />
          </Link>
        </div>

        {/* Hero Area */}
        <div className="px-4 lg:px-8 -mt-10 lg:-mt-14 relative z-10">
          <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.05)] border border-gray-100/80">
            {/* Mobile layout: single column. Desktop layout: two columns */}
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* LEFT COLUMN: Profile info (Avatar, Name, City, Member Since, Rating details) */}
              <div className="flex-1 lg:max-w-md flex flex-col items-center lg:items-start text-center lg:text-left lg:border-r lg:border-gray-100 lg:pr-8">
                
                {/* Avatar container */}
                <div className="relative w-24 h-24 lg:w-28 lg:h-28 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-[0_8px_24px_rgba(255,138,0,0.25)] overflow-hidden border-4 border-white mb-4 -mt-16 lg:-mt-22">
                  {chef.avatarUrl ? (
                    <Image
                      src={chef.avatarUrl}
                      alt={chef.displayName}
                      fill
                      sizes="(max-width: 768px) 96px, 112px"
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-[36px] lg:text-[42px] font-black text-white select-none leading-none">
                      {initials}
                    </span>
                  )}
                </div>

                {/* Name & Badge */}
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-[22px] lg:text-[26px] font-black text-gray-900 tracking-tight">
                    {chef.displayName}
                  </h1>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600">
                    <ChefHat size={14} />
                  </span>
                </div>

                {/* City */}
                {chef.city && (
                  <div className="flex items-center gap-1.5 text-gray-500 mb-3">
                    <MapPin size={14} className="text-orange-500" />
                    <span className="text-[13px] font-semibold">{chef.city}</span>
                  </div>
                )}

                {/* Stats quick row for mobile, detailed on desktop */}
                <div className="flex items-center gap-3 text-gray-500 text-[12px] font-semibold mb-4 lg:mb-5">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span className="text-gray-900 font-bold">{rating}</span>
                    <span className="text-gray-400">({chef.totalReviews})</span>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-250" />
                  <div className="flex items-center gap-1">
                    <Calendar size={13} className="text-gray-400" />
                    <span>Since {formattedDate}</span>
                  </div>
                </div>

                {/* Specialties Badges */}
                {chef.specialties.length > 0 && (
                  <div className="w-full">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 text-center lg:text-left">
                      Specialties
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                      {chef.specialties.map((s) => (
                        <span
                          key={s}
                          className="px-3 py-1 rounded-xl bg-orange-50/70 hover:bg-orange-50 border border-orange-100/80 text-orange-600 text-[10px] font-extrabold uppercase tracking-wide transition-colors"
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
                  <h2 className="text-[16px] lg:text-[18px] font-extrabold text-gray-900 tracking-tight mb-3">
                    About Chef {chef.displayName.replace(/^chef\s+/i, "")}
                  </h2>
                  {chef.bio ? (
                    <p className="text-[14px] text-gray-605 leading-relaxed whitespace-pre-wrap">
                      {chef.bio}
                    </p>
                  ) : (
                    <p className="text-[13px] text-gray-400 italic">
                      No bio available for this chef yet.
                    </p>
                  )}
                </div>

                {/* Chef Statistics Panel */}
                <div className="grid grid-cols-3 gap-4 bg-gray-50/85 rounded-2xl p-4 mt-6 border border-gray-100/50">
                  <div className="flex flex-col items-center justify-center text-center">
                    <span className="text-[18px] lg:text-[22px] font-black text-gray-900">
                      {chefDishes.length}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                      Dishes
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center text-center border-l border-r border-gray-200/50">
                    <span className="text-[18px] lg:text-[22px] font-black text-orange-600 flex items-center gap-0.5">
                      {rating}
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                      Rating
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center text-center">
                    <span className="text-[18px] lg:text-[22px] font-black text-gray-900">
                      {chef.totalReviews}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                      Reviews
                    </span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="px-4 lg:px-8 mt-8 pb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between pl-1">
            <h2 className="text-[18px] lg:text-[20px] font-black text-gray-900 tracking-tight">
              Menu Dishes
            </h2>
            <span className="text-[11px] font-extrabold bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
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
            <div className="flex flex-col items-center justify-center py-16 px-6 bg-white border border-gray-100 rounded-3xl shadow-sm text-center">
              <AlertCircle size={32} className="text-gray-300 mb-3" />
              <p className="text-[14px] font-extrabold text-gray-705">No dishes available</p>
              <p className="text-[12px] text-gray-400 mt-1 max-w-[240px]">
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
