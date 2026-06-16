import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getDishImageUrl } from "@/lib/upload";

/** Serialize a Prisma Dish row for JSON (handles Decimal conversion). */
function serializeDish(dish: any) {
  return {
    ...dish,
    price: Number(dish.price),
    imageUrl: getDishImageUrl(dish.imageUrl),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/dishes/[id]/toggle — Toggle dish availability (isAvailable)
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Authenticate
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    if (session.role !== "CHEF") {
      return NextResponse.json(
        { error: "Forbidden: Chef access only." },
        { status: 403 }
      );
    }

    // 2. Resolve ChefProfile
    const chefProfile = await prisma.chefProfile.findUnique({
      where: { userId: session.id },
      select: { id: true, status: true },
    });

    if (!chefProfile) {
      return NextResponse.json(
        { error: "Chef profile not found." },
        { status: 404 }
      );
    }

    // 3. Block SUSPENDED chefs
    if (chefProfile.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Your chef account is suspended. Dish management is disabled." },
        { status: 403 }
      );
    }

    // 4. Verify dish ownership (also excludes soft-deleted dishes)
    const dish = await prisma.dish.findFirst({
      where: {
        id,
        chefId: chefProfile.id,
        deletedAt: null,
      },
    });

    if (!dish) {
      return NextResponse.json(
        { error: "Dish not found." },
        { status: 404 }
      );
    }

    // 5. Flip availability
    const updatedDish = await prisma.dish.update({
      where: { id },
      data: { isAvailable: !dish.isAvailable },
    });

    return NextResponse.json({
      dish: serializeDish(updatedDish),
      message: `Dish is now ${updatedDish.isAvailable ? "available" : "unavailable"}.`,
    });
  } catch (error) {
    console.error("PATCH /api/dishes/[id]/toggle error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
