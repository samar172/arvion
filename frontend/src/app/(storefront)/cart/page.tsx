"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Info, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import api from "@/lib/api";
import { availableStock, inr, parseGallery } from "@/lib/format";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { EmptyState } from "@/components/ui/empty-state";
import { FreeShippingMeter } from "@/components/cart/free-shipping-meter";
import { SafeImage } from "@/components/ui/safe-image";

export default function CartPage() {
  const { items, hydrated, removeFromCart, updateQuantity, syncItems, total, count } = useCart();
  const { user } = useAuth();
  const settings = useSettings();
  const router = useRouter();

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [applying, setApplying] = useState(false);
  const [notices, setNotices] = useState<string[]>([]);

  // Prices and stock in localStorage can be days old — refresh each line from the catalog.
  useEffect(() => {
    if (!hydrated || items.length === 0) return;
    let alive = true;
    Promise.all(
      items.map((item) =>
        api
          .get(`/catalog/${item.productId}`)
          .then((res) => ({ item, product: res.data }))
          .catch((err) => ({ item, product: err.response?.status === 404 ? null : undefined }))
      )
    ).then((results) => {
      if (!alive) return;
      const updates: Record<string, any> = {};
      const messages: string[] = [];
      for (const { item, product } of results) {
        if (product === undefined) continue; // network error — keep the line as-is
        if (product === null || product.isActive === false) {
          updates[item.productId] = null;
          messages.push(`${item.title} is no longer available and was removed.`);
          continue;
        }
        const price = parseFloat(product.price);
        const stock = availableStock(product);
        if (stock !== null && stock <= 0) {
          messages.push(`${product.title} just sold out and was removed.`);
        } else if (stock !== null && item.quantity > stock) {
          messages.push(`Only ${stock} of ${product.title} left — quantity updated.`);
        } else if (price !== item.price) {
          messages.push(`The price of ${product.title} changed to ${inr(price)}.`);
        }
        updates[item.productId] = {
          title: product.title,
          price,
          imageUrl: parseGallery(product)[0] || item.imageUrl,
          maxQuantity: stock,
        };
      }
      syncItems(updates);
      setNotices(messages);
    });
    return () => {
      alive = false;
    };
    // Once the bag is loaded — re-running on every quantity change would spam the API.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Restore a previously applied coupon
  useEffect(() => {
    const saved = localStorage.getItem("arvion_coupon");
    if (saved) setCouponInput(saved);
  }, []);

  // Re-validate whenever the cart total changes
  useEffect(() => {
    if (!coupon) return;
    if (items.length === 0) {
      setCoupon(null);
      return;
    }
    api
      .post("/coupons/validate", { code: coupon.code, subtotal: total })
      .then((res) => setCoupon({ code: res.data.code, discount: res.data.discount }))
      .catch((err) => {
        setCoupon(null);
        setCouponError(err.response?.data?.message || "Coupon no longer valid");
        localStorage.removeItem("arvion_coupon");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const applyCoupon = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setApplying(true);
    setCouponError("");
    try {
      const res = await api.post("/coupons/validate", { code, subtotal: total });
      setCoupon({ code: res.data.code, discount: res.data.discount });
      localStorage.setItem("arvion_coupon", res.data.code);
    } catch (err: any) {
      setCoupon(null);
      setCouponError(err.response?.data?.message || "Invalid coupon code");
      localStorage.removeItem("arvion_coupon");
    } finally {
      setApplying(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput("");
    setCouponError("");
    localStorage.removeItem("arvion_coupon");
  };

  const discount = coupon?.discount || 0;
  const freeThreshold = Number(settings.freeShippingThreshold) || 0;
  const shippingFee = Number(settings.shippingFee) || 0;
  const shipping = total - discount >= freeThreshold || items.length === 0 ? 0 : shippingFee;
  const grandTotal = Math.max(0, total - discount + shipping);

  const handleCheckout = () => {
    router.push(user ? "/checkout" : "/login/customer?redirect=/checkout");
  };

  if (!hydrated) {
    return <div className="mx-auto max-w-6xl w-full px-4 md:px-7 py-6 md:py-12 flex-1" />;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl w-full px-4 md:px-7 py-8 md:py-14 flex-1">
        <h1 className="font-display font-medium text-[38px] md:text-[52px] text-ink mb-6">Your bag</h1>
        {notices.length > 0 && <Notices notices={notices} onDismiss={() => setNotices([])} />}
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" strokeWidth={1.5} />}
          title="Your bag is empty"
          body="Discover thoughtful gifts curated with love."
          actionLabel="Start shopping"
          actionHref="/category/all"
        >
          <Link href="/wishlist" className="block mt-4 font-sans text-sm text-emerald underline underline-offset-4">
            View your wishlist
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl w-full px-4 md:px-7 py-6 md:py-12 flex-1">
      <div className="flex items-baseline justify-between gap-4 mb-5 md:mb-8">
        <h1 className="font-display font-medium text-[38px] md:text-[52px] text-ink">
          Your bag <span className="font-sans text-base text-muted align-middle">({count})</span>
        </h1>
        <Link href="/category/all" className="link-underline hidden sm:inline-flex">
          Continue shopping
        </Link>
      </div>

      {notices.length > 0 && <Notices notices={notices} onDismiss={() => setNotices([])} />}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-10 items-start">
        <div className="flex flex-col gap-4">
          <FreeShippingMeter subtotal={total - discount} />

          <ul className="border border-line rounded-md overflow-hidden bg-card divide-y divide-line-soft">
            {items.map((item) => (
              <li key={item.productId} className="flex gap-3.5 md:gap-5 p-3.5 md:p-5 animate-fadeIn">
                <Link
                  href={`/products/${item.productId}`}
                  className="w-24 h-24 md:w-28 md:h-28 flex-none rounded-md overflow-hidden bg-paper border border-line-soft"
                >
                  {item.imageUrl ? (
                    <SafeImage src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full pattern-paper" />
                  )}
                </Link>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/products/${item.productId}`}
                      className="font-display text-lg md:text-[22px] text-ink leading-snug line-clamp-2 hover:text-emerald transition-colors"
                    >
                      {item.title}
                    </Link>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      aria-label={`Remove ${item.title}`}
                      className="-mr-1 -mt-1 p-2 rounded-full text-muted hover:text-danger hover:bg-paper transition shrink-0"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>
                  <div className="font-sans text-[13px] text-muted mt-0.5 tabular">{inr(item.price)} each</div>
                  {item.maxQuantity != null && item.maxQuantity <= 5 && (
                    <div className="font-sans text-[11px] text-gold-dark mt-0.5">Only {item.maxQuantity} left</div>
                  )}
                  <div className="mt-auto pt-3 flex items-center justify-between gap-3">
                    <QuantityStepper
                      value={item.quantity}
                      onChange={(q) => updateQuantity(item.productId, q)}
                      max={item.maxQuantity}
                      size="sm"
                    />
                    <div className="font-sans text-base font-medium text-emerald tabular">
                      {inr(item.price * item.quantity)}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Summary */}
        <aside className="border border-line rounded-md bg-paper p-5 md:p-6 lg:sticky lg:top-28" aria-label="Order summary">
          <h2 className="font-display font-medium text-2xl text-ink mb-5">Order summary</h2>

          {/* Coupon */}
          <div className="mb-5">
            {coupon ? (
              <div className="flex items-center justify-between bg-card border border-gold rounded-sm px-3.5 py-2.5 animate-fadeIn">
                <span className="flex items-center gap-2 font-sans text-sm text-emerald">
                  <Tag className="h-4 w-4 text-gold-dark" strokeWidth={1.75} />
                  <span className="font-medium">{coupon.code}</span> applied
                </span>
                <button onClick={removeCoupon} aria-label="Remove coupon" className="p-1 text-muted hover:text-danger">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={applyCoupon} className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value.toUpperCase());
                    setCouponError("");
                  }}
                  placeholder="Coupon code"
                  aria-label="Coupon code"
                  aria-invalid={!!couponError}
                  className="field flex-1 min-w-0 uppercase py-2.5"
                />
                <button type="submit" disabled={applying || !couponInput.trim()} className="btn-primary px-5 py-2.5">
                  {applying ? "…" : "Apply"}
                </button>
              </form>
            )}
            {couponError && <p className="font-sans text-xs text-danger mt-2" role="alert">{couponError}</p>}
          </div>

          <dl className="flex flex-col gap-3 font-sans text-sm text-ink-body tabular">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{inr(total)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald">
                <dt>Discount ({coupon?.code})</dt>
                <dd>−{inr(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Shipping</dt>
              <dd>{shipping === 0 ? <span className="text-emerald">Free</span> : inr(shipping)}</dd>
            </div>
          </dl>
          <div className="border-t border-line my-4" />
          <div className="flex justify-between font-display text-[26px] text-emerald mb-5 tabular">
            <span>Total</span>
            <span>{inr(grandTotal)}</span>
          </div>
          <button onClick={handleCheckout} className="btn-primary w-full hidden lg:flex group">
            {user ? "Checkout" : "Sign in to checkout"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <p className="font-sans text-[11px] text-muted text-center mt-3">
            Secure payment by Razorpay · UPI, cards &amp; netbanking
          </p>
        </aside>
      </div>

      {/* Mobile sticky checkout */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-nav bg-paper/95 backdrop-blur-md border-t border-line px-4 pt-3 pb-safe">
        <div className="flex items-center gap-4 pb-3">
          <div>
            <div className="font-sans text-[11px] text-muted">Total · {count} {count === 1 ? "item" : "items"}</div>
            <div className="font-display text-2xl leading-none text-emerald tabular">{inr(grandTotal)}</div>
          </div>
          <button onClick={handleCheckout} className="btn-primary flex-1">
            {user ? "Checkout" : "Sign in to checkout"} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Notices({ notices, onDismiss }: { notices: string[]; onDismiss: () => void }) {
  return (
    <div role="status" className="mb-5 flex gap-3 rounded-md border border-gold/60 bg-[#f8f2e2] px-4 py-3 animate-fadeIn">
      <Info className="h-4 w-4 mt-0.5 text-gold-dark shrink-0" strokeWidth={1.75} />
      <ul className="flex-1 font-sans text-[13px] text-ink-body flex flex-col gap-1">
        {notices.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      <button onClick={onDismiss} aria-label="Dismiss" className="p-1 -m-1 text-muted hover:text-ink h-fit">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
