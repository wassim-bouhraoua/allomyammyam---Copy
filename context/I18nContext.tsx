'use client';

import React, { createContext, useContext } from 'react';
import fr from '@/locales/fr.json';
import en from '@/locales/en.json';
import ar from '@/locales/ar.json';

export type Dictionary = Omit<typeof fr, 'dishes'> & {
  dishes: Omit<typeof fr.dishes, 'categories' | 'tags'> & {
    categories: Record<string, string>;
    tags: Record<string, string>;
  };
};
const dictionaries: Record<string, any> = { fr, en, ar };

const I18nContext = createContext<{
  locale: string;
  dict: Dictionary;
}>({
  locale: 'fr',
  dict: fr,
});

export function I18nProvider({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const dict = dictionaries[locale] || fr;
  return (
    <I18nContext.Provider value={{ locale, dict }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
