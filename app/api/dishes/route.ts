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
 * Authenticate the request and resolve the ChefProfile.
 * Returns { chefProfile } on success or a NextResponse error.
 */
async function authenticateChef(): Promise<
  | { chefProfile: { id: string; status: string }; error?: never }
  | { chefProfile?: never; error: NextResponse }
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

  return { chefProfile };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dishes — List authenticated chef's own dishes
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const auth = await authenticateChef();
    if (auth.error) return auth.error;

    const dishes = await prisma.dish.findMany({
      where: {
        chefId: auth.chefProfile.id,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      dishes: dishes.map(serializeDish),
    });
  } catch (error) {
    console.error("GET /api/dishes error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/dishes — Create a new dish
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateChef();
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

    // ── Validation ──────────────────────────────────────────────────────────

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Dish name is required." },
        { status: 400 }
      );
    }

    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) <= 0) {
      return NextResponse.json(
        { error: "Price must be a positive number." },
        { status: 400 }
      );
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }

    if (
      preparationTime === undefined ||
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

    // ── Image upload ────────────────────────────────────────────────────────

    let imageUrl: string | null = null;

    if (typeof image === "string") {
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

    // ── Create ──────────────────────────────────────────────────────────────

    const dish = await prisma.dish.create({
      data: {
        chefId: auth.chefProfile.id,
        name: name.trim(),
        name_en: name_en ? String(name_en).trim() : null,
        name_ar: name_ar ? String(name_ar).trim() : null,
        description: description ? String(description).trim() : null,
        description_en: description_en ? String(description_en).trim() : null,
        description_ar: description_ar ? String(description_ar).trim() : null,
        price: Number(price),
        category,
        preparationTime: Number(preparationTime),
        tags: Array.isArray(tags) ? tags.map((t: any) => String(t).trim()).filter(Boolean) : [],
        stockCount: stockCount !== undefined && stockCount !== null ? Number(stockCount) : null,
        imageUrl,
        calories: calories !== undefined && calories !== null && calories !== "" ? Number(calories) : null,
        protein: protein !== undefined && protein !== null && protein !== "" ? Number(protein) : null,
        carbs: carbs !== undefined && carbs !== null && carbs !== "" ? Number(carbs) : null,
        fat: fat !== undefined && fat !== null && fat !== "" ? Number(fat) : null,
        sugar: sugar !== undefined && sugar !== null && sugar !== "" ? Number(sugar) : null,
      },
    });

    return NextResponse.json(
      {
        dish: serializeDish(dish),
        message: "Dish created successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/dishes error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
