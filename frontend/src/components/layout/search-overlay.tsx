"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, X } from "lucide-react";
import api from "@/lib/api";
import { inr, toSummary, type ProductSummary } from "@/lib/format";
import { useNavCategories } from "@/hooks/use-nav-categories";
import { SafeImage } from "@/components/ui/safe-image";

const SUGGESTIONS = ["Quran", "Prayer mat", "Attar", "Dates", "Tasbih", "Hamper"];

/** Full-width search panel with debounced live results from /catalog. */
export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const categories = useNavCategories();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const t = setTimeout(() => {
      api
        .get(`/catalog?limit=6&search=${encodeURIComponent(term)}`)
        .then((res) => {
          if (cancelled) return;
          setResults((res.data.data || []).map(toSummary));
          setTotal(res.data.total || 0);
        })
        .catch(() => !cancelled && setResults([]))
        .finally(() => !cancelled && setLoading(false));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  if (!open) return null;

  const go = (href: string) => {
    onClose();
    setQuery("");
    router.push(href);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = query.trim();
    if (term) go(`/category/all?q=${encodeURIComponent(term)}`);
  };

  const term = query.trim();

  return (
    <div className="fixed inset-0 z-overlay" role="dialog" aria-modal="true" aria-label="Search">
      <button
        aria-label="Close search"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-emerald-deep/50 animate-fadeIn cursor-default"
      />
      <div className="relative bg-paper border-b border-line shadow-[0_24px_60px_-24px_rgba(10,46,34,0.5)] animate-fadeIn max-h-[100dvh] overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 md:px-7 pt-4 md:pt-8 pb-6 md:pb-10">
          <form onSubmit={submit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" strokeWidth={1.75} />
              <input
                ref={inputRef}
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Quran sets, attars, prayer mats…"
                aria-label="Search products"
                className="w-full bg-card border border-line rounded-full pl-12 pr-4 h-12 md:h-14 font-sans text-base text-ink placeholder:text-muted-2 focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none transition"
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search"
              className="h-12 w-12 shrink-0 flex items-center justify-center rounded-full text-ink-soft hover:bg-line-soft transition"
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </form>

          {term.length < 2 ? (
            <div className="mt-7 grid gap-7 md:grid-cols-2">
              <div>
                <p className="eyebrow mb-3">Popular searches</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="bg-card border border-line font-sans text-[13px] text-ink-soft px-4 py-2 rounded-full hover:border-gold hover:text-emerald transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {categories.length > 0 && (
                <div>
                  <p className="eyebrow mb-3">Collections</p>
                  <div className="flex flex-col">
                    {categories.slice(0, 6).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => go(`/category/${c.slug}`)}
                        className="flex items-center justify-between py-2.5 border-b border-line-soft font-display text-lg text-ink hover:text-emerald text-left transition group"
                      >
                        {c.name}
                        <ArrowRight className="h-4 w-4 text-gold opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6" aria-live="polite">
              {loading && results.length === 0 ? (
                <p className="font-sans text-sm text-muted py-6">Searching…</p>
              ) : results.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="font-display text-2xl text-ink-soft">No gifts match “{term}”</p>
                  <p className="font-sans text-sm text-muted mt-1.5">
                    Try a shorter word, or browse a collection above.
                  </p>
                </div>
              ) : (
                <>
                  <p className="eyebrow mb-3">
                    {total} {total === 1 ? "result" : "results"}
                  </p>
                  <ul className="flex flex-col divide-y divide-line-soft border-y border-line-soft">
                    {results.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/products/${p.id}`}
                          onClick={onClose}
                          className="flex items-center gap-4 py-3 hover:bg-card transition -mx-2 px-2 rounded-sm"
                        >
                          <span className="h-14 w-14 shrink-0 rounded-sm overflow-hidden bg-card border border-line-soft">
                            {p.imageUrl ? (
                              <SafeImage src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="block h-full w-full pattern-paper" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-display text-lg text-ink truncate">{p.title}</span>
                            {p.categoryName && (
                              <span className="block font-sans text-xs text-muted">{p.categoryName}</span>
                            )}
                          </span>
                          <span className="font-sans text-sm font-medium text-emerald tabular">
                            {inr(p.price)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {total > results.length && (
                    <button
                      onClick={() => go(`/category/all?q=${encodeURIComponent(term)}`)}
                      className="btn-outline w-full mt-5"
                    >
                      See all {total} results <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
