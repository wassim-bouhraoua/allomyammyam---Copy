import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import DishDetailClient from "./dish-detail-client";
import { getAvatarUrl, getDishImageUrl } from "@/lib/upload";
import { getChefBannerUrl, getChefAvatarUrl } from "@/lib/defaults-server";

export const dynamic = "force-dynamic";

export default async function DishDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const dish = await prisma.dish.findFirst({
    where: {
      id,
      deletedAt: null,
      isAvailable: true,
      chef: {
        status: "APPROVED",
      },
    },
    include: {
      chef: {
        include: {
          user: {
            select: {
              avatar: true,
            },
          },
        },
      },
    },
  });

  if (!dish) {
    notFound();
  }

  // Fetch related dishes in the same category
  const relatedDishes = await prisma.dish.findMany({
    where: {
      id: { not: id },
      category: dish.category,
      deletedAt: null,
      isAvailable: true,
      chef: {
        status: "APPROVED",
      },
    },
    include: {
      chef: {
        include: {
          user: {
            select: {
              avatar: true,
            },
          },
        },
      },
    },
    take: 6,
  });

  const detailDish = {
    id: dish.id,
    name: dish.name,
    description: dish.description,
    price: Number(dish.price),
    category: dish.category,
    imageUrl: getDishImageUrl(dish.imageUrl),
    averageRating: dish.averageRating,
    totalReviews: dish.totalReviews,
    isAvailable: dish.isAvailable,
    stockCount: dish.stockCount,
    preparationTime: dish.preparationTime,
    tags: dish.tags,
    nutrition: {
      calories: dish.calories,
      protein: dish.protein,
      carbs: dish.carbs,
      fat: dish.fat,
      sugar: dish.sugar,
    },
    chef: {
      id: dish.chef.id,
      displayName: dish.chef.displayName,
      avatarUrl: getChefAvatarUrl(dish.chef.avatarUrl || dish.chef.user.avatar),
      bannerUrl: getChefBannerUrl(dish.chef.bannerUrl),
      bio: dish.chef.bio,
      averageRating: dish.chef.averageRating,
      totalReviews: dish.chef.totalReviews,
      city: dish.chef.city,
      isAvailable: dish.chef.isAvailable,
    },
  };

  const exploreRelated = relatedDishes.map((d) => ({
    id: d.id,
    name: d.name,
    price: Number(d.price),
    category: d.category,
    imageUrl: getDishImageUrl(d.imageUrl),
    averageRating: d.averageRating,
    preparationTime: d.preparationTime,
    isAvailable: d.isAvailable,
    chef: {
      displayName: d.chef.displayName,
      city: d.chef.city,
      avatarUrl: getChefAvatarUrl(d.chef.avatarUrl || d.chef.user.avatar),
      isAvailable: d.chef.isAvailable,
    },
  }));

  const dbReviews = await prisma.dishReview.findMany({
    where: {
      orderItem: {
        dishId: id,
      },
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const reviews = dbReviews.map((r) => ({
    id: r.id,
    authorName: `${r.user.firstName} ${r.user.lastName ? r.user.lastName[0] + "." : ""}`,
    initial: r.user.firstName?.[0]?.toUpperCase() || "U",
    rating: r.rating,
    comment: r.comment || "",
    date: r.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    verifiedOrder: true,
  }));

  return <DishDetailClient dish={detailDish} related={exploreRelated} reviews={reviews} />;
}
