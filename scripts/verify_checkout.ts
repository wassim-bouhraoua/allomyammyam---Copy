// @ts-nocheck
import { prisma } from '@/lib/prisma';
import fetch from 'node-fetch';

async function main() {
  // Clean up previous test data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.chefProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create two users (customer and chefs)
  const customer = await prisma.user.create({
    data: { email: 'cust@test.com', password: 'pw', firstName: 'Cust', lastName: 'User', role: 'USER', city: 'TestCity' },
  });

  const chefAUser = await prisma.user.create({
    data: { email: 'chefA@test.com', password: 'pw', firstName: 'Chef', lastName: 'A', role: 'CHEF', city: 'TestCity' },
  });
  const chefBUser = await prisma.user.create({
    data: { email: 'chefB@test.com', password: 'pw', firstName: 'Chef', lastName: 'B', role: 'CHEF', city: 'TestCity' },
  });

  const chefA = await prisma.chefProfile.create({ data: { userId: chefAUser.id, displayName: 'Chef A' } });
  const chefB = await prisma.chefProfile.create({ data: { userId: chefBUser.id, displayName: 'Chef B' } });

  // Create dishes for each chef with stock
  const { Prisma } = require('@prisma/client');
  const dishA = await prisma.dish.create({
    data: {
      chefId: chefA.id,
      name: 'Dish A',
      price: new Prisma.Decimal(10),
      category: 'MAIN_COURSE',
      stockCount: 5,
      preparationTime: 15,
    },
  });
  const dishB = await prisma.dish.create({
    data: {
      chefId: chefB.id,
      name: 'Dish B',
      price: new Prisma.Decimal(20),
      category: 'MAIN_COURSE',
      stockCount: 3,
      preparationTime: 20,
    },
  });

  // Create cart for customer
  const cart = await prisma.cart.create({ data: { userId: customer.id } });
  await prisma.cartItem.create({ data: { cartId: cart.id, dishId: dishA.id, quantity: 2 } });
  await prisma.cartItem.create({ data: { cartId: cart.id, dishId: dishB.id, quantity: 1 } });

  // Simulate login session by setting a mock cookie? We'll call API directly using prisma session emulation: the checkout route uses getSession which reads from cookies. For test we can call the function directly instead of HTTP.
  // Import the route handler directly:
  const { POST } = require('../app/api/cart/checkout/route');
  const mockReq = new (require('node-fetch')).Request('http://localhost/api/cart/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deliveryAddress: '123 Test St' }),
  });
  // Mock getSession to return customer
  const originalGetSession = require('../app/lib/session').getSession;
  require('../app/lib/session').getSession = async () => customer;
  const res = await POST(mockReq);
  const json = await res.json();
  console.log('Checkout response', json);
  // Restore original
  require('../app/lib/session').getSession = originalGetSession;

  // Verify orders
  const orders = await prisma.order.findMany({ where: { userId: customer.id }, include: { orderItems: true } });
  console.log('Orders created:', orders.map(o => ({ id: o.id, chefId: o.chefId, total: o.totalAmount, items: o.orderItems.length })));
  // Verify stock
  const freshDishA = await prisma.dish.findUnique({ where: { id: dishA.id } });
  const freshDishB = await prisma.dish.findUnique({ where: { id: dishB.id } });
  console.log('Stock after checkout:', { dishA: freshDishA?.stockCount, dishB: freshDishB?.stockCount });
}

main().catch(e => console.error(e));
