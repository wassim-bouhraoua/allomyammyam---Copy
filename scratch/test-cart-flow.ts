import { prisma } from "./db-setup";
import { signToken, COOKIE_NAME } from "../lib/auth";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function recordTest(name: string, passed: boolean, error?: any) {
  results.push({ name, passed, error: error ? String(error) : undefined });
  console.log(`${passed ? "✅" : "❌"} ${name}${error ? ` - Error: ${error}` : ""}`);
}

async function runTests() {
  console.log("=== Starting Cart (Gestion du Panier) TS E2E Verification ===");

  // 1. Prepare chef and client users in DB
  const passwordHash = await bcrypt.hash("TestPassword123!", 10);

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

  const chefProfile = await prisma.chefProfile.upsert({
    where: { userId: userChef.id },
    update: { status: "APPROVED", isAvailable: true },
    create: {
      userId: userChef.id,
      displayName: "Chef Cart Flow TS E2E",
      city: "Oujda",
      status: "APPROVED",
      isAvailable: true
    }
  });

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

  const tokenClient = signToken({ sub: userClient.id, email: userClient.email, role: "USER" });

  const apiFetch = async (url: string, method: string, token: string, body?: any) => {
    return fetch(`${BASE_URL}${url}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Cookie": `${COOKIE_NAME}=${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  // Clean existing cart for client if any
  const existingCart = await prisma.cart.findUnique({
    where: { userId: userClient.id },
  });
  if (existingCart) {
    await prisma.cartItem.deleteMany({ where: { cartId: existingCart.id } });
  }

  // 2. Create a test dish with stockCount = 5
  const testDish = await prisma.dish.create({
    data: {
      chefId: chefProfile.id,
      name: "E2E Test Dish TS",
      description: "Dish with limited stock count TS",
      price: 50.00,
      category: "SOUP",
      preparationTime: 20,
      isAvailable: true,
      stockCount: 5,
      tags: ["e2e"],
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 1: Add 3 portions to cart
  // ───────────────────────────────────────────────────────────────────────────
  try {
    const res = await apiFetch("/api/cart", "POST", tokenClient, { dishId: testDish.id, quantity: 3 });
    const data = await res.json();
    if (res.status !== 200) {
      throw new Error(`Failed to add. Status: ${res.status}, body: ${JSON.stringify(data)}`);
    }

    const items = await prisma.cartItem.findMany({
      where: { cart: { userId: userClient.id } }
    });
    if (items.length !== 1 || items[0].quantity !== 3) {
      throw new Error(`Expected 1 cart item with quantity 3, got: ${JSON.stringify(items)}`);
    }
    recordTest("Add initial quantity to cart", true);
  } catch (err) {
    recordTest("Add initial quantity to cart", false, err);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 2: Add 2 more portions (Aggregating quantity)
  // ───────────────────────────────────────────────────────────────────────────
  try {
    const res = await apiFetch("/api/cart", "POST", tokenClient, { dishId: testDish.id, quantity: 2 });
    const data = await res.json();
    if (res.status !== 200) {
      throw new Error(`Failed to aggregate. Status: ${res.status}, body: ${JSON.stringify(data)}`);
    }

    const items = await prisma.cartItem.findMany({
      where: { cart: { userId: userClient.id } }
    });
    if (items.length !== 1 || items[0].quantity !== 5) {
      throw new Error(`Expected aggregated quantity to be 5, got: ${JSON.stringify(items)}`);
    }
    recordTest("Aggregate same dish in cart", true);
  } catch (err) {
    recordTest("Aggregate same dish in cart", false, err);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 3: Attempt to add 1 more (Exceeding stock of 5)
  // ───────────────────────────────────────────────────────────────────────────
  try {
    const res = await apiFetch("/api/cart", "POST", tokenClient, { dishId: testDish.id, quantity: 1 });
    const data = await res.json();
    if (res.status === 200) {
      throw new Error("Expected request to fail due to stock limit, but it succeeded.");
    }
    recordTest("Block addition exceeding stockCount", true);
  } catch (err) {
    recordTest("Block addition exceeding stockCount", false, err);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 4: Attempt to PATCH update to quantity 6 (Exceeding stock of 5)
  // ───────────────────────────────────────────────────────────────────────────
  try {
    const res = await apiFetch("/api/cart", "PATCH", tokenClient, { dishId: testDish.id, quantity: 6 });
    const data = await res.json();
    if (res.status === 200) {
      throw new Error("Expected PATCH to fail due to stock limit, but it succeeded.");
    }
    recordTest("Block quantity update exceeding stockCount", true);
  } catch (err) {
    recordTest("Block quantity update exceeding stockCount", false, err);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 5: Decrease quantity to 4 via PATCH
  // ───────────────────────────────────────────────────────────────────────────
  try {
    const res = await apiFetch("/api/cart", "PATCH", tokenClient, { dishId: testDish.id, quantity: 4 });
    const data = await res.json();
    if (res.status !== 200) {
      throw new Error(`Failed to decrease quantity. Status: ${res.status}`);
    }

    const items = await prisma.cartItem.findMany({
      where: { cart: { userId: userClient.id } }
    });
    if (items.length !== 1 || items[0].quantity !== 4) {
      throw new Error(`Expected quantity to be 4, got: ${JSON.stringify(items)}`);
    }
    recordTest("Successfully decrease quantity via PATCH", true);
  } catch (err) {
    recordTest("Successfully decrease quantity via PATCH", false, err);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 6: Make dish unavailable
  // ───────────────────────────────────────────────────────────────────────────
  try {
    await prisma.dish.update({
      where: { id: testDish.id },
      data: { isAvailable: false }
    });

    const res = await apiFetch("/api/cart", "GET", tokenClient);
    const data = await res.json();
    if (res.status !== 200) {
      throw new Error("Failed to fetch cart after deactivation");
    }

    const item = data.cartItems.find((i: any) => i.dish.id === testDish.id);
    if (!item) {
      throw new Error("Deactivated dish disappeared from cart GET response.");
    }
    if (item.dish.isAvailable !== false) {
      throw new Error(`Expected isAvailable to be false, got: ${item.dish.isAvailable}`);
    }
    recordTest("Unavailable dish remains visible in cart with isAvailable: false", true);
  } catch (err) {
    recordTest("Unavailable dish remains visible in cart with isAvailable: false", false, err);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 7: Block quantity increase on deactivated dish
  // ───────────────────────────────────────────────────────────────────────────
  try {
    const res = await apiFetch("/api/cart", "PATCH", tokenClient, { dishId: testDish.id, quantity: 5 });
    const data = await res.json();
    if (res.status === 200) {
      throw new Error("Expected PATCH increment to fail on unavailable dish, but it succeeded.");
    }
    recordTest("Block quantity increase on unavailable dish", true);
  } catch (err) {
    recordTest("Block quantity increase on unavailable dish", false, err);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 8: Allow quantity decrease on deactivated dish
  // ───────────────────────────────────────────────────────────────────────────
  try {
    const res = await apiFetch("/api/cart", "PATCH", tokenClient, { dishId: testDish.id, quantity: 2 });
    const data = await res.json();
    if (res.status !== 200) {
      throw new Error(`Failed to decrease quantity of unavailable dish. Status: ${res.status}`);
    }

    const items = await prisma.cartItem.findMany({
      where: { cart: { userId: userClient.id } }
    });
    if (items.length !== 1 || items[0].quantity !== 2) {
      throw new Error(`Expected quantity to be 2, got: ${JSON.stringify(items)}`);
    }
    recordTest("Allow quantity decrease on unavailable dish", true);
  } catch (err) {
    recordTest("Allow quantity decrease on unavailable dish", false, err);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 9: Remove item from cart
  // ───────────────────────────────────────────────────────────────────────────
  try {
    const res = await apiFetch(`/api/cart?dishId=${testDish.id}`, "DELETE", tokenClient);
    const data = await res.json();
    if (res.status !== 200) {
      throw new Error(`Failed to remove item. Status: ${res.status}`);
    }

    const items = await prisma.cartItem.findMany({
      where: { cart: { userId: userClient.id } }
    });
    if (items.length !== 0) {
      throw new Error(`Expected empty cart items list, got: ${JSON.stringify(items)}`);
    }
    recordTest("Remove item from cart", true);
  } catch (err) {
    recordTest("Remove item from cart", false, err);
  }

  // Cleanup test data
  try {
    await prisma.dish.delete({ where: { id: testDish.id } });
  } catch (e) {}
  try {
    await prisma.chefProfile.delete({ where: { id: chefProfile.id } });
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

  console.log("\n=== Cart E2E Verification Results Summary ===");
  const allPassed = results.every(r => r.passed);
  console.log(allPassed ? "🎉 ALL TESTS PASSED SUCCESSFULLY!" : "⚠️ SOME TESTS FAILED.");
  fs.writeFileSync(
    path.join(__dirname, "test-cart-flow-results.json"),
    JSON.stringify({ allPassed, results }, null, 2)
  );
  process.exit(allPassed ? 0 : 1);
}

runTests().catch(err => {
  console.error("Test runner encountered error:", err);
  process.exit(1);
});
