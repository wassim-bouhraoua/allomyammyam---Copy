import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getAvatarUrl } from "@/lib/upload";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.id,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      avatar: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          orders: true,
        },
      },
      chefProfile: {
        select: {
          id: true,
          displayName: true,
          bio: true,
          specialties: true,
          city: true,
          status: true,
          _count: {
            select: {
              orders: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  const ordersCount = user.role === "CHEF"
    ? (user.chefProfile?._count?.orders ?? 0)
    : (user._count?.orders ?? 0);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      avatar: getAvatarUrl(user.avatar),
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      ordersCount,
      chefProfile: user.chefProfile
        ? {
            id: user.chefProfile.id,
            displayName: user.chefProfile.displayName,
            bio: user.chefProfile.bio,
            specialties: user.chefProfile.specialties,
            city: user.chefProfile.city,
            status: user.chefProfile.status,
          }
        : null,
    },
  });
}