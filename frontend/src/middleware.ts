import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side guard for the /admin area. This runs at the edge BEFORE any admin
 * page renders, so non-admins are redirected without ever downloading admin UI
 * or seeing a flash of content.
 *
 * This is defense-in-depth / UX only — the authoritative check is the backend
 * RolesGuard on every /analytics, /inventory, /orders and /catalog admin route.
 * We decode (not cryptographically verify) the JWT payload here just to read the
 * role and expiry; a forged token would still be rejected by the API.
 */

function decodeJwtPayload(token: string): { role?: string; exp?: number } | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(normalized);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get("arvion_token")?.value;
  const loginUrl = new URL("/login", req.url);

  if (!token) {
    return NextResponse.redirect(loginUrl);
  }

  const payload = decodeJwtPayload(token);
  const isExpired = payload?.exp ? payload.exp * 1000 < Date.now() : true;

  if (!payload || isExpired || payload.role !== "ADMIN") {
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
