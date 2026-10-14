import React from "react";
import Link from "next/link";

export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  actionHref,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  actionLabel?: string;
  actionHref?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="text-center py-14 md:py-20 px-5 border border-line rounded bg-card">
      {icon && (
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-paper border border-line text-gold-dark">
          {icon}
        </div>
      )}
      <p className="font-display text-2xl md:text-[28px] text-ink-soft mb-2">{title}</p>
      {body && <p className="font-sans text-sm text-muted mb-6 max-w-sm mx-auto">{body}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary px-8">
          {actionLabel}
        </Link>
      )}
      {children}
    </div>
  );
}
