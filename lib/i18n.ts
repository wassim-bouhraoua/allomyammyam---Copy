import fr from "@/locales/fr.json";
import en from "@/locales/en.json";
import ar from "@/locales/ar.json";

export type Dictionary = typeof fr;
const dictionaries: Record<string, Dictionary> = { fr, en, ar };

export function getDictionary(locale: string): Dictionary {
  return dictionaries[locale] || dictionaries.fr;
}

export function getLocalizedName(
  dish: { name: string; name_en?: string | null; name_ar?: string | null },
  locale: string
): string {
  if (locale === "en") return dish.name_en || dish.name;
  if (locale === "ar") return dish.name_ar || dish.name;
  return dish.name;
}

export function getLocalizedDescription(
  dish: { description?: string | null; description_en?: string | null; description_ar?: string | null },
  locale: string
): string {
  const desc = dish.description || "";
  if (locale === "en") return dish.description_en || desc;
  if (locale === "ar") return dish.description_ar || desc;
  return desc;
}

export function getLocalizedBio(
  chef: { bio?: string | null; bio_en?: string | null; bio_ar?: string | null },
  locale: string
): string {
  const bio = chef.bio || "";
  if (locale === "en") return chef.bio_en || bio;
  if (locale === "ar") return chef.bio_ar || bio;
  return bio;
}

export function getLocalizedOrderItemName(
  item: { dishName: string; dish?: { name: string; name_en?: string | null; name_ar?: string | null } | null },
  locale: string
): string {
  if (!item.dish) return item.dishName;
  return getLocalizedName(item.dish, locale);
}

export function getLocalizedSpecialty(specialty: string, locale: string): string {
  const dict = getDictionary(locale);
  const key = specialty.toLowerCase();
  if (key === "grill") return dict.dishes.tags.grilled || specialty;
  if (key === "soups") return dict.dishes.categories.soup || specialty;
  const tags = dict.dishes.tags as Record<string, string>;
  const categories = dict.dishes.categories as Record<string, string>;
  return tags[key] || categories[key] || specialty;
}
