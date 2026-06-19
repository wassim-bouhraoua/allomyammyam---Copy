import Link from "next/link";
import { MapPin, Search, SlidersHorizontal } from "lucide-react";

import BottomNav from "@/components/bottom-nav";
import HeroBanner from "@/components/hero-banner";
import HomeSection from "@/components/home-section";
import DishCard from "@/components/dish-card";
import ChefCard from "@/components/chef-card";
import MobileHeader from "@/components/mobile-header";

import { prisma } from "@/lib/prisma";
import { getAvatarUrl, getDishImageUrl } from "@/lib/upload";

export default async function HomePage() {
  // Fetch approved chefs from database (Top Chefs / Booking Restaurant)
  const dbChefs = await prisma.chefProfile.findMany({
    where: {
      status: "APPROVED",
      deletedAt: null,
    },
    include: {
      user: {
        select: {
          avatar: true,
        },
      },
    },
    take: 4,
    orderBy: {
      averageRating: "desc",
    },
  });

  const chefs = dbChefs.map((c) => ({
    id: c.id,
    userId: c.userId,
    displayName: c.displayName,
    bio: c.bio,
    specialties: c.specialties,
    city: c.city,
    bannerUrl: c.bannerUrl,
    avatarUrl: getAvatarUrl(c.avatarUrl || c.user.avatar),
    averageRating: c.averageRating,
    totalReviews: c.totalReviews,
    status: c.status,
    isAvailable: c.isAvailable,
    deletedAt: c.deletedAt,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));

  // Fetch newest active dishes from approved chefs (New Today Arrivals)
  const dbNewDishes = await prisma.dish.findMany({
    where: {
      deletedAt: null,
      isAvailable: true,
      chef: {
        status: "APPROVED",
        deletedAt: null,
      },
    },
    include: {
      chef: {
        select: {
          displayName: true,
          city: true,
          avatarUrl: true,
          user: {
            select: {
              avatar: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  const newDishes = dbNewDishes.map((dish) => ({
    id: dish.id,
    name: dish.name,
    price: Number(dish.price),
    category: dish.category,
    imageUrl: getDishImageUrl(dish.imageUrl),
    averageRating: dish.averageRating,
    preparationTime: dish.preparationTime,
    isAvailable: dish.isAvailable,
    chef: {
      displayName: dish.chef.displayName,
      city: dish.chef.city,
      avatarUrl: getAvatarUrl(dish.chef.avatarUrl || dish.chef.user.avatar),
    },
  }));

  // Fetch top rated active dishes from approved chefs (Top Rated)
  // Fallback ordering: averageRating desc, then createdAt desc (newest first)
  const dbTopRatedDishes = await prisma.dish.findMany({
    where: {
      deletedAt: null,
      isAvailable: true,
      chef: {
        status: "APPROVED",
        deletedAt: null,
      },
    },
    include: {
      chef: {
        select: {
          displayName: true,
          city: true,
          avatarUrl: true,
          user: {
            select: {
              avatar: true,
            },
          },
        },
      },
    },
    orderBy: [
      { averageRating: "desc" },
      { createdAt: "desc" },
    ],
    take: 10,
  });

  const topRatedDishes = dbTopRatedDishes.map((dish) => ({
    id: dish.id,
    name: dish.name,
    price: Number(dish.price),
    category: dish.category,
    imageUrl: getDishImageUrl(dish.imageUrl),
    averageRating: dish.averageRating,
    preparationTime: dish.preparationTime,
    isAvailable: dish.isAvailable,
    chef: {
      displayName: dish.chef.displayName,
      city: dish.chef.city,
      avatarUrl: getAvatarUrl(dish.chef.avatarUrl || dish.chef.user.avatar),
    },
  }));

  return (
    <div className="bg-background min-h-screen">

      {/* ── Desktop: two-column shell. Mobile: single column. ── */}
      <div className="max-w-[90rem] mx-auto min-h-screen flex gap-8 px-0 lg:px-8 lg:py-8">

        {/* ── Left sidebar — desktop only ─────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 gap-6 sticky top-8 self-start">

          {/* Brand */}
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-[0_4px_12px_rgba(255,138,0,0.38)]">
              <span className="text-white text-sm font-black">A</span>
            </div>
            <span className="text-[17px] font-black text-foreground">AlloMyamMyam</span>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-1">
            {[
              { label: "Home", href: "/" },
              { label: "Dishes", href: "/dishes" },
              { label: "Orders", href: "/orders" },
              { label: "Profile", href: "/profile" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="px-4 py-2.5 rounded-2xl text-[14px] font-semibold text-muted-foreground hover:bg-card hover:text-orange-500 hover:shadow-sm transition-all duration-150"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Location pill */}
          <div className="flex items-center gap-2 px-4 py-3 bg-card rounded-2xl border border-border shadow-sm">
            <MapPin size={13} className="text-orange-500 flex-shrink-0" fill="currentColor" />
            <span className="text-[13px] font-bold text-foreground truncate">Oujda, Oriental</span>
          </div>
        </aside>

        {/* ── Main content column ──────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Mobile shell — unchanged */}
          <div className="lg:hidden bg-background min-h-screen flex flex-col relative shadow-[0_0_80px_rgba(0,0,0,0.07)]">
            <main className="flex-1 overflow-y-auto pb-[78px]">
              <MobileHeader />
              <SearchBar />
              <HeroBanner />
              <HomeSections chefs={chefs} newDishes={newDishes} topRatedDishes={topRatedDishes} />
            </main>
            <BottomNav />
          </div>

          {/* Desktop content — no mobile chrome ─────────────────────────── */}
          <div className="hidden lg:block">
            <DesktopSearchBar />
            <HeroBanner />
            <HomeSections chefs={chefs} newDishes={newDishes} topRatedDishes={topRatedDishes} />
            {/* Bottom padding so last section doesn't hug viewport edge */}
            <div className="h-12" />
          </div>

        </div>

        {/* ── Right panel — desktop only ───────────────────────────────────── */}
        <aside className="hidden xl:flex flex-col w-72 flex-shrink-0 gap-4 sticky top-8 self-start">
          <div className="bg-card rounded-3xl border border-border shadow-sm p-5">
            <p className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mb-3">
              Top Chefs
            </p>
            <div className="flex flex-col gap-3">
              {chefs.length > 0 ? (
                chefs.map((chef) => (
                  <ChefCard key={chef.id} chef={chef} />
                ))
              ) : (
                <div className="text-[11px] text-muted-foreground italic text-center py-4">
                  No top chefs available.
                </div>
              )}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}

/* ─── Extracted shared sections ─────────────────────────────────────────── */



function SearchBar() {
  return (
    <div className="flex items-center gap-2.5 px-4 mb-4">
      <Link
        href="/dishes"
        className="flex-1 flex items-center gap-2.5 bg-secondary rounded-2xl px-4 h-11 active:bg-secondary/80 transition-colors"
      >
        <Search size={15} className="text-muted-foreground flex-shrink-0" />
        <span className="text-sm text-muted-foreground font-medium">Search dishes or chefs...</span>
      </Link>
      <Link
        href="/dishes"
        className="w-11 h-11 rounded-2xl bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-[0_4px_14px_rgba(255,138,0,0.38)] active:scale-95 transition-transform duration-150"
        aria-label="Filter dishes"
      >
        <SlidersHorizontal size={17} className="text-white" />
      </Link>
    </div>
  );
}

function DesktopSearchBar() {
  return (
    <div className="flex items-center gap-3 mb-6">
      <Link
        href="/dishes"
        className="flex-1 flex items-center gap-3 bg-card border border-border rounded-2xl px-5 h-12 hover:border-orange-300 transition-colors shadow-sm"
      >
        <Search size={16} className="text-muted-foreground flex-shrink-0" />
        <span className="text-[14px] text-muted-foreground font-medium">Search dishes or chefs...</span>
      </Link>
      <Link
        href="/dishes"
        className="h-12 px-5 rounded-2xl bg-orange-500 flex items-center gap-2 flex-shrink-0 shadow-[0_4px_14px_rgba(255,138,0,0.38)] hover:bg-orange-600 transition-colors"
        aria-label="Filter dishes"
      >
        <SlidersHorizontal size={16} className="text-white" />
        <span className="text-[14px] font-bold text-white">Filter</span>
      </Link>
    </div>
  );
}

function HomeSections({
  chefs,
  newDishes,
  topRatedDishes,
}: {
  chefs: any[];
  newDishes: any[];
  topRatedDishes: any[];
}) {
  return (
    <>
      <HomeSection
        title="New Today Arrivals"
        subtitle="Fresh dishes added today"
        href="/dishes?filter=new"
      >
        {newDishes.length > 0 ? (
          newDishes.map((dish) => (
            <DishCard key={dish.id} dish={dish} variant="vertical" />
          ))
        ) : (
          <div className="text-[12px] text-muted-foreground italic px-4 py-2">
            No new dishes available today.
          </div>
        )}
      </HomeSection>

      <HomeSection
        title="Top Rated"
        subtitle="Highest rated dishes on the platform"
        href="/dishes?filter=top-rated"
      >
        {topRatedDishes.length > 0 ? (
          topRatedDishes.map((dish) => (
            <DishCard key={dish.id} dish={dish} variant="vertical" />
          ))
        ) : (
          <div className="text-[12px] text-muted-foreground italic px-4 py-2">
            No top rated dishes available.
          </div>
        )}
      </HomeSection>

      {/* Booking Restaurant — hidden on desktop (moved to right sidebar) */}
      <div className="lg:hidden">
        <HomeSection
          title="Booking Restaurant"
          subtitle="Check your city nearby restaurants"
          href="/restaurants"
          scrollable={false}
        >
          {chefs.length > 0 ? (
            chefs.map((chef) => (
              <ChefCard key={chef.id} chef={chef} />
            ))
          ) : (
            <div className="text-[12px] text-muted-foreground italic px-4 py-2">
              No restaurants available.
            </div>
          )}
        </HomeSection>
      </div>
    </>
  );
}