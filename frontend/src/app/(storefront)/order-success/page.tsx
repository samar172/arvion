import React from "react";
import Link from "next/link";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";

export default function OrderSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const orderId = searchParams.order;

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 flex-1 w-full text-center flex flex-col items-center space-y-6">
      <span className="grid h-24 w-24 place-items-center rounded-full bg-emerald-50 text-emerald-500 ring-1 ring-emerald-100">
        <CheckCircle2 className="h-12 w-12" strokeWidth={1.75} />
      </span>

      <div className="space-y-2">
        <h1 className="text-3xl font-display font-bold text-gray-900">Payment Confirmed</h1>
        <p className="text-gray-500">
          Thank you for your order — your attars are being prepared with care.
        </p>
      </div>

      {orderId && (
        <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm">
          <Package className="h-4 w-4 text-amber-500" strokeWidth={2.25} />
          <span className="text-gray-500">Order ID</span>
          <span className="font-mono font-bold text-gray-800">{orderId}</span>
        </div>
      )}

      <p className="max-w-md text-sm text-gray-500">
        A confirmation has been recorded against your account. Our team will begin
        processing your order shortly.
      </p>

      <div className="pt-2">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-emerald px-6 py-3 font-bold text-white transition hover:bg-emerald-800"
        >
          Continue Shopping
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}
