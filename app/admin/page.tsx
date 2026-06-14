"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, ShieldCheck, UserCheck, UserX, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import BackToHome from "@/components/auth/back-to-home";

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
  city: string | null;
  specialties: string[];
  status: "PENDING" | "APPROVED" | "SUSPENDED";
  createdAt: string;
  user: ChefUser;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
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
  const fetchChefs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/chefs");
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error ?? "Failed to load chefs list.");
        return;
      }
      setChefs(data.chefs || []);
    } catch {
      setError("Something went wrong loading the admin dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      fetchChefs();
    }
  }, [user]);

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
        setError(data.error ?? "Failed to update chef status.");
        return;
      }
      
      // Update local state
      setChefs((prev) =>
        prev.map((c) => (c.id === chefProfileId ? { ...c, status: newStatus } : c))
      );
    } catch {
      setError("Connection error. Could not update status.");
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
    <div className="w-full max-w-6xl mx-auto flex flex-col min-h-full px-4 pt-4 pb-8 transition-all duration-300">
      <BackToHome />
      
      {/* Header */}
      <div className="flex items-center justify-between py-4 mb-2">
        <Link
          href="/profile"
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:text-orange-500 hover:border-orange-200 transition-all active:scale-95"
          aria-label="Back to profile"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-[18px] font-black text-gray-900 tracking-tight flex items-center gap-1.5">
          <ShieldCheck size={18} className="text-purple-600" />
          Admin Dashboard
        </h1>
        <div className="w-10" />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
          <p className="text-[12px] font-semibold text-red-600">{error}</p>
        </div>
      )}

      {/* List Container */}
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1 pl-1">
          Registered Chefs ({chefs.length})
        </p>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin text-orange-500" size={24} />
          </div>
        ) : chefs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chefs.map((chef) => {
              const isUpdating = updatingId === chef.id;
              const registrationDate = new Date(chef.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              const specialtiesLabel = chef.specialties
                .map((s) => s.toLowerCase())
                .join(", ");

              return (
                <div
                  key={chef.id}
                  className="bg-white rounded-3xl p-4 border border-gray-100 shadow-[0_2px_16px_rgba(0,0,0,0.04)] flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0 relative overflow-hidden font-black text-[13px] text-orange-600">
                      {chef.user.avatar ? (
                        <img src={chef.user.avatar} alt={chef.displayName} className="w-full h-full object-cover" />
                      ) : (
                        chef.displayName[0]?.toUpperCase()
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 justify-between">
                        <h3 className="text-[13px] font-extrabold text-gray-900 truncate">
                          {chef.displayName}
                        </h3>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                          chef.status === "APPROVED"
                            ? "bg-green-50 text-green-600 border border-green-100"
                            : chef.status === "SUSPENDED"
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : "bg-amber-50 text-amber-600 border border-amber-100"
                        }`}>
                          {chef.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-500 font-semibold truncate mt-0.5">
                        {chef.user.firstName} {chef.user.lastName}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">{chef.user.email}</p>
                      
                      {chef.city && (
                        <p className="text-[10px] text-gray-400 font-medium mt-1">
                          Location: <span className="text-gray-700 font-semibold">{chef.city}</span>
                        </p>
                      )}
                      {chef.specialties.length > 0 && (
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5 truncate">
                          Specialties: <span className="capitalize text-gray-700 font-semibold">{specialtiesLabel}</span>
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5 flex items-center gap-1">
                        <Clock size={10} /> {registrationDate}
                      </p>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center gap-2 border-t border-gray-50 pt-2.5 mt-0.5">
                    {(chef.status === "PENDING" || chef.status === "SUSPENDED") && (
                      <button
                        onClick={() => handleUpdateStatus(chef.id, "APPROVED")}
                        disabled={isUpdating}
                        className="flex-1 h-8 rounded-xl bg-green-500 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        <UserCheck size={12} />
                        Approve
                      </button>
                    )}
                    {chef.status === "APPROVED" && (
                      <button
                        onClick={() => handleUpdateStatus(chef.id, "SUSPENDED")}
                        disabled={isUpdating}
                        className="flex-1 h-8 rounded-xl bg-red-500 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        <UserX size={12} />
                        Suspend
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center text-gray-500 shadow-sm">
            No chef accounts registered in database.
          </div>
        )}
      </div>
    </div>
  );
}
