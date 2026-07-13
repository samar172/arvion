"use client";

import React, { createContext, useContext, useState, useRef, useCallback } from "react";

const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const toast = useCallback((msg: string) => {
    clearTimeout(timer.current);
    setMessage(msg);
    timer.current = setTimeout(() => setMessage(""), 2400);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {message && (
        <div className="fixed bottom-24 md:bottom-7 left-1/2 -translate-x-1/2 z-[80] bg-emerald text-cream font-sans text-sm tracking-wide px-6 py-3.5 rounded border border-gold shadow-2xl animate-toast whitespace-nowrap">
          ✦ {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
