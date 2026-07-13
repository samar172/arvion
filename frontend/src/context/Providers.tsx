"use client";

import { AuthProvider } from './AuthContext';
import { CartProvider } from './CartContext';
import { SettingsProvider } from './SettingsContext';
import { ToastProvider } from './ToastContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
