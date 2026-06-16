export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getAvatarUrl } from "@/lib/upload";
import DishesClient, { ExploreDish } from "./dishes-client";

export default async function DishesPage() {
  const activeDishes = await prisma.dish.findMany({
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
        include: {
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
  });

  const dishes: ExploreDish[] = activeDishes.map((d) => ({
    id: d.id,
    name: d.name,
    price: Number(d.price),
    category: d.category,
    imageUrl: d.imageUrl,
    averageRating: d.averageRating,
    preparationTime: d.preparationTime,
    tags: d.tags,
    isAvailable: d.isAvailable,
    deletedAt: d.deletedAt,
    chef: {
      displayName: d.chef.displayName,
      city: d.chef.city,
      avatarUrl: getAvatarUrl(d.chef.avatarUrl || d.chef.user.avatar),
    },
  }));

  return <DishesClient initialDishes={dishes} />;
}