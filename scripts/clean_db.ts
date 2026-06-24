import { prisma } from '../lib/prisma';

async function main() {
  console.log('=== CLEANING DATABASE ===\n');

  console.log('Deleting DishReview records...');
  await prisma.dishReview.deleteMany();

  console.log('Deleting OrderItem records...');
  await prisma.orderItem.deleteMany();

  console.log('Deleting Order records...');
  await prisma.order.deleteMany();

  console.log('Deleting CartItem records...');
  await prisma.cartItem.deleteMany();

  console.log('Deleting Cart records...');
  await prisma.cart.deleteMany();

  console.log('Deleting Dish records...');
  await prisma.dish.deleteMany();

  console.log('Deleting ChefProfile records...');
  await prisma.chefProfile.deleteMany();

  console.log('Deleting User records...');
  await prisma.user.deleteMany();

  console.log('\n=== DATABASE CLEANED SUCCESSFULLY ===');
}

main()
  .catch((err) => {
    console.error('Database cleanup failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
