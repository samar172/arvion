"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/product/product-card";
import api from "@/lib/api";
import { Search } from "lucide-react";

export default function CategoryPage({ params }: { params: { name: string } }) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [sortBy, setSortBy] = useState("featured");
  const [search, setSearch] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const catFilter =
          params.name !== "all" ? `&categorySlug=${params.name}` : "";
        const searchFilter = query ? `&search=${encodeURIComponent(query)}` : "";
        const [prodRes, catRes] = await Promise.all([
          api.get(`/catalog?limit=100&sort=${sortBy}${catFilter}${searchFilter}`),
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
  }, [params.name, sortBy, query]);

  const category = categories.find((c) => c.slug === params.name);
  const displayName =
    category?.name ??
    (params.name === "all"
      ? "All Gifts"
      : decodeURIComponent(params.name).replace(/-/g, " "));

  const chips = [{ id: "all", slug: "all", name: "All Gifts" }, ...categories];

  return (
    <div className="mx-auto max-w-7xl w-full px-4 md:px-7 py-8 md:py-10 flex-1">
      {/* Breadcrumb + title */}
      <div className="font-sans text-xs tracking-[0.06em] text-muted-2 mb-3">
        <Link href="/" className="hover:text-emerald">Home</Link>
        <span className="mx-2">/</span>
        <span>Shop</span>
      </div>
      <h1 className="font-display font-medium text-4xl md:text-[46px] text-ink mb-1">
        {displayName}
      </h1>
      <p className="font-sans text-[13px] text-muted mb-7">
        {loading ? "…" : `${products.length} gifts`} · Handcrafted with love
      </p>

      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(search.trim());
        }}
        className="relative max-w-xl mb-7"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for Quran sets, attars, prayer rugs…"
          className="w-full bg-card border border-line rounded-full pl-11 pr-4 py-3 font-sans text-sm text-ink placeholder:text-muted-2 focus:border-gold focus:outline-none transition"
        />
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-8 lg:gap-10 items-start">
        {/* Sidebar (desktop) / chips (mobile) */}
        <aside className="lg:sticky lg:top-28">
          <div className="hidden lg:block">
            <div className="font-sans text-xs tracking-[0.16em] uppercase text-emerald mb-3.5 border-b border-line pb-2.5">
              Categories
            </div>
            <div className="flex flex-col gap-0.5">
              {chips.map((cat) => {
                const active = params.name === cat.slug;
                return (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className={`text-left font-sans text-sm py-2.5 px-3 border-l-2 transition ${
                      active
                        ? "bg-[#f0e8d5] border-gold text-emerald"
                        : "border-transparent text-ink-body hover:text-emerald"
                    }`}
                  >
                    {cat.name}
                  </Link>
                );
              })}
            </div>
            <div className="font-sans text-xs tracking-[0.16em] uppercase text-emerald mt-7 mb-3.5 border-b border-line pb-2.5">
              Sort by
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full font-sans text-sm p-2.5 border border-line bg-card text-ink-soft rounded-sm focus:outline-none focus:border-gold"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>

          {/* Mobile chips + sort */}
          <div className="lg:hidden flex flex-col gap-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
              {chips.map((cat) => {
                const active = params.name === cat.slug;
                return (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className={`px-4 py-2 font-sans text-[13px] rounded-full whitespace-nowrap border transition ${
                      active
                        ? "bg-emerald text-cream border-emerald"
                        : "bg-card text-ink-soft border-line"
                    }`}
                  >
                    {cat.name}
                  </Link>
                );
              })}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full font-sans text-sm p-2.5 border border-line bg-card text-ink-soft rounded-sm focus:outline-none"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </aside>

        {/* Grid */}
        {loading ? (
          <div className="py-24 text-center font-display italic text-lg text-muted animate-pulse">
            Loading gifts…
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {products.map((prod) => (
              <ProductCard
                key={prod.id}
                id={prod.id}
                title={prod.title}
                price={parseFloat(prod.price)}
                compareAtPrice={
                  prod.compareAtPrice ? parseFloat(prod.compareAtPrice) : null
                }
                imageUrl={prod.imageUrl}
                categoryName={prod.category?.name}
              />
            ))}
            {products.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <p className="font-display text-2xl text-ink-soft mb-2">
                  No gifts found
                </p>
                <p className="font-sans text-sm text-muted">
                  Try a different search or browse all our collections.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
