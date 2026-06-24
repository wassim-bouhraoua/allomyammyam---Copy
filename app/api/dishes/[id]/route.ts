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
    const {
      name,
      name_en,
      name_ar,
      description,
      description_en,
      description_ar,
      price,
      category,
      preparationTime,
      tags,
      stockCount,
      image,
      calories,
      protein,
      carbs,
      fat,
      sugar
    } = body;

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

    // Validate optional nutrition fields
    const nutritionFields = { calories, protein, carbs, fat, sugar };
    for (const [key, value] of Object.entries(nutritionFields)) {
      if (value !== undefined && value !== null && value !== "") {
        const num = Number(value);
        if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
          return NextResponse.json(
            { error: `${key.charAt(0).toUpperCase() + key.slice(1)} must be a non-negative integer.` },
            { status: 400 }
          );
        }
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
      if (image.startsWith("data:")) {
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
    if (name_en !== undefined) dataToUpdate.name_en = name_en ? String(name_en).trim() : null;
    if (name_ar !== undefined) dataToUpdate.name_ar = name_ar ? String(name_ar).trim() : null;
    if (description !== undefined) dataToUpdate.description = description ? String(description).trim() : null;
    if (description_en !== undefined) dataToUpdate.description_en = description_en ? String(description_en).trim() : null;
    if (description_ar !== undefined) dataToUpdate.description_ar = description_ar ? String(description_ar).trim() : null;
    if (price !== undefined) dataToUpdate.price = Number(price);
    if (category !== undefined) dataToUpdate.category = category;
    if (preparationTime !== undefined) dataToUpdate.preparationTime = Number(preparationTime);
    if (tags !== undefined) dataToUpdate.tags = tags.map((t: any) => String(t).trim()).filter(Boolean);
    if (stockCount !== undefined) dataToUpdate.stockCount = stockCount !== null ? Number(stockCount) : null;
    if (imageUrl !== undefined) dataToUpdate.imageUrl = imageUrl;

    if (calories !== undefined) dataToUpdate.calories = (calories !== null && calories !== "") ? Number(calories) : null;
    if (protein !== undefined) dataToUpdate.protein = (protein !== null && protein !== "") ? Number(protein) : null;
    if (carbs !== undefined) dataToUpdate.carbs = (carbs !== null && carbs !== "") ? Number(carbs) : null;
    if (fat !== undefined) dataToUpdate.fat = (fat !== null && fat !== "") ? Number(fat) : null;
    if (sugar !== undefined) dataToUpdate.sugar = (sugar !== null && sugar !== "") ? Number(sugar) : null;

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
