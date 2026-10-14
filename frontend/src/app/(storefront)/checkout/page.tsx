"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Check, ChevronDown, Lock, MapPin, Pencil } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import api from "@/lib/api";
import { inr } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { SafeImage } from "@/components/ui/safe-image";

const STEPS = ["Bag", "Details", "Payment"];

function Steps({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2 md:gap-3 mb-6 md:mb-9 font-sans text-[11px] md:text-xs tracking-[0.12em] uppercase">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-2 md:gap-3">
            <span className={`flex items-center gap-2 ${active ? "text-emerald" : done ? "text-emerald-soft" : "text-muted-2"}`}>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] ${
                  done
                    ? "bg-emerald border-emerald text-cream"
                    : active
                    ? "border-emerald text-emerald"
                    : "border-line text-muted-2"
                }`}
              >
                {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
              </span>
              {i === 0 ? <Link href="/cart" className="hover:underline underline-offset-4">{label}</Link> : label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-6 md:w-12 bg-line" />}
          </li>
        );
      })}
    </ol>
  );
}

interface AddressForm {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pin: string;
  note: string;
}

function composeAddress(f: AddressForm) {
  return [f.line1, f.line2, `${f.city}, ${f.state} — ${f.pin}`].filter((s) => s.trim()).join("\n");
}

function validate(f: AddressForm) {
  const errors: Partial<Record<keyof AddressForm, string>> = {};
  if (f.name.trim().length < 2) errors.name = "Please enter the recipient's full name.";
  if (f.line1.trim().length < 5) errors.line1 = "Add house / flat number and street.";
  if (!f.city.trim()) errors.city = "City is required.";
  if (!f.state.trim()) errors.state = "State is required.";
  if (!/^\d{6}$/.test(f.pin)) errors.pin = "Enter a 6-digit PIN code.";
  return errors;
}

export default function CheckoutPage() {
  const { user, loading: authLoading, updateUser } = useAuth();
  const { items, hydrated, total, count, checkout, clearCart } = useCart();
  const settings = useSettings();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rzpReady, setRzpReady] = useState(false);
  const [useSaved, setUseSaved] = useState(false);
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [touched, setTouched] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [form, setForm] = useState<AddressForm>({
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pin: "",
    note: "",
  });
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);

  const savedAddress: string = (user as any)?.address || "";

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({ ...prev, name: user.name === "Customer" ? "" : user.name || "" }));
    if (savedAddress) setUseSaved(true);
  }, [user, savedAddress]);

  useEffect(() => {
    if ((window as any).Razorpay) setRzpReady(true);
  }, []);

  // Validate the coupon applied in the cart
  useEffect(() => {
    const saved = localStorage.getItem("arvion_coupon");
    if (!saved || total === 0) return;
    api
      .post("/coupons/validate", { code: saved, subtotal: total })
      .then((res) => setCoupon({ code: res.data.code, discount: res.data.discount }))
      .catch(() => {
        setCoupon(null);
        localStorage.removeItem("arvion_coupon");
      });
  }, [total]);

  // If unauthenticated or no items, bounce back
  useEffect(() => {
    if (authLoading || !hydrated) return;
    if (!user) {
      router.push("/login/customer?redirect=/checkout");
    } else if (items.length === 0) {
      router.push("/cart");
    }
  }, [user, authLoading, hydrated, items, router]);

  const discount = coupon?.discount || 0;
  const freeThreshold = Number(settings.freeShippingThreshold) || 0;
  const shippingFee = Number(settings.shippingFee) || 0;
  const shipping = total - discount >= freeThreshold ? 0 : shippingFee;
  const grandTotal = Math.max(0, total - discount + shipping);

  const errors = useSaved ? (form.name.trim().length < 2 ? { name: "Please enter the recipient's full name." } : {}) : validate(form);
  const set = (key: keyof AddressForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: key === "pin" ? e.target.value.replace(/\D/g, "").slice(0, 6) : e.target.value }));

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length > 0) {
      setError("Please fix the highlighted fields.");
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    if (!rzpReady || !(window as any).Razorpay) {
      setError("Payment is still loading. Please try again in a moment.");
      return;
    }

    const address = useSaved ? savedAddress : composeAddress(form);

    try {
      setLoading(true);
      setError("");

      if (!useSaved && saveToProfile) {
        api
          .post("/auth/profile", { name: form.name, address })
          .then(() => updateUser({ name: form.name, address }))
          .catch(() => {
            /* saving the address is a convenience — never block payment on it */
          });
      }

      const shippingAddress = form.note.trim() ? `${address}\n\nGift note: ${form.note.trim()}` : address;

      const checkoutData = await checkout({
        customerName: form.name.trim(),
        shippingAddress,
        couponCode: coupon?.code,
      });

      const options = {
        key: checkoutData.key,
        amount: checkoutData.amount * 100,
        currency: checkoutData.currency,
        name: settings.storeName,
        description: `${count} ${count === 1 ? "gift" : "gifts"}`,
        order_id: checkoutData.razorpayOrderId,
        handler: async function (response: any) {
          setLoading(true);
          let pending = false;
          try {
            await api.post("/orders/verify-payment", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
          } catch {
            // Money was taken; the Razorpay webhook will still confirm the order.
            pending = true;
          }
          clearCart();
          localStorage.removeItem("arvion_coupon");
          window.location.href = `/order-success?order=${checkoutData.orderId}${pending ? "&pending=1" : ""}`;
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError("Payment was cancelled. Your bag is saved — you can try again.");
          },
        },
        prefill: {
          name: form.name,
          contact: (user as any)?.phone || "",
          email: user?.email || "",
        },
        theme: { color: "#0d3b2c" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setError(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Checkout failed. Please try again.");
      setLoading(false);
    }
  };

  if (authLoading || !user || items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl w-full px-4 md:px-7 py-8 md:py-12 flex-1">
        <Skeleton className="h-6 w-64 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          <Skeleton className="h-96" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  const fieldError = (key: keyof AddressForm) => (touched ? (errors as any)[key] : undefined);
  const inputProps = (key: keyof AddressForm) => ({
    id: key,
    value: form[key],
    onChange: set(key),
    "aria-invalid": !!fieldError(key),
    "aria-describedby": fieldError(key) ? `${key}-error` : undefined,
    className: `field ${fieldError(key) ? "border-danger focus:border-danger focus:ring-danger/20" : ""}`,
  });
  const ErrorText = ({ k }: { k: keyof AddressForm }) =>
    fieldError(k) ? (
      <p id={`${k}-error`} className="font-sans text-xs text-danger mt-1.5">
        {fieldError(k)}
      </p>
    ) : null;

  return (
    <div className="mx-auto max-w-6xl w-full px-4 md:px-7 py-6 md:py-12 flex-1">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRzpReady(true)}
        onError={() => setError("Couldn't load the payment window. Check your connection and refresh.")}
      />

      <Steps current={1} />
      <h1 className="font-display font-medium text-[38px] md:text-[52px] leading-tight text-ink mb-6 md:mb-8">Checkout</h1>

      <form onSubmit={handlePayNow} noValidate className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-10 items-start">
        <div className="flex flex-col gap-5">
          <section className="border border-line rounded-md bg-card p-5 md:p-7">
            <h2 className="font-display font-medium text-2xl text-ink mb-1">Delivery details</h2>
            <p className="font-sans text-xs text-muted mb-5">
              Order updates go to {(user as any).phone || user.email}.
            </p>

            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="name" className="field-label">Recipient name</label>
                <input type="text" autoComplete="name" placeholder="Full name" {...inputProps("name")} />
                <ErrorText k="name" />
              </div>

              {savedAddress && (
                <div className="grid gap-2.5">
                  <button
                    type="button"
                    onClick={() => setUseSaved(true)}
                    className={`text-left flex gap-3 rounded-md border px-4 py-3.5 transition ${
                      useSaved ? "border-emerald bg-paper ring-1 ring-emerald" : "border-line hover:border-gold"
                    }`}
                  >
                    <MapPin className="h-4 w-4 mt-0.5 text-gold-dark shrink-0" strokeWidth={1.75} />
                    <span className="min-w-0">
                      <span className="block font-sans text-xs tracking-[0.1em] uppercase text-emerald mb-1">Saved address</span>
                      <span className="block font-sans text-sm text-ink-body whitespace-pre-line">{savedAddress}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseSaved(false)}
                    className={`text-left flex items-center gap-3 rounded-md border px-4 py-3 transition font-sans text-sm ${
                      !useSaved ? "border-emerald bg-paper ring-1 ring-emerald text-emerald" : "border-line text-ink-soft hover:border-gold"
                    }`}
                  >
                    <Pencil className="h-4 w-4 text-gold-dark" strokeWidth={1.75} /> Deliver somewhere else
                  </button>
                </div>
              )}

              {!useSaved && (
                <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                  <div className="col-span-2">
                    <label htmlFor="line1" className="field-label">Address</label>
                    <input type="text" autoComplete="address-line1" placeholder="House / flat no., building, street" {...inputProps("line1")} />
                    <ErrorText k="line1" />
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="line2" className="field-label">
                      Landmark <span className="normal-case tracking-normal text-muted">(optional)</span>
                    </label>
                    <input type="text" autoComplete="address-line2" placeholder="Area, landmark" {...inputProps("line2")} />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label htmlFor="city" className="field-label">City</label>
                    <input type="text" autoComplete="address-level2" {...inputProps("city")} />
                    <ErrorText k="city" />
                  </div>
                  <div className="col-span-1">
                    <label htmlFor="state" className="field-label">State</label>
                    <input type="text" autoComplete="address-level1" {...inputProps("state")} />
                    <ErrorText k="state" />
                  </div>
                  <div className="col-span-1">
                    <label htmlFor="pin" className="field-label">PIN code</label>
                    <input type="text" inputMode="numeric" autoComplete="postal-code" placeholder="6 digits" {...inputProps("pin")} />
                    <ErrorText k="pin" />
                  </div>
                  <label className="col-span-2 flex items-center gap-2.5 font-sans text-sm text-ink-body cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveToProfile}
                      onChange={(e) => setSaveToProfile(e.target.checked)}
                      className="h-4 w-4 accent-emerald"
                    />
                    Save this address for next time
                  </label>
                </div>
              )}

              <div>
                <label htmlFor="note" className="field-label">
                  ✦ Gift note <span className="normal-case tracking-normal text-muted">(optional)</span>
                </label>
                <textarea
                  id="note"
                  value={form.note}
                  onChange={set("note")}
                  maxLength={200}
                  rows={2}
                  placeholder="A short message, or the name to engrave"
                  className="field resize-none"
                />
                <p className="font-sans text-[11px] text-muted mt-1 text-right tabular">{form.note.length}/200</p>
              </div>
            </div>
          </section>
        </div>

        {/* Summary + pay */}
        <aside className="border border-line rounded-md bg-paper p-5 md:p-6 lg:sticky lg:top-28" aria-label="Order summary">
          <button
            type="button"
            onClick={() => setShowItems((v) => !v)}
            className="w-full flex items-center justify-between mb-4"
            aria-expanded={showItems}
          >
            <h2 className="font-display font-medium text-2xl text-ink">
              {count} {count === 1 ? "item" : "items"}
            </h2>
            <ChevronDown className={`h-5 w-5 text-gold transition-transform lg:hidden ${showItems ? "rotate-180" : ""}`} />
          </button>
          <ul className={`flex-col gap-3 mb-5 max-h-64 overflow-y-auto ${showItems ? "flex" : "hidden lg:flex"}`}>
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-md overflow-hidden bg-card border border-line-soft flex-none">
                  {item.imageUrl ? (
                    <SafeImage src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full pattern-paper" />
                  )}
                  <span className="absolute -top-0 -right-0 min-w-[18px] h-[18px] px-1 rounded-bl-md bg-emerald text-cream font-sans text-[10px] flex items-center justify-center">
                    {item.quantity}
                  </span>
                </div>
                <p className="flex-1 min-w-0 font-display text-base text-ink leading-snug line-clamp-2">{item.title}</p>
                <span className="font-sans text-sm text-emerald tabular">{inr(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>

          <dl className="flex flex-col gap-3 font-sans text-sm text-ink-body tabular border-t border-line pt-4">
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
          {error && (
            <p role="alert" className="font-sans text-[13px] text-danger mb-4 border border-danger/30 bg-danger/5 rounded-sm px-3 py-2.5">
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-gold w-full hidden lg:flex">
            <Lock className="h-4 w-4" strokeWidth={1.75} />
            {loading ? "Opening secure payment…" : `Pay ${inr(grandTotal)}`}
          </button>
          <p className="font-sans text-[11px] text-muted text-center mt-3">
            Secured by Razorpay · UPI, cards &amp; netbanking
          </p>
        </aside>

        {/* Mobile sticky pay bar */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-nav bg-paper/95 backdrop-blur-md border-t border-line px-4 pt-3 pb-safe">
          <div className="flex items-center gap-4 pb-3">
            <div>
              <div className="font-sans text-[11px] text-muted">To pay</div>
              <div className="font-display text-2xl leading-none text-emerald tabular">{inr(grandTotal)}</div>
            </div>
            <button type="submit" disabled={loading} className="btn-gold flex-1">
              <Lock className="h-4 w-4" strokeWidth={1.75} />
              {loading ? "Opening…" : "Pay securely"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
