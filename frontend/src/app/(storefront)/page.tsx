"use client";

import React from "react";
import Link from "next/link";
import PrayerWidget from "@/components/widgets/prayer-widget";
import ProductCard from "@/components/product/product-card";
import { STATIC_PRODUCTS, STATIC_CATEGORIES, getBestsellers, getNewArrivals } from "@/lib/static-data";

export default function StorefrontHomePage() {
  const bestsellers = getBestsellers();
  const newArrivals = getNewArrivals();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12 flex-1 w-full">
      <PrayerWidget />

      {/* Hero Banner */}
      <div className="relative w-full h-[320px] md:h-[420px] rounded-2xl overflow-hidden shadow-xl">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1400&q=80")',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent" />
        <div className="relative h-full flex items-center px-8 md:px-16">
          <div className="space-y-4 max-w-lg">
            <span className="inline-block bg-amber-400 text-black text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">
              Pure · Natural · Ancient
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white leading-tight">
              The Soul of Ancient Perfumery
            </h2>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed">
              Discover rare Attar & Ittar oils — alcohol-free, distilled from flowers, herbs and
              resins using centuries-old deg-bhapka methods.
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <Link
                href="/category/rose-floral"
                className="bg-amber-400 text-black font-bold px-6 py-3 rounded-xl hover:bg-amber-300 transition-all duration-200 shadow-lg"
              >
                Explore Collection
              </Link>
              <Link
                href="/category/gift-collections"
                className="text-white font-bold border border-white/40 px-6 py-3 rounded-xl hover:bg-white/10 transition-all duration-200"
              >
                Gift Sets
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-6 right-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white text-center hidden md:block">
          <p className="text-amber-400 font-extrabold text-lg">12+</p>
          <p className="text-xs font-medium text-white/80">Rare Attars</p>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: "🌿", label: "100% Natural", sub: "No synthetics, ever" },
          { icon: "🏺", label: "Ancient Method", sub: "Deg-bhapka distillation" },
          { icon: "🌸", label: "Alcohol-Free", sub: "Pure botanical oils" },
          { icon: "📦", label: "Free Shipping", sub: "On orders above ₹999" },
        ].map((badge) => (
          <div key={badge.label} className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center space-x-3">
            <span className="text-2xl">{badge.icon}</span>
            <div>
              <p className="font-bold text-sm text-gray-800">{badge.label}</p>
              <p className="text-xs text-gray-500">{badge.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <h3 className="text-xl font-display font-bold text-gray-800">Shop by Collection</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {STATIC_CATEGORIES.map((cat) => (
            <Link href={`/category/${cat.slug}`} key={cat.slug}>
              <div className="relative rounded-2xl overflow-hidden aspect-square group cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300">
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <span className="text-xl">{cat.icon}</span>
                  <p className="text-white font-bold text-sm leading-tight mt-1">{cat.name}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bestsellers */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-display font-bold text-gray-800">Bestsellers</h3>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">⭐ Most Loved</span>
          </div>
          <Link href="/category/rose-floral" className="text-sm font-bold text-amber-700 hover:underline">View All</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {bestsellers.map((prod) => (
            <ProductCard
              key={prod.id}
              id={prod.id}
              title={prod.title}
              price={parseFloat(prod.price)}
              halalCertified={prod.halalCertified}
              imageUrl={prod.imageUrl}
            />
          ))}
        </div>
      </div>

      {/* Feature Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative rounded-2xl overflow-hidden min-h-[200px] group">
          <img
            src="https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80"
            alt="Rose Attar"
            className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-rose-900/85 to-rose-900/30" />
          <div className="relative p-8 flex flex-col justify-end h-full min-h-[200px] space-y-2">
            <span className="text-rose-200 text-xs font-bold uppercase tracking-widest">Rose & Floral</span>
            <h4 className="text-2xl font-display font-bold text-white">The Heart of Indian Attar</h4>
            <p className="text-rose-100 text-sm">Ruh Gulab, Mogra & more — distilled from petals picked at dawn.</p>
            <Link href="/category/rose-floral" className="inline-block text-xs font-bold text-white border-b border-white/50 pb-0.5 w-fit hover:border-white transition">
              Shop Rose Collection →
            </Link>
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden min-h-[200px] group">
          <img
            src="https://images.unsplash.com/photo-1519682577862-22b62b24cb12?auto=format&fit=crop&w=800&q=80"
            alt="Oud Attar"
            className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-900/88 to-stone-900/30" />
          <div className="relative p-8 flex flex-col justify-end h-full min-h-[200px] space-y-2">
            <span className="text-amber-300 text-xs font-bold uppercase tracking-widest">Oud & Woody</span>
            <h4 className="text-2xl font-display font-bold text-white">The Scent of Kings</h4>
            <p className="text-stone-300 text-sm">Aged agarwood from Assam & Cambodia — commanding, regal, timeless.</p>
            <Link href="/category/oud-woody" className="inline-block text-xs font-bold text-white border-b border-white/50 pb-0.5 w-fit hover:border-white transition">
              Shop Oud Collection →
            </Link>
          </div>
        </div>
      </div>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-display font-bold text-gray-800">New Arrivals</h3>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded-full">🆕 Just Added</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {newArrivals.map((prod) => (
              <ProductCard
                key={prod.id}
                id={prod.id}
                title={prod.title}
                price={parseFloat(prod.price)}
                halalCertified={prod.halalCertified}
                imageUrl={prod.imageUrl}
              />
            ))}
          </div>
        </div>
      )}

      {/* Full Collection */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="text-xl font-display font-bold text-gray-800">Full Collection</h3>
          <span className="text-sm text-gray-500">{STATIC_PRODUCTS.length} attars</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {STATIC_PRODUCTS.map((prod) => (
            <ProductCard
              key={prod.id}
              id={prod.id}
              title={prod.title}
              price={parseFloat(prod.price)}
              halalCertified={prod.halalCertified}
              imageUrl={prod.imageUrl}
            />
          ))}
        </div>
      </div>

      {/* About Attar */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-8 md:p-12 text-center space-y-4">
        <span className="text-4xl">🏺</span>
        <h3 className="text-2xl font-display font-bold text-gray-900">What is Attar?</h3>
        <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Attar (also spelled Ittar) is a traditional, highly concentrated natural perfume oil derived from
          botanical sources — flowers, herbs, spices, and resins — using centuries-old distillation techniques.
          Free from alcohol and synthetic chemicals, attars are inherently halal and gentle on the skin, making
          them the fragrance of choice for Muslims and natural fragrance lovers worldwide.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          {["Alcohol-Free", "No Synthetics", "Long-Lasting", "Halal", "Skin-Safe", "Eco-Friendly"].map((tag) => (
            <span key={tag} className="bg-white border border-amber-200 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-gray-900 to-stone-800 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between shadow-xl text-white">
        <div className="space-y-2 mb-6 md:mb-0 md:w-2/3">
          <h3 className="text-2xl font-display font-bold text-amber-400">Find Your Signature Scent</h3>
          <p className="text-gray-300 max-w-lg">
            Not sure where to start? Our curated gift sets let you explore multiple attars at once — the perfect way to discover your signature.
          </p>
        </div>
        <Link
          href="/category/gift-collections"
          className="bg-amber-400 text-gray-900 font-bold px-8 py-3 rounded-xl shadow-lg hover:bg-amber-300 hover:-translate-y-0.5 transition-all w-full md:w-auto text-center"
        >
          Shop Gift Sets
        </Link>
      </div>
    </div>
  );
}
