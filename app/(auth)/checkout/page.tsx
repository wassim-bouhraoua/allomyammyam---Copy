'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, MapPin, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import BackToHome from '@/components/auth/back-to-home';
import { useTranslation } from '@/context/I18nContext';
import { getLocalizedName } from '@/lib/i18n';

export default function CheckoutPage() {
  const { locale, dict } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [cartLoading, setCartLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch cart on mount
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await fetch('/api/cart');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load cart');
        setCartItems(data.cartItems || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setCartLoading(false);
      }
    };
    fetchCart();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCityMismatch) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryAddress, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      const ids = data.orders.map((o: any) => o.id).join(',');
      window.location.href = `/profile/orders/confirmation?ids=${ids}`;
    } catch (e: any) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || cartLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[13px] font-medium text-muted-foreground">{dict.checkout.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center bg-background min-h-screen">
        <BackToHome />
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-center justify-center mb-5 text-red-500">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-[18px] font-extrabold text-foreground">{dict.checkout.errorLoading}</h2>
        <p className="text-[13px] text-muted-foreground mt-2 max-w-xs">{error}</p>
      </main>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center bg-background min-h-screen">
        <BackToHome />
        <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 flex items-center justify-center mb-5 text-orange-500">
          <ShoppingBag size={28} />
        </div>
        <h2 className="text-[18px] font-extrabold text-foreground">{dict.checkout.emptyCart}</h2>
        <p className="text-[13px] text-muted-foreground mt-2 max-w-xs mb-6">
          {dict.checkout.emptyCartSub}
        </p>
        <Link href="/dishes" className="h-11 px-6 rounded-2xl bg-orange-500 text-white font-extrabold text-[14px] flex items-center justify-center shadow-md shadow-orange-500/20">
          {dict.checkout.exploreDishes}
        </Link>
      </main>
    );
  }

  // Group by chefId
  const itemsByChef: Record<string, any[]> = {};
  cartItems.forEach((item) => {
    const chefId = item.dish.chefId;
    if (!itemsByChef[chefId]) itemsByChef[chefId] = [];
    itemsByChef[chefId].push(item);
  });

  const subtotal = cartItems.reduce((sum, i) => sum + Number(i.dish.price) * i.quantity, 0);
  const deliveryFee = 15; // Standard flat delivery fee per order
  const totalAmount = subtotal + deliveryFee;

  const customerCity = user?.city;

  // Find if there is any city mismatch
  let mismatchChefName = '';
  let mismatchChefCity = '';
  let isCityMismatch = false;

  for (const chefItems of Object.values(itemsByChef)) {
    const chef = chefItems[0].dish.chef;
    if (chef.city !== customerCity) {
      isCityMismatch = true;
      mismatchChefName = chef.displayName;
      mismatchChefCity = chef.city;
      break;
    }
  }

  return (
    <div className="bg-background min-h-screen text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-8 lg:px-6">
        
        {/* Header navigation */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/cart"
            className="w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Back to Cart"
          >
            <ArrowLeft size={18} className="text-foreground rtl:rotate-180" />
          </Link>
          <div>
            <h1 className="text-[24px] font-black tracking-tight">{dict.checkout.title}</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">{dict.checkout.subtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Form & Groups */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Chef-grouped orders summaries */}
            <div className="flex flex-col gap-4">
              <h3 className="text-[14px] font-black text-foreground uppercase tracking-widest pl-1">
                {dict.checkout.orderSummaries}
              </h3>

              {Object.entries(itemsByChef).map(([chefId, items]) => {
                const chef = items[0].dish.chef;
                const cityMismatchForThisChef = chef.city !== customerCity;

                return (
                  <div
                    key={chefId}
                    className="bg-card rounded-[24px] border border-border p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col gap-3 text-start"
                  >
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">👨‍🍳</span>
                        <h4 className="text-[14px] font-extrabold text-foreground">
                          {dict.checkout.chefLabel.replace('{name}', chef.displayName)}
                        </h4>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 text-[10px] font-bold">
                        {chef.city}
                      </span>
                    </div>

                    {/* Items List */}
                    <div className="flex flex-col gap-2 pt-1.5 border-t border-border">
                      {items.map((it) => (
                        <div key={it.id} className="flex justify-between text-[13px]">
                          <span className="text-muted-foreground truncate flex-1 pr-4">
                            <span className="font-bold text-foreground mr-1.5">{it.quantity}x</span>
                            {getLocalizedName(it.dish, locale)}
                          </span>
                          <span className="font-semibold text-foreground tabular-nums">
                            {(Number(it.dish.price) * it.quantity).toLocaleString(locale === "ar" ? "ar-MA" : "fr-MA")} {dict.common.currency}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Mismatch Alert for this chef */}
                    {cityMismatchForThisChef && (
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 rounded-xl p-3 flex gap-2 mt-2">
                        <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] font-semibold text-red-700 dark:text-red-400 leading-normal">
                          {dict.checkout.cityMismatchNotice
                            .replace('{chefCity}', chef.city)
                            .replace('{userCity}', customerCity || 'None')}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="bg-card rounded-[28px] border border-border p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col gap-5 text-start">
              <h3 className="text-[14px] font-black text-foreground uppercase tracking-widest border-b border-border pb-2.5">
                {dict.checkout.deliveryDetails}
              </h3>

              {/* Address input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wide pl-0.5">
                  {dict.checkout.addressLabel}
                </label>
                <textarea
                  required
                  placeholder={dict.checkout.addressPlaceholder}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full h-24 p-3 bg-secondary/40 border border-border focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-2xl text-[13px] font-semibold transition-all resize-none outline-none leading-relaxed"
                />
              </div>

              {/* Delivery notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wide pl-0.5">
                  {dict.checkout.notesLabel}
                </label>
                <input
                  type="text"
                  placeholder={dict.checkout.notesPlaceholder}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-11 px-4 bg-secondary/40 border border-border focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-2xl text-[13px] font-semibold transition-all outline-none"
                />
              </div>

              {/* Submit Error */}
              {submitError && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 rounded-xl p-3 flex gap-2">
                  <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px] font-semibold text-red-700 dark:text-red-400">{submitError}</span>
                </div>
              )}

              {/* Place order button */}
              <button
                type="submit"
                disabled={submitting || isCityMismatch}
                className="w-full h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_4px_14px_rgba(255,138,0,0.38)] disabled:opacity-50"
              >
                {submitting ? dict.checkout.placingOrder : dict.checkout.placeOrderBtn}
              </button>
            </form>

          </div>

          {/* Right Column: Invoice summary */}
          <div className="flex flex-col gap-6">
            
            <div className="bg-card rounded-[28px] border border-border p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col gap-4 text-start">
              <h3 className="text-[13px] font-black text-foreground uppercase tracking-widest border-b border-border pb-2.5">
                {dict.checkout.cartSummary}
              </h3>

              <div className="flex flex-col gap-2.5 text-[13px]">
                <div className="flex justify-between text-muted-foreground">
                  <span>{dict.checkout.subtotal}</span>
                  <span className="font-semibold text-foreground tabular-nums">{subtotal.toLocaleString(locale === "ar" ? "ar-MA" : "fr-MA")} {dict.common.currency}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{dict.checkout.delivery}</span>
                  <span className="font-semibold text-foreground tabular-nums">{deliveryFee.toLocaleString(locale === "ar" ? "ar-MA" : "fr-MA")} {dict.common.currency}</span>
                </div>

                <div className="flex justify-between border-t border-border pt-3 mt-1">
                  <span className="font-bold text-foreground">{dict.checkout.total}</span>
                  <span className="text-[20px] font-black text-orange-600 tabular-nums">
                    {totalAmount.toLocaleString(locale === "ar" ? "ar-MA" : "fr-MA")} {dict.common.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* City discrepancy blocker message */}
            {isCityMismatch && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 rounded-2xl p-4 flex gap-3 text-start">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[13px] font-black text-red-800 dark:text-red-400">{dict.checkout.checkoutBlocked}</h4>
                  <p className="text-[11.5px] text-red-600 dark:text-red-300 mt-1 leading-relaxed">
                    {dict.checkout.checkoutBlockedDesc
                      .replace('{chefCity}', mismatchChefCity)
                      .replace('{userCity}', customerCity || 'None')}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    {dict.checkout.checkoutBlockedSub}
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
