import React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`rounded-sm bg-[linear-gradient(90deg,#efe7d4_0%,#f7f1e3_50%,#efe7d4_100%)] bg-[length:200%_100%] animate-shimmer ${className}`}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col bg-card border border-line rounded overflow-hidden">
      <Skeleton className="aspect-square rounded-none" />
      <div className="p-3.5 sm:p-4 flex flex-col gap-2.5">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full mt-1" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 8,
  className = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className} role="status" aria-label="Loading gifts">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
