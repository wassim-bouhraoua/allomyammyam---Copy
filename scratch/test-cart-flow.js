const fs = require('fs');
const path = require('path');

const BASE_URL = "http://localhost:3000";
const COOKIE_NAME = "auth_token";

const results = [];

function recordTest(name, passed, error) {
  results.push({ name, passed, error: error ? String(error) : undefined });
  console.log(`${passed ? "✅" : "❌"} ${name}${error ? ` - Error: ${error}` : ""}`);
}

async function runTests() {
  console.log("=== Starting Cart (Gestion du Panier) E2E Verification ===");

  let tokenClient = "";
  let dishId = "";
  let chefId = "";

  const apiFetch = async (url, method, token, body) => {
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers["Cookie"] = `${COOKIE_NAME}=${token}`;
    }
    return fetch(`${BASE_URL}${url}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  // 1. Setup test data via /api/test-helper
  try {
    const res = await apiFetch("/api/test-helper", "POST", null, { action: "setup" });
    const data = await res.json();
    if (res.status !== 200 || !data.success) {
      throw new Error(`Helper setup failed: ${JSON.stringify(data)}`);
    }
    tokenClient = data.token;
    dishId = data.dishId;
    chefId = data.chefId;
    recordTest("Initialize E2E test state via helper API", true);
  } catch (err) {
    recordTest("Initialize E2E test state via helper API", false, err);
    process.exit(1);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 1: Add 3 portions to cart
  // ───────────────────────────────────────────────────────────────────────────
  try {
    const res = await apiFetch("/api/cart", "POST", tokenClient, { dishId, quantity: 3 });
    const data = await res.json();
    if (res.status !== 200) {
      throw new Error(`Failed to add. Status: ${res.status}, body: ${JSON.stringify(data)}`);
    }

    // Verify quantity is 3 via GET
    const getRes = await apiFetch("/api/cart", "GET", tokenClient);
    const getData = await getRes.json();
    const item = getData.cartItems.find(i => i.dish.id === dishId);
    if (!item || item.quantity !== 3) {
      throw new Error(`Expected quantity 3, got: ${JSON.stringify(getData)}`);
    }
    recordTest("Add initial quantity to cart", true);
  } catch (err) {
    recordTest("Add initial quantity to cart", false, err);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 2: Add 2 more portions (Aggregating quantity)
  // ───────────────────────────────────────────────────────────────────────────
  try {
    const res = await apiFetch("/api/cart", "POST", tokenClient, { dishId, quantity: 2 });
    const data = await res.json();
    if (res.status !== 200) {
      throw new Error(`Failed to aggregate. Status: ${res.status}, body: ${JSON.stringify(data)}`);
    }

    const getRes = await apiFetch("/api/cart", "GET", tokenClient);
    const getData = await getRes.json();
    const item = getData.cartItems.find(i => i.dish.id === dishId);
    if (!item || item.quantity !== 5) {
      throw new Error(`Expected aggregated quantity to be 5, got: ${JSON.stringify(getData)}`);
    }
    recordTest("Aggregate same dish in cart", true);
  } catch (err) {
    recordTest("Aggregate same dish in cart", false, err);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 3: Attempt to add 1 more (Exceeding stock of 5)
  // ───────────────────────────────────────────────────────────────────────────
  try {
    const res = await apiFetch("/api/cart", "POST", tokenClient, { dishId, quantity: 1 });
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
    const res = await apiFetch("/api/cart", "PATCH", tokenClient, { dishId, quantity: 6 });
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
    const res = await apiFetch("/api/cart", "PATCH", tokenClient, { dishId, quantity: 4 });
    const data = await res.json();
    if (res.status !== 200) {
      throw new Error(`Failed to decrease quantity. Status: ${res.status}`);
    }

    const getRes = await apiFetch("/api/cart", "GET", tokenClient);
    const getData = await getRes.json();
    const item = getData.cartItems.find(i => i.dish.id === dishId);
    if (!item || item.quantity !== 4) {
      throw new Error(`Expected quantity to be 4, got: ${JSON.stringify(getData)}`);
    }
    recordTest("Successfully decrease quantity via PATCH", true);
  } catch (err) {
    recordTest("Successfully decrease quantity via PATCH", false, err);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 6: Make dish unavailable via helper API
  // ───────────────────────────────────────────────────────────────────────────
  try {
    const resDeact = await apiFetch("/api/test-helper", "POST", null, { action: "deactivate", dishId });
    if (resDeact.status !== 200) {
      throw new Error("Failed to deactivate dish via helper API");
    }

    const res = await apiFetch("/api/cart", "GET", tokenClient);
    const data = await res.json();
    if (res.status !== 200) {
      throw new Error("Failed to fetch cart after deactivation");
    }

    const item = data.cartItems.find(i => i.dish.id === dishId);
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
    const res = await apiFetch("/api/cart", "PATCH", tokenClient, { dishId, quantity: 5 });
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
    const res = await apiFetch("/api/cart", "PATCH", tokenClient, { dishId, quantity: 2 });
    const data = await res.json();
    if (res.status !== 200) {
      throw new Error(`Failed to decrease quantity of unavailable dish. Status: ${res.status}`);
    }

    const getRes = await apiFetch("/api/cart", "GET", tokenClient);
    const getData = await getRes.json();
    const item = getData.cartItems.find(i => i.dish.id === dishId);
    if (!item || item.quantity !== 2) {
      throw new Error(`Expected quantity to be 2, got: ${JSON.stringify(getData)}`);
    }
    recordTest("Allow quantity decrease on unavailable dish", true);
  } catch (err) {
    recordTest("Allow quantity decrease on unavailable dish", false, err);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 9: Remove item from cart
  // ───────────────────────────────────────────────────────────────────────────
  try {
    const res = await apiFetch(`/api/cart?dishId=${dishId}`, "DELETE", tokenClient);
    const data = await res.json();
    if (res.status !== 200) {
      throw new Error(`Failed to remove item. Status: ${res.status}`);
    }

    const getRes = await apiFetch("/api/cart", "GET", tokenClient);
    const getData = await getRes.json();
    if (getData.cartItems.length !== 0) {
      throw new Error(`Expected empty cart items list, got: ${JSON.stringify(getData)}`);
    }
    recordTest("Remove item from cart", true);
  } catch (err) {
    recordTest("Remove item from cart", false, err);
  }

  // 10. Cleanup via helper API
  try {
    const res = await apiFetch("/api/test-helper", "POST", null, { action: "cleanup", dishId, chefId });
    if (res.status !== 200) {
      throw new Error(`Failed to cleanup. Status: ${res.status}`);
    }
    recordTest("Clean up E2E test state via helper API", true);
  } catch (err) {
    recordTest("Clean up E2E test state via helper API", false, err);
  }

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
