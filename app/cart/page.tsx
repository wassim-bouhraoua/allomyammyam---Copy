"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Trash2, ShoppingBag, Plus, Minus, AlertCircle, MapPin } from "lucide-react";
import { useCart, CartItem } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import BottomNav from "@/components/bottom-nav";
import DesktopNavLinks from "@/components/desktop-nav-links";
import LocationPill from "@/components/location-pill";

export default function CartPage() {
  const { user } = useAuth();
  const { cartItems, cartCount, loading, updateQuantity, removeFromCart } = useCart();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isDishUnavailable = (item: CartItem) => {
    return !item.dish.isAvailable || item.dish.deletedAt !== null;
  };

  // Calculate cart subtotal
  const subtotal = cartItems.reduce((acc, item) => acc + item.dish.price * item.quantity, 0);

  const handleDecreaseQuantity = async (item: CartItem) => {
    if (item.quantity <= 1) return;
    const res = await updateQuantity(item.dish.id, item.quantity - 1);
    if (!res.success) {
      showToast(res.error ?? "Failed to update quantity.", "error");
    }
  };

  const handleIncreaseQuantity = async (item: CartItem) => {
    // If dish is unavailable/deleted, disable increase
    if (isDishUnavailable(item)) return;
    
    // Check if stock count limit is reached
    if (item.dish.stockCount !== null && item.quantity >= item.dish.stockCount) {
      showToast(`Only ${item.dish.stockCount} portions available in stock.`, "error");
      return;
    }

    const res = await updateQuantity(item.dish.id, item.quantity + 1);
    if (!res.success) {
      showToast(res.error ?? "Failed to update quantity.", "error");
    }
  };

  const handleRemoveItem = async (dishId: string) => {
    const res = await removeFromCart(dishId);
    if (res.success) {
      showToast("Item removed from cart.", "success");
    } else {
      showToast(res.error ?? "Failed to remove item.", "error");
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* ── Toast notification container ── */}
      {toast && (
        <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
          toast.type === "success"
            ? "bg-green-50/90 dark:bg-green-950/90 border-green-200 dark:border-green-900/30 text-green-800 dark:text-green-300"
            : "bg-red-50/90 dark:bg-red-950/90 border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-300"
        }`}>
          {toast.type === "success" ? <Plus className="rotate-45" size={16} /> : <AlertCircle size={16} />}
          <span className="text-[13px] font-bold">{toast.message}</span>
        </div>
      )}

      {/* ── Two-column Shell (Desktop) / Vertical Stack (Mobile) ── */}
      <div className="max-w-[90rem] mx-auto min-h-screen flex gap-8 px-0 lg:px-8 lg:py-8">

        {/* ── Left Sidebar (Desktop Only) ── */}
        <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 gap-6 sticky top-8 self-start">
          {/* Brand */}
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-[0_4px_12px_rgba(255,138,0,0.38)]">
              <span className="text-white text-sm font-black">A</span>
            </div>
            <span className="text-[17px] font-black text-foreground">AlloMyamMyam</span>
          </div>

          {/* Navigation Links */}
          <DesktopNavLinks />

          {/* Location pill */}
          <LocationPill />
        </aside>

        {/* ── Main Column ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between px-4 pt-5 pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Go back"
              >
                <ArrowLeft size={16} className="text-foreground" />
              </Link>
              <h1 className="text-[17px] font-extrabold text-foreground">My Cart</h1>
            </div>
            <span className="text-[12px] font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
              {cartCount} {cartCount === 1 ? "item" : "items"}
            </span>
          </div>

          {/* Content container */}
          <main className="flex-1 p-4 lg:p-0 pb-[90px] lg:pb-12">
            
            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div>
                <h1 className="text-[24px] font-black text-foreground leading-tight">My Cart</h1>
                <p className="text-[13px] text-muted-foreground mt-0.5">Manage items in your shopping bag</p>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-[13px] font-medium text-muted-foreground">Loading your cart...</p>
              </div>
            ) : cartItems.length === 0 ? (
              /* Empty Cart State */
              <div className="flex flex-col items-center justify-center py-16 px-4 bg-card rounded-[28px] border border-border text-center shadow-sm max-w-lg mx-auto mt-6">
                <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 flex items-center justify-center mb-5 animate-bounce">
                  <ShoppingBag size={28} className="text-orange-500" />
                </div>
                <h2 className="text-[18px] font-extrabold text-foreground">Your cart is empty</h2>
                <p className="text-[13px] text-muted-foreground mt-2 max-w-xs leading-relaxed">
                  Looks like you haven't added any dishes to your cart yet. Let's find some delicious home-cooked meals!
                </p>
                <Link
                  href="/dishes"
                  className="mt-6 inline-flex items-center justify-center px-6 h-11 bg-orange-500 text-white font-extrabold text-[14px] rounded-2xl shadow-[0_4px_16px_rgba(255,138,0,0.35)] active:scale-98 transition-transform"
                >
                  Explore Dishes
                </Link>
              </div>
            ) : (
              /* Cart layout */
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* List of items */}
                <div className="xl:col-span-2 flex flex-col gap-3">
                  {cartItems.map((item) => {
                    const unavailable = isDishUnavailable(item);
                    const stockCapReached = item.dish.stockCount !== null && item.quantity >= item.dish.stockCount;
                    const itemSubtotal = (item.dish.price * item.quantity).toLocaleString("fr-MA");

                    return (
                      <div
                        key={item.id}
                        className={`flex items-start sm:items-center gap-3.5 p-3.5 bg-card rounded-2xl border border-border shadow-sm transition-all duration-200 ${
                          unavailable ? "opacity-75" : ""
                        }`}
                      >
                        {/* Image */}
                        <div className="relative w-[72px] h-[72px] rounded-xl overflow-hidden bg-secondary flex-shrink-0 shadow-inner">
                          {item.dish.imageUrl ? (
                            <img
                              src={item.dish.imageUrl}
                              alt={item.dish.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              🍽️
                            </div>
                          )}
                          
                          {unavailable && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-center">
                              <span className="text-[8.5px] font-black text-white uppercase tracking-wider px-1 py-0.5 bg-red-600 rounded">
                                Sold Out
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-[13px] sm:text-[14px] font-extrabold text-foreground leading-snug truncate">
                              {item.dish.name}
                            </h3>
                            <button
                              onClick={() => handleRemoveItem(item.dish.id)}
                              aria-label="Remove item"
                              className="text-muted-foreground hover:text-red-500 active:scale-90 transition-all p-1 -mr-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            Chef: <span className="font-semibold">{item.dish.chef.displayName}</span>
                          </p>

                          <div className="flex items-center justify-between gap-3 mt-2 flex-wrap sm:flex-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[13px] font-extrabold text-orange-600">
                                {item.dish.price} MAD
                              </span>
                              <span className="text-[10px] text-muted-foreground font-medium">
                                / serving
                              </span>
                            </div>

                            {/* Stepper & Badges */}
                            <div className="flex items-center gap-3">
                              {/* Quantity Stepper */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleDecreaseQuantity(item)}
                                  disabled={item.quantity <= 1}
                                  aria-label="Decrease quantity"
                                  className="w-7 h-7 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90 disabled:opacity-40 disabled:hover:text-muted-foreground transition-all"
                                >
                                  <Minus size={11} />
                                </button>
                                <span className="text-[13px] font-extrabold text-foreground min-w-[16px] text-center tabular-nums">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleIncreaseQuantity(item)}
                                  disabled={unavailable || stockCapReached}
                                  aria-label="Increase quantity"
                                  className="w-7 h-7 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90 disabled:opacity-40 disabled:hover:text-muted-foreground transition-all"
                                >
                                  <Plus size={11} />
                                </button>
                              </div>

                              {/* Subtotal of Item */}
                              <span className="text-[13px] font-extrabold text-foreground tabular-nums font-black text-orange-600">
                                {itemSubtotal} MAD
                              </span>
                            </div>
                          </div>

                          {/* Extra info/status */}
                          {unavailable ? (
                            <p className="flex items-center gap-1 text-[10px] font-bold text-red-500 mt-2">
                              <AlertCircle size={10} />
                              This dish is currently unavailable. Please remove it.
                            </p>
                          ) : item.dish.stockCount !== null && item.quantity >= item.dish.stockCount ? (
                            <p className="text-[10px] text-amber-500 font-semibold mt-2">
                              Maximum available portions reached
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotal Display Panel */}
                <div className="flex flex-col gap-4">
                  <div className="bg-card rounded-[24px] border border-border shadow-sm p-5 sticky top-8">
                    <h2 className="text-[14px] font-black text-foreground uppercase tracking-widest mb-4">
                      Summary
                    </h2>
                    
                    <div className="flex flex-col gap-2.5 border-b border-border pb-4 mb-4">
                      <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                        <span>Total Items</span>
                        <span className="font-extrabold text-foreground tabular-nums">{cartCount}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[14px] font-bold text-foreground">Subtotal</span>
                      <span className="text-[20px] font-black text-orange-600 tabular-nums">
                        {subtotal.toLocaleString("fr-MA")} MAD
                      </span>
                    </div>

                    <Link
                      href="/checkout"
                      className="w-full h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_4px_14px_rgba(255,138,0,0.38)] mb-3"
                    >
                      Proceed to Checkout
                    </Link>

                    <p className="text-[11px] text-muted-foreground text-center italic mt-2 leading-relaxed">
                      Delivery fees and order validation will be calculated at checkout.
                    </p>
                  </div>
                </div>

              </div>
            )}

          </main>
          <BottomNav />
        </div>

      </div>
    </div>
  );
}
