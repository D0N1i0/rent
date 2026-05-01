// src/middleware.ts
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const CUSTOMER_ROUTES = ["/dashboard", "/profile", "/my-bookings"];
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const path = nextUrl.pathname;
  const isLoggedIn = !!session;
  const userRole = session?.user?.role;

  // ── API admin backstop ─────────────────────────────────────────────────────
  // Returns JSON 401/403 for unauthenticated/unauthorized API calls to /api/admin/*.
  // Per-route checks inside each handler are the primary enforcement; this is a
  // defense-in-depth layer that catches any future route that accidentally skips
  // its own auth check. Stripe webhooks (/api/webhooks) and public APIs
  // (/api/bookings, /api/cars, /api/contact, /api/auth) are excluded from this
  // matcher and are not affected.
  if (path.startsWith("/api/admin")) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (userRole !== "ADMIN" && userRole !== "STAFF") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Block admin UI routes for non-admins
  if (path.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login?callbackUrl=/admin/dashboard", req.url));
    }
    if (userRole !== "ADMIN" && userRole !== "STAFF") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Protect customer routes
  if (CUSTOMER_ROUTES.some(r => path.startsWith(r))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${path}`, req.url));
    }
  }

  // Redirect logged-in users away from auth pages
  if (AUTH_ROUTES.some(r => path.startsWith(r)) && isLoggedIn) {
    const callbackUrl = nextUrl.searchParams.get("callbackUrl");
    // Only redirect to relative paths on the same origin — never to external URLs
    if (callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")) {
      return NextResponse.redirect(new URL(callbackUrl, req.url));
    }
    if (userRole === "ADMIN" || userRole === "STAFF") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Page routes: exclude static assets
    "/((?!api|_next/static|_next/image|favicon.ico|images|icons).*)",
    // API admin backstop: run middleware on /api/admin/* only.
    // Public APIs (/api/bookings, /api/auth, /api/webhooks, etc.) are excluded
    // and continue to rely on per-route auth checks.
    "/api/admin/:path*",
  ],
};
