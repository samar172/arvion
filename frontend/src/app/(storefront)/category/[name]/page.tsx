"use client";

import React, { useState } from "react";
import ProductCard from "@/components/product/product-card";
import { STATIC_PRODUCTS, STATIC_CATEGORIES, getProductsByCategory } from "@/lib/static-data";

export default function CategoryPage({ params }: { params: { name: string } }) {
  const [sortBy, setSortBy] = useState("recommended");

  const category = STATIC_CATEGORIES.find((c) => c.slug === params.name);
  const rawProducts = params.name === "all"
    ? STATIC_PRODUCTS
    : getProductsByCategory(params.name).length > 0
    ? getProductsByCategory(params.name)
    : STATIC_PRODUCTS;

  const sorted = [...rawProducts].sort((a, b) => {
    if (sortBy === "price_low") return parseFloat(a.price) - parseFloat(b.price);
    if (sortBy === "price_high") return parseFloat(b.price) - parseFloat(a.price);
    if (sortBy === "rating") return b.rating - a.rating;
    return 0;
  });

  const displayName = category?.name ?? decodeURIComponent(params.name).replace(/-/g, " ");
  const displayDescription =
    category?.description ?? `Discover our finest ${displayName.toLowerCase()} attars.`;

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
          <span className="text-3xl mb-2">{category?.icon ?? "✨"}</span>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">{displayName}</h1>
          <p className="mt-2 text-white/80 max-w-xl">{displayDescription}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto scrollbar-hide">
          <button className="px-4 py-2 text-sm font-bold rounded-full whitespace-nowrap bg-amber-500 text-white">
            All Products
          </button>
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
            <option value="rating">Top Rated</option>
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
