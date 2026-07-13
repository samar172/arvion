"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

export function useNavCategories() {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    api
      .get("/category")
      .then((res) => setCategories(res.data || []))
      .catch((err) => console.error("Failed to load nav categories", err));
  }, []);

  return categories;
}
