const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Cleanup any previous test data (use a unique email domain)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.chefProfile.deleteMany();
  await prisma.user.deleteMany({ where: { email: { endsWith: '@test.com' } } });

  // Create a test user with a city
  const user = await prisma.user.create({
    data: {
      email: 'checkout_user@test.com',
      password: 'hashed',
      firstName: 'Checkout',
      lastName: 'User',
      city: 'Rabat',
    },
  });

  // Create two chefs in the same city
  const chefA = await prisma.chefProfile.create({
    data: {
      user: {
        create: {
          email: 'chefA@test.com',
          password: 'hashed',
          firstName: 'Chef',
          lastName: 'A',
          city: 'Rabat',
        },
      },
      displayName: 'Chef A',
      city: 'Rabat',
    },
    include: { user: true },
  });

  const chefB = await prisma.chefProfile.create({
    data: {
      user: {
        create: {
          email: 'chefB@test.com',
          password: 'hashed',
          firstName: 'Chef',
          lastName: 'B',
          city: 'Rabat',
        },
      },
      displayName: 'Chef B',
      city: 'Rabat',
    },
    include: { user: true },
  });

  // Create dishes with sufficient stock
  const dishA = await prisma.dish.create({
    data: {
      name: 'Dish A',
      price: 100,
      category: 'MAIN_COURSE',
      chefId: chefA.id,
      stockCount: 10,
    },
  });
  const dishB = await prisma.dish.create({
    data: {
      name: 'Dish B',
      price: 150,
      category: 'MAIN_COURSE',
      chefId: chefB.id,
      stockCount: 10,
    },
  });

  // Create a cart for the user and add items (2 each)
  const cart = await prisma.cart.create({ data: { userId: user.id } });
  await prisma.cartItem.createMany({
    data: [
      { cartId: cart.id, dishId: dishA.id, quantity: 2 },
      { cartId: cart.id, dishId: dishB.id, quantity: 2 },
    ],
  });

  console.log('--- BEFORE CHECKOUT ---');
  console.log('Cart items:', await prisma.cartItem.findMany({ where: { cartId: cart.id } }));
  console.log('Dish stocks:', await prisma.dish.findMany({ where: { id: { in: [dishA.id, dishB.id] } } }));

  // Simulate session data used by the checkout route
  const session = { id: user.id, city: user.city };
  const deliveryAddress = '123 Test St';
  const notes = '';

  async function checkout() {
    const cart = await prisma.cart.findUnique({
      where: { userId: session.id },
      include: { cartItems: { include: { dish: { include: { chef: true } } } } },
    });
    if (!cart || cart.cartItems.length === 0) throw new Error('Cart empty');

    const itemsByChef = {};
    for (const item of cart.cartItems) {
      const chefId = item.dish.chefId;
      if (!itemsByChef[chefId]) itemsByChef[chefId] = [];
      itemsByChef[chefId].push(item);
    }

    const createdOrders = await prisma.$transaction(async (tx) => {
      const orders = [];
      for (const chefId of Object.keys(itemsByChef)) {
        const items = itemsByChef[chefId];
        const dishIds = items.map(i => i.dish.id);
        const freshDishes = await tx.dish.findMany({ where: { id: { in: dishIds } } });
        const freshMap = new Map(freshDishes.map(d => [d.id, d]));
        // Stock validation
        for (const item of items) {
          const fresh = freshMap.get(item.dish.id);
          if (fresh.stockCount !== null && item.quantity > fresh.stockCount) {
            throw new Error('Insufficient stock for ' + fresh.name);
          }
        }
        // Subtotal
        let subtotal = 0;
        for (const item of items) {
          subtotal += Number(item.dish.price) * item.quantity;
        }
        // Create Order
        const order = await tx.order.create({
          data: {
            userId: session.id,
            chefId,
            status: 'CREATED',
            totalAmount: subtotal,
            deliveryAddress,
            notes,
          },
        });
        // Order items + stock decrement
        for (const item of items) {
          const fresh = freshMap.get(item.dish.id);
          if (!fresh) {
            throw new Error('Dish not found during checkout test');
          }
          await tx.orderItem.create({
            data: {
              orderId: order.id,
              dishId: fresh.id,
              quantity: item.quantity,
              unitPrice: fresh.price,
              totalPrice: Number(fresh.price) * item.quantity,
              dishName: fresh.name,
            },
          });
          if (fresh.stockCount !== null) {
            await tx.dish.update({
              where: { id: fresh.id },
              data: { stockCount: fresh.stockCount - item.quantity },
            });
          }
        }
        orders.push({ id: order.id, chefId, totalAmount: subtotal, status: order.status });
      }
      // Clear cart items (keep cart record)
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return orders;
    });
    return createdOrders;
  }

  // ----- SUCCESSFUL CHECKOUT -----
  const successResult = await checkout();
  console.log('--- AFTER SUCCESSFUL CHECKOUT ---');
  console.log('Created Orders:', successResult);
  console.log('Orders in DB:', await prisma.order.findMany({ include: { orderItems: true } }));
  console.log('Dish stocks after checkout:', await prisma.dish.findMany({ where: { id: { in: [dishA.id, dishB.id] } } }));
  console.log('Cart items after checkout (should be empty):', await prisma.cartItem.findMany({ where: { cartId: cart.id } }));

  // ----- ROLLBACK TEST (force insufficient stock) -----
  // Re‑populate cart with items again
  await prisma.cartItem.createMany({
    data: [
      { cartId: cart.id, dishId: dishA.id, quantity: 5 },
      { cartId: cart.id, dishId: dishB.id, quantity: 5 },
    ],
  });
  // Reduce stock of dishB to create shortage
  await prisma.dish.update({ where: { id: dishB.id }, data: { stockCount: 3 } });

  try {
    await checkout();
  } catch (e) {
    console.log('--- ROLLBACK OCCURRED ---');
    console.log('Error message:', e.message);
  }

  console.log('State after rollback attempt:');
  console.log('Orders count (should still be 2):', await prisma.order.count());
  console.log('OrderItems count (should still be 4):', await prisma.orderItem.count());
  console.log('Dish stocks (unchanged for B):', await prisma.dish.findMany({ where: { id: { in: [dishA.id, dishB.id] } } }));
  console.log('Cart items still present (should be 2):', await prisma.cartItem.findMany({ where: { cartId: cart.id } }));
}

main()
  .catch((e) => console.error('Unexpected error:', e))
  .finally(async () => {
    await prisma.$disconnect();
  });
