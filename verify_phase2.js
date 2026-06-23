require('ts-node').register({ transpileOnly: true });
const { prisma } = require('./lib/prisma');
const { POST } = require('./app/api/cart/checkout/route');
const sessionModule = require('./app/lib/session');

(async () => {
  // Clean up any previous data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.chefProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create a customer
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

  // Create two chefs in the same city
  const chefAUser = await prisma.user.create({
    data: { email: 'chefA@test.com', password: 'pw', firstName: 'Chef', lastName: 'A', role: 'CHEF', city: 'TestCity' },
  });
  const chefBUser = await prisma.user.create({
    data: { email: 'chefB@test.com', password: 'pw', firstName: 'Chef', lastName: 'B', role: 'CHEF', city: 'TestCity' },
  });
  const chefA = await prisma.chefProfile.create({ data: { userId: chefAUser.id, displayName: 'Chef A' } });
  const chefB = await prisma.chefProfile.create({ data: { userId: chefBUser.id, displayName: 'Chef B' } });

  // Create dishes with stock (price as string to fit Decimal)
  const dishA = await prisma.dish.create({
    data: { chefId: chefA.id, name: 'Dish A', price: '10', category: 'MAIN_COURSE', stockCount: 5, preparationTime: 15 },
  });
  const dishB = await prisma.dish.create({
    data: { chefId: chefB.id, name: 'Dish B', price: '20', category: 'MAIN_COURSE', stockCount: 3, preparationTime: 20 },
  });

  // Create cart for the customer and add items from both chefs
  const cart = await prisma.cart.create({ data: { userId: customer.id } });
  await prisma.cartItem.create({ data: { cartId: cart.id, dishId: dishA.id, quantity: 2 } }); // 2 * 10 = 20
  await prisma.cartItem.create({ data: { cartId: cart.id, dishId: dishB.id, quantity: 1 } }); // 1 * 20 = 20

  // Mock getSession to return the customer
  const originalGetSession = sessionModule.getSession;
  sessionModule.getSession = async () => customer;

  // Mock request object for POST handler
  const mockReq = { json: async () => ({ deliveryAddress: '123 Test St', notes: '' }) };

  const res = await POST(mockReq);
  const json = await res.json();
  console.log('--- Checkout response ---');
  console.log(JSON.stringify(json, null, 2));

  // Restore original getSession
  sessionModule.getSession = originalGetSession;

  // Verify orders in DB
  const orders = await prisma.order.findMany({ where: { userId: customer.id }, include: { orderItems: true } });
  console.log('\n--- Orders created ---');
  orders.forEach(o => {
    console.log({ id: o.id, chefId: o.chefId, totalAmount: o.totalAmount.toString(), items: o.orderItems.length });
  });

  // Verify stock after checkout
  const freshA = await prisma.dish.findUnique({ where: { id: dishA.id } });
  const freshB = await prisma.dish.findUnique({ where: { id: dishB.id } });
  console.log('\n--- Stock after checkout ---');
  console.log({ DishA: freshA?.stockCount, DishB: freshB?.stockCount });
})();
