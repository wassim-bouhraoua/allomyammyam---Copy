'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { MapPin, X, Navigation, Loader2 } from 'lucide-react';

const SUPPORTED_CITIES = [
  'Casablanca',
  'Rabat',
  'Marrakech',
  'Fes',
  'Tangier',
  'Oujda',
  'Agadir',
  'Meknes',
  'Tetouan',
  'Kenitra',
  'El Jadida',
  'Nador',
];

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Casablanca: { lat: 33.5731, lng: -7.5898 },
  Rabat: { lat: 34.0209, lng: -6.8416 },
  Marrakech: { lat: 31.6295, lng: -7.9811 },
  Fes: { lat: 34.0331, lng: -5.0003 },
  Tangier: { lat: 35.7595, lng: -5.8340 },
  Oujda: { lat: 34.6867, lng: -1.9114 },
  Agadir: { lat: 30.4278, lng: -9.5981 },
  Meknes: { lat: 33.8935, lng: -5.5473 },
  Tetouan: { lat: 35.5889, lng: -5.3626 },
  Kenitra: { lat: 34.2610, lng: -6.5802 },
  'El Jadida': { lat: 33.2316, lng: -8.5007 },
  Nador: { lat: 35.1681, lng: -2.9335 },
};

function getNearestCity(lat: number, lng: number): string {
  let nearestCity = 'Oujda';
  let minDistance = Infinity;
  for (const [cityName, coords] of Object.entries(CITY_COORDINATES)) {
    const dist = Math.sqrt(Math.pow(lat - coords.lat, 2) + Math.pow(lng - coords.lng, 2));
    if (dist < minDistance) {
      minDistance = dist;
      nearestCity = cityName;
    }
  }
  return nearestCity;
}

// Normalize city helper
function normalizeCityName(cityName: string): string {
  const clean = cityName.trim().toLowerCase();
  if (clean.includes('casa')) return 'Casablanca';
  if (clean.includes('marra')) return 'Marrakech';
  if (clean.includes('fe')) return 'Fes';
  if (clean.includes('tangi')) return 'Tangier';
  if (clean.includes('oujd')) return 'Oujda';
  if (clean.includes('agad')) return 'Agadir';
  if (clean.includes('mekn')) return 'Meknes';
  if (clean.includes('teto')) return 'Tetouan';
  if (clean.includes('keni')) return 'Kenitra';
  if (clean.includes('jadi')) return 'El Jadida';
  if (clean.includes('nado')) return 'Nador';
  if (clean.includes('raba')) return 'Rabat';

  // Capitalize first letter as fallback
  const normalized = SUPPORTED_CITIES.find(c => c.toLowerCase() === clean);
  return normalized || (cityName.charAt(0).toUpperCase() + cityName.slice(1));
}

interface LocationContextValue {
  city: string;
  setCity: (newCity: string) => Promise<void>;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() ?? null;
  return null;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};path=/;expires=${d.toUTCString()};sameSite=lax`;
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [city, setCityState] = useState('Oujda');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Sync city state with user context or cookie on mount / user change
  useEffect(() => {
    if (user && user.city) {
      setCityState(normalizeCityName(user.city));
    } else {
      const savedCookieCity = getCookie('user_city');
      if (savedCookieCity) {
        setCityState(normalizeCityName(savedCookieCity));
      }
    }
  }, [user]);

  const setCity = async (newCity: string) => {
    const normalized = normalizeCityName(newCity);
    if (!SUPPORTED_CITIES.includes(normalized)) {
      console.warn(`City "${newCity}" is not supported.`);
      return;
    }

    setCityState(normalized);
    setCookie('user_city', normalized);

    if (user) {
      try {
        const res = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city: normalized }),
        });
        if (res.ok) {
          await refreshUser();
        }
      } catch (err) {
        console.error('Failed to update city on user profile:', err);
      }
    }

    router.refresh();
  };

  const handleUseGeolocation = () => {
    setGeoLoading(true);
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const nearest = getNearestCity(latitude, longitude);
          await setCity(nearest);
          setIsModalOpen(false);
        } catch {
          setGeoError('Failed to resolve nearest city.');
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoError(err.message || 'Permission denied.');
        setGeoLoading(false);
      },
      { timeout: 10000 }
    );
  };

  return (
    <LocationContext.Provider value={{ city, setCity, isModalOpen, setIsModalOpen }}>
      {children}

      {/* Globally mounted Location Selector Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Modal Backdrop overlay click to close */}
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />

          {/* Modal Container */}
          <div className="relative bg-card text-foreground w-full max-w-md rounded-[28px] border border-border shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-6 z-10 animate-in zoom-in-95 duration-200 flex flex-col gap-5">
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90 transition-all"
              aria-label="Close modal"
            >
              <X size={15} />
            </button>

            {/* Header */}
            <div>
              <h2 className="text-[18px] font-black tracking-tight flex items-center gap-2 text-foreground">
                <MapPin size={18} className="text-orange-500" fill="currentColor" />
                Select Your Location
              </h2>
              <p className="text-[12px] text-muted-foreground mt-1">
                Choose a city to explore top-rated local dishes and chefs.
              </p>
            </div>

            {/* Geolocation Button */}
            <button
              onClick={handleUseGeolocation}
              disabled={geoLoading}
              className="w-full h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[14px] flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(255,138,0,0.3)] transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {geoLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Locating...
                </>
              ) : (
                <>
                  <Navigation size={15} fill="currentColor" />
                  Use Current Location
                </>
              )}
            </button>

            {geoError && (
              <p className="text-[11px] font-semibold text-red-500 -mt-2 pl-1">
                ⚠️ {geoError}
              </p>
            )}

            {/* Separator */}
            <div className="flex items-center gap-3">
              <span className="flex-1 h-[1px] bg-border" />
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">or choose manually</span>
              <span className="flex-1 h-[1px] bg-border" />
            </div>

            {/* Predefined Cities Grid */}
            <div className="grid grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
              {SUPPORTED_CITIES.map((cityName) => {
                const active = city === cityName;
                return (
                  <button
                    key={cityName}
                    onClick={async () => {
                      await setCity(cityName);
                      setIsModalOpen(false);
                    }}
                    className={`h-11 rounded-xl font-bold text-[13px] flex items-center justify-center border transition-all active:scale-95 ${
                      active
                        ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-500 text-orange-600 dark:text-orange-400'
                        : 'bg-secondary/40 hover:bg-secondary border-border text-foreground'
                    }`}
                  >
                    {cityName}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used inside <LocationProvider>');
  }
  return context;
}
