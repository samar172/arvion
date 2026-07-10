"use client";

import React, { useState, useEffect } from "react";
import ProductCard from "@/components/product/product-card";
import api from "@/lib/api";
import { getCategoryIcon } from "@/lib/category-icons";
import Link from "next/link";

export default function CategoryPage({ params }: { params: { name: string } }) {
  const [sortBy, setSortBy] = useState("recommended");
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          api.get(`/catalog?limit=100${params.name !== "all" ? `&categorySlug=${params.name}` : ""}`),
          api.get("/category"),
        ]);
        setProducts(prodRes.data.data || []);
        setCategories(catRes.data || []);
      } catch (err) {
        console.error("Failed to load category page data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [params.name]);

  const category = categories.find((c) => c.slug === params.name);

  const sorted = [...products].sort((a, b) => {
    if (sortBy === "price_low") return parseFloat(a.price) - parseFloat(b.price);
    if (sortBy === "price_high") return parseFloat(b.price) - parseFloat(a.price);
    return 0; // Default sorting by creation or recommended
  });

  const displayName = category?.name ?? (params.name === "all" ? "All Products" : decodeURIComponent(params.name).replace(/-/g, " "));
  const displayDescription =
    category?.description ?? `Discover our finest ${displayName.toLowerCase()} attars.`;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full flex items-center justify-center">
        <p className="text-gray-500 font-medium animate-pulse">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">
      {/* Category Hero */}
      <div className="relative rounded-2xl overflow-hidden min-h-[180px]">
        {category?.imageUrl && (
          <img
            src={category.imageUrl}
            alt={displayName}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />
        <div className="relative p-8 md:p-12 flex flex-col justify-center min-h-[180px]">
          <span className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-white/15 text-white backdrop-blur-sm ring-1 ring-white/25">
            {React.createElement(getCategoryIcon(params.name), { className: "h-6 w-6", strokeWidth: 2 })}
          </span>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">{displayName}</h1>
          <p className="mt-2 text-white/80 max-w-xl">{displayDescription}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto scrollbar-hide">
          <Link
            href="/category/all"
            className={`px-4 py-2 text-sm font-bold rounded-full whitespace-nowrap transition ${
              params.name === "all" ? "bg-amber-500 text-white" : "bg-gray-150 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Products
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className={`px-4 py-2 text-sm font-bold rounded-full whitespace-nowrap transition ${
                params.name === cat.slug ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-sm text-gray-500 font-medium">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm font-bold text-gray-800 border border-gray-200 bg-gray-50 rounded-lg py-1.5 pl-3 pr-8 focus:ring-1 focus:ring-amber-400 cursor-pointer"
          >
            <option value="recommended">Recommended</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Product count */}
      <p className="text-sm text-gray-500">
        Showing <span className="font-bold text-gray-800">{sorted.length}</span> attars
      </p>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {sorted.map((prod) => (
          <ProductCard
            key={prod.id}
            id={prod.id}
            title={prod.title}
            price={parseFloat(prod.price)}
            halalCertified={prod.halalCertified}
            imageUrl={prod.imageUrl}
          />
        ))}
        {sorted.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-500">
            No products found in this category.
          </div>
        )}
      </div>
    </div>
  );
}
