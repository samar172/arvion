"use client";

import React, { useState, useEffect } from "react";
import ProductCard from "@/components/product/product-card";
import api from "@/lib/api";

export default function CategoryPage({ params }: { params: { name: string } }) {
  const categoryName = decodeURIComponent(params.name).replace(/-/g, ' ');
  const titleCaseCategory = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("recommended");

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        // Note: The backend returns paginated data: { data: [...], total, page, ... }
        const res = await api.get('/catalog');
        
        let filtered = res.data.data || [];
        // Optional local filtering since backend currently returns all
        if (params.name === 'halal-meat') {
          filtered = filtered.filter((p: any) => p.halalCertified && p.sku.startsWith('MEAT'));
        }
        
        setProducts(filtered);
      } catch (err) {
        console.error("Failed to load category products", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryProducts();
  }, [params.name]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">
      {/* Category Header */}
      <div className="bg-brand-emerald text-white rounded-xl p-8 flex flex-col justify-center items-center text-center shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-amber-400 opacity-10 rounded-full blur-2xl"></div>
        
        <h1 className="text-3xl md:text-4xl font-display font-bold relative z-10">{titleCaseCategory}</h1>
        <p className="mt-2 text-emerald-100 max-w-2xl relative z-10">
          Discover the finest selection of {categoryName.toLowerCase()} products, carefully curated for our community.
        </p>
      </div>

      {/* Filters and Sorting Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-hide">
          <button className="px-4 py-2 bg-brand-emerald text-white text-sm font-bold rounded-full whitespace-nowrap">
            All Products
          </button>
          <button className="px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 text-sm font-bold rounded-full whitespace-nowrap border border-gray-200">
            Halal Certified
          </button>
          <button className="px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 text-sm font-bold rounded-full whitespace-nowrap border border-gray-200">
            Best Sellers
          </button>
          <button className="px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 text-sm font-bold rounded-full whitespace-nowrap border border-gray-200">
            On Sale
          </button>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-sm text-gray-500 font-medium">Sort by:</span>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm font-bold text-gray-800 border-none bg-gray-50 rounded-md py-1.5 pl-3 pr-8 focus:ring-0 cursor-pointer appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
          >
            <option value="recommended">Recommended</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="newest">Newest Arrivals</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-emerald"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((prod) => (
            <ProductCard
              key={prod.id}
              id={prod.id}
              title={prod.title}
              price={parseFloat(prod.price)}
              halalCertified={prod.halalCertified}
              imageUrl={prod.imageUrl}
            />
          ))}
          {products.length === 0 && (
             <div className="col-span-full py-20 text-center text-gray-500">
               No products found in this category.
             </div>
          )}
        </div>
      )}
      
      {/* Pagination / Load More */}
      {!loading && products.length > 0 && (
        <div className="flex justify-center pt-8 pb-4">
          <button className="px-8 py-3 bg-white border-2 border-brand-emerald text-brand-emerald font-bold rounded-xl hover:bg-emerald-50 transition duration-200">
            Load More Products
          </button>
        </div>
      )}
    </div>
  );
}
