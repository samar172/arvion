"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import PrayerWidget from "@/components/widgets/prayer-widget";
import ProductCard from "@/components/product/product-card";
import api from "@/lib/api";

export default function StorefrontHomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const res = await api.get('/catalog');
        setProducts(res.data.data || []);
      } catch (err) {
        console.error("Failed to load catalog", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // Enhanced Categories
  const categories = [
    { name: "Halal Meat", icon: "🥩", path: "/category/halal-meat" },
    { name: "Dates & Honey", icon: "🍯", path: "/category/dates-honey" },
    { name: "Modest Fashion", icon: "👗", path: "/category/modest-fashion" },
    { name: "Prayer Essentials", icon: "🧎", path: "/category/prayer-essentials" },
    { name: "Islamic Books", icon: "📚", path: "/category/islamic-books" },
    { name: "Attar & Fragrance", icon: "✨", path: "/category/attar-fragrance" },
    { name: "Gifting", icon: "🎁", path: "/category/gifting" },
    { name: "Vitamins", icon: "💊", path: "/category/vitamins" },
  ];

  // Derive deals and recommended for demo purposes from fetched products
  const dailyDeals = products.slice(0, 4);
  const recommendedProducts = products.slice(4, 9);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10 flex-1 w-full">
      {/* Header Widget */}
      <PrayerWidget />

      {/* Main Hero Slider / Banner */}
      <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-lg group">
        <div className="absolute inset-0 bg-brand-emerald">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M54.627 0l.83.83-54.627 54.627-.83-.83L54.627 0zM0 54.627l.83-.83 54.627-54.627.83.83L0 54.627z\' fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' }}></div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-emerald via-emerald-800/90 to-transparent"></div>
        
        <div className="relative h-full flex items-center px-8 md:px-16 w-full md:w-2/3">
          <div className="space-y-4">
            <span className="inline-block bg-amber-400 text-brand-emeraldDark text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full">
              Eid Special Collection
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white leading-tight">
              Prepare for the Blessed Month with Premium Essentials
            </h2>
            <p className="text-emerald-50 max-w-lg text-sm md:text-base">
              Discover authentic, halal-certified groceries, premium prayer mats, and modest fashion with up to 40% off.
            </p>
            <div className="pt-2">
              <button className="bg-white text-brand-emeraldDark font-bold px-8 py-3 rounded-xl shadow-lg hover:bg-emerald-50 hover:-translate-y-0.5 transition-all duration-200">
                Explore Collection
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="text-xl font-display font-bold text-gray-800">Shop by Category</h3>
          <Link href="/categories" className="text-sm font-bold text-brand-emerald hover:underline">View All</Link>
        </div>
        <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {categories.map((cat, index) => (
            <Link href={cat.path} key={index} className="snap-start shrink-0">
              <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center w-28 md:w-32 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all duration-200 group">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform duration-200 group-hover:bg-emerald-50">
                  {cat.icon}
                </div>
                <span className="text-xs font-bold text-gray-700 text-center group-hover:text-brand-emerald transition-colors">
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Secondary Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-amber-50 rounded-2xl p-6 md:p-8 flex items-center border border-amber-100 overflow-hidden relative">
          <div className="absolute -right-10 -bottom-10 text-[150px] opacity-10">🥩</div>
          <div className="relative z-10 w-2/3 space-y-3">
            <h4 className="text-xl font-display font-bold text-amber-900">100% Halal Certified Meat</h4>
            <p className="text-sm text-amber-800">Freshly sourced, hand-slaughtered, and delivered straight to your door.</p>
            <button className="text-xs font-bold text-amber-900 uppercase tracking-wide border-b-2 border-amber-900 pb-0.5 hover:text-amber-700">Shop Meat →</button>
          </div>
        </div>
        
        <div className="bg-emerald-50 rounded-2xl p-6 md:p-8 flex items-center border border-emerald-100 overflow-hidden relative">
          <div className="absolute -right-10 -bottom-10 text-[150px] opacity-10">📖</div>
          <div className="relative z-10 w-2/3 space-y-3">
            <h4 className="text-xl font-display font-bold text-emerald-900">Islamic Knowledge</h4>
            <p className="text-sm text-emerald-800">Expand your deen with our curated collection of books, Qurans, and guides.</p>
            <button className="text-xs font-bold text-emerald-900 uppercase tracking-wide border-b-2 border-emerald-900 pb-0.5 hover:text-emerald-700">Shop Books →</button>
          </div>
        </div>
      </div>

      {/* Daily Deals Section */}
      {dailyDeals.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div className="flex items-center space-x-3">
              <h3 className="text-xl font-display font-bold text-gray-800">Flash Deals</h3>
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center space-x-1">
                <span>⏱</span>
                <span>Ends in 12:45:00</span>
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {dailyDeals.map((prod) => (
              <div key={prod.id} className="relative">
                <ProductCard
                  id={prod.id}
                  title={prod.title}
                  price={parseFloat(prod.price)}
                  halalCertified={prod.halalCertified}
                  imageUrl={prod.imageUrl}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended For You Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="text-xl font-display font-bold text-gray-800">Recommended For You</h3>
          <Link href="/recommended" className="text-sm font-bold text-brand-emerald hover:underline">See More</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {recommendedProducts.length > 0 ? recommendedProducts.map((prod) => (
            <ProductCard
              key={prod.id}
              id={prod.id}
              title={prod.title}
              price={parseFloat(prod.price)}
              halalCertified={prod.halalCertified}
              imageUrl={prod.imageUrl}
            />
          )) : (
            <p className="text-gray-500 col-span-full">No products found. Please add products from Admin Panel.</p>
          )}
        </div>
      </div>

      {/* Bottom Promo */}
      <div className="bg-gradient-to-r from-gray-900 to-brand-emeraldDark rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between shadow-xl text-white">
        <div className="space-y-2 mb-6 md:mb-0 md:w-2/3">
          <h3 className="text-2xl font-display font-bold text-amber-400">Join Arvion Premium</h3>
          <p className="text-gray-300 max-w-lg">
            Get unlimited free delivery, exclusive early access to sales, and 5% cashback on all Halal meat purchases.
          </p>
        </div>
        <button className="bg-amber-400 text-gray-900 font-bold px-8 py-3 rounded-xl shadow-lg hover:bg-amber-300 hover:-translate-y-0.5 transition-all w-full md:w-auto">
          Start 30-Day Free Trial
        </button>
      </div>
    </div>
  );
}
