"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/context/CartContext";

const VISIBLE_MS = 5000;

/**
 * Slides up after "Add to Bag" so the bag is one tap away instead of a trip to
 * the header icon. Auto-hides; tapping anywhere on it goes to the cart.
 */
export function AddedToBagBar() {
  const { lastAdded, dismissLastAdded, items, total } = useCart();
  const pathname = usePathname();

  useEffect(() => {
    if (!lastAdded) return;
    const timer = setTimeout(dismissLastAdded, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [lastAdded, dismissLastAdded]);

  // Pointless (and in the way) where the bag is already on screen.
  const onCartFlow = pathname === "/cart" || pathname === "/checkout";
  if (!lastAdded || onCartFlow) return null;

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed inset-x-0 bottom-[86px] lg:bottom-6 z-[70] px-3 pointer-events-none">
      <Link
        key={lastAdded.key}
        href="/cart"
        onClick={dismissLastAdded}
        aria-live="polite"
        className="pointer-events-auto animate-slideUp mx-auto flex max-w-lg items-center gap-3 rounded-lg border border-gold/60 bg-emerald px-3 py-2.5 shadow-2xl"
      >
        {lastAdded.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lastAdded.imageUrl}
            alt=""
            className="h-11 w-11 shrink-0 rounded object-cover"
          />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-emerald-light">
            <ShoppingBag className="h-5 w-5 text-gold" strokeWidth={2} />
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.16em] text-gold">
            <Check className="h-3 w-3" strokeWidth={3} />
            Added to bag
          </span>
          <span className="mt-0.5 block truncate font-display text-[15px] leading-tight text-cream">
            {lastAdded.title}
          </span>
        </span>

        <span className="shrink-0 text-right">
          <span className="block font-sans text-xs tracking-[0.08em] text-gold underline underline-offset-4">
            View Bag
          </span>
          <span className="mt-0.5 block font-sans text-[11px] text-sand-dim">
            {count} {count === 1 ? "item" : "items"} · ₹
            {Number(total).toLocaleString("en-IN")}
          </span>
        </span>

        <button
          type="button"
          aria-label="Dismiss"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dismissLastAdded();
          }}
          className="shrink-0 rounded p-1 text-sand-dim hover:text-cream"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </Link>
    </div>
  );
}
