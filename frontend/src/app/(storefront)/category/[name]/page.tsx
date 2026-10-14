"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import ProductCard from "@/components/product/product-card";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { useNavCategories } from "@/hooks/use-nav-categories";
import api from "@/lib/api";
import { toSummary, type ProductSummary } from "@/lib/format";

const PAGE_SIZE = 12;

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price_low", label: "Price: low to high" },
  { value: "price_high", label: "Price: high to low" },
];

const PRICE_RANGES = [
  { value: "u1000", label: "Under ₹1,000", min: undefined, max: 999 },
  { value: "1000-2500", label: "₹1,000 – ₹2,500", min: 1000, max: 2500 },
  { value: "2500-5000", label: "₹2,500 – ₹5,000", min: 2500, max: 5000 },
  { value: "5000+", label: "Above ₹5,000", min: 5000, max: undefined },
] as const;

interface Filters {
  q: string;
  sort: string;
  sale: boolean;
  halal: boolean;
  price: string;
}

function readFilters(params: URLSearchParams): Filters {
  return {
    q: params.get("q") || "",
    sort: params.get("sort") || "featured",
    sale: params.get("sale") === "1",
    halal: params.get("halal") === "1",
    price: params.get("price") || "",
  };
}

function toQueryString(f: Filters) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.sort !== "featured") p.set("sort", f.sort);
  if (f.sale) p.set("sale", "1");
  if (f.halal) p.set("halal", "1");
  if (f.price) p.set("price", f.price);
  const s = p.toString();
  return s ? `?${s}` : "";
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-2.5 cursor-pointer font-sans text-sm text-ink-body">
      {label}
      <span className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="block h-6 w-11 rounded-full bg-line transition-colors peer-checked:bg-emerald peer-focus-visible:ring-2 peer-focus-visible:ring-gold" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-card shadow transition-transform duration-300 ease-out-expo peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function FilterPanel({
  filters,
  update,
  activeSlug,
  categories,
  onNavigate,
}: {
  filters: Filters;
  update: (patch: Partial<Filters>) => void;
  activeSlug: string;
  categories: { id: string; slug: string; name: string }[];
  onNavigate?: () => void;
}) {
  const heading = "font-sans text-xs tracking-[0.16em] uppercase text-emerald mb-2 border-b border-line pb-2.5";
  const chips = [{ id: "all", slug: "all", name: "All gifts" }, ...categories];
  return (
    <div className="flex flex-col gap-7">
      <div>
        <div className={heading}>Categories</div>
        <div className="flex flex-col gap-0.5">
          {chips.map((cat) => {
            const active = activeSlug === cat.slug;
            return (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}${toQueryString({ ...filters, q: "" })}`}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`font-sans text-sm py-2.5 px-3 border-l-2 transition ${
                  active
                    ? "bg-[#f0e8d5] border-gold text-emerald"
                    : "border-transparent text-ink-body hover:text-emerald hover:border-line"
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <div className={heading}>Price</div>
        <div className="flex flex-col">
          {PRICE_RANGES.map((r) => (
            <label key={r.value} className="flex items-center gap-3 py-2 cursor-pointer font-sans text-sm text-ink-body">
              <input
                type="radio"
                name="price"
                checked={filters.price === r.value}
                onChange={() => update({ price: r.value })}
                className="h-4 w-4 accent-emerald"
              />
              {r.label}
            </label>
          ))}
          {filters.price && (
            <button onClick={() => update({ price: "" })} className="text-left font-sans text-xs text-emerald underline underline-offset-4 mt-1">
              Any price
            </button>
          )}
        </div>
      </div>

      <div>
        <div className={heading}>Refine</div>
        <Toggle label="On sale" checked={filters.sale} onChange={(v) => update({ sale: v })} />
        <Toggle label="Halal certified" checked={filters.halal} onChange={(v) => update({ halal: v })} />
      </div>
    </div>
  );
}

export default function CategoryPage({ params }: { params: { name: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categories = useNavCategories();

  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const [search, setSearch] = useState(filters.q);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => setSearch(filters.q), [filters.q]);

  const update = (patch: Partial<Filters>) => {
    router.replace(`${pathname}${toQueryString({ ...filters, ...patch })}`, { scroll: false });
  };

  const apiQuery = useMemo(() => {
    const p = new URLSearchParams({ limit: String(PAGE_SIZE), sort: filters.sort });
    if (params.name !== "all") p.set("categorySlug", params.name);
    if (filters.q) p.set("search", filters.q);
    if (filters.sale) p.set("onSaleOnly", "true");
    if (filters.halal) p.set("halalOnly", "true");
    const range = PRICE_RANGES.find((r) => r.value === filters.price);
    if (range?.min !== undefined) p.set("minPrice", String(range.min));
    if (range?.max !== undefined) p.set("maxPrice", String(range.max));
    return p.toString();
  }, [params.name, filters]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    setPage(1);
    api
      .get(`/catalog?${apiQuery}&page=1`)
      .then((res) => {
        if (!alive) return;
        setProducts((res.data.data || []).map(toSummary));
        setTotal(res.data.total || 0);
      })
      .catch((err) => {
        console.error("Failed to load products", err);
        if (alive) setError(true);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [apiQuery, retry]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await api.get(`/catalog?${apiQuery}&page=${next}`);
      setProducts((prev) => [...prev, ...(res.data.data || []).map(toSummary)]);
      setPage(next);
    } catch (err) {
      console.error("Failed to load more products", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const category = categories.find((c) => c.slug === params.name);
  const displayName =
    category?.name ??
    (params.name === "all" ? "All gifts" : decodeURIComponent(params.name).replace(/-/g, " "));

  const activeChips: { label: string; clear: Partial<Filters> }[] = [];
  if (filters.q) activeChips.push({ label: `“${filters.q}”`, clear: { q: "" } });
  if (filters.price)
    activeChips.push({
      label: PRICE_RANGES.find((r) => r.value === filters.price)?.label || filters.price,
      clear: { price: "" },
    });
  if (filters.sale) activeChips.push({ label: "On sale", clear: { sale: false } });
  if (filters.halal) activeChips.push({ label: "Halal certified", clear: { halal: false } });
  const filterCount = activeChips.filter((c) => !("q" in c.clear)).length;

  const clearAll = () => router.replace(pathname, { scroll: false });

  return (
    <div className="mx-auto max-w-7xl w-full px-4 md:px-7 py-6 md:py-10 flex-1">
      {/* Breadcrumb + title */}
      <nav aria-label="Breadcrumb" className="font-sans text-xs tracking-[0.06em] text-muted-2 mb-3">
        <Link href="/" className="hover:text-emerald">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/category/all" className="hover:text-emerald">Shop</Link>
        {params.name !== "all" && (
          <>
            <span className="mx-2">/</span>
            <span className="text-ink-soft">{displayName}</span>
          </>
        )}
      </nav>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-8 mb-6 md:mb-8">
        <div>
          <h1 className="font-display font-medium text-[38px] leading-tight md:text-[52px] text-ink capitalize">
            {displayName}
          </h1>
          {category?.description && (
            <p className="font-sans text-sm text-muted mt-1 max-w-xl">{category.description}</p>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: search.trim() });
          }}
          className="relative w-full md:max-w-sm"
          role="search"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${params.name === "all" ? "all gifts" : displayName}…`}
            aria-label="Search products"
            className="w-full bg-card border border-line rounded-full pl-11 pr-4 h-11 font-sans text-[15px] md:text-sm text-ink placeholder:text-muted-2 focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none transition"
          />
        </form>
      </div>

      {/* Mobile: category chips + filter/sort bar */}
      <div className="lg:hidden flex flex-col gap-3 mb-5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
          {[{ id: "all", slug: "all", name: "All gifts" }, ...categories].map((cat) => {
            const active = params.name === cat.slug;
            return (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}${toQueryString({ ...filters, q: "" })}`}
                className={`px-4 py-2 font-sans text-[13px] rounded-full whitespace-nowrap border transition ${
                  active ? "bg-emerald text-cream border-emerald" : "bg-card text-ink-soft border-line"
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>
        <div className="sticky top-[64px] z-10 -mx-4 px-4 py-2 bg-cream/95 backdrop-blur-sm grid grid-cols-2 gap-2">
          <button
            onClick={() => setSheetOpen(true)}
            className="h-11 inline-flex items-center justify-center gap-2 border border-line bg-card rounded-sm font-sans text-[13px] text-ink-soft"
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} />
            Filter
            {filterCount > 0 && (
              <span className="h-5 min-w-[20px] px-1 rounded-full bg-emerald text-cream text-[11px] inline-flex items-center justify-center">
                {filterCount}
              </span>
            )}
          </button>
          <select
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value })}
            aria-label="Sort products"
            className="h-11 w-full font-sans text-[13px] px-3 border border-line bg-card text-ink-soft rounded-sm focus:outline-none focus:border-gold"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-8 lg:gap-10 items-start">
        <aside className="hidden lg:block lg:sticky lg:top-28" aria-label="Filters">
          <FilterPanel filters={filters} update={update} activeSlug={params.name} categories={categories} />
        </aside>

        <div>
          {/* Result bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 md:mb-5">
            <p className="font-sans text-[13px] text-muted" aria-live="polite">
              {loading ? "Finding gifts…" : `${total} ${total === 1 ? "gift" : "gifts"}`}
            </p>
            <div className="hidden lg:flex items-center gap-2">
              <label htmlFor="sort" className="font-sans text-xs text-muted">Sort by</label>
              <select
                id="sort"
                value={filters.sort}
                onChange={(e) => update({ sort: e.target.value })}
                className="font-sans text-sm h-10 px-3 border border-line bg-card text-ink-soft rounded-sm focus:outline-none focus:border-gold"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-5">
              {activeChips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => update(chip.clear)}
                  className="inline-flex items-center gap-1.5 bg-paper border border-gold/50 rounded-full pl-3.5 pr-2.5 py-1.5 font-sans text-xs text-emerald hover:border-gold transition"
                >
                  {chip.label}
                  <X className="h-3.5 w-3.5" aria-label="Remove filter" />
                </button>
              ))}
              {activeChips.length > 1 && (
                <button onClick={clearAll} className="font-sans text-xs text-muted underline underline-offset-4 hover:text-emerald ml-1">
                  Clear all
                </button>
              )}
            </div>
          )}

          {loading ? (
            <ProductGridSkeleton count={6} className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5" />
          ) : error ? (
            <EmptyState title="We couldn't load gifts" body="Check your connection and try again.">
              <button onClick={() => setRetry((n) => n + 1)} className="btn-primary px-8">
                Try again
              </button>
            </EmptyState>
          ) : products.length === 0 ? (
            <EmptyState
              icon={<Search className="h-6 w-6" strokeWidth={1.5} />}
              title="No gifts match these filters"
              body={filters.q ? `Nothing found for “${filters.q}”. Try a broader word or clear filters.` : "Try removing a filter or browse another collection."}
            >
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {activeChips.length > 0 && (
                  <button onClick={clearAll} className="btn-primary px-8">
                    Clear filters
                  </button>
                )}
                <Link href="/category/all" className="btn-ghost px-8">
                  Browse all gifts
                </Link>
              </div>
            </EmptyState>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                {products.map((p, i) => (
                  <div key={p.id} className="flex animate-fadeUp [&>article]:w-full" style={{ animationDelay: `${(i % PAGE_SIZE) * 40}ms` }}>
                    <ProductCard product={p} priority={i < 4} />
                  </div>
                ))}
              </div>
              {products.length < total && (
                <div className="mt-10 flex flex-col items-center gap-3">
                  <p className="font-sans text-xs text-muted">
                    Showing {products.length} of {total}
                  </p>
                  <div className="h-1 w-48 rounded-full bg-line overflow-hidden">
                    <div className="h-full bg-gold transition-[width] duration-500" style={{ width: `${(products.length / total) * 100}%` }} />
                  </div>
                  <button onClick={loadMore} disabled={loadingMore} className="btn-outline px-10 mt-2">
                    {loadingMore ? "Loading…" : "Load more gifts"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        footer={
          <div className="grid grid-cols-2 gap-3">
            <button onClick={clearAll} className="btn-ghost">
              Clear
            </button>
            <button onClick={() => setSheetOpen(false)} className="btn-primary">
              Show {loading ? "…" : total}
            </button>
          </div>
        }
      >
        <div className="px-5 py-5">
          <FilterPanel
            filters={filters}
            update={update}
            activeSlug={params.name}
            categories={categories}
            onNavigate={() => setSheetOpen(false)}
          />
        </div>
      </Sheet>
    </div>
  );
}
