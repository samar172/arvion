"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { toSummary, type ProductSummary } from "@/lib/format";
import ProductCard from "./product-card";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/ui/reveal";

export function SectionHeading({
  eyebrow,
  title,
  viewAllHref,
  viewAllLabel = "View all",
}: {
  eyebrow: string;
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="font-display font-medium text-[30px] leading-tight md:text-[42px] text-ink mt-1.5 md:mt-2">
          {title}
        </h2>
      </div>
      {viewAllHref && (
        <Link href={viewAllHref} className="link-underline group inline-flex items-center gap-1.5 mb-1.5">
          {viewAllLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

/** Fetches a catalog query and caches nothing — each shelf owns its loading state. */
export function useCatalog(query: string) {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get(`/catalog?${query}`)
      .then((res) => alive && setProducts((res.data.data || []).map(toSummary)))
      .catch((err) => console.error(`Failed to load /catalog?${query}`, err))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [query]);

  return { products, loading };
}

/**
 * Horizontal swipe row on phones (cards peek to signal scroll), regular grid from md up.
 */
export function ProductRow({
  products,
  loading,
  skeletonCount = 4,
}: {
  products: ProductSummary[];
  loading: boolean;
  skeletonCount?: number;
}) {
  const cell = "w-[46vw] max-w-[230px] shrink-0 snap-start md:w-auto md:max-w-none";
  return (
    <div className="-mx-4 px-4 md:mx-0 md:px-0 flex md:grid md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar scroll-px-4">
      {loading
        ? Array.from({ length: skeletonCount }).map((_, i) => (
            <div key={i} className={cell}>
              <ProductCardSkeleton />
            </div>
          ))
        : products.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i, 4) * 70} className={`${cell} flex`}>
              <div className="flex w-full [&>article]:w-full">
                <ProductCard product={p} priority={i < 2} />
              </div>
            </Reveal>
          ))}
    </div>
  );
}

export function ProductShelf({
  eyebrow,
  title,
  query,
  viewAllHref,
  hideWhenEmpty = true,
  className = "",
}: {
  eyebrow: string;
  title: string;
  query: string;
  viewAllHref?: string;
  hideWhenEmpty?: boolean;
  className?: string;
}) {
  const { products, loading } = useCatalog(query);
  if (!loading && products.length === 0 && hideWhenEmpty) return null;

  return (
    <section className={`mx-auto max-w-7xl w-full px-4 md:px-7 ${className}`}>
      <SectionHeading eyebrow={eyebrow} title={title} viewAllHref={viewAllHref} />
      <ProductRow products={products} loading={loading} />
    </section>
  );
}
