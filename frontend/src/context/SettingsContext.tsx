"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/api";

export interface StoreSettings {
  storeName: string;
  storeTagline: string;
  announcementOn: string;
  announcementText: string;
  heroBadge: string;
  heroTitle: string;
  heroQuote: string;
  heroImageUrl: string;
  heroCtaLabel: string;
  brandStory: string;
  freeShippingThreshold: string;
  shippingFee: string;
  whatsapp: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  instagram: string;
  facebook: string;
  youtube: string;
  [key: string]: string;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "AL-RIZVI",
  storeTagline: "Islamic Gifting",
  announcementOn: "true",
  announcementText: "Share the Barakah — Free shipping over ₹500",
  heroBadge: "Share the Barakah",
  heroTitle: "Thoughtful Islamic gifts, curated with love",
  heroQuote: "“Give gifts and you will love one another.”",
  heroImageUrl: "",
  heroCtaLabel: "Shop the Collection",
  brandStory:
    "We create gifts meant to be felt, remembered and cherished. Each hamper is thoughtfully curated and beautifully presented — turning ordinary moments into lasting, meaningful memories.",
  freeShippingThreshold: "500",
  shippingFee: "49",
  whatsapp: "",
  supportEmail: "",
  supportPhone: "",
  address: "",
  instagram: "",
  facebook: "",
  youtube: "",
};

const SettingsContext = createContext<StoreSettings>(DEFAULT_SETTINGS);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    api
      .get("/settings/public")
      .then((res) => setSettings({ ...DEFAULT_SETTINGS, ...res.data }))
      .catch((err) => console.error("Failed to load store settings", err));
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
