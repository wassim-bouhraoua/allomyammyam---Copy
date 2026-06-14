const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

// Set WebSocket constructor for Neon serverless in Node.js
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set!");
  process.exit(1);
}

const adapter = new PrismaNeon({
  connectionString
});
const prisma = new PrismaClient({
  adapter
});

async function main() {
  const userCount = await prisma.user.count();
  const dishCount = await prisma.dish.count();
  console.log(`Users in database: ${userCount}`);
  console.log(`Dishes in database: ${dishCount}`);
  
  if (dishCount === 0) {
    console.log("No dishes found. Creating sample dishes...");
    // Create a chef user first
    const chefUser = await prisma.user.create({
      data: {
        firstName: "Fatima",
        lastName: "Ezzahra",
        email: "fatima@example.com",
        password: "$2a$12$samplepasswordhachedversion", // simple dummy hash
        role: "CHEF",
        chefProfile: {
          create: {
            displayName: "Fatima Cuisine",
            bio: "Spécialiste de la cuisine marocaine authentique. Diplômée de l'école hôtelière.",
            specialties: ["Couscous", "Tajine", "Pastilla"],
            city: "Oujda"
          }
        }
      },
      include: {
        chefProfile: true
      }
    });
    
    // Create a client user
    await prisma.user.create({
      data: {
        firstName: "Wassim",
        lastName: "Bouhraoua",
        email: "wassim@example.com",
        password: "$2a$12$clientpasswordhashed",
        role: "USER"
      }
    });

    // Create dishes
    const dish1 = await prisma.dish.create({
      data: {
        name: "Couscous Royal",
        description: "Semoule de blé fine, légumes frais de saison, pois chiches, viande de bœuf tendre et poulet fermier.",
        price: 75.0,
        preparationTime: 45,
        isAvailable: true,
        category: "MAIN_COURSE",
        chefId: chefUser.chefProfile.id
      }
    });

    const dish2 = await prisma.dish.create({
      data: {
        name: "Tajine de Poulet aux Citrons",
        description: "Tajine de poulet traditionnel mijoté lentement avec des citrons confits, des olives violettes et des épices de Fès.",
        price: 65.0,
        preparationTime: 35,
        isAvailable: true,
        category: "MAIN_COURSE",
        chefId: chefUser.chefProfile.id
      }
    });

    const dish3 = await prisma.dish.create({
      data: {
        name: "Pastilla au Poulet",
        description: "Feuilletage croustillant farci d'un mélange de poulet effiloché aux oignons caramélisés et d'amandes grillées concassées, parfumé à la cannelle.",
        price: 80.0,
        preparationTime: 50,
        isAvailable: true,
        category: "MAIN_COURSE",
        chefId: chefUser.chefProfile.id
      }
    });

    // Add dummy images
    await prisma.dishImage.create({
      data: {
        url: "/dishes/couscous.jpg",
        dishId: dish1.id
      }
    });
    await prisma.dishImage.create({
      data: {
        url: "/dishes/tajine.jpg",
        dishId: dish2.id
      }
    });
    await prisma.dishImage.create({
      data: {
        url: "/dishes/pastilla.jpg",
        dishId: dish3.id
      }
    });

    console.log("Sample users and dishes created successfully!");
  } else {
    // List some dishes to see their IDs
    const dishes = await prisma.dish.findMany({ take: 3 });
    console.log("Sample dishes in DB:");
    for (const d of dishes) {
      console.log(`- [${d.id}] ${d.name} (${d.price} MAD)`);
    }
  }
}

main()
  .catch(e => {
    console.error("Error inspecting database:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
