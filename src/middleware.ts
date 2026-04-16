// src/middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

const ADMIN_ROUTES = ["/admin"];
const CUSTOMER_ROUTES = ["/dashboard", "/profile", "/my-bookings"];
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const path = nextUrl.pathname;
  const isLoggedIn = !!session;
  const userRole = session?.user?.role;

  // Block admin routes for non-admins
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|icons).*)"],
};
