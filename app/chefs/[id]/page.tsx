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
      <div className="w-full max-w-md lg:max-w-5xl bg-white min-h-screen lg:min-h-0 lg:rounded-[32px] flex flex-col relative shadow-[0_0_80px_rgba(0,0,0,0.07)] lg:border lg:border-gray-100/50 overflow-hidden pb-[78px] transition-all duration-300">
        
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

        {/* Responsive Grid */}
        <div className="flex flex-col lg:flex-row gap-6 relative z-10 lg:pb-6">
          
          {/* Left Column (Chef Bio & Stats Sidebar) */}
          <div className="w-full lg:w-80 flex-shrink-0 px-4 lg:px-0 lg:pl-6 -mt-10 lg:-mt-16">
            <div className="bg-white rounded-3xl p-5 shadow-[0_4px_28px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-[0_6px_20px_rgba(255,138,0,0.35)] overflow-hidden relative -mt-16 border-4 border-white mb-3">
                {chef.avatarUrl ? (
                  <Image
                    src={chef.avatarUrl}
                    alt={chef.displayName}
                    fill
                    sizes="80px"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <span className="text-[32px] font-black text-white select-none leading-none">
                    {initials}
                  </span>
                )}
              </div>

              {/* Chef Info */}
              <h1 className="text-[20px] font-black text-gray-900 tracking-tight flex items-center gap-1.5 justify-center">
                {chef.displayName}
                <ChefHat size={16} className="text-orange-500 flex-shrink-0" />
              </h1>

              {chef.city && (
                <div className="flex items-center gap-1.5 text-gray-500 mt-1">
                  <MapPin size={12} className="text-orange-500" />
                  <span className="text-[12px] font-semibold">{chef.city}</span>
                </div>
              )}

              {/* Stats Row */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-3.5 border-t border-b border-gray-50 py-2.5 w-full">
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span className="text-[13px] font-extrabold text-gray-900">{rating}</span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                <div className="flex items-center gap-1.5 text-gray-500">
                  <MessageSquare size={13} />
                  <span className="text-[12px] font-bold">{chef.totalReviews} reviews</span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                <div className="flex items-center gap-1 text-gray-500">
                  <Calendar size={13} />
                  <span className="text-[12px] font-bold">Joined {formattedDate}</span>
                </div>
              </div>

              {/* Bio */}
              {chef.bio && (
                <p className="text-[13px] text-gray-650 mt-4 leading-relaxed whitespace-pre-wrap max-w-xs">
                  {chef.bio}
                </p>
              )}

              {/* Specialties Chips */}
              {chef.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
                  {chef.specialties.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-100 text-orange-600 text-[10px] font-extrabold uppercase tracking-wide"
                    >
                      {s.replace(/_/g, " ").toLowerCase()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Dishes Grid) */}
          <div className="flex-1 px-4 lg:px-0 lg:pr-6 flex flex-col gap-3 lg:mt-6">
            <h2 className="text-[15px] font-black text-gray-900 tracking-tight pl-1">
              Menu Dishes
            </h2>

            {chefDishes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {chefDishes.map((dish) => (
                  <DishCard key={dish.id} dish={dish} variant="horizontal" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-6 bg-white border border-gray-100 rounded-3xl shadow-sm text-center">
                <AlertCircle size={28} className="text-gray-300 mb-2" />
                <p className="text-[13px] font-bold text-gray-500">No dishes available</p>
                <p className="text-[11px] text-gray-400 mt-1 max-w-[200px]">
                  This chef has not posted any dishes yet.
                </p>
              </div>
            )}
          </div>

        </div>

        <BottomNav />
      </div>
    </div>
  );
}
