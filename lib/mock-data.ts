// ─────────────────────────────────────────────────────────────────────────────
// Mock data — shapes match Prisma schema exactly.
// Replace `mockDishes` with:
//   await prisma.dish.findMany({ include: { chef: true } })
// and components work without modification.
// ─────────────────────────────────────────────────────────────────────────────

import { DishCategory, ChefStatus } from "@prisma/client";

// ── Embedded ChefProfile (subset returned by Prisma include) ─────────────────
export interface MockChefProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  specialties: string[];
  city: string | null;
  bannerUrl: string | null;
  avatarUrl: string | null;
  averageRating: number;
  totalReviews: number;
  status: ChefStatus;
  isAvailable: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Nutrition facts (added to every dish) ────────────────────────────────────
export interface NutritionFacts {
  calories: number;   // kcal
  protein: number;    // g
  carbs: number;      // g
  fat: number;        // g
  sugar: number;      // g
}

// ── Dish with embedded chef (Prisma findMany include shape) ──────────────────
export interface MockDish {
  id: string;
  chefId: string;
  name: string;
  description: string | null;
  price: number;
  category: DishCategory;
  imageUrl: string | null;
  averageRating: number;
  totalReviews: number;
  isAvailable: boolean;
  stockCount: number | null;
  preparationTime: number;
  tags: string[];
  nutrition: NutritionFacts;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  chef: MockChefProfile;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chef profiles
// ─────────────────────────────────────────────────────────────────────────────
const chefAli: MockChefProfile = {
  id: "chef-1", userId: "user-chef-1",
  displayName: "Chef Ali",
  bio: "Moroccan comfort food done right.",
  specialties: ["MAIN_COURSE", "MEAT"],
  city: "Oujda",
  bannerUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
  avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
  averageRating: 4.9, totalReviews: 312, status: "APPROVED", isAvailable: true,
  deletedAt: null, createdAt: new Date("2024-01-15"), updatedAt: new Date("2025-03-10"),
};

const chefSarah: MockChefProfile = {
  id: "chef-2", userId: "user-chef-2",
  displayName: "Chef Sarah",
  bio: "Mediterranean & French pastry expert.",
  specialties: ["DESSERT", "BREAKFAST"],
  city: "Casablanca",
  bannerUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80",
  avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80",
  averageRating: 4.7, totalReviews: 198, status: "APPROVED", isAvailable: true,
  deletedAt: null, createdAt: new Date("2024-02-20"), updatedAt: new Date("2025-04-01"),
};

const chefKarim: MockChefProfile = {
  id: "chef-3", userId: "user-chef-3",
  displayName: "Chef Karim",
  bio: "Traditional Moroccan tagines & couscous.",
  specialties: ["MAIN_COURSE", "SOUP"],
  city: "Fès",
  bannerUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80",
  avatarUrl: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=200&q=80",
  averageRating: 4.6, totalReviews: 145, status: "APPROVED", isAvailable: false,
  deletedAt: null, createdAt: new Date("2024-03-05"), updatedAt: new Date("2025-02-14"),
};

const chefLila: MockChefProfile = {
  id: "chef-4", userId: "user-chef-4",
  displayName: "Chef Lila",
  bio: "Plant-based bowls & healthy eating.",
  specialties: ["SALAD", "VEGAN"],
  city: "Rabat",
  bannerUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
  avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
  averageRating: 4.5, totalReviews: 87, status: "APPROVED", isAvailable: true,
  deletedAt: null, createdAt: new Date("2024-05-12"), updatedAt: new Date("2025-05-01"),
};

const chefOmar: MockChefProfile = {
  id: "chef-5", userId: "user-chef-5",
  displayName: "Chef Omar",
  bio: "Seafood & charcoal grill specialist.",
  specialties: ["SEAFOOD", "MEAT"],
  city: "Agadir",
  bannerUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
  avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
  averageRating: 4.8, totalReviews: 231, status: "APPROVED", isAvailable: true,
  deletedAt: null, createdAt: new Date("2024-04-18"), updatedAt: new Date("2025-04-22"),
};

const chefPriya: MockChefProfile = {
  id: "chef-6", userId: "user-chef-6",
  displayName: "Chef Priya",
  bio: "Authentic Indian home cooking from Mumbai.",
  specialties: ["MAIN_COURSE", "RICE_AND_GRAINS"],
  city: "Casablanca",
  bannerUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80",
  avatarUrl: "https://p16-oec-sg.ibyteimg.com/tos-alisg-i-aphluv4xwc-sg/img/VqbcmM/2023/11/10/1aa41dcc-5430-40c8-b119-d414df70559d.jpg~tplv-aphluv4xwc-resize-jpeg:700:0.jpg",
  averageRating: 4.8, totalReviews: 274, status: "APPROVED", isAvailable: true,
  deletedAt: null, createdAt: new Date("2024-06-01"), updatedAt: new Date("2025-05-10"),
};

const chefYuki: MockChefProfile = {
  id: "chef-7", userId: "user-chef-7",
  displayName: "Chef Yuki",
  bio: "Japanese precision — sushi, ramen & beyond.",
  specialties: ["ASIAN", "SEAFOOD"],
  city: "Rabat",
  bannerUrl: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80",
  avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80",
  averageRating: 4.9, totalReviews: 189, status: "APPROVED", isAvailable: true,
  deletedAt: null, createdAt: new Date("2024-07-15"), updatedAt: new Date("2025-05-12"),
};

// ─────────────────────────────────────────────────────────────────────────────
// Dishes — 20 dishes, verified images, accurate tags, realistic nutrition
// ─────────────────────────────────────────────────────────────────────────────
export const mockDishes: MockDish[] = [

  // ── Moroccan ───────────────────────────────────────────────────────────────
  {
    id: "dish-1", chefId: "chef-3",
    name: "Moroccan Lamb Tagine",
    description: "Slow-braised lamb with preserved lemon, olives and harissa — served with fresh khobz.",
    price: 150, category: "MAIN_COURSE",
    // Authentic Moroccan lamb tagine in a clay tagine pot with vegetables and olives
    imageUrl: "https://images.unsplash.com/photo-1643019237176-8ae0859f1123?w=1200&q=80",
    averageRating: 4.7, totalReviews: 134, isAvailable: true, stockCount: null,
    preparationTime: 50,
    tags: ["moroccan", "halal", "lamb", "slow-cooked", "traditional"],
    nutrition: { calories: 480, protein: 34, carbs: 28, fat: 22, sugar: 6 },
    deletedAt: null, createdAt: new Date("2025-01-22"), updatedAt: new Date("2025-04-28"),
    chef: chefKarim,
  },
  {
    id: "dish-2", chefId: "chef-3",
    name: "Harira Soup",
    description: "Classic Moroccan lentil and tomato soup with fresh coriander, celery and lemon.",
    price: 45, category: "SOUP",
    // Harira — reddish-brown Moroccan soup with herbs and lemon
    imageUrl: "https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=600&q=80&auto=format&fit=crop",
    averageRating: 4.5, totalReviews: 98, isAvailable: true, stockCount: null,
    preparationTime: 30,
    tags: ["moroccan", "halal", "soup", "traditional", "lentils"],
    nutrition: { calories: 310, protein: 15, carbs: 36, fat: 8, sugar: 4 },
    deletedAt: null, createdAt: new Date("2025-02-01"), updatedAt: new Date("2025-04-20"),
    chef: chefKarim,
  },
  {
    id: "dish-3", chefId: "chef-1",
    name: "Beef Kofta Platter",
    description: "Charcoal-grilled beef kofta with saffron rice and mint yoghurt.",
    price: 110, category: "MEAT",
    // Kofta / kebab skewers on a platter with rice and sauce
    imageUrl: "https://images.unsplash.com/photo-1696950168795-0b31150f8b5d?q=80",
    averageRating: 4.6, totalReviews: 119, isAvailable: true, stockCount: null,
    preparationTime: 30,
    tags: ["moroccan", "halal", "grilled", "beef", "meat"],
    nutrition: { calories: 520, protein: 38, carbs: 32, fat: 24, sugar: 3 },
    deletedAt: null, createdAt: new Date("2025-03-01"), updatedAt: new Date("2025-05-05"),
    chef: chefAli,
  },
  {
    id: "dish-4", chefId: "chef-1",
    name: "Chicken Bastilla",
    description: "Flaky warqa pastry filled with spiced chicken, almonds and cinnamon.",
    price: 95, category: "MAIN_COURSE",
    // Moroccan bastilla — round golden flaky pastry pie dusted with powdered sugar and cinnamon
    imageUrl: "https://cultureatz.com/wp-content/uploads/2016/05/Chicken-Bastilla-1200x900.jpg",
    averageRating: 4.8, totalReviews: 167, isAvailable: true, stockCount: null,
    preparationTime: 40,
    tags: ["moroccan", "halal", "traditional", "pastry", "chicken"],
    nutrition: { calories: 560, protein: 30, carbs: 45, fat: 26, sugar: 8 },
    deletedAt: null, createdAt: new Date("2025-01-10"), updatedAt: new Date("2025-05-01"),
    chef: chefAli,
  },

  // ── Indian ─────────────────────────────────────────────────────────────────
  {
    id: "dish-5", chefId: "chef-6",
    name: "Chicken Biryani",
    description: "Aromatic basmati rice slow-cooked with spiced chicken and whole spices.",
    price: 120, category: "RICE_AND_GRAINS",
    // Classic chicken biryani in a pot with saffron rice and whole spices
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80&auto=format&fit=crop",
    averageRating: 4.8, totalReviews: 241, isAvailable: true, stockCount: null,
    preparationTime: 35,
    tags: ["indian", "halal", "spicy", "rice", "chicken"],
    nutrition: { calories: 620, protein: 36, carbs: 72, fat: 18, sugar: 5 },
    deletedAt: null, createdAt: new Date("2025-01-10"), updatedAt: new Date("2025-05-01"),
    chef: chefPriya,
  },
  {
    id: "dish-6", chefId: "chef-6",
    name: "Butter Chicken",
    description: "Tender chicken in a rich tomato and butter masala sauce with basmati.",
    price: 115, category: "MAIN_COURSE",
    // Butter chicken — creamy orange-red curry in a bowl
    imageUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&q=80&auto=format&fit=crop",
    averageRating: 4.9, totalReviews: 312, isAvailable: true, stockCount: null,
    preparationTime: 30,
    tags: ["indian", "halal", "creamy", "chicken", "mild"],
    nutrition: { calories: 540, protein: 34, carbs: 30, fat: 28, sugar: 9 },
    deletedAt: null, createdAt: new Date("2025-02-14"), updatedAt: new Date("2025-05-08"),
    chef: chefPriya,
  },
  {
    id: "dish-7", chefId: "chef-6",
    name: "Palak Paneer",
    description: "Fresh cottage cheese cubes in a smooth spiced spinach sauce.",
    price: 85, category: "MAIN_COURSE",
    // Palak paneer — vibrant green spinach curry with visible white paneer cubes
    imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80&auto=format&fit=crop",
    averageRating: 4.6, totalReviews: 88, isAvailable: true, stockCount: null,
    preparationTime: 25,
    tags: ["indian", "vegetarian", "spiced", "paneer", "spinach"],
    nutrition: { calories: 390, protein: 22, carbs: 26, fat: 20, sugar: 5 },
    deletedAt: null, createdAt: new Date("2025-03-10"), updatedAt: new Date("2025-05-02"),
    chef: chefPriya,
  },

  // ── Japanese ───────────────────────────────────────────────────────────────
  {
    id: "dish-8", chefId: "chef-7",
    name: "Spicy Tuna Roll",
    description: "Fresh tuna, avocado and sriracha mayo in nori and sushi rice.",
    price: 130, category: "SEAFOOD",
    // Sushi rolls — tuna maki sliced and arranged on a plate
    imageUrl: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=600&q=80&auto=format&fit=crop",
    averageRating: 4.8, totalReviews: 145, isAvailable: true, stockCount: 15,
    preparationTime: 20,
    tags: ["japanese", "seafood", "spicy", "fresh", "sushi"],
    nutrition: { calories: 340, protein: 22, carbs: 38, fat: 10, sugar: 3 },
    deletedAt: null, createdAt: new Date("2025-02-20"), updatedAt: new Date("2025-05-10"),
    chef: chefYuki,
  },
  {
    id: "dish-9", chefId: "chef-7",
    name: "Tonkotsu Ramen",
    description: "Rich pork bone broth, chashu pork, soft-boiled egg and nori.",
    price: 100, category: "SOUP",
    // Tonkotsu ramen bowl — milky white broth with chashu pork, soft-boiled egg and nori
    imageUrl: "https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=600&q=80&auto=format&fit=crop",
    averageRating: 4.9, totalReviews: 178, isAvailable: true, stockCount: null,
    preparationTime: 15,
    tags: ["japanese", "noodles", "rich", "pork", "warming"],
    nutrition: { calories: 580, protein: 30, carbs: 55, fat: 24, sugar: 4 },
    deletedAt: null, createdAt: new Date("2025-03-05"), updatedAt: new Date("2025-05-11"),
    chef: chefYuki,
  },
  {
    id: "dish-10", chefId: "chef-7",
    name: "Salmon Sashimi",
    description: "Premium Atlantic salmon sliced to order, served with wasabi and pickled ginger.",
    price: 160, category: "SEAFOOD",
    // Salmon sashimi — thick orange slices neatly arranged on a plate with garnish
    imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=80&auto=format&fit=crop",
    averageRating: 4.9, totalReviews: 112, isAvailable: true, stockCount: 10,
    preparationTime: 10,
    tags: ["japanese", "seafood", "fresh", "light", "raw"],
    nutrition: { calories: 290, protein: 34, carbs: 4, fat: 14, sugar: 1 },
    deletedAt: null, createdAt: new Date("2025-04-01"), updatedAt: new Date("2025-05-12"),
    chef: chefYuki,
  },

  // ── Seafood & Grill ────────────────────────────────────────────────────────
  {
    id: "dish-11", chefId: "chef-5",
    name: "Grilled Sea Bass",
    description: "Whole sea bass over charcoal with chermoula and lemon wedges.",
    price: 180, category: "SEAFOOD",
    // Grilled whole fish on a plate with lemon and herbs
    imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80&auto=format&fit=crop",
    averageRating: 4.9, totalReviews: 202, isAvailable: true, stockCount: 8,
    preparationTime: 25,
    tags: ["seafood", "grilled", "halal", "moroccan", "chermoula"],
    nutrition: { calories: 360, protein: 42, carbs: 6, fat: 16, sugar: 2 },
    deletedAt: null, createdAt: new Date("2025-02-28"), updatedAt: new Date("2025-05-12"),
    chef: chefOmar,
  },
  {
    id: "dish-12", chefId: "chef-5",
    name: "Prawn Chermoula",
    description: "Tiger prawns marinated in chermoula, pan-seared with garlic butter.",
    price: 160, category: "SEAFOOD",
    // Sautéed prawns / shrimp with herbs and garlic butter
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTS7nkqwxP3PaCE6AKacOFwRJ--u1TJzQ_RHw&s",
    averageRating: 4.8, totalReviews: 156, isAvailable: true, stockCount: 12,
    preparationTime: 20,
    tags: ["seafood", "grilled", "halal", "moroccan", "prawns"],
    nutrition: { calories: 310, protein: 32, carbs: 8, fat: 16, sugar: 2 },
    deletedAt: null, createdAt: new Date("2025-04-18"), updatedAt: new Date("2025-05-13"),
    chef: chefOmar,
  },
  {
    id: "dish-13", chefId: "chef-5",
    name: "Mixed Grill Platter",
    description: "Lamb chops, merguez and chicken skewers off the charcoal grill.",
    price: 200, category: "MEAT",
    // Mixed meat grill platter with skewers, lamb chops and sausages
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80&auto=format&fit=crop",
    averageRating: 4.7, totalReviews: 143, isAvailable: true, stockCount: null,
    preparationTime: 35,
    tags: ["grilled", "halal", "moroccan", "sharing", "meat"],
    nutrition: { calories: 780, protein: 62, carbs: 14, fat: 48, sugar: 3 },
    deletedAt: null, createdAt: new Date("2025-03-15"), updatedAt: new Date("2025-05-09"),
    chef: chefOmar,
  },

  // ── Vegan & Fresh ──────────────────────────────────────────────────────────
  {
    id: "dish-14", chefId: "chef-4",
    name: "Avocado Buddha Bowl",
    description: "Quinoa, roasted chickpeas, avocado, pomegranate and tahini dressing.",
    price: 80, category: "SALAD",
    // Buddha bowl with greens, avocado slices, chickpeas and colourful toppings
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80&auto=format&fit=crop",
    averageRating: 4.5, totalReviews: 76, isAvailable: true, stockCount: null,
    preparationTime: 10,
    tags: ["vegan", "healthy", "fresh", "light", "quinoa"],
    nutrition: { calories: 420, protein: 16, carbs: 48, fat: 18, sugar: 8 },
    deletedAt: null, createdAt: new Date("2025-03-15"), updatedAt: new Date("2025-05-08"),
    chef: chefLila,
  },
  {
    id: "dish-15", chefId: "chef-4",
    name: "Caesar Salad",
    description: "Crisp romaine, shaved parmesan, croutons and house Caesar dressing.",
    price: 65, category: "SALAD",
    // Caesar salad close-up with romaine lettuce, croutons and parmesan
    imageUrl: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&q=80&auto=format&fit=crop",
    averageRating: 4.4, totalReviews: 54, isAvailable: true, stockCount: null,
    preparationTime: 10,
    tags: ["vegetarian", "fresh", "light", "salad", "classic"],
    nutrition: { calories: 320, protein: 12, carbs: 22, fat: 20, sugar: 4 },
    deletedAt: null, createdAt: new Date("2025-04-10"), updatedAt: new Date("2025-05-06"),
    chef: chefLila,
  },
  {
    id: "dish-16", chefId: "chef-4",
    name: "Vegan Lentil Dal",
    description: "Slow-simmered red lentils with cumin, turmeric and coconut milk.",
    price: 70, category: "MAIN_COURSE",
    // Red lentil dal — thick orange-yellow curry in a bowl with a swirl of coconut cream
    imageUrl: "https://cdn.vegkit.com/wp-content/uploads/sites/2/2022/03/18161433/SpinachRedLentilDahl_full.jpg",
    averageRating: 4.6, totalReviews: 67, isAvailable: true, stockCount: null,
    preparationTime: 20,
    tags: ["vegan", "healthy", "indian", "lentils", "gluten-free"],
    nutrition: { calories: 350, protein: 18, carbs: 44, fat: 10, sugar: 5 },
    deletedAt: null, createdAt: new Date("2025-04-20"), updatedAt: new Date("2025-05-07"),
    chef: chefLila,
  },

  // ── Breakfast ──────────────────────────────────────────────────────────────
  {
    id: "dish-17", chefId: "chef-2",
    name: "Harissa Shakshuka",
    description: "Eggs poached in smoky tomato-harissa sauce with feta and sourdough.",
    price: 70, category: "BREAKFAST",
    // Shakshuka — eggs poached in red tomato sauce in a cast-iron pan
    imageUrl: "https://images.unsplash.com/photo-1590412200988-a436970781fa?w=600&q=80&auto=format&fit=crop",
    averageRating: 4.7, totalReviews: 93, isAvailable: true, stockCount: null,
    preparationTime: 20,
    tags: ["breakfast", "vegetarian", "spicy", "moroccan", "eggs"],
    nutrition: { calories: 380, protein: 20, carbs: 28, fat: 20, sugar: 7 },
    deletedAt: null, createdAt: new Date("2025-04-05"), updatedAt: new Date("2025-05-11"),
    chef: chefSarah,
  },
  {
    id: "dish-18", chefId: "chef-2",
    name: "Msemen & Honey",
    description: "Flaky Moroccan flatbread with argan oil, amlou and wild honey.",
    price: 40, category: "BREAKFAST",
    // Msemen — square golden layered Moroccan flatbread on a plate
    imageUrl: "https://api2.arabesquekitchen.com/images/recipe-moroccan-msemen-image-ujyya/recipe-moroccan-msemen-image-ujyya-optimized.webp?version=1683101078975",
    averageRating: 4.6, totalReviews: 81, isAvailable: true, stockCount: null,
    preparationTime: 15,
    tags: ["breakfast", "moroccan", "traditional", "vegetarian", "bread"],
    nutrition: { calories: 430, protein: 10, carbs: 62, fat: 16, sugar: 18 },
    deletedAt: null, createdAt: new Date("2025-04-12"), updatedAt: new Date("2025-05-09"),
    chef: chefSarah,
  },

  // ── Dessert ────────────────────────────────────────────────────────────────
  {
    id: "dish-19", chefId: "chef-2",
    name: "Chocolate Lava Cake",
    description: "Warm dark chocolate cake with a molten centre and vanilla cream.",
    price: 65, category: "DESSERT",
    // Chocolate lava cake cut open showing molten chocolate flowing out
    imageUrl: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&q=80&auto=format&fit=crop",
    averageRating: 4.9, totalReviews: 178, isAvailable: true, stockCount: 20,
    preparationTime: 15,
    tags: ["dessert", "chocolate", "sweet", "vegetarian", "warm"],
    nutrition: { calories: 520, protein: 8, carbs: 58, fat: 28, sugar: 38 },
    deletedAt: null, createdAt: new Date("2025-02-03"), updatedAt: new Date("2025-05-10"),
    chef: chefSarah,
  },
  {
    id: "dish-20", chefId: "chef-2",
    name: "Moroccan Chebakia",
    description: "Sesame and honey pastry fried and coated in rosewater syrup.",
    price: 35, category: "DESSERT",
    // Chebakia — golden flower-shaped sesame cookies glistening with honey syrup
    imageUrl: "https://tasteofmaroc.com/wp-content/uploads/2020/04/chebakia-picturepartners-bigstock-1024x660.jpg.webp",
    averageRating: 4.7, totalReviews: 109, isAvailable: true, stockCount: 30,
    preparationTime: 10,
    tags: ["dessert", "moroccan", "traditional", "sweet", "sesame"],
    nutrition: { calories: 310, protein: 5, carbs: 42, fat: 14, sugar: 28 },
    deletedAt: null, createdAt: new Date("2025-03-22"), updatedAt: new Date("2025-05-04"),
    chef: chefSarah,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Derived slices (replace with Prisma where clauses later)
// ─────────────────────────────────────────────────────────────────────────────
export const todayNewDishes = [...mockDishes]
  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  .slice(0, 6);

export const popularDishes = [...mockDishes]
  .sort((a, b) => b.totalReviews - a.totalReviews)
  .slice(0, 6);

export const mockChefs: MockChefProfile[] = [
  chefAli, chefSarah, chefKarim, chefLila, chefOmar, chefPriya, chefYuki,
];
