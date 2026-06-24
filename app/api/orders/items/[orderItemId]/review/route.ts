import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  props: { params: Promise<{ orderItemId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { orderItemId } = await props.params;

    // Load order item, parent order, dish, and chef details
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: true,
        dish: {
          include: {
            chef: true,
          },
        },
      },
    });

    if (!orderItem) {
      return NextResponse.json({ error: "Order item not found." }, { status: 404 });
    }

    // Ownership Check: User must own the order
    if (orderItem.order.userId !== session.id) {
      return NextResponse.json({ error: "Unauthorized access to order." }, { status: 403 });
    }

    // Delivery Status Check: Order must be DELIVERED to leave a review
    if (orderItem.order.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Reviews are allowed only after the order is delivered." },
        { status: 400 }
      );
    }

    // Self-Review Protection: Chefs cannot review their own dishes
    if (orderItem.dish.chef.userId === session.id) {
      return NextResponse.json(
        { error: "Chefs cannot review their own dishes." },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const rating = Number(body.rating);
    const comment = body.comment ? String(body.comment).trim() : "";

    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
    }

    // Run review insert/update and averages recalculations inside a transaction
    const resultReview = await prisma.$transaction(async (tx) => {
      // 1. Create or update the DishReview record
      const review = await tx.dishReview.upsert({
        where: { orderItemId },
        update: {
          rating,
          comment,
        },
        create: {
          orderItemId,
          userId: session.id,
          rating,
          comment,
        },
      });

      // 2. Fetch all reviews for this specific Dish
      const dishReviews = await tx.dishReview.findMany({
        where: {
          orderItem: {
            dishId: orderItem.dishId,
          },
        },
      });

      const dishTotal = dishReviews.length;
      const dishSum = dishReviews.reduce((sum, r) => sum + r.rating, 0);
      const dishAvg = dishTotal > 0 ? dishSum / dishTotal : 0;

      // 3. Update the Dish average rating and count
      await tx.dish.update({
        where: { id: orderItem.dishId },
        data: {
          averageRating: dishAvg,
          totalReviews: dishTotal,
        },
      });

      // 4. Fetch all reviews across all dishes of this Chef
      const chefReviews = await tx.dishReview.findMany({
        where: {
          orderItem: {
            dish: {
              chefId: orderItem.dish.chefId,
            },
          },
        },
      });

      const chefTotal = chefReviews.length;
      const chefSum = chefReviews.reduce((sum, r) => sum + r.rating, 0);
      const chefAvg = chefTotal > 0 ? chefSum / chefTotal : 0;

      // 5. Update the ChefProfile average rating and count
      await tx.chefProfile.update({
        where: { id: orderItem.dish.chefId },
        data: {
          averageRating: chefAvg,
          totalReviews: chefTotal,
        },
      });

      return review;
    });

    return NextResponse.json({ success: true, review: resultReview });
  } catch (error: any) {
    console.error("DishReview POST Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error." }, { status: 500 });
  }
}
