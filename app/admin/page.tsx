"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, ShieldCheck, UserCheck, UserX, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import BackToHome from "@/components/auth/back-to-home";
import { useTranslation } from "@/context/I18nContext";
import { getLocalizedSpecialty } from "@/lib/i18n";

interface ChefUser {
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
}

interface ChefProfile {
  id: string;
  displayName: string;
  bio: string | null;
  bio_en?: string | null;
  bio_ar?: string | null;
  city: string | null;
  specialties: string[];
  status: "PENDING" | "APPROVED" | "SUSPENDED";
  createdAt: string;
  user: ChefUser;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { locale, dict } = useTranslation();
  
  const [chefs, setChefs] = useState<ChefProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Authorization Check
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "ADMIN") {
        router.push("/");
      }
    }
  }, [user, authLoading, router]);

  // Fetch chefs list
  const fetchChefs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/chefs");
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error ?? dict.admin.loadFailed);
        return;
      }
      setChefs(data.chefs || []);
    } catch {
      setError(dict.admin.connError);
    } finally {
      setLoading(false);
    }
  }, [dict.admin.loadFailed, dict.admin.connError]);

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      fetchChefs();
    }
  }, [user, fetchChefs]);

  // Update Status
  const handleUpdateStatus = async (chefProfileId: string, newStatus: "APPROVED" | "SUSPENDED" | "PENDING") => {
    setError(null);
    setUpdatingId(chefProfileId);
    
    try {
      const res = await fetch("/api/admin/chefs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chefProfileId, status: newStatus }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error ?? dict.admin.updateFailed);
        return;
      }
      
      // Update local state
      setChefs((prev) =>
        prev.map((c) => (c.id === chefProfileId ? { ...c, status: newStatus } : c))
      );
    } catch {
      setError(dict.admin.updateConnError);
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading || !user || user.role !== "ADMIN") {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[350px]">
        <Loader2 size={28} className="animate-spin text-orange-400" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col min-h-full px-4 pt-4 pb-8 transition-all duration-300 text-start">
      <BackToHome />
      
      {/* Header */}
      <div className="flex items-center justify-between py-4 mb-2">
        <Link
          href="/profile"
          className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-orange-500 hover:border-orange-200 transition-all active:scale-95"
          aria-label={dict.common.back}
        >
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </Link>
        <h1 className="text-[18px] font-black text-foreground tracking-tight flex items-center gap-1.5">
          <ShieldCheck size={18} className="text-purple-600" />
          {dict.admin.title}
        </h1>
        <div className="w-10" />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
          <p className="text-[12px] font-semibold text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* List Container */}
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1 pl-1 rtl:pl-0 rtl:pr-1">
          {dict.admin.registeredChefs.replace("{count}", String(chefs.length))}
        </p>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin text-orange-500" size={24} />
          </div>
        ) : chefs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chefs.map((chef) => {
              const isUpdating = updatingId === chef.id;
              const registrationDate = new Date(chef.createdAt).toLocaleDateString(locale === "ar" ? "ar-MA" : locale === "en" ? "en-US" : "fr-FR", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              const specialtiesLabel = chef.specialties
                .map((s) => getLocalizedSpecialty(s, locale))
                .join(", ");

              const statusText = chef.status === "APPROVED" 
                ? dict.admin.statusApproved 
                : chef.status === "SUSPENDED" 
                ? dict.admin.statusSuspended 
                : dict.admin.statusPending;

              return (
                <div
                  key={chef.id}
                  className="bg-card rounded-3xl p-4 border border-border shadow-[0_2px_16px_rgba(0,0,0,0.04)] flex flex-col justify-between gap-3 text-start"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100/50 dark:bg-orange-950/30 flex items-center justify-center flex-shrink-0 relative overflow-hidden font-black text-[13px] text-orange-600 dark:text-orange-400">
                      {chef.user.avatar ? (
                        <img src={chef.user.avatar} alt={chef.displayName} className="w-full h-full object-cover" />
                      ) : (
                        chef.displayName[0]?.toUpperCase()
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 text-start">
                      <div className="flex items-center gap-1.5 justify-between">
                        <h3 className="text-[13px] font-extrabold text-foreground truncate">
                          {chef.displayName}
                        </h3>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                          chef.status === "APPROVED"
                            ? "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30"
                            : chef.status === "SUSPENDED"
                            ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30"
                            : "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30"
                        }`}>
                          {statusText}
                        </span>
                      </div>

                      <p className="text-[11px] text-muted-foreground font-semibold truncate mt-0.5">
                        {chef.user.firstName} {chef.user.lastName}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{chef.user.email}</p>
                      
                      {chef.city && (
                        <p className="text-[10px] text-muted-foreground font-medium mt-1">
                          {dict.admin.locationLabel.replace("{city}", chef.city)}
                        </p>
                      )}
                      {chef.specialties.length > 0 && (
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5 truncate">
                          {dict.admin.specialtiesLabel.replace("{specialties}", specialtiesLabel)}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground font-medium mt-0.5 flex items-center gap-1">
                        <Clock size={10} /> {registrationDate}
                      </p>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center gap-2 border-t border-border pt-2.5 mt-0.5">
                    {(chef.status === "PENDING" || chef.status === "SUSPENDED") && (
                      <button
                        onClick={() => handleUpdateStatus(chef.id, "APPROVED")}
                        disabled={isUpdating}
                        className="flex-1 h-8 rounded-xl bg-green-500 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        <UserCheck size={12} />
                        {dict.admin.approveBtn}
                      </button>
                    )}
                    {chef.status === "APPROVED" && (
                      <button
                        onClick={() => handleUpdateStatus(chef.id, "SUSPENDED")}
                        disabled={isUpdating}
                        className="flex-1 h-8 rounded-xl bg-red-500 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        <UserX size={12} />
                        {dict.admin.suspendBtn}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card rounded-3xl border border-border p-8 text-center text-muted-foreground shadow-sm">
            {dict.admin.noChefs}
          </div>
        )}
      </div>
    </div>
  );
}
