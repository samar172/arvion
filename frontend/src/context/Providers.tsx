"use client";

import { AuthProvider } from './AuthContext';
import { CartProvider } from './CartContext';
import { SettingsProvider } from './SettingsContext';
import { ToastProvider } from './ToastContext';
import { WishlistProvider } from './WishlistContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
