import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAvatarUrl } from "@/lib/upload";
import DishDetailClient, { DetailDish } from "./dish-detail-client";

function relevanceScore(
  current: { category: string; tags: string[]; chefId: string },
  candidate: { category: string; tags: string[]; chefId: string }
): number {
  let score = 0;
  if (candidate.category === current.category) score += 10;
  const tagOverlap = candidate.tags.filter((t) => current.tags.includes(t)).length;
  score += tagOverlap * 2;
  if (candidate.chefId === current.chefId) score += 1;
  return score;
}

export default async function DishDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const dbDish = await prisma.dish.findFirst({
    where: {
      id,
      deletedAt: null,
      isAvailable: true,
      chef: {
        status: "APPROVED",
        deletedAt: null,
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

  if (!dbDish) {
    notFound();
  }

  const dish: DetailDish = {
    id: dbDish.id,
    name: dbDish.name,
    description: dbDish.description,
    price: Number(dbDish.price),
    category: dbDish.category,
    imageUrl: dbDish.imageUrl,
    averageRating: dbDish.averageRating,
    totalReviews: dbDish.totalReviews,
    isAvailable: dbDish.isAvailable,
    stockCount: dbDish.stockCount,
    preparationTime: dbDish.preparationTime,
    tags: dbDish.tags,
    nutrition: { calories: 380, protein: 18, carbs: 42, fat: 12, sugar: 4 }, // fallback/default nutrition as specified
    chef: {
      id: dbDish.chef.id,
      displayName: dbDish.chef.displayName,
      avatarUrl: getAvatarUrl(dbDish.chef.avatarUrl || dbDish.chef.user.avatar),
      bannerUrl: dbDish.chef.bannerUrl || "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
      bio: dbDish.chef.bio,
      averageRating: dbDish.chef.averageRating,
      totalReviews: dbDish.chef.totalReviews,
      city: dbDish.chef.city,
    },
  };

  const candidateDishes = await prisma.dish.findMany({
    where: {
      id: { not: dbDish.id },
      deletedAt: null,
      isAvailable: true,
      chef: {
        status: "APPROVED",
        deletedAt: null,
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

  const related = candidateDishes
    .map((d) => ({
      dish: {
        id: d.id,
        name: d.name,
        price: Number(d.price),
        category: d.category,
        imageUrl: d.imageUrl,
        averageRating: d.averageRating,
        preparationTime: d.preparationTime,
        tags: d.tags,
        isAvailable: d.isAvailable,
        chef: {
          displayName: d.chef.displayName,
          city: d.chef.city,
          avatarUrl: getAvatarUrl(d.chef.avatarUrl || d.chef.user.avatar),
        },
      },
      score: relevanceScore(
        { category: dbDish.category, tags: dbDish.tags, chefId: dbDish.chefId },
        { category: d.category, tags: d.tags, chefId: d.chefId }
      ),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ dish }) => dish);

  return <DishDetailClient dish={dish} related={related} />;
}
