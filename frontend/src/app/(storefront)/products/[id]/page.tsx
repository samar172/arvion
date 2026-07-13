"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import ProductCard from "@/components/product/product-card";

export default function ProductDetailsPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const { addToCart } = useCart();
  const settings = useSettings();
  const router = useRouter();

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/catalog/${params.id}`);
        const productData = res.data;
        setProduct(productData);
        setActiveImage(0);

        if (productData.category?.slug) {
          const relatedRes = await api.get(
            `/catalog?limit=5&categorySlug=${productData.category.slug}`
          );
          const relatedList = (relatedRes.data.data || []).filter(
            (p: any) => p.id !== productData.id
          );
          setRelated(relatedList.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to load product details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-32">
        <p className="font-display italic text-xl text-muted animate-pulse">
          Unwrapping…
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 py-32 text-center px-4">
        <h2 className="font-display text-3xl text-ink">
          This gift could not be found
        </h2>
        <Link
          href="/category/all"
          className="font-sans text-sm tracking-[0.08em] uppercase text-emerald border-b border-gold pb-1"
        >
          Return to the collection
        </Link>
      </div>
    );
  }

  const price = parseFloat(product.price);
  const compareAt = product.compareAtPrice
    ? parseFloat(product.compareAtPrice)
    : null;
  const hasSale = !!compareAt && compareAt > price;
  const discount = hasSale ? Math.round((1 - price / compareAt!) * 100) : 0;

  let gallery: string[] = [];
  if (product.imageUrl) gallery.push(product.imageUrl);
  try {
    const extra = product.images ? JSON.parse(product.images) : [];
    if (Array.isArray(extra)) gallery = [...gallery, ...extra.filter(Boolean)];
  } catch {
    /* images is optional JSON — ignore malformed */
  }

  const stock = product.inventory
    ? product.inventory.stock - product.inventory.reserved
    : null;
  const outOfStock = stock !== null && stock <= 0;

  const handleAddToCart = () => {
    addToCart(
      {
        id: product.id,
        title: product.title,
        price,
        imageUrl: product.imageUrl,
      },
      quantity
    );
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/cart");
  };

  return (
    <div className="mx-auto max-w-7xl w-full px-4 md:px-7 py-8 md:py-10 flex-1">
      {/* Breadcrumb */}
      <nav className="font-sans text-xs tracking-[0.06em] text-muted-2 mb-6 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-emerald">Home</Link>
        <span>/</span>
        {product.category ? (
          <>
            <Link href={`/category/${product.category.slug}`} className="hover:text-emerald">
              {product.category.name}
            </Link>
            <span>/</span>
          </>
        ) : (
          <>
            <Link href="/category/all" className="hover:text-emerald">Shop</Link>
            <span>/</span>
          </>
        )}
        <span className="text-ink-soft truncate max-w-[200px]">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-12 items-start">
        {/* Gallery */}
        <div className="flex flex-col gap-3.5">
          <div className="relative aspect-square border border-line rounded overflow-hidden bg-paper">
            {hasSale && (
              <span className="absolute top-4 left-4 z-10 bg-emerald text-sand font-sans text-xs tracking-wide px-3 py-1.5 rounded-sm">
                {discount}% OFF
              </span>
            )}
            {gallery[activeImage] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gallery[activeImage]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[repeating-linear-gradient(135deg,#efe7d4_0_18px,#f5eede_18px_36px)] flex items-center justify-center">
                <span className="font-mono text-xs tracking-[0.2em] text-gold-muted">
                  {(product.category?.name || "GIFT").toUpperCase()}
                </span>
              </div>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`h-20 border rounded-sm overflow-hidden transition ${
                    activeImage === i ? "border-gold" : "border-line"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pt-1">
          {product.category && (
            <span className="font-sans text-[11px] tracking-[0.16em] uppercase text-gold-muted">
              {product.category.name}
            </span>
          )}
          <h1 className="font-display font-medium text-3xl md:text-[42px] leading-[1.1] text-ink mt-3 mb-3.5">
            {product.title}
          </h1>
          <div className="text-gold text-sm tracking-[2px] mb-4">
            ★★★★★{" "}
            <span className="font-sans text-xs text-muted tracking-normal">
              (4.9 · loved by our families)
            </span>
          </div>
          <div className="flex items-baseline gap-3 mb-5">
            <span className="font-display text-3xl md:text-[34px] text-emerald">
              ₹{price.toLocaleString("en-IN")}
            </span>
            {hasSale && (
              <span className="font-sans text-lg text-faded line-through">
                ₹{compareAt!.toLocaleString("en-IN")}
              </span>
            )}
          </div>
          <p className="font-sans font-light text-[15px] leading-[1.75] text-ink-body mb-6">
            {product.description}
          </p>

          {outOfStock ? (
            <div className="bg-paper border border-line rounded-sm px-4 py-3.5 mb-6 font-sans text-sm text-danger">
              Currently out of stock — check back soon, insha&apos;Allah.
            </div>
          ) : (
            stock !== null &&
            stock <= 5 && (
              <div className="bg-paper border border-gold rounded-sm px-4 py-3.5 mb-6 font-sans text-sm text-gold-dark">
                Only {stock} left in stock — order soon.
              </div>
            )
          )}

          <div className="flex gap-3.5 items-stretch mb-4">
            <div className="flex items-center border border-emerald rounded-sm">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-11 h-full text-lg text-emerald"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="font-sans text-[15px] min-w-[32px] text-center text-emerald">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-11 h-full text-lg text-emerald"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="flex-1 bg-emerald text-cream font-sans text-[13px] tracking-[0.12em] uppercase py-3.5 rounded-sm hover:bg-emerald-light transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add to Bag
            </button>
          </div>
          <button
            onClick={handleBuyNow}
            disabled={outOfStock}
            className="w-full bg-gold text-emerald font-sans text-[13px] tracking-[0.12em] uppercase py-3.5 rounded-sm hover:bg-gold-light transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Buy It Now
          </button>

          <div className="mt-6 border-t border-line pt-4.5 pt-5 flex flex-col gap-2.5 font-sans text-[13px] text-emerald-soft">
            <span>✦ Free shipping on orders over ₹{settings.freeShippingThreshold}</span>
            <span>✦ Handcrafted &amp; gift-wrapped with love</span>
            <span>✦ Ships in 2–4 business days · Worldwide delivery</span>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display font-medium text-2xl md:text-[32px] text-ink mb-6">
            You may also love
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                title={p.title}
                price={parseFloat(p.price)}
                compareAtPrice={p.compareAtPrice ? parseFloat(p.compareAtPrice) : null}
                imageUrl={p.imageUrl}
                categoryName={p.category?.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
