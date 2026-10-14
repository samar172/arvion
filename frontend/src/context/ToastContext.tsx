"use client";

import React, { createContext, useContext, useState, useRef, useCallback } from "react";

const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback((message: string) => {
    clearTimeout(timer.current);
    setToast({ message, key: Date.now() });
    timer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-[96px] lg:bottom-8 left-1/2 -translate-x-1/2 z-toast w-max max-w-[calc(100vw-32px)] pointer-events-none"
      >
        {toast && (
          <div
            key={toast.key}
            className="bg-emerald text-cream font-sans text-sm tracking-wide px-5 py-3 rounded-full border border-gold/60 shadow-[0_16px_40px_-12px_rgba(10,46,34,0.6)] animate-toast text-center"
          >
            <span className="text-gold mr-1.5">✦</span>
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
