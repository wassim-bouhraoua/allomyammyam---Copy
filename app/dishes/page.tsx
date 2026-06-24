import { prisma } from "@/lib/prisma";
import DishesClient from "./dishes-client";
import { getAvatarUrl, getDishImageUrl } from "@/lib/upload";
import { getChefAvatarUrl } from "@/lib/defaults-server";
import { getSession } from "@/lib/session";

import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function DishesPage() {
  const session = await getSession();
  const cookieStore = await cookies();
  const userCity = session?.city || cookieStore.get("user_city")?.value || "Oujda";

  const dishes = await prisma.dish.findMany({
    where: {
      deletedAt: null,
      isAvailable: true,
      chef: {
        status: "APPROVED",
        deletedAt: null,
        ...(userCity ? { city: userCity } : {}),
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

  const exploreDishes = dishes.map((dish) => ({
    id: dish.id,
    name: dish.name,
    price: Number(dish.price),
    category: dish.category,
    imageUrl: getDishImageUrl(dish.imageUrl),
    averageRating: dish.averageRating,
    preparationTime: dish.preparationTime,
    tags: dish.tags,
    isAvailable: dish.isAvailable,
    deletedAt: dish.deletedAt,
    chef: {
      displayName: dish.chef.displayName,
      city: dish.chef.city,
      avatarUrl: getChefAvatarUrl(dish.chef.avatarUrl || dish.chef.user.avatar),
      isAvailable: dish.chef.isAvailable,
    },
  }));

  return <DishesClient initialDishes={exploreDishes} />;
}