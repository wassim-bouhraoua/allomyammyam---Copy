"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";

export interface CartItem {
  id: string;
  quantity: number;
  dish: {
    id: string;
    name: string;
    price: number;
    category: string;
    imageUrl: string | null;
    isAvailable: boolean;
    deletedAt: string | null;
    stockCount: number | null;
    chef: {
      displayName: string;
    };
  };
}

interface CartContextValue {
  cartItems: CartItem[];
  cartCount: number;
  loading: boolean;
  addToCart: (dishId: string, quantity: number) => Promise<{ success: boolean; error?: string }>;
  updateQuantity: (dishId: string, quantity: number) => Promise<{ success: boolean; error?: string }>;
  removeFromCart: (dishId: string) => Promise<{ success: boolean; error?: string }>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Compute total quantity sum of items in the cart
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/cart", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setCartItems(data.cartItems ?? []);
      } else {
        setCartItems([]);
      }
    } catch {
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load cart on mount or when user changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const refreshCart = useCallback(async () => {
    await fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (dishId: string, quantity: number) => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ dishId, quantity }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error ?? "Failed to add to cart." };
      }

      await fetchCart(); // Refresh cart state on mutation
      return { success: true };
    } catch {
      return { success: false, error: "Something went wrong. Please try again." };
    }
  }, [fetchCart]);

  const updateQuantity = useCallback(async (dishId: string, quantity: number) => {
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ dishId, quantity }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error ?? "Failed to update quantity." };
      }

      await fetchCart(); // Refresh cart state on mutation
      return { success: true };
    } catch {
      return { success: false, error: "Something went wrong. Please try again." };
    }
  }, [fetchCart]);

  const removeFromCart = useCallback(async (dishId: string) => {
    try {
      const res = await fetch(`/api/cart?dishId=${encodeURIComponent(dishId)}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error ?? "Failed to remove item." };
      }

      await fetchCart(); // Refresh cart state on mutation
      return { success: true };
    } catch {
      return { success: false, error: "Something went wrong. Please try again." };
    }
  }, [fetchCart]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return ctx;
}
