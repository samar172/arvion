"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function StorefrontHomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          api.get("/catalog?limit=100"),
          api.get("/category"),
        ]);
        setProducts(prodRes.data.data || []);
        setCategories(catRes.data || []);
      } catch (err) {
        console.error("Failed to load storefront homepage data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const trendingProducts = products.slice(0, 6);

  const handleAdd = (id: string) => {
    setQuantities((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleRemove = (id: string) => {
    setQuantities((prev) => {
      const current = prev[id] || 0;
      if (current <= 1) {
        const newQ = { ...prev };
        delete newQ[id];
        return newQ;
      }
      return { ...prev, [id]: current - 1 };
    });
  };

  if (loading) {
    return (
      <div className="flex-1 w-full flex items-center justify-center min-h-[50vh]">
        <p className="text-outline font-medium animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-surface pb-4 max-w-7xl mx-auto">
      {/* Search Bar - Sticky */}
      <div className="sticky top-[60px] md:top-[70px] z-40 bg-surface px-container-margin py-xs md:py-sm">
        <div className="relative max-w-3xl mx-auto">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input 
            type="text" 
            placeholder="Search for Attar, Dates, Prayer Mats..." 
            className="w-full bg-surface-container rounded-full pl-10 pr-4 py-3 text-body-md text-on-surface placeholder:text-outline border-none focus:ring-1 focus:ring-primary outline-none transition-shadow"
          />
        </div>
      </div>

      {/* Prayer Widget */}
      <div className="px-container-margin mt-md md:mt-lg">
        <div className="bg-tertiary-fixed rounded-2xl p-md md:p-lg md:px-xl relative overflow-hidden flex items-center justify-between shadow-sm">
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 md:right-10 md:top-1/2 md:-translate-y-1/2 text-[120px] md:text-[180px] text-tertiary/10 rotate-[-15deg]">mosque</span>
          <div className="relative z-10 flex flex-col">
            <span className="text-badge-micro md:text-sm font-label-bold text-on-tertiary-fixed-variant uppercase tracking-wider">Next Prayer</span>
            <div className="flex items-baseline gap-2 mt-xs md:mt-1">
              <span className="text-headline-md md:text-4xl font-extrabold text-on-tertiary-container">Dhuhr</span>
              <span className="text-title-md md:text-xl font-bold text-on-tertiary-container">12:45 PM</span>
            </div>
            <span className="text-body-sm md:text-base text-on-tertiary-fixed mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] md:text-[18px]">schedule</span>
              Countdown: 1h 22m remains
            </span>
          </div>
          <div className="relative z-10 flex flex-col items-end gap-xs md:gap-2 text-right">
            <span className="text-body-sm md:text-base text-on-tertiary-fixed font-medium">Fajr • 05:12 AM</span>
            <span className="text-body-sm md:text-base text-on-tertiary-fixed font-medium">Isha • 07:45 PM</span>
          </div>
        </div>
      </div>

      {/* Hero Banners */}
      <div className="mt-lg md:mt-xl">
        <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar px-container-margin gap-md pb-xs">
          {/* Banner 1 */}
          <div className="min-w-[85%] sm:min-w-[400px] md:min-w-[600px] snap-center relative rounded-2xl overflow-hidden h-[160px] md:h-[280px] bg-surface-container flex-shrink-0 shadow-sm">
            <img src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=80" alt="Attar Collection" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-on-primary-container/95 via-on-primary-container/70 to-transparent"></div>
            <div className="relative z-10 p-md md:p-xl flex flex-col justify-center h-full max-w-[70%] md:max-w-[50%]">
              <span className="text-badge-micro md:text-sm font-label-bold text-primary-fixed uppercase tracking-wider mb-1 md:mb-2">LIMITED TIME</span>
              <h3 className="text-title-md md:text-3xl font-bold text-on-primary mb-1 md:mb-3">Pure Oud Attars</h3>
              <p className="text-body-sm md:text-base text-primary-fixed-dim line-clamp-2 md:line-clamp-none">Up to 20% off on select premium collections</p>
            </div>
          </div>
          {/* Banner 2 */}
          <div className="min-w-[85%] sm:min-w-[400px] md:min-w-[600px] snap-center relative rounded-2xl overflow-hidden h-[160px] md:h-[280px] bg-surface-container flex-shrink-0 shadow-sm">
            <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80" alt="Dates" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-on-secondary-fixed/95 via-on-secondary-fixed/70 to-transparent"></div>
            <div className="relative z-10 p-md md:p-xl flex flex-col justify-center h-full max-w-[70%] md:max-w-[50%]">
              <span className="text-badge-micro md:text-sm font-label-bold text-secondary-fixed uppercase tracking-wider mb-1 md:mb-2">NEW ARRIVALS</span>
              <h3 className="text-title-md md:text-3xl font-bold text-on-primary mb-1 md:mb-3">Ajwa Dates</h3>
              <p className="text-body-sm md:text-base text-secondary-fixed-dim line-clamp-2 md:line-clamp-none">Freshly imported from Madinah</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Categories */}
      <div className="px-container-margin mt-lg md:mt-xl">
        <div className="flex justify-between items-end mb-md md:mb-lg">
          <h2 className="text-title-md md:text-2xl font-bold text-on-surface">Shop by Category</h2>
          <Link href="/category/all" className="text-body-sm md:text-base font-medium text-primary hover:underline">View All</Link>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-sm gap-y-md md:gap-lg">
          {categories.slice(0, 8).map((cat) => (
            <Link href={`/category/${cat.slug}`} key={cat.id} className="flex flex-col items-center gap-2 md:gap-3 group">
              <div className="w-full aspect-square rounded-2xl md:rounded-[2rem] bg-surface-container-low flex items-center justify-center overflow-hidden border border-outline-variant/30 group-hover:border-primary/50 group-hover:shadow-md transition-all duration-300">
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <span className="material-symbols-outlined text-outline text-[32px] md:text-[48px]">category</span>
                )}
              </div>
              <span className="text-badge-micro md:text-sm font-label-bold text-on-surface text-center line-clamp-2 leading-tight md:leading-normal">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Trending Carousel */}
      <div className="mt-lg md:mt-xl">
        <div className="px-container-margin flex justify-between items-end mb-md md:mb-lg">
          <div>
            <h2 className="text-title-md md:text-2xl font-bold text-on-surface">Trending this Week</h2>
            <p className="text-body-sm md:text-base text-outline">Most loved by the community</p>
          </div>
          <Link href="/category/all" className="text-body-sm md:text-base font-medium text-primary hover:underline">View All</Link>
        </div>
        <div className="flex overflow-x-auto no-scrollbar px-container-margin gap-sm md:gap-lg pb-md">
          {trendingProducts.map((prod) => (
            <div key={prod.id} className="min-w-[160px] md:min-w-[240px] w-40 md:w-60 flex flex-col bg-surface rounded-2xl border border-outline-variant overflow-hidden flex-shrink-0 group hover:shadow-lg transition-shadow">
              <Link href={`/products/${prod.id}`} className="relative aspect-square bg-surface-container-lowest block">
                {prod.halalCertified && (
                  <span className="absolute top-2 left-2 md:top-3 md:left-3 bg-primary text-on-primary text-badge-micro md:text-xs font-label-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-md shadow-sm z-10">HALAL</span>
                )}
                <img src={prod.imageUrl || "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=400&q=80"} alt={prod.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </Link>
              <div className="p-sm md:p-md flex flex-col flex-1">
                <Link href={`/products/${prod.id}`} className="text-body-md md:text-lg font-bold text-on-surface line-clamp-2 leading-tight mb-1 md:mb-3 flex-1 hover:text-primary transition-colors">
                  {prod.title}
                </Link>
                <div className="flex justify-between items-end mt-2 md:mt-4">
                  <span className="text-title-md md:text-xl font-extrabold text-on-surface">₹{parseFloat(prod.price)}</span>
                  {quantities[prod.id] ? (
                    <div className="flex items-center bg-primary rounded-lg md:rounded-xl shadow-sm border border-primary overflow-hidden h-8 md:h-10">
                      <button onClick={() => handleRemove(prod.id)} className="w-7 md:w-10 h-full flex items-center justify-center text-on-primary active:bg-primary-container transition-colors hover:bg-primary/90">
                        <span className="material-symbols-outlined text-[18px] md:text-[20px]">remove</span>
                      </button>
                      <span className="w-6 md:w-8 text-center text-body-sm md:text-base font-bold text-on-primary">{quantities[prod.id]}</span>
                      <button onClick={() => handleAdd(prod.id)} className="w-7 md:w-10 h-full flex items-center justify-center text-on-primary active:bg-primary-container transition-colors hover:bg-primary/90">
                        <span className="material-symbols-outlined text-[18px] md:text-[20px]">add</span>
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => handleAdd(prod.id)} className="bg-surface border border-outline text-primary text-label-bold md:text-sm px-3 md:px-5 py-1.5 md:py-2 rounded-lg md:rounded-xl font-bold hover:bg-primary hover:text-on-primary hover:border-primary active:bg-primary-container transition-all h-8 md:h-10 flex items-center justify-center">
                      ADD
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
