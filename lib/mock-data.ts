import { DishCategory, ChefStatus } from "@prisma/client";

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
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  chef: MockChefProfile;
}

const chefAli: MockChefProfile = {
  id: "chef-1",
  userId: "user-chef-1",
  displayName: "Chef Ali",
  bio: "Specialist in Moroccan & Asian fusion dishes.",
  specialties: ["RICE_AND_GRAINS", "MEAT"],
  city: "Oujda",
  bannerUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
  avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
  averageRating: 4.9,
  totalReviews: 312,
  status: "APPROVED",
  isAvailable: true,
  deletedAt: null,
  createdAt: new Date("2024-01-15"),
  updatedAt: new Date("2025-03-10"),
};

const chefSarah: MockChefProfile = {
  id: "chef-2",
  userId: "user-chef-2",
  displayName: "Chef Sarah",
  bio: "Mediterranean & French pastry expert.",
  specialties: ["DESSERT", "MEDITERRANEAN"],
  city: "Casablanca",
  bannerUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80",
  avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80",
  averageRating: 4.7,
  totalReviews: 198,
  status: "APPROVED",
  isAvailable: true,
  deletedAt: null,
  createdAt: new Date("2024-02-20"),
  updatedAt: new Date("2025-04-01"),
};

const chefKarim: MockChefProfile = {
  id: "chef-3",
  userId: "user-chef-3",
  displayName: "Chef Karim",
  bio: "Traditional Moroccan tagines & couscous.",
  specialties: ["MAIN_COURSE", "SOUP"],
  city: "Fès",
  bannerUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80",
  avatarUrl: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=200&q=80",
  averageRating: 4.6,
  totalReviews: 145,
  status: "APPROVED",
  isAvailable: false,
  deletedAt: null,
  createdAt: new Date("2024-03-05"),
  updatedAt: new Date("2025-02-14"),
};

const chefLila: MockChefProfile = {
  id: "chef-4",
  userId: "user-chef-4",
  displayName: "Chef Lila",
  bio: "Plant-based & healthy bowls.",
  specialties: ["SALAD", "VEGAN"],
  city: "Rabat",
  bannerUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
  avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
  averageRating: 4.5,
  totalReviews: 87,
  status: "APPROVED",
  isAvailable: true,
  deletedAt: null,
  createdAt: new Date("2024-05-12"),
  updatedAt: new Date("2025-05-01"),
};

const chefOmar: MockChefProfile = {
  id: "chef-5",
  userId: "user-chef-5",
  displayName: "Chef Omar",
  bio: "Seafood & grilled specialties from Agadir.",
  specialties: ["SEAFOOD", "MEAT"],
  city: "Agadir",
  bannerUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
  avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
  averageRating: 4.8,
  totalReviews: 231,
  status: "APPROVED",
  isAvailable: true,
  deletedAt: null,
  createdAt: new Date("2024-04-18"),
  updatedAt: new Date("2025-04-22"),
};

export const mockDishes: MockDish[] = [
  {
    id: "dish-1", chefId: "chef-1",
    name: "Chicken Biryani",
    description: "Aromatic basmati rice slow-cooked with tender chicken and whole spices.",
    price: 120, category: "RICE_AND_GRAINS",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80",
    averageRating: 4.8, totalReviews: 241, isAvailable: true, stockCount: null,
    preparationTime: 35, tags: ["spicy", "halal", "popular"],
    deletedAt: null, createdAt: new Date("2025-01-10"), updatedAt: new Date("2025-05-01"),
    chef: chefAli,
  },
  {
    id: "dish-2", chefId: "chef-2",
    name: "Chocolate Lava Cake",
    description: "Warm dark chocolate cake with a molten centre, served with vanilla cream.",
    price: 65, category: "DESSERT",
    imageUrl: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500&q=80",
    averageRating: 4.9, totalReviews: 178, isAvailable: true, stockCount: 20,
    preparationTime: 15, tags: ["sweet", "chocolate", "vegetarian"],
    deletedAt: null, createdAt: new Date("2025-02-03"), updatedAt: new Date("2025-05-10"),
    chef: chefSarah,
  },
  {
    id: "dish-3", chefId: "chef-3",
    name: "Moroccan Lamb Tagine",
    description: "Slow-braised lamb shoulder with preserved lemon, olives and harissa.",
    price: 150, category: "MAIN_COURSE",
    imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=500&q=80",
    averageRating: 4.7, totalReviews: 134, isAvailable: true, stockCount: null,
    preparationTime: 50, tags: ["halal", "traditional", "lamb"],
    deletedAt: null, createdAt: new Date("2025-01-22"), updatedAt: new Date("2025-04-28"),
    chef: chefKarim,
  },
  {
    id: "dish-4", chefId: "chef-4",
    name: "Avocado Buddha Bowl",
    description: "Quinoa, roasted chickpeas, avocado, pomegranate and tahini drizzle.",
    price: 80, category: "SALAD",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80",
    averageRating: 4.5, totalReviews: 76, isAvailable: true, stockCount: null,
    preparationTime: 10, tags: ["vegan", "healthy", "gluten-free"],
    deletedAt: null, createdAt: new Date("2025-03-15"), updatedAt: new Date("2025-05-08"),
    chef: chefLila,
  },
  {
    id: "dish-5", chefId: "chef-5",
    name: "Grilled Sea Bass",
    description: "Whole sea bass grilled over charcoal with chermoula and lemon.",
    price: 180, category: "SEAFOOD",
    imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&q=80",
    averageRating: 4.9, totalReviews: 202, isAvailable: true, stockCount: 8,
    preparationTime: 25, tags: ["seafood", "grilled", "halal"],
    deletedAt: null, createdAt: new Date("2025-02-28"), updatedAt: new Date("2025-05-12"),
    chef: chefOmar,
  },
  {
    id: "dish-6", chefId: "chef-1",
    name: "Beef Kofta Platter",
    description: "Charcoal-grilled beef kofta with saffron rice and mint yoghurt.",
    price: 110, category: "MEAT",
    imageUrl: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500&q=80",
    averageRating: 4.6, totalReviews: 119, isAvailable: true, stockCount: null,
    preparationTime: 30, tags: ["halal", "grilled", "spicy"],
    deletedAt: null, createdAt: new Date("2025-03-01"), updatedAt: new Date("2025-05-05"),
    chef: chefAli,
  },
  {
    id: "dish-7", chefId: "chef-2",
    name: "Harissa Shakshuka",
    description: "Eggs poached in a smoky tomato-harissa sauce with feta and sourdough.",
    price: 70, category: "BREAKFAST",
    imageUrl: "https://images.unsplash.com/photo-1590412200988-a436970781fa?w=500&q=80",
    averageRating: 4.7, totalReviews: 93, isAvailable: true, stockCount: null,
    preparationTime: 20, tags: ["vegetarian", "spicy", "breakfast"],
    deletedAt: null, createdAt: new Date("2025-04-05"), updatedAt: new Date("2025-05-11"),
    chef: chefSarah,
  },
  {
    id: "dish-8", chefId: "chef-5",
    name: "Prawn Chermoula",
    description: "Tiger prawns marinated in chermoula, pan-seared with garlic butter.",
    price: 160, category: "SEAFOOD",
    imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&q=80",
    averageRating: 4.8, totalReviews: 156, isAvailable: true, stockCount: 12,
    preparationTime: 20, tags: ["seafood", "halal", "popular"],
    deletedAt: null, createdAt: new Date("2025-04-18"), updatedAt: new Date("2025-05-13"),
    chef: chefOmar,
  },
];

export const todayNewDishes = [...mockDishes]
  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  .slice(0, 6);

export const popularDishes = [...mockDishes]
  .sort((a, b) => b.totalReviews - a.totalReviews)
  .slice(0, 6);

export const mockChefs: MockChefProfile[] = [
  chefAli, chefSarah, chefKarim, chefLila, chefOmar,
];