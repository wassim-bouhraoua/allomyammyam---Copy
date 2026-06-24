import { prisma } from '../lib/prisma';
import { POST } from '../app/api/orders/items/[orderItemId]/review/route';

async function main() {
  console.log('=== STARTING REVIEW E2E VERIFICATION TESTS ===\n');

  // Clean up any previous test data
  console.log('Cleaning up previous test data...');
  await prisma.dishReview.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.chefProfile.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create customer user
  console.log('Creating customer and chef users...');
  const customer = await prisma.user.create({
    data: {
      email: 'cust_e2e@test.com',
      password: 'pw',
      firstName: 'Jane',
      lastName: 'Customer',
      role: 'USER',
      city: 'Casablanca',
    },
  });

  // Create another customer (to leave a second review)
  const customer2 = await prisma.user.create({
    data: {
      email: 'cust2_e2e@test.com',
      password: 'pw',
      firstName: 'Alice',
      lastName: 'Smith',
      role: 'USER',
      city: 'Casablanca',
    },
  });

  // 2. Create chef user and chef profile
  const chefUser = await prisma.user.create({
    data: {
      email: 'chef_e2e@test.com',
      password: 'pw',
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
      averageRating: 0.0,
      totalReviews: 0,
    },
  });

  // 3. Create dish
  const dish = await prisma.dish.create({
    data: {
      chefId: chefProfile.id,
      name: 'E2E Test Burger',
      price: '12.5',
      category: 'BURGER',
      stockCount: 10,
      preparationTime: 20,
      averageRating: 0.0,
      totalReviews: 0,
    },
  });

  // 4. Create an order with status CREATED
  console.log('Creating an order with status CREATED...');
  const order = await prisma.order.create({
    data: {
      userId: customer.id,
      chefId: chefProfile.id,
      status: 'CREATED',
      deliveryAddress: '123 Test St',
      notes: 'No onions',
      totalAmount: '27.5',
      deliveryFee: '15',
    },
  });

  const orderItem = await prisma.orderItem.create({
    data: {
      orderId: order.id,
      dishId: dish.id,
      quantity: 1,
      unitPrice: '12.5',
      totalPrice: '12.5',
      dishName: dish.name,
    },
  });

  // --- E2E Verification 1: Prevent review when status != DELIVERED ---
  console.log('\n--- 1. Testing review before delivery ---');
  // Mock session to be customer
  let currentSession: any = customer;
  (globalThis as any).__mockSession = currentSession;

  let mockReq = {
    json: async () => ({ rating: 4, comment: 'Nice!' }),
  } as unknown as Request;

  let res = await POST(mockReq, { params: Promise.resolve({ orderItemId: orderItem.id }) });
  let json = await res.json();
  console.log(`Status: ${res.status}`);
  console.log(`Response:`, json);
  if (res.status !== 400 || !json.error.includes('delivered')) {
    throw new Error('Expected 400 bad request for undelivered order review');
  }
  console.log('✓ Successfully blocked review for non-delivered order');

  // --- E2E Verification 2: Deliver the order ---
  console.log('\n--- 2. Delivering order ---');
  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'DELIVERED' },
  });
  console.log('Order status updated to DELIVERED');

  // --- E2E Verification 3: Verify self-review protection ---
  console.log('\n--- 3. Testing self-review protection ---');
  // Create an order where chefUser is the customer ordering their own dish
  const selfOrder = await prisma.order.create({
    data: {
      userId: chefUser.id, // Chef orders their own dish
      chefId: chefProfile.id,
      status: 'DELIVERED',
      deliveryAddress: '123 Chef Lane',
      totalAmount: '12.5',
    },
  });
  const selfOrderItem = await prisma.orderItem.create({
    data: {
      orderId: selfOrder.id,
      dishId: dish.id,
      quantity: 1,
      unitPrice: '12.5',
      totalPrice: '12.5',
      dishName: dish.name,
    },
  });

  currentSession = chefUser;
  (globalThis as any).__mockSession = currentSession;
  res = await POST(mockReq, { params: Promise.resolve({ orderItemId: selfOrderItem.id }) });
  json = await res.json();
  console.log(`Status: ${res.status}`);
  console.log(`Response:`, json);
  if (res.status !== 403 || !json.error.includes('Chefs cannot review')) {
    throw new Error('Expected 403 Forbidden for chef self-review');
  }
  console.log('✓ Successfully blocked chef from reviewing their own dish');

  // --- E2E Verification 4: Verify review ownership protection ---
  console.log('\n--- 4. Testing review ownership protection ---');
  currentSession = customer2; // Alice tries to review Jane's order
  (globalThis as any).__mockSession = currentSession;
  res = await POST(mockReq, { params: Promise.resolve({ orderItemId: orderItem.id }) });
  json = await res.json();
  console.log(`Status: ${res.status}`);
  console.log(`Response:`, json);
  if (res.status !== 403 || !json.error.includes('Unauthorized access')) {
    throw new Error('Expected 403 Forbidden for review ownership mismatch');
  }
  console.log('✓ Successfully blocked unauthorized customer from reviewing another user\'s order');

  // --- E2E Verification 5: Customer leaves a review (create) ---
  console.log('\n--- 5. Leaving a review (Rating: 4) ---');
  currentSession = customer; // Jane reviews
  (globalThis as any).__mockSession = currentSession;
  res = await POST(mockReq, { params: Promise.resolve({ orderItemId: orderItem.id }) });
  json = await res.json();
  console.log(`Status: ${res.status}`);
  console.log(`Response success:`, json.success);
  if (res.status !== 200 || !json.success) {
    throw new Error('Expected review creation to succeed');
  }

  // --- E2E Verification 6: Verify Dish & Chef statistics after first review ---
  console.log('\n--- 6. Verifying Dish & Chef statistics (should be 4.0 average, 1 review) ---');
  let freshDish = await prisma.dish.findUnique({ where: { id: dish.id } });
  let freshChef = await prisma.chefProfile.findUnique({ where: { id: chefProfile.id } });
  console.log(`Dish averageRating: ${freshDish?.averageRating}, totalReviews: ${freshDish?.totalReviews}`);
  console.log(`Chef averageRating: ${freshChef?.averageRating}, totalReviews: ${freshChef?.totalReviews}`);
  if (Number(freshDish?.averageRating) !== 4.0 || freshDish?.totalReviews !== 1) {
    throw new Error('Dish statistics mismatch after first review');
  }
  if (Number(freshChef?.averageRating) !== 4.0 || freshChef?.totalReviews !== 1) {
    throw new Error('Chef statistics mismatch after first review');
  }
  console.log('✓ Dish and Chef statistics verified successfully');

  // --- E2E Verification 7: Customer updates/edits the review (edit) ---
  console.log('\n--- 7. Editing the review (Rating: 5, comment: "Superb!") ---');
  mockReq = {
    json: async () => ({ rating: 5, comment: 'Superb!' }),
  } as unknown as Request;
  res = await POST(mockReq, { params: Promise.resolve({ orderItemId: orderItem.id }) });
  json = await res.json();
  console.log(`Status: ${res.status}`);
  console.log(`Response success:`, json.success);
  if (res.status !== 200 || !json.success) {
    throw new Error('Expected review update to succeed');
  }

  // --- E2E Verification 8: Verify Dish & Chef statistics after edit ---
  console.log('\n--- 8. Verifying Dish & Chef statistics after edit (should be 5.0 average, 1 review) ---');
  freshDish = await prisma.dish.findUnique({ where: { id: dish.id } });
  freshChef = await prisma.chefProfile.findUnique({ where: { id: chefProfile.id } });
  console.log(`Dish averageRating: ${freshDish?.averageRating}, totalReviews: ${freshDish?.totalReviews}`);
  console.log(`Chef averageRating: ${freshChef?.averageRating}, totalReviews: ${freshChef?.totalReviews}`);
  if (Number(freshDish?.averageRating) !== 5.0 || freshDish?.totalReviews !== 1) {
    throw new Error('Dish statistics mismatch after edit');
  }
  if (Number(freshChef?.averageRating) !== 5.0 || freshChef?.totalReviews !== 1) {
    throw new Error('Chef statistics mismatch after edit');
  }
  console.log('✓ Dish and Chef statistics updated correctly after edit');

  // --- E2E Verification 9: Verify no mock reviews exist and privacy/date format rules are respected ---
  console.log('\n--- 9. Verifying privacy rules & date format on reviews query ---');
  // Fetch reviews exactly like in app/dishes/[id]/page.tsx
  const dbReviews = await prisma.dishReview.findMany({
    where: { orderItem: { dishId: dish.id } },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
    },
  });

  console.log(`Found ${dbReviews.length} reviews in DB`);
  if (dbReviews.length !== 1) {
    throw new Error('Expected exactly 1 review in the database');
  }

  const mappedReviews = dbReviews.map((r) => ({
    id: r.id,
    authorName: `${r.user.firstName} ${r.user.lastName ? r.user.lastName[0] + "." : ""}`,
    initial: r.user.firstName?.[0]?.toUpperCase() || "U",
    rating: r.rating,
    comment: r.comment || "",
    date: r.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
  }));

  console.log('Mapped review display format:', mappedReviews[0]);

  // Privacy Rule check
  const authorName = mappedReviews[0].authorName;
  console.log(`Rendered Author Name: "${authorName}"`);
  if (authorName !== 'Jane C.') {
    throw new Error(`Expected authorName to be Jane C., got: ${authorName}`);
  }
  console.log('✓ Privacy rule check passed (First Name + Last Initial only, no full names/emails exposed)');

  // Date Check
  const dateStr = mappedReviews[0].date;
  console.log(`Rendered Review Date: "${dateStr}"`);
  if (!dateStr || isNaN(Date.parse(dateStr))) {
    throw new Error('Invalid or unparseable review date format');
  }
  console.log('✓ Review date format verified successfully');

  // Clean up global mock session
  delete (globalThis as any).__mockSession;

  console.log('\n=== ALL E2E VERIFICATION TESTS COMPLETED SUCCESSFULY ===');
}

main()
  .catch((err) => {
    console.error('E2E Verification failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
