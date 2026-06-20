import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "setup") {
      const passwordHash = await bcrypt.hash("TestPassword123!", 10);

      // Create chef user
      const userChef = await prisma.user.upsert({
        where: { email: "cart-chef-ts@test.com" },
        update: { role: "CHEF" },
        create: {
          email: "cart-chef-ts@test.com",
          password: passwordHash,
          firstName: "CartChef",
          lastName: "Test",
          role: "CHEF",
        }
      });

      // Create chef profile
      const chefProfile = await prisma.chefProfile.upsert({
        where: { userId: userChef.id },
        update: { status: "APPROVED", isAvailable: true },
        create: {
          userId: userChef.id,
          displayName: "Chef Cart Flow E2E",
          city: "Oujda",
          status: "APPROVED",
          isAvailable: true
        }
      });

      // Create client user
      const userClient = await prisma.user.upsert({
        where: { email: "cart-client-ts@test.com" },
        update: { role: "USER" },
        create: {
          email: "cart-client-ts@test.com",
          password: passwordHash,
          firstName: "CartClient",
          lastName: "Test",
          role: "USER",
        }
      });

      // Clear existing cart items for this client if any
      const existingCart = await prisma.cart.findUnique({
        where: { userId: userClient.id },
      });
      if (existingCart) {
        await prisma.cartItem.deleteMany({ where: { cartId: existingCart.id } });
      }

      // Create dish with stockCount = 5
      const testDish = await prisma.dish.create({
        data: {
          chefId: chefProfile.id,
          name: "E2E Test Dish TS",
          description: "Dish with limited stock count",
          price: 50.00,
          category: "SOUP",
          preparationTime: 20,
          isAvailable: true,
          stockCount: 5,
          tags: ["e2e"],
        }
      });

      const tokenClient = signToken({ sub: userClient.id, email: userClient.email, role: "USER" });

      return NextResponse.json({
        success: true,
        dishId: testDish.id,
        token: tokenClient,
        userId: userClient.id,
        chefId: chefProfile.id,
      });
    }

    if (action === "deactivate") {
      const { dishId } = body;
      await prisma.dish.update({
        where: { id: dishId },
        data: { isAvailable: false }
      });
      return NextResponse.json({ success: true });
    }

    if (action === "cleanup") {
      const { dishId, chefId } = body;
      
      try {
        if (dishId) {
          await prisma.dish.deleteMany({ where: { id: dishId } });
        }
      } catch (e) {}

      try {
        if (chefId) {
          await prisma.chefProfile.deleteMany({ where: { id: chefId } });
        }
      } catch (e) {}

      try {
        await prisma.user.deleteMany({
          where: {
            email: {
              in: ["cart-chef-ts@test.com", "cart-client-ts@test.com"]
            }
          }
        });
      } catch (e) {}

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("Test helper error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
