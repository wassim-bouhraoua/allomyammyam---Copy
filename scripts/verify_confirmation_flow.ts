import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { signToken } from '../lib/auth';

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function runQATests() {
  console.log('=== STARTING CONFIRMATION FLOW QA TESTS ===\n');

  // Seed database
  console.log('Seeding database...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.chefProfile.deleteMany();
  await prisma.user.deleteMany();

  const customerUser = await prisma.user.create({
    data: {
      email: 'confirmation_qa@test.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Confirmation',
      role: 'USER',
      city: 'Casablanca',
    },
  });

  const chefUser = await prisma.user.create({
    data: {
      email: 'chef_confirmation_qa@test.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'ConfirmationChef',
      role: 'CHEF',
      city: 'Casablanca',
    },
  });

  const chefProfile = await prisma.chefProfile.create({
    data: {
      userId: chefUser.id,
      displayName: 'Chef Casablanca Confirmation',
      status: 'APPROVED',
      city: 'Casablanca',
    },
  });

  const dish = await prisma.dish.create({
    data: {
      chefId: chefProfile.id,
      name: 'Confirmation Gourmet Couscous',
      price: new Prisma.Decimal(65.0),
      category: 'MAIN_COURSE',
      stockCount: 10,
      preparationTime: 25,
    },
  });

  console.log('Seeded database successfully.');

  // Create JWT token for customer
  const token = signToken({ sub: customerUser.id, email: customerUser.email, role: 'USER', city: customerUser.city });
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `auth_token=${token}`,
  };

  // Add item to cart
  const cart = await prisma.cart.create({ data: { userId: customerUser.id } });
  await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      dishId: dish.id,
      quantity: 1,
    },
  });
  console.log('Added 1 item to cart.');

  // Perform checkout
  console.log('Performing checkout...');
  const checkoutRes = await fetch(`${BASE_URL}/api/cart/checkout`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      deliveryAddress: '456 Confirmation St, Casablanca',
    }),
  });

  if (!checkoutRes.ok) {
    throw new Error(`Checkout failed: ${checkoutRes.status} ${await checkoutRes.text()}`);
  }

  const checkoutData = await checkoutRes.json();
  const createdOrderId = checkoutData.orders[0].id;
  console.log(`Checkout successful. Order ID: ${createdOrderId}`);

  // Test 1: Hit `/profile/orders/confirmation?ids=<orderId>`
  console.log('\n--- VERIFYING CONFIRMATION PAGE ---');
  const confirmUrl = `${BASE_URL}/profile/orders/confirmation?ids=${createdOrderId}`;
  console.log(`Requesting GET ${confirmUrl}...`);
  const confirmRes = await fetch(confirmUrl, { headers });
  console.log(`Response Status (should be 200): ${confirmRes.status}`);
  const html = await confirmRes.text();
  console.log(`Contains "Order Confirmation" text: ${html.includes('Order Confirmation')}`);
  console.log(`Contains correct Order ID: ${html.includes(createdOrderId.slice(0, 8))}`);

  // Test 2: Hit `/profile/orders/confirmation?id=<orderId>` (using alternate id param)
  console.log('\n--- VERIFYING CONFIRMATION PAGE WITH ALT ID PARAM ---');
  const confirmUrlAlt = `${BASE_URL}/profile/orders/confirmation?id=${createdOrderId}`;
  console.log(`Requesting GET ${confirmUrlAlt}...`);
  const confirmResAlt = await fetch(confirmUrlAlt, { headers });
  console.log(`Response Status (should be 200): ${confirmResAlt.status}`);
  const htmlAlt = await confirmResAlt.text();
  console.log(`Contains "Order Confirmation" text: ${htmlAlt.includes('Order Confirmation')}`);

  // Test 3: Hit `/profile/orders`
  console.log('\n--- VERIFYING ORDERS PAGE ---');
  const ordersUrl = `${BASE_URL}/profile/orders`;
  console.log(`Requesting GET ${ordersUrl}...`);
  const ordersRes = await fetch(ordersUrl, { headers });
  console.log(`Response Status (should be 200): ${ordersRes.status}`);
  const ordersHtml = await ordersRes.text();
  console.log(`Contains "Order History" text: ${ordersHtml.includes('Order History')}`);
  console.log(`Contains new order: ${ordersHtml.includes(createdOrderId.slice(0, 8))}`);

  console.log('\n=== ALL CONFIRMATION FLOW QA TESTS COMPLETED SUCCESSFULY ===');
}

runQATests().catch((err) => {
  console.error('QA Test execution failed:', err);
  process.exit(1);
});
