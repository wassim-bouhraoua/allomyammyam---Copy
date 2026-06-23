import { prisma } from '../lib/prisma';
import { Prisma, OrderStatus } from '@prisma/client';
import { signToken } from '../lib/auth';

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('=== STARTING PHASE 3 FUNCTIONAL TESTS ===\n');

  // 1. Seed Database
  console.log('[1/7] Seeding database...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.chefProfile.deleteMany();
  await prisma.user.deleteMany();

  const customerUser = await prisma.user.create({
    data: {
      email: 'customer@test.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Customer',
      role: 'USER',
      city: 'Casablanca',
    },
  });

  const chefUser = await prisma.user.create({
    data: {
      email: 'chef@test.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Chef',
      role: 'CHEF',
      city: 'Casablanca',
    },
  });

  const chefProfile = await prisma.chefProfile.create({
    data: {
      userId: chefUser.id,
      displayName: 'Chef John',
      status: 'APPROVED',
      city: 'Casablanca',
    },
  });

  const dish = await prisma.dish.create({
    data: {
      chefId: chefProfile.id,
      name: 'Test Gourmet Burger',
      price: new Prisma.Decimal(12.5),
      category: 'BURGER',
      stockCount: 10,
      preparationTime: 20,
    },
  });

  console.log(`Seeded Customer (ID: ${customerUser.id}), Chef (ID: ${chefProfile.id}), Dish "${dish.name}" (Stock: 10).`);

  // 2. Generate auth tokens
  const customerToken = signToken({ sub: customerUser.id, email: customerUser.email, role: 'USER', city: 'Casablanca' });
  const chefToken = signToken({ sub: chefUser.id, email: chefUser.email, role: 'CHEF', city: 'Casablanca' });

  const customerHeaders = {
    'Content-Type': 'application/json',
    'Cookie': `auth_token=${customerToken}`,
  };

  const chefHeaders = {
    'Content-Type': 'application/json',
    'Cookie': `auth_token=${chefToken}`,
  };

  // Helper: check stock
  const getStock = async () => {
    const d = await prisma.dish.findUnique({ where: { id: dish.id } });
    return d?.stockCount ?? 0;
  };

  // Helper: checkout helper
  const checkout = async (qty: number) => {
    // Clear cart & items
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    // Create cart and cart item
    const cart = await prisma.cart.create({ data: { userId: customerUser.id } });
    await prisma.cartItem.create({ data: { cartId: cart.id, dishId: dish.id, quantity: qty } });

    const res = await fetch(`${BASE_URL}/api/cart/checkout`, {
      method: 'POST',
      headers: customerHeaders,
      body: JSON.stringify({ deliveryAddress: '123 Test St', notes: 'Leave at door' }),
    });
    if (!res.ok) {
      throw new Error(`Checkout failed: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    return data.orders[0].id;
  };

  // --- TEST 1: ACCEPT ORDER ---
  console.log('\n--- TEST 1: Accept Order ---');
  console.log(`Initial dish stock: ${await getStock()}`);
  const order1Id = await checkout(3);
  console.log(`Order 1 created: ${order1Id}`);
  console.log(`Dish stock after checkout (should be 7): ${await getStock()}`);

  // Fetch order before accept
  const orderBeforeAccept = await prisma.order.findUnique({ where: { id: order1Id } });
  console.log(`Order status before accept: ${orderBeforeAccept?.status}`);

  // Accept order
  console.log('Sending Accept POST request as Chef...');
  const acceptRes = await fetch(`${BASE_URL}/api/chef/orders/${order1Id}/accept`, {
    method: 'POST',
    headers: chefHeaders,
  });
  console.log(`Accept status: ${acceptRes.status}`);
  const acceptedOrder = await acceptRes.json();
  console.log(`Response Order status: ${acceptedOrder.status}`);

  // Double accept test (should fail)
  console.log('Sending Accept POST request again...');
  const doubleAcceptRes = await fetch(`${BASE_URL}/api/chef/orders/${order1Id}/accept`, {
    method: 'POST',
    headers: chefHeaders,
  });
  console.log(`Double accept status: ${doubleAcceptRes.status}`);
  console.log(`Response: ${await doubleAcceptRes.text()}`);

  // --- TEST 2: REJECT ORDER & STOCK RESTORATION ---
  console.log('\n--- TEST 2: Reject Order & Stock Restoration ---');
  console.log(`Current dish stock: ${await getStock()}`);
  const order2Id = await checkout(2);
  console.log(`Order 2 created: ${order2Id}`);
  console.log(`Dish stock after checkout (should be 5): ${await getStock()}`);

  // Reject order
  console.log('Sending Reject POST request as Chef...');
  const rejectRes = await fetch(`${BASE_URL}/api/chef/orders/${order2Id}/reject`, {
    method: 'POST',
    headers: chefHeaders,
  });
  console.log(`Reject status: ${rejectRes.status}`);
  const rejectedOrder = await rejectRes.json();
  console.log(`Response Order status: ${rejectedOrder.status}`);
  console.log(`Dish stock after rejection (should be 7): ${await getStock()}`);

  // --- TEST 3: FULL TRANSITION PROGRESSION (CREATED -> ACCEPTED -> PREPARING -> READY -> OUT_FOR_DELIVERY -> DELIVERED) ---
  console.log('\n--- TEST 3: Full Transition Progression ---');
  const order3Id = await checkout(1);
  console.log(`Order 3 created: ${order3Id}`);
  console.log(`Dish stock after checkout (should be 6): ${await getStock()}`);

  const statuses: OrderStatus[] = [
    OrderStatus.ACCEPTED,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.DELIVERED,
  ];

  let currentOrderState = await prisma.order.findUnique({ where: { id: order3Id } });
  console.log(`Initial Order status: ${currentOrderState?.status}`);

  for (const nextStatus of statuses) {
    if (nextStatus === OrderStatus.ACCEPTED) {
      console.log(`Transitioning to ACCEPTED using /accept endpoint...`);
      const res = await fetch(`${BASE_URL}/api/chef/orders/${order3Id}/accept`, {
        method: 'POST',
        headers: chefHeaders,
      });
      const data = await res.json();
      console.log(`New status: ${data.status} (HTTP ${res.status})`);
    } else {
      console.log(`Transitioning to ${nextStatus} using /status endpoint...`);
      const res = await fetch(`${BASE_URL}/api/chef/orders/${order3Id}/status`, {
        method: 'POST',
        headers: chefHeaders,
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      console.log(`New status: ${data.status} (HTTP ${res.status})`);
    }
  }

  // Verify invalid transitions (e.g. trying to transition a DELIVERED order)
  console.log('Testing invalid transition (DELIVERED -> PREPARING)...');
  const invalidRes = await fetch(`${BASE_URL}/api/chef/orders/${order3Id}/status`, {
    method: 'POST',
    headers: chefHeaders,
    body: JSON.stringify({ status: OrderStatus.PREPARING }),
  });
  console.log(`Response status (should be 400): ${invalidRes.status}`);
  console.log(`Response body: ${await invalidRes.text()}`);

  // --- TEST 4: STOCK RESTORATION AFTER CANCELLATION VIA STATUS ENDPOINT ---
  console.log('\n--- TEST 4: Stock Restoration after Cancellation via status ---');
  console.log(`Current dish stock: ${await getStock()}`);
  const order4Id = await checkout(1);
  console.log(`Order 4 created: ${order4Id}`);
  console.log(`Dish stock after checkout (should be 5): ${await getStock()}`);

  // Transition to ACCEPTED
  await fetch(`${BASE_URL}/api/chef/orders/${order4Id}/accept`, {
    method: 'POST',
    headers: chefHeaders,
  });

  // Cancel/Reject using /status
  console.log('Sending status CANCELLED POST request...');
  const cancelRes = await fetch(`${BASE_URL}/api/chef/orders/${order4Id}/status`, {
    method: 'POST',
    headers: chefHeaders,
    body: JSON.stringify({ status: OrderStatus.CANCELLED }),
  });
  console.log(`Cancel status: ${cancelRes.status}`);
  const cancelledOrder = await cancelRes.json();
  console.log(`Response Order status: ${cancelledOrder.status}`);
  console.log(`Dish stock after cancellation (should be 6): ${await getStock()}`);

  console.log('\n=== ALL PHASE 3 FUNCTIONAL TESTS COMPLETED SUCCESSFULY ===');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
