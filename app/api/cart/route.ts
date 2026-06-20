import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getDishImageUrl } from "@/lib/upload";

/** Helper to format dish values cleanly (price as number, correct image URL) */
function serializeCartItem(item: any) {
  return {
    id: item.id,
    quantity: item.quantity,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    dish: {
      id: item.dish.id,
      name: item.dish.name,
      price: Number(item.dish.price),
      category: item.dish.category,
      imageUrl: getDishImageUrl(item.dish.imageUrl),
      isAvailable: item.dish.isAvailable,
      deletedAt: item.dish.deletedAt,
      stockCount: item.dish.stockCount,
      chef: {
        displayName: item.dish.chef.displayName,
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/cart — Retrieve the authenticated user's cart
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.id },
      include: {
        cartItems: {
          include: {
            dish: {
              include: {
                chef: {
                  select: { displayName: true },
                },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({ cartItems: [] });
    }

    return NextResponse.json({
      cartItems: cart.cartItems.map(serializeCartItem),
    });
  } catch (error) {
    console.error("GET /api/cart error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/cart — Add an item to the cart (or increase quantity)
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await req.json();
    const { dishId, quantity } = body;

    if (!dishId || typeof dishId !== "string") {
      return NextResponse.json({ error: "Invalid dishId." }, { status: 400 });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty < 1 || !Number.isInteger(qty)) {
      return NextResponse.json({ error: "Quantity must be a positive integer." }, { status: 400 });
    }

    // 1. Fetch dish
    const dish = await prisma.dish.findFirst({
      where: { id: dishId, deletedAt: null },
      include: {
        chef: { select: { displayName: true } },
      },
    });

    if (!dish) {
      return NextResponse.json({ error: "Dish not found." }, { status: 404 });
    }

    // 2. Validate availability
    if (!dish.isAvailable) {
      return NextResponse.json({ error: "This dish is currently unavailable." }, { status: 400 });
    }

    // 3. Resolve user's cart
    let cart = await prisma.cart.findUnique({
      where: { userId: session.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.id },
      });
    }

    // 4. Check existing cart item quantity
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_dishId: {
          cartId: cart.id,
          dishId: dish.id,
        },
      },
    });

    const existingQty = existingItem ? existingItem.quantity : 0;
    const newQty = existingQty + qty;

    // 5. Validate stock limits
    if (dish.stockCount !== null && newQty > dish.stockCount) {
      return NextResponse.json({
        error: `Cannot add more. You have ${existingQty} in cart, and only ${dish.stockCount} are available.`,
      }, { status: 400 });
    }

    // 6. Persist CartItem
    const cartItem = await prisma.cartItem.upsert({
      where: {
        cartId_dishId: {
          cartId: cart.id,
          dishId: dish.id,
        },
      },
      update: { quantity: newQty },
      create: {
        cartId: cart.id,
        dishId: dish.id,
        quantity: qty,
      },
      include: {
        dish: {
          include: {
            chef: { select: { displayName: true } },
          },
        },
      },
    });

    return NextResponse.json({
      message: "Item added to cart.",
      cartItem: serializeCartItem(cartItem),
    });
  } catch (error) {
    console.error("POST /api/cart error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/cart — Update quantity of a cart item
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await req.json();
    const { dishId, quantity } = body;

    if (!dishId || typeof dishId !== "string") {
      return NextResponse.json({ error: "Invalid dishId." }, { status: 400 });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty < 1 || !Number.isInteger(qty)) {
      return NextResponse.json({ error: "Quantity must be a positive integer." }, { status: 400 });
    }

    // 1. Get user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId: session.id },
    });

    if (!cart) {
      return NextResponse.json({ error: "Cart not found." }, { status: 404 });
    }

    // 2. Find cart item
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_dishId: {
          cartId: cart.id,
          dishId,
        },
      },
      include: {
        dish: {
          include: {
            chef: { select: { displayName: true } },
          },
        },
      },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found in cart." }, { status: 404 });
    }

    const dish = existingItem.dish;

    // 3. Validation for deactivated or soft-deleted dish
    const isDishUnavailable = !dish.isAvailable || dish.deletedAt !== null;
    if (isDishUnavailable) {
      // Disallow increases for unavailable dishes
      if (qty > existingItem.quantity) {
        return NextResponse.json({ error: "Cannot increase quantity. This dish is currently unavailable." }, { status: 400 });
      }
    } else {
      // 4. Validate stock limits for active dishes
      if (dish.stockCount !== null && qty > dish.stockCount) {
        return NextResponse.json({ error: `Requested quantity exceeds available stock (${dish.stockCount}).` }, { status: 400 });
      }
    }

    // 5. Update
    const updatedItem = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: qty },
      include: {
        dish: {
          include: {
            chef: { select: { displayName: true } },
          },
        },
      },
    });

    return NextResponse.json({
      message: "Cart updated.",
      cartItem: serializeCartItem(updatedItem),
    });
  } catch (error) {
    console.error("PATCH /api/cart error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/cart — Remove an item from the cart
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dishId = searchParams.get("dishId");

    if (!dishId) {
      return NextResponse.json({ error: "Missing dishId parameter." }, { status: 400 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.id },
    });

    if (!cart) {
      return NextResponse.json({ error: "Cart not found." }, { status: 404 });
    }

    // Delete the cart item matching this cart and dish
    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        dishId,
      },
    });

    return NextResponse.json({ message: "Item removed from cart." });
  } catch (error) {
    console.error("DELETE /api/cart error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
