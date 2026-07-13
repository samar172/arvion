"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl?: string;
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

interface CartContextType {
  items: CartItem[];
  addToCart: (product: { id: string; title: string; price: number; imageUrl?: string }, quantity?: number) => void;
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

  // Load from local storage
  useEffect(() => {
    const savedCart = localStorage.getItem('arvion_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('arvion_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: { id: string; title: string; price: number; imageUrl?: string }, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        title: product.title,
        price: product.price,
        quantity,
        imageUrl: product.imageUrl
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
    setItems(prev => prev.map(item => 
      item.productId === productId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setItems([]);
    setLastAdded(null);
  };

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
      items, addToCart, removeFromCart, updateQuantity, clearCart, total,
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
