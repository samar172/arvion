"use client";

import { useEffect, useState } from "react";
import api, { apiError } from "@/lib/api";
import { inr, dateTime, statusVariant } from "@/lib/format";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export function OrderSheet({
  orderId,
  onOpenChange,
}: {
  orderId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      return;
    }
    setLoading(true);
    api
      .get(`/orders/${orderId}`)
      .then((res) => setOrder(res.data))
      .catch((err) => toast.error(apiError(err, "Could not load order")))
      .finally(() => setLoading(false));
  }, [orderId]);

  const subtotal = order?.subtotalAmount ? Number(order.subtotalAmount) : null;
  const discount = order?.discountAmount ? Number(order.discountAmount) : 0;
  const total = order ? Number(order.totalAmount) : 0;
  const shipping =
    subtotal !== null ? Math.max(0, total - (subtotal - discount)) : null;

  return (
    <Sheet open={!!orderId} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">
            {order ? `#${order.id.slice(0, 8).toUpperCase()}` : "Order"}
          </SheetTitle>
        </SheetHeader>

        {loading || !order ? (
          <div className="mt-6 flex flex-col gap-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <Badge variant={statusVariant(order.status)}>
                {order.status.toLowerCase()}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {dateTime(order.createdAt)}
              </span>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Customer
              </h4>
              <p className="font-medium">
                {order.customerName || order.user?.name || "Guest"}
              </p>
              {order.user?.email && (
                <p className="text-sm text-muted-foreground">{order.user.email}</p>
              )}
              {(order.customerPhone || order.user?.phone) && (
                <p className="text-sm text-muted-foreground">
                  {order.customerPhone || order.user?.phone}
                </p>
              )}
            </div>

            {order.shippingAddress && (
              <div>
                <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Shipping to
                </h4>
                <p className="text-sm whitespace-pre-line leading-relaxed">
                  {order.shippingAddress}
                </p>
              </div>
            )}

            <Separator />

            <div>
              <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                Items
              </h4>
              <div className="flex flex-col gap-3">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-md overflow-hidden bg-muted border flex-none">
                      {item.product?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.product.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.product?.title || "Item"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {inr(item.price)}
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      {inr(Number(item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-1.5 text-sm">
              {subtotal !== null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{inr(subtotal)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
                  <span>−{inr(discount)}</span>
                </div>
              )}
              {shipping !== null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? "Free" : inr(shipping)}</span>
                </div>
              )}
              <div className="flex justify-between font-display text-xl pt-2">
                <span>Total</span>
                <span>{inr(total)}</span>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
