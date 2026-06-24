"use client";

// app/(auth)/profile/dishes/page.tsx
// Chef dish management dashboard — list, toggle, soft-delete.
// Access: CHEF role only. PENDING and APPROVED chefs have full access.
// SUSPENDED chefs see a blocked state message.

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  ArrowLeft, Loader2, AlertCircle, UtensilsCrossed,
  CheckCircle2, XCircle, Clock, ChefHat,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import BackToHome from "@/components/auth/back-to-home";
import { useTranslation } from "@/context/I18nContext";
import { getLocalizedName } from "@/lib/i18n";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Dish {
  id: string;
  name: string;
  name_en?: string | null;
  name_ar?: string | null;
  category: string;
  price: number;
  isAvailable: boolean;
  imageUrl: string | null;
  preparationTime: number;
  stockCount: number | null;
  tags: string[];
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function ChefDishesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { locale, dict } = useTranslation();

  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "CHEF")) {
      router.push("/profile");
    }
  }, [user, authLoading, router]);

  // ── Fetch dishes ───────────────────────────────────────────────────────────
  const fetchDishes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/dishes", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? dict.chefDishes.loadFailed);
        return;
      }
      setDishes(data.dishes ?? []);
    } catch {
      setError(dict.chefDishes.connError);
    } finally {
      setLoading(false);
    }
  }, [dict]);

  useEffect(() => {
    if (user && user.role === "CHEF") {
      fetchDishes();
    }
  }, [user, fetchDishes]);

  // ── Toggle availability ────────────────────────────────────────────────────
  const handleToggle = async (dishId: string) => {
    setTogglingId(dishId);
    setError(null);
    try {
      const res = await fetch(`/api/dishes/${dishId}/toggle`, {
        method: "PATCH",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? dict.chefDishes.toggleFailed);
        return;
      }
      setDishes((prev) =>
        prev.map((d) =>
          d.id === dishId ? { ...d, isAvailable: data.dish.isAvailable } : d
        )
      );
    } catch {
      setError(dict.chefDishes.toggleConnError);
    } finally {
      setTogglingId(null);
    }
  };

  // ── Soft delete ────────────────────────────────────────────────────────────
  const handleDelete = async (dishId: string) => {
    setDeletingId(dishId);
    setError(null);
    try {
      const res = await fetch(`/api/dishes/${dishId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? dict.chefDishes.deleteFailed);
        return;
      }
      setDishes((prev) => prev.filter((d) => d.id !== dishId));
      setDeleteConfirmId(null);
    } catch {
      setError(dict.chefDishes.deleteConnError);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (authLoading || !user || user.role !== "CHEF") {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[350px]">
        <Loader2 size={28} className="animate-spin text-orange-400" />
      </div>
    );
  }

  const isSuspended = user.chefProfile?.status === "SUSPENDED";

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-8 text-start">
      <BackToHome />

      {/* Header */}
      <div className="flex items-center justify-between py-4 mb-2">
        <Link
          href="/profile"
          className="w-10 h-10 rounded-xl border border-gray-200 dark:border-neutral-700 flex items-center justify-center text-gray-600 dark:text-neutral-300 hover:text-orange-500 hover:border-orange-200 dark:hover:border-orange-900/35 transition-all active:scale-95"
          aria-label={dict.common.back}
        >
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </Link>
        <h1 className="text-[18px] font-black text-gray-900 dark:text-neutral-100 tracking-tight flex items-center gap-1.5">
          <ChefHat size={18} className="text-orange-500" />
          {dict.chefDishes.title}
        </h1>
        <div className="w-10" />
      </div>

      {/* Suspended banner */}
      {isSuspended && (
        <div className="mb-4 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-start gap-3 text-start">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-bold text-red-700 dark:text-red-400">{dict.chefDishes.suspendedTitle}</p>
            <p className="text-[12px] text-red-500 dark:text-red-400/80 mt-0.5 leading-relaxed">
              {dict.chefDishes.suspendedDesc}
            </p>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center gap-2 text-start">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
          <p className="text-[12px] font-semibold text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Add dish CTA */}
      {!isSuspended && (
        <Link
          href="/profile/dishes/new"
          className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-orange-500 text-white font-extrabold text-[14px] shadow-[0_4px_14px_rgba(255,138,0,0.38)] hover:bg-orange-600 active:scale-[0.98] transition-all mb-5"
        >
          <Plus size={16} />
          {dict.chefDishes.addBtn}
        </Link>
      )}

      {/* Dish count label */}
      <p className="text-[11px] font-extrabold text-gray-400 dark:text-neutral-450 uppercase tracking-wider mb-3 pl-1 rtl:pl-0 rtl:pr-1">
        {loading ? dict.common.loading : dishes.length === 1 ? dict.chefDishes.dishCountOne : dict.chefDishes.dishCount.replace("{count}", String(dishes.length))}
      </p>

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="animate-spin text-orange-500" size={24} />
        </div>
      ) : dishes.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 px-6 bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-3xl shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 flex items-center justify-center mb-4">
            <UtensilsCrossed size={28} className="text-orange-400" />
          </div>
          <p className="text-[15px] font-extrabold text-gray-800 dark:text-neutral-100">{dict.chefDishes.empty}</p>
          <p className="text-[12px] text-gray-400 dark:text-neutral-450 mt-1.5 max-w-[220px] leading-relaxed">
            {dict.chefDishes.emptySub}
          </p>
          {!isSuspended && (
            <Link
              href="/profile/dishes/new"
              className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-orange-500 text-white font-bold text-[13px] shadow-[0_4px_12px_rgba(255,138,0,0.35)] active:scale-95 transition-transform"
            >
              <Plus size={14} /> {dict.chefDishes.addBtn}
            </Link>
          )}
        </div>
      ) : (
        /* Dish list */
        <div className="flex flex-col gap-3">
          {dishes.map((dish) => {
            const isToggling = togglingId === dish.id;
            const isDeleting = deletingId === dish.id;
            const confirmingDelete = deleteConfirmId === dish.id;
            const catKey = dish.category.toLowerCase();
            const translatedCat = dict.dishes.categories[catKey] || dish.category;

            return (
              <div
                key={dish.id}
                className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-[0_2px_16px_rgba(0,0,0,0.05)] overflow-hidden"
              >
                <div className="flex gap-3 p-3">
                  {/* Dish image */}
                  <div className="relative w-[80px] h-[80px] rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-neutral-900">
                    {dish.imageUrl ? (
                      <Image
                        src={dish.imageUrl}
                        alt={getLocalizedName(dish, locale)}
                        fill
                        sizes="80px"
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl opacity-20">🍽️</span>
                      </div>
                    )}
                    {/* Availability overlay */}
                    {!dish.isAvailable && (
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold uppercase tracking-widest">
                          {dict.chefDishes.inactiveOverlay}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dish info */}
                  <div className="flex-1 min-w-0 py-0.5 text-start">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[13px] font-bold text-gray-900 dark:text-neutral-100 leading-snug truncate flex-1">
                        {getLocalizedName(dish, locale)}
                      </h3>
                      {/* Availability badge */}
                      <span
                        className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          dish.isAvailable
                            ? "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30"
                            : "bg-gray-100 dark:bg-neutral-900 text-gray-500 dark:text-neutral-400 border border-gray-200 dark:border-neutral-700"
                        }`}
                      >
                        {dish.isAvailable ? (
                          <><CheckCircle2 size={8} />{dict.chefDishes.statusAvailable}</>
                        ) : (
                          <><XCircle size={8} />{dict.chefDishes.statusUnavailable}</>
                        )}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-400 dark:text-neutral-450 mt-0.5">
                      {translatedCat}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-[14px] font-extrabold text-orange-600 dark:text-orange-500">
                        {dish.price} <span className="text-[10px] font-bold text-orange-400">{dict.common.currency}</span>
                      </span>
                      <span className="flex items-center gap-0.5 text-[11px] text-gray-400 dark:text-neutral-450">
                        <Clock size={9} className="text-gray-300 dark:text-neutral-600" />
                        {dish.preparationTime} min
                      </span>
                      {dish.stockCount !== null && (
                        <span className="text-[10px] text-gray-400 dark:text-neutral-450">
                          {dict.chefDishes.stockLabel}: {dish.stockCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action row */}
                {!isSuspended && (
                  <div className="flex items-center gap-0 border-t border-gray-50 dark:border-neutral-750">
                    {/* Toggle availability */}
                    <button
                      onClick={() => handleToggle(dish.id)}
                      disabled={isToggling || isDeleting}
                      title={dish.isAvailable ? dict.chefDishes.deactivate : dict.chefDishes.activate}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold transition-colors disabled:opacity-50 ${
                        dish.isAvailable
                          ? "text-gray-500 dark:text-neutral-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-neutral-750"
                          : "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-neutral-750"
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : dish.isAvailable ? (
                        <ToggleRight size={14} />
                      ) : (
                        <ToggleLeft size={14} />
                      )}
                      {dish.isAvailable ? dict.chefDishes.deactivate : dict.chefDishes.activate}
                    </button>

                    <div className="w-px h-6 bg-gray-100 dark:bg-neutral-750" />

                    {/* Edit */}
                    <Link
                      href={`/profile/dishes/${dish.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold text-gray-500 dark:text-neutral-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-neutral-750 transition-colors"
                    >
                      <Pencil size={12} />
                      {dict.chefDishes.edit}
                    </Link>

                    <div className="w-px h-6 bg-gray-100 dark:bg-neutral-750" />

                    {/* Delete */}
                    {confirmingDelete ? (
                      <div className="flex-1 flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleDelete(dish.id)}
                          disabled={isDeleting}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500 text-white text-[10px] font-bold disabled:opacity-50 active:scale-95 transition-transform"
                        >
                          {isDeleting ? <Loader2 size={10} className="animate-spin" /> : null}
                          {dict.chefDishes.confirmDelete}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          disabled={isDeleting}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-neutral-900 text-gray-600 dark:text-neutral-300 text-[10px] font-bold active:scale-95 transition-transform"
                        >
                          {dict.chefDishes.cancelDelete}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(dish.id)}
                        disabled={isToggling || isDeleting}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold text-gray-500 dark:text-neutral-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-neutral-750 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={12} />
                        {dict.chefDishes.delete}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
