"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  ChevronDown,
  Gift,
  PackageCheck,
  Share2,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { useToast } from "@/context/ToastContext";
import api from "@/lib/api";
import {
  availableStock,
  discountPercent,
  inr,
  parseGallery,
  toSummary,
  type ProductSummary,
} from "@/lib/format";
import { WishlistButton } from "@/components/product/product-card";
import { ProductRow, SectionHeading } from "@/components/product/product-shelf";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { SafeImage } from "@/components/ui/safe-image";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";

function Gallery({ images, title, badge }: { images: string[]; title: string; badge?: React.ReactNode }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Mobile: swipe track drives the active dot.
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  const select = (i: number) => {
    setActive(i);
    const el = trackRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  if (images.length === 0) {
    return (
      <div className="relative aspect-square border border-line rounded-lg overflow-hidden pattern-paper flex items-center justify-center">
        {badge}
        <span className="font-sans text-xs tracking-[0.2em] uppercase text-gold-muted">Gift</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row-reverse gap-3">
      <div className="relative flex-1 -mx-4 md:mx-0">
        {badge}
        {/* Mobile swipe track */}
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="md:hidden flex overflow-x-auto snap-x snap-mandatory no-scrollbar aspect-square bg-paper"
        >
          {images.map((src, i) => (
            <SafeImage
              key={src}
              src={src}
              alt={i === 0 ? title : `${title} — view ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              className="w-full h-full shrink-0 snap-center object-cover"
            />
          ))}
        </div>
        {images.length > 1 && (
          <div className="md:hidden absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === active ? "w-5 bg-emerald" : "w-1.5 bg-card/80"
                }`}
              />
            ))}
          </div>
        )}

        {/* Desktop: hover to zoom */}
        <div
          className="hidden md:block relative aspect-square border border-line rounded-lg overflow-hidden bg-paper cursor-zoom-in"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseLeave={() => setZoom(null)}
        >
          <SafeImage
            key={images[active]}
            src={images[active]}
            alt={title}
            className="w-full h-full object-cover animate-fadeIn transition-transform duration-300 ease-out"
            style={
              zoom
                ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
                : undefined
            }
          />
        </div>
      </div>

      {images.length > 1 && (
        <div className="hidden md:flex md:flex-col gap-3 md:w-20 shrink-0">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => select(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={active === i}
              className={`aspect-square border-2 rounded-md overflow-hidden transition ${
                active === i ? "border-gold" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <SafeImage src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Detail({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group border-b border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-sans text-[13px] tracking-[0.1em] uppercase text-emerald [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-4 w-4 text-gold transition-transform duration-300 group-open:rotate-180" />
      </summary>
      <div className="pb-5 font-sans font-light text-[15px] leading-[1.75] text-ink-body whitespace-pre-line">
        {children}
      </div>
    </details>
  );
}

function ProductSkeleton() {
  return (
    <div className="mx-auto max-w-7xl w-full px-4 md:px-7 py-6 md:py-10 flex-1">
      <Skeleton className="h-3 w-48 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14">
        <Skeleton className="aspect-square rounded-lg" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-4/5" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailsPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, items } = useCart();
  const settings = useSettings();
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setQuantity(1);
        const res = await api.get(`/catalog/${params.id}`);
        if (!alive) return;
        const productData = res.data;
        setProduct(productData);

        if (productData.category?.slug) {
          const relatedRes = await api.get(`/catalog?limit=5&categorySlug=${productData.category.slug}`);
          if (!alive) return;
          setRelated(
            (relatedRes.data.data || [])
              .filter((p: any) => p.id !== productData.id)
              .slice(0, 4)
              .map(toSummary)
          );
        }
      } catch (err) {
        console.error("Failed to load product details", err);
        if (alive) setProduct(null);
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetchProductDetails();
    return () => {
      alive = false;
    };
  }, [params.id]);

  const summary = useMemo(() => (product ? toSummary(product) : null), [product]);
  const recent = useRecentlyViewed(summary);

  useEffect(() => {
    if (product?.title) document.title = `${product.title} — ${settings.storeName}`;
  }, [product?.title, settings.storeName]);

  if (loading) return <ProductSkeleton />;

  if (!product || product.isActive === false) {
    return (
      <div className="mx-auto max-w-2xl w-full px-4 py-16 md:py-24 flex-1">
        <EmptyState
          icon={<Gift className="h-6 w-6" strokeWidth={1.5} />}
          title="This gift isn't available"
          body="It may have sold out or been retired from the collection."
          actionLabel="Browse the collection"
          actionHref="/category/all"
        />
      </div>
    );
  }

  const price = parseFloat(product.price);
  const compareAt = product.compareAtPrice ? parseFloat(product.compareAtPrice) : null;
  const discount = discountPercent(price, compareAt);
  const gallery = parseGallery(product);
  const stock = availableStock(product);
  const inBag = items.find((i) => i.productId === product.id)?.quantity ?? 0;
  const remaining = stock === null ? null : Math.max(0, stock - inBag);
  const outOfStock = stock !== null && stock <= 0;
  const cannotAdd = outOfStock || remaining === 0;

  const handleAddToCart = () => {
    addToCart(
      { id: product.id, title: product.title, price, imageUrl: gallery[0], maxQuantity: stock },
      quantity
    );
    setQuantity(1);
  };

  const handleBuyNow = () => {
    if (!cannotAdd) handleAddToCart();
    router.push("/cart");
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast("Link copied");
      }
    } catch {
      /* user dismissed the share sheet */
    }
  };

  const whatsapp = settings.whatsapp?.replace(/\D/g, "");
  const freeThreshold = Number(settings.freeShippingThreshold) || 0;

  const addLabel = outOfStock ? "Sold out" : remaining === 0 ? "All stock in bag" : "Add to bag";

  return (
    <div className="mx-auto max-w-7xl w-full px-4 md:px-7 py-4 md:py-10 flex-1">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="font-sans text-xs tracking-[0.06em] text-muted-2 mb-4 md:mb-6 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-emerald">Home</Link>
        <span>/</span>
        {product.category ? (
          <Link href={`/category/${product.category.slug}`} className="hover:text-emerald">
            {product.category.name}
          </Link>
        ) : (
          <Link href="/category/all" className="hover:text-emerald">Shop</Link>
        )}
        <span>/</span>
        <span className="text-ink-soft truncate max-w-[180px] sm:max-w-[320px]">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 lg:gap-14 items-start">
        <div className="md:sticky md:top-24">
          <Gallery
            images={gallery}
            title={product.title}
            badge={
              discount > 0 && !outOfStock ? (
                <span className="absolute top-4 left-4 md:left-4 z-10 bg-emerald text-sand font-sans text-xs tracking-wide px-3 py-1.5 rounded-sm tabular">
                  {discount}% off
                </span>
              ) : outOfStock ? (
                <span className="absolute top-4 left-4 z-10 bg-ink/85 text-cream font-sans text-xs tracking-wide px-3 py-1.5 rounded-sm">
                  Sold out
                </span>
              ) : null
            }
          />
        </div>

        {/* Info */}
        <div className="md:pt-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {product.category && (
                <Link href={`/category/${product.category.slug}`} className="eyebrow hover:text-gold-dark">
                  {product.category.name}
                </Link>
              )}
              <h1 className="font-display font-medium text-[32px] md:text-[44px] leading-[1.08] text-ink mt-2 mb-3">
                {product.title}
              </h1>
            </div>
            <div className="flex gap-2 shrink-0 pt-1">
              {summary && <WishlistButton product={summary} className="h-11 w-11" />}
              <button
                onClick={handleShare}
                aria-label="Share"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-card border border-line/70 text-emerald hover:bg-paper transition"
              >
                <Share2 className="h-[17px] w-[17px]" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {product.halalCertified && (
            <span className="inline-flex items-center gap-1.5 mb-4 font-sans text-xs text-emerald bg-paper border border-gold/50 rounded-full px-3 py-1">
              <BadgeCheck className="h-3.5 w-3.5 text-gold-dark" strokeWidth={1.75} /> Halal certified
            </span>
          )}

          <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1 mb-1">
            <span className="font-display text-[34px] md:text-[38px] text-emerald tabular">{inr(price)}</span>
            {discount > 0 && (
              <>
                <span className="font-sans text-lg text-faded line-through tabular">{inr(compareAt)}</span>
                <span className="font-sans text-xs tracking-wide text-gold-dark bg-[#f8f2e2] border border-gold/40 rounded-sm px-2 py-0.5">
                  You save {inr(compareAt! - price)}
                </span>
              </>
            )}
          </div>
          <p className="font-sans text-xs text-muted mb-6">Inclusive of all taxes</p>

          {outOfStock ? (
            <div className="bg-paper border border-line rounded-sm px-4 py-3.5 mb-6 font-sans text-sm text-danger">
              Currently out of stock — check back soon, insha&apos;Allah.
            </div>
          ) : (
            stock !== null &&
            stock <= 5 && (
              <div className="flex items-center gap-2.5 bg-paper border border-gold rounded-sm px-4 py-3 mb-6 font-sans text-sm text-gold-dark">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-dark" />
                </span>
                Only {stock} left in stock — order soon.
              </div>
            )
          )}

          {/* Desktop actions (mobile uses the sticky bar below) */}
          <div className="hidden md:block">
            <div className="flex gap-3 items-stretch mb-3">
              <QuantityStepper
                value={quantity}
                onChange={(q) => setQuantity(Math.max(1, remaining != null ? Math.min(q, remaining) : q))}
                max={remaining}
              />
              <button onClick={handleAddToCart} disabled={cannotAdd} className="btn-primary flex-1">
                <ShoppingBag className="h-4 w-4" strokeWidth={1.75} /> {addLabel}
              </button>
            </div>
            <button onClick={handleBuyNow} disabled={outOfStock} className="btn-gold w-full">
              Buy it now
            </button>
            {inBag > 0 && (
              <p className="font-sans text-xs text-muted mt-3">
                {inBag} already in your bag ·{" "}
                <Link href="/cart" className="text-emerald underline underline-offset-4">View bag</Link>
              </p>
            )}
          </div>

          {/* Mobile quantity */}
          {!cannotAdd && (
            <div className="md:hidden flex items-center justify-between mb-2">
              <span className="field-label mb-0">Quantity</span>
              <QuantityStepper
                value={quantity}
                onChange={(q) => setQuantity(Math.max(1, remaining != null ? Math.min(q, remaining) : q))}
                max={remaining}
                size="sm"
              />
            </div>
          )}

          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans text-[13px] text-emerald-soft">
            <li className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 rounded-md bg-paper border border-line-soft px-4 py-3">
              <Truck className="h-5 w-5 text-gold-dark shrink-0" strokeWidth={1.5} />
              {freeThreshold > 0 ? `Free shipping over ${inr(freeThreshold)}` : "Free shipping"}
            </li>
            <li className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 rounded-md bg-paper border border-line-soft px-4 py-3">
              <Gift className="h-5 w-5 text-gold-dark shrink-0" strokeWidth={1.5} />
              Gift-wrapped with a note
            </li>
            <li className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 rounded-md bg-paper border border-line-soft px-4 py-3">
              <PackageCheck className="h-5 w-5 text-gold-dark shrink-0" strokeWidth={1.5} />
              Ships in 2–4 business days
            </li>
          </ul>

          <div className="mt-6 border-t border-line">
            <Detail title="Description" defaultOpen>
              {product.description}
            </Detail>
            <Detail title="Shipping & returns">
              Orders are packed and dispatched in 2–4 business days. Domestic delivery takes 3–6 days, international 7–12 days.
              {"\n\n"}Unused items in original packaging can be returned within 7 days. Personalised items are non-returnable.
            </Detail>
            <Detail title="Gift wrapping & notes">
              Every order is gift-wrapped by hand. Add a name or short message in the gift note at checkout and we&apos;ll include it.
            </Detail>
          </div>

          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Assalamu Alaikum, I'd like to know more about "${product.title}".`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-center justify-between gap-3 rounded-md border border-line bg-card px-4 py-3.5 hover:border-gold transition group"
            >
              <span className="font-sans text-sm text-ink-body">
                Questions or personalisation?
                <span className="block text-emerald font-medium">Chat with us on WhatsApp</span>
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white transition-transform group-hover:scale-105">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                  <path d="M12.05 21.5a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.44 9.44 0 1 1 8 4.42M20.09 4.02A11.3 11.3 0 0 0 .68 12.07c0 2 .52 3.96 1.52 5.68L.58 23.7l6.09-1.6A11.37 11.37 0 0 0 23.43 12.1c0-3.04-1.18-5.9-3.34-8.05" />
                </svg>
              </span>
            </a>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 md:mt-24">
          <SectionHeading
            eyebrow="More from this collection"
            title="You may also love"
            viewAllHref={product.category ? `/category/${product.category.slug}` : undefined}
          />
          <ProductRow products={related} loading={false} />
        </section>
      )}

      {recent.length > 0 && (
        <section className="mt-14 md:mt-20">
          <SectionHeading eyebrow="Pick up where you left off" title="Recently viewed" />
          <ProductRow products={recent.slice(0, 4)} loading={false} />
        </section>
      )}

      {/* Mobile sticky buy bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-nav bg-paper/95 backdrop-blur-md border-t border-line px-4 pt-3 pb-safe">
        <div className="flex items-center gap-3 pb-3">
          <div className="min-w-0">
            <div className="font-display text-2xl leading-none text-emerald tabular">{inr(price * quantity)}</div>
            {quantity > 1 && <div className="font-sans text-[11px] text-muted mt-0.5">{quantity} × {inr(price)}</div>}
          </div>
          <button onClick={handleAddToCart} disabled={cannotAdd} className="btn-primary flex-1 px-3">
            {addLabel}
          </button>
          {!outOfStock && (
            <button onClick={handleBuyNow} className="btn-gold px-4">
              Buy now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
