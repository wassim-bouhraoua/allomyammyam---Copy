import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import DishDetailClient from "./dish-detail-client";
import { getAvatarUrl, getDishImageUrl } from "@/lib/upload";

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
      avatarUrl: getAvatarUrl(dish.chef.avatarUrl || dish.chef.user.avatar),
      bannerUrl: dish.chef.bannerUrl,
      bio: dish.chef.bio,
      averageRating: dish.chef.averageRating,
      totalReviews: dish.chef.totalReviews,
      city: dish.chef.city,
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
      avatarUrl: getAvatarUrl(d.chef.avatarUrl || d.chef.user.avatar),
    },
  }));

  return <DishDetailClient dish={detailDish} related={exploreRelated} />;
}
