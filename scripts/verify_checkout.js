const { prisma } = require('../lib/prisma');
const { Decimal } = require('@prisma/client');
const { POST } = require('../app/api/cart/checkout/route');

// Mock getSession to return the customer user
const sessionModule = require('../app/lib/session');

async function main() {
  // Clean previous test data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.chefProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create customer user
  const customer = await prisma.user.create({
    data: {
      email: 'cust@test.com',
      password: 'pw',
      firstName: 'Cust',
      lastName: 'User',
      role: 'USER',
      city: 'TestCity',
    },
  });

  // Create two chefs (users + profiles) in same city
  const chefAUser = await prisma.user.create({
    data: {
      email: 'chefA@test.com',
      password: 'pw',
      firstName: 'Chef',
      lastName: 'A',
      role: 'CHEF',
      city: 'TestCity',
    },
  });
  const chefBUser = await prisma.user.create({
    data: {
      email: 'chefB@test.com',
      password: 'pw',
      firstName: 'Chef',
      lastName: 'B',
      role: 'CHEF',
      city: 'TestCity',
    },
  });

  const chefA = await prisma.chefProfile.create({ data: { userId: chefAUser.id, displayName: 'Chef A' } });
  const chefB = await prisma.chefProfile.create({ data: { userId: chefBUser.id, displayName: 'Chef B' } });

  // Create dishes for each chef with stock
  const dishA = await prisma.dish.create({
    data: {
      chefId: chefA.id,
      name: 'Dish A',
      price: new Decimal(10),
      category: 'MAIN_COURSE',
      stockCount: 5,
      preparationTime: 15,
    },
  });
  const dishB = await prisma.dish.create({
    data: {
      chefId: chefB.id,
      name: 'Dish B',
      price: new Decimal(20),
      category: 'MAIN_COURSE',
      stockCount: 3,
      preparationTime: 20,
    },
  });

  // Create cart for customer and add items (2 of A, 1 of B)
  const cart = await prisma.cart.create({ data: { userId: customer.id } });
  await prisma.cartItem.create({ data: { cartId: cart.id, dishId: dishA.id, quantity: 2 } });
  await prisma.cartItem.create({ data: { cartId: cart.id, dishId: dishB.id, quantity: 1 } });

  // Mock getSession to return our customer
  const originalGetSession = sessionModule.getSession;
  sessionModule.getSession = async () => customer;

  // Mock NextRequest compatible object
  const mockReq = {
    json: async () => ({ deliveryAddress: '123 Test St', notes: '' }),
    method: 'POST',
    headers: new Map(),
  };

  const res = await POST(mockReq);
  const json = await res.json();
  console.log('Checkout response:', json);

  // Restore getSession
  sessionModule.getSession = originalGetSession;

  // Verify orders
  const orders = await prisma.order.findMany({ where: { userId: customer.id }, include: { orderItems: true } });
  console.log('Orders created:');
  orders.forEach(o => console.log({ id: o.id, chefId: o.chefId, totalAmount: o.totalAmount.toString(), items: o.orderItems.length }));

  // Verify stock after checkout
  const freshA = await prisma.dish.findUnique({ where: { id: dishA.id } });
  const freshB = await prisma.dish.findUnique({ where: { id: dishB.id } });
  console.log('Stock after checkout:', { DishA: freshA?.stockCount, DishB: freshB?.stockCount });
}

main().catch(e => console.error('Verification error:', e));

  // Clean previous test data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.chefProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create customer user
  const customer = await prisma.user.create({
    data: {
      email: 'cust@test.com',
      password: 'pw',
      firstName: 'Cust',
      lastName: 'User',
      role: 'USER',
      city: 'TestCity',
    },
  });

  // Create two chefs (users + profiles) in same city
  const chefAUser = await prisma.user.create({
    data: {
      email: 'chefA@test.com',
      password: 'pw',
      firstName: 'Chef',
      lastName: 'A',
      role: 'CHEF',
      city: 'TestCity',
    },
  });
  const chefBUser = await prisma.user.create({
    data: {
      email: 'chefB@test.com',
      password: 'pw',
      firstName: 'Chef',
      lastName: 'B',
      role: 'CHEF',
      city: 'TestCity',
    },
  });

  const chefA = await prisma.chefProfile.create({ data: { userId: chefAUser.id, displayName: 'Chef A' } });
  const chefB = await prisma.chefProfile.create({ data: { userId: chefBUser.id, displayName: 'Chef B' } });

  // Create dishes for each chef with stock
  const dishA = await prisma.dish.create({
    data: {
      chefId: chefA.id,
      name: 'Dish A',
      price: new Decimal(10),
      category: 'MAIN_COURSE',
      stockCount: 5,
      preparationTime: 15,
    },
  });
  const dishB = await prisma.dish.create({
    data: {
      chefId: chefB.id,
      name: 'Dish B',
      price: new Decimal(20),
      category: 'MAIN_COURSE',
      stockCount: 3,
      preparationTime: 20,
    },
  });

  // Create cart for customer and add items (2 of A, 1 of B)
  const cart = await prisma.cart.create({ data: { userId: customer.id } });
  await prisma.cartItem.create({ data: { cartId: cart.id, dishId: dishA.id, quantity: 2 } });
  await prisma.cartItem.create({ data: { cartId: cart.id, dishId: dishB.id, quantity: 1 } });

  // Mock getSession to return our customer
  const originalGetSession = sessionModule.getSession;
  sessionModule.getSession = async () => customer;

  // Mock NextRequest
  const mockReq = {
    json: async () => ({ deliveryAddress: '123 Test St', notes: '' }),
    method: 'POST',
    headers: new Map(),
  };

  const res = await POST(mockReq);
  const json = await res.json();
  console.log('Checkout response:', json);

  // Restore original getSession
  sessionModule.getSession = originalGetSession;

  // Verify orders
  const orders = await prisma.order.findMany({ where: { userId: customer.id }, include: { orderItems: true } });
  console.log('Orders created:');
  for (const o of orders) {
    console.log({ id: o.id, chefId: o.chefId, totalAmount: o.totalAmount.toString(), itemCount: o.orderItems.length });
  }

  // Verify stock after checkout
  const freshA = await prisma.dish.findUnique({ where: { id: dishA.id } });
  const freshB = await prisma.dish.findUnique({ where: { id: dishB.id } });
  console.log('Stock after checkout:', { DishA: freshA?.stockCount, DishB: freshB?.stockCount });
}

main().catch(e => console.error('Verification error:', e));
