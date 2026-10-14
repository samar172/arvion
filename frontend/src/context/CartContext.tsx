"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  /** Sellable stock when last seen; caps the quantity stepper. */
  maxQuantity?: number | null;
}

/** The most recent add, used to pop the "added to bag" bar. */
export interface LastAdded {
  /** Changes on every add so re-adding the same product replays the animation. */
  key: number;
  productId: string;
  title: string;
  quantity: number;
  imageUrl?: string;
}

type AddableProduct = { id: string; title: string; price: number; imageUrl?: string; maxQuantity?: number | null };

interface CartContextType {
  items: CartItem[];
  /** False until the saved bag has been read from storage. */
  hydrated: boolean;
  /** Total units in the bag. */
  count: number;
  addToCart: (product: AddableProduct, quantity?: number) => void;
  /** Replace lines with fresh catalog data (price, stock); null removes the line. */
  syncItems: (updates: Record<string, Partial<CartItem> | null>) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  lastAdded: LastAdded | null;
  dismissLastAdded: () => void;
  checkout: (options?: { customerName?: string, shippingAddress?: string, couponCode?: string }) => Promise<any>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [lastAdded, setLastAdded] = useState<LastAdded | null>(null);

  const [hydrated, setHydrated] = useState(false);

  // Load from local storage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('arvion_cart');
      if (savedCart) setItems(JSON.parse(savedCart));
    } catch (e) {
      console.error("Failed to parse cart", e);
    }
    setHydrated(true);
  }, []);

  // Save to local storage — but never before the saved bag has been read,
  // or the initial [] would overwrite it.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem('arvion_cart', JSON.stringify(items));
    } catch {
      /* storage full or blocked */
    }
  }, [items, hydrated]);

  const addToCart = (product: AddableProduct, quantity = 1) => {
    const cap = (q: number) =>
      product.maxQuantity != null ? Math.min(q, product.maxQuantity) : q;
    setItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, price: product.price, maxQuantity: product.maxQuantity, quantity: cap(item.quantity + quantity) }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        title: product.title,
        price: product.price,
        quantity: cap(quantity),
        imageUrl: product.imageUrl,
        maxQuantity: product.maxQuantity,
      }];
    });

    setLastAdded({
      key: Date.now(),
      productId: product.id,
      title: product.title,
      quantity,
      imageUrl: product.imageUrl,
    });
  };

  const dismissLastAdded = useCallback(() => setLastAdded(null), []);

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(prev => prev.map(item => {
      if (item.productId !== productId) return item;
      const capped = item.maxQuantity != null ? Math.min(quantity, item.maxQuantity) : quantity;
      return { ...item, quantity: Math.max(1, capped) };
    }));
  };

  const syncItems = useCallback((updates: Record<string, Partial<CartItem> | null>) => {
    setItems(prev => prev.flatMap(item => {
      if (!(item.productId in updates)) return [item];
      const update = updates[item.productId];
      if (update === null) return [];
      const next = { ...item, ...update };
      if (next.maxQuantity != null) {
        if (next.maxQuantity <= 0) return [];
        next.quantity = Math.min(next.quantity, next.maxQuantity);
      }
      return [next];
    }));
  }, []);

  const clearCart = () => {
    setItems([]);
    setLastAdded(null);
  };

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  const checkout = async (options?: { customerName?: string, shippingAddress?: string, couponCode?: string }) => {
    if (items.length === 0) throw new Error("Cart is empty");
    
    const res = await api.post('/orders/checkout', {
      items: items.map(item => ({ productId: item.productId, quantity: item.quantity })),
      ...options
    });
    
    return res.data;
  };

  return (
    <CartContext.Provider value={{
      items, hydrated, count, addToCart, syncItems, removeFromCart, updateQuantity, clearCart, total,
      lastAdded, dismissLastAdded, checkout
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
