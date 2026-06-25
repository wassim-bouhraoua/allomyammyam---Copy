'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from '@/context/I18nContext';

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
] as const;

export default function LanguageSwitcher() {
  const router = useRouter();
  const { locale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleChangeLocale = (newLocale: string) => {
    document.cookie = `user_locale=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;
    setIsOpen(false);
    // Refresh page components on the server to update the layout and static dictionaries
    router.refresh();
  };

  const currentLang = LANGUAGES.find((lang) => lang.code === locale) || LANGUAGES[0];

  return (
    <div className="relative w-full text-start" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 px-4 py-3 bg-secondary/20 hover:bg-secondary/40 rounded-2xl border border-border shadow-sm transition-all outline-none w-full text-start"
      >
        <div className="flex items-center gap-2.5">
          <Globe size={15} className="text-orange-500 flex-shrink-0" />
          <span className="text-[13px] font-black text-foreground">{currentLang.label}</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-muted-foreground transition-transform duration-250 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 top-full mt-2 start-0 end-0 bg-card dark:bg-neutral-900 border border-border rounded-2xl shadow-xl overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === locale;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleChangeLocale(lang.code)}
                className={`w-full text-start px-4 py-3 text-[13px] font-bold flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-orange-50/70 dark:bg-orange-950/20 text-orange-500 dark:text-orange-400'
                    : 'text-foreground hover:bg-secondary/50 dark:hover:bg-neutral-800'
                }`}
              >
                <span>{lang.label}</span>
                {isSelected && <Check size={14} className="text-orange-500 dark:text-orange-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
