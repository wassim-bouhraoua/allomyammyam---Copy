"use client";
import { useEffect, useState } from 'react';

/**
 * Checkout client component – fetches cart, displays grouped items, total,
 * and posts JSON to /api/cart/checkout.
 */
export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [loading, setLoading] = useState(true);
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
        setCartItems(data.cartItems);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryAddress, notes: '' }),
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

  if (loading) return <p>Loading cart...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (cartItems.length === 0) return <p>Your cart is empty.</p>;

  // Group by chefId
  const itemsByChef: Record<string, any[]> = {};
  cartItems.forEach((item) => {
    const chefId = item.dish.chefId;
    if (!itemsByChef[chefId]) itemsByChef[chefId] = [];
    itemsByChef[chefId].push(item);
  });

  const total = cartItems.reduce((sum, i) => sum + Number(i.dish.price) * i.quantity, 0);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>
      {Object.entries(itemsByChef).map(([chefId, items]) => (
        <div key={chefId} className="mb-6 border rounded-lg p-4 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Chef: {items[0].dish.chef.displayName}</h2>
          <ul>
            {items.map((it) => (
              <li key={it.id} className="flex justify-between py-1">
                <span>{it.dish.name} × {it.quantity}</span>
                <span>{(Number(it.dish.price) * it.quantity).toFixed(2)} MAD</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="text-right font-bold text-lg mb-4">Total: {total.toFixed(2)} MAD</div>
      {submitError && <p className="text-red-600 mb-2">{submitError}</p>}
      <form onSubmit={handleSubmit} className="border p-4 rounded-lg shadow-sm">
        <label className="block mb-2 font-medium">Delivery Address</label>
        <textarea
          required
          value={deliveryAddress}
          onChange={(e) => setDeliveryAddress(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          {submitting ? 'Placing...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
}
