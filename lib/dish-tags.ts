export interface DishTag {
  value: string;
  label: string;
  emoji: string;
  group: "cuisine" | "vibe";
}

export interface FilterValueDef {
  label: string;
  emoji: string;
  type: "category" | "tag";
  group: "cuisine" | "vibe";
  categories?: string[];
  tagValue?: string;
}

// Single source of truth for all filters and tags
export const FILTER_DEFS: FilterValueDef[] = [
  // Cuisines
  { label: "Moroccan", emoji: "🫕", type: "tag", group: "cuisine", tagValue: "moroccan" },
  { label: "Indian", emoji: "🍛", type: "tag", group: "cuisine", tagValue: "indian" },
  { label: "Japanese", emoji: "🍣", type: "tag", group: "cuisine", tagValue: "japanese" },
  { label: "Seafood", emoji: "🦞", type: "category", group: "cuisine", categories: ["SEAFOOD"] },

  // Vibes
  { label: "Breakfast", emoji: "🍳", type: "category", group: "vibe", categories: ["BREAKFAST", "BRUNCH"] },
  { label: "Dessert", emoji: "🍰", type: "category", group: "vibe", categories: ["DESSERT", "PASTRY", "CAKE", "ICE_CREAM"] },
  { label: "Grilled", emoji: "🔥", type: "tag", group: "vibe", tagValue: "grilled" },
  { label: "Spicy", emoji: "🌶️", type: "tag", group: "vibe", tagValue: "spicy" },
  { label: "Vegan", emoji: "🌱", type: "tag", group: "vibe", tagValue: "vegan" },
  { label: "Light", emoji: "🥗", type: "tag", group: "vibe", tagValue: "light" },
  { label: "Meat", emoji: "🥩", type: "tag", group: "vibe", tagValue: "meat" },
];

export const ALLOWED_TAGS: DishTag[] = FILTER_DEFS.filter(
  (f) => f.type === "tag"
).map((f) => ({
  value: f.tagValue!,
  label: f.label,
  emoji: f.emoji,
  group: f.group,
}));

export const CUISINE_CHIPS_DEFS = [
  { label: "All", emoji: "🍽️", kind: "all" as const },
  ...FILTER_DEFS.filter((f) => f.group === "cuisine").map((f) => {
    if (f.type === "category") {
      return {
        label: f.label,
        emoji: f.emoji,
        kind: "category" as const,
        categories: f.categories!,
      };
    } else {
      return {
        label: f.label,
        emoji: f.emoji,
        kind: "tag" as const,
        tag: f.tagValue!,
      };
    }
  }),
];

export const VIBE_CHIPS_DEFS = [
  { label: "All", emoji: "✨", kind: "all" as const },
  ...FILTER_DEFS.filter((f) => f.group === "vibe").map((f) => {
    if (f.type === "category") {
      return {
        label: f.label,
        emoji: f.emoji,
        kind: "category" as const,
        categories: f.categories!,
      };
    } else {
      return {
        label: f.label,
        emoji: f.emoji,
        kind: "tag" as const,
        tag: f.tagValue!,
      };
    }
  }),
];

export interface CategoryOption {
  value: string;
  label: string;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: "APPETIZER",      label: "Appetizer" },
  { value: "SOUP",           label: "Soup" },
  { value: "SALAD",          label: "Salad" },
  { value: "MAIN_COURSE",    label: "Main Course" },
  { value: "PASTA",          label: "Pasta" },
  { value: "RICE_AND_GRAINS",label: "Rice & Grains" },
  { value: "SEAFOOD",        label: "Seafood" },
  { value: "MEAT",           label: "Meat" },
  { value: "VEGETARIAN",     label: "Vegetarian" },
  { value: "VEGAN",          label: "Vegan" },
  { value: "PIZZA",          label: "Pizza" },
  { value: "BURGER",         label: "Burger" },
  { value: "SANDWICH",       label: "Sandwich" },
  { value: "WRAP",           label: "Wrap" },
  { value: "SUSHI",          label: "Sushi" },
  { value: "ASIAN",          label: "Asian" },
  { value: "MEDITERRANEAN",  label: "Mediterranean" },
  { value: "MIDDLE_EASTERN", label: "Middle Eastern" },
  { value: "AFRICAN",        label: "African" },
  { value: "LATIN_AMERICAN", label: "Latin American" },
  { value: "BREAKFAST",      label: "Breakfast" },
  { value: "BRUNCH",         label: "Brunch" },
  { value: "DESSERT",        label: "Dessert" },
  { value: "PASTRY",         label: "Pastry" },
  { value: "CAKE",           label: "Cake" },
  { value: "ICE_CREAM",      label: "Ice Cream" },
  { value: "BEVERAGE",       label: "Beverage" },
  { value: "SMOOTHIE",       label: "Smoothie" },
  { value: "JUICE",          label: "Juice" },
  { value: "OTHER",          label: "Other" },
];


