'use client';

import { MapPin } from 'lucide-react';
import { useLocation } from '@/context/LocationContext';

export default function LocationPill() {
  const { city, setIsModalOpen } = useLocation();

  return (
    <button
      onClick={() => setIsModalOpen(true)}
      className="flex items-center gap-2 px-4 py-3 bg-card hover:bg-secondary/60 rounded-2xl border border-border shadow-sm active:scale-[0.98] transition-all outline-none w-full text-left"
    >
      <MapPin size={14} className="text-orange-500 flex-shrink-0" fill="currentColor" />
      <span className="text-[13px] font-extrabold text-foreground truncate">{city}</span>
    </button>
  );
}
