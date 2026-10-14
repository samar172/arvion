"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

export interface NavCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
}

// Header, footer, menu and search all want the list — fetch it once per page load.
let cache: NavCategory[] | null = null;
let inflight: Promise<NavCategory[]> | null = null;

function loadCategories() {
  if (!inflight) {
    inflight = api
      .get("/category")
      .then((res) => (cache = res.data || []))
      .catch((err) => {
        console.error("Failed to load nav categories", err);
        inflight = null; // allow a retry on the next mount
        return [] as NavCategory[];
      });
  }
  return inflight;
}

export function useNavCategories() {
  const [categories, setCategories] = useState<NavCategory[]>(cache ?? []);

  useEffect(() => {
    if (cache) return;
    let alive = true;
    loadCategories().then((list) => alive && setCategories(list));
    return () => {
      alive = false;
    };
  }, []);

  return categories;
}
