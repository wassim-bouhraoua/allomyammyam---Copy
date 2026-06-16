import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { saveDishImage, getDishImageUrl } from "@/lib/upload";
import { DishCategory } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const VALID_CATEGORIES = Object.values(DishCategory);

/** Serialize a Prisma Dish row for JSON (handles Decimal conversion). */
function serializeDish(dish: any) {
  return {
    ...dish,
    price: Number(dish.price),
    imageUrl: getDishImageUrl(dish.imageUrl),
  };
}

/**
 * Authenticate the request, resolve ChefProfile, and verify dish ownership.
 * Returns { chefProfile, dish } on success or a NextResponse error.
 */
async function authenticateChefAndDish(dishId: string): Promise<
  | { chefProfile: { id: string; status: string }; dish: any; error?: never }
  | { chefProfile?: never; dish?: never; error: NextResponse }
> {
  const session = await getSession();

  if (!session) {
    return {
      error: NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      ),
    };
  }

  if (session.role !== "CHEF") {
    return {
      error: NextResponse.json(
        { error: "Forbidden: Chef access only." },
        { status: 403 }
      ),
    };
  }

  const chefProfile = await prisma.chefProfile.findUnique({
    where: { userId: session.id },
    select: { id: true, status: true },
  });

  if (!chefProfile) {
    return {
      error: NextResponse.json(
        { error: "Chef profile not found." },
        { status: 404 }
      ),
    };
  }

  if (chefProfile.status === "SUSPENDED") {
    return {
      error: NextResponse.json(
        { error: "Your chef account is suspended. Dish management is disabled." },
        { status: 403 }
      ),
    };
  }

  // Fetch dish and verify ownership in a single query
  const dish = await prisma.dish.findFirst({
    where: {
      id: dishId,
      chefId: chefProfile.id,
      deletedAt: null,
    },
  });

  if (!dish) {
    // Return 404 whether the dish doesn't exist or belongs to another chef
    return {
      error: NextResponse.json(
        { error: "Dish not found." },
        { status: 404 }
      ),
    };
  }

  return { chefProfile, dish };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dishes/[id] — Get a single dish owned by the authenticated chef
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateChefAndDish(id);
    if (auth.error) return auth.error;

    return NextResponse.json({
      dish: serializeDish(auth.dish),
    });
  } catch (error) {
    console.error("GET /api/dishes/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/dishes/[id] — Update a dish owned by the authenticated chef
// ─────────────────────────────────────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateChefAndDish(id);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { name, description, price, category, preparationTime, tags, stockCount, image } = body;

    // ── Validation (only for provided fields) ───────────────────────────────

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { error: "Dish name cannot be empty." },
          { status: 400 }
        );
      }
    }

    if (price !== undefined) {
      if (price === null || isNaN(Number(price)) || Number(price) <= 0) {
        return NextResponse.json(
          { error: "Price must be a positive number." },
          { status: 400 }
        );
      }
    }

    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) {
        return NextResponse.json(
          { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
          { status: 400 }
        );
      }
    }

    if (preparationTime !== undefined) {
      if (
        preparationTime === null ||
        isNaN(Number(preparationTime)) ||
        Number(preparationTime) <= 0 ||
        !Number.isInteger(Number(preparationTime))
      ) {
        return NextResponse.json(
          { error: "Preparation time must be a positive integer (minutes)." },
          { status: 400 }
        );
      }
    }

    if (tags !== undefined && !Array.isArray(tags)) {
      return NextResponse.json(
        { error: "Tags must be an array of strings." },
        { status: 400 }
      );
    }

    if (stockCount !== undefined && stockCount !== null) {
      if (isNaN(Number(stockCount)) || Number(stockCount) < 0 || !Number.isInteger(Number(stockCount))) {
        return NextResponse.json(
          { error: "Stock count must be a non-negative integer." },
          { status: 400 }
        );
      }
    }

    // ── Image handling (same pattern as profile avatar) ─────────────────────
    // null → remove image
    // data:image/... → upload new image
    // undefined / omitted → keep current image

    let imageUrl: string | null | undefined = undefined;

    if (image === null) {
      imageUrl = null;
    } else if (typeof image === "string") {
      if (image.startsWith("data:image/")) {
        try {
          imageUrl = await saveDishImage(image);
        } catch (err: any) {
          return NextResponse.json(
            { error: err.message ?? "Failed to upload dish image." },
            { status: 400 }
          );
        }
      } else if (image.startsWith("http://") || image.startsWith("https://")) {
        imageUrl = image;
      }
    }

    // ── Build update data (only include provided fields) ────────────────────

    const dataToUpdate: any = {};

    if (name !== undefined) dataToUpdate.name = name.trim();
    if (description !== undefined) dataToUpdate.description = description ? String(description).trim() : null;
    if (price !== undefined) dataToUpdate.price = Number(price);
    if (category !== undefined) dataToUpdate.category = category;
    if (preparationTime !== undefined) dataToUpdate.preparationTime = Number(preparationTime);
    if (tags !== undefined) dataToUpdate.tags = tags.map((t: any) => String(t).trim()).filter(Boolean);
    if (stockCount !== undefined) dataToUpdate.stockCount = stockCount !== null ? Number(stockCount) : null;
    if (imageUrl !== undefined) dataToUpdate.imageUrl = imageUrl;

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { error: "No fields to update." },
        { status: 400 }
      );
    }

    const updatedDish = await prisma.dish.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      dish: serializeDish(updatedDish),
      message: "Dish updated successfully.",
    });
  } catch (error) {
    console.error("PUT /api/dishes/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/dishes/[id] — Soft-delete a dish owned by the authenticated chef
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateChefAndDish(id);
    if (auth.error) return auth.error;

    await prisma.dish.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      message: "Dish deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE /api/dishes/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
