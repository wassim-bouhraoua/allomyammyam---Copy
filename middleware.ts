// middleware.ts — project root
// ─────────────────────────────────────────────────────────────────────────────
// Runs on the Edge runtime before every matched request.
// Only reads + verifies the JWT cookie. No Prisma, no DB calls.
// Injects x-user-id / x-user-role / x-chef-id headers for downstream use.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";

// ── Routes that require a valid session ──────────────────────────────────────
const PROTECTED_ROUTES = ["/orders", "/cart", "/checkout", "/profile"];
const CHEF_ROUTES = ["/chef/dashboard", "/chef/dishes", "/chef/orders", "/profile/chef-orders"];
const ADMIN_ROUTES = ["/admin"];

// ── Paths middleware never touches ────────────────────────────────────────────
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};

// ── Lightweight JWT decode — no signature verification on Edge ────────────────
// Signature is verified in /api/auth/me and API routes (Node runtime, full lib).
// Here we only need the payload to make routing decisions.
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // Base64url → Base64 → decode
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(payload);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Determine locale first ────────────────────────────────────────────────
  let locale = request.cookies.get("user_locale")?.value;
  if (!locale) {
    const acceptLang = request.headers.get("accept-language") || "";
    if (acceptLang.includes("ar")) {
      locale = "ar";
    } else if (acceptLang.includes("en")) {
      locale = "en";
    } else {
      locale = "fr"; // Default to French
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-locale", locale);

  // ── Determine if route needs protection ──────────────────────────────────
  const needsAuth = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const needsChef = CHEF_ROUTES.some((r) => pathname.startsWith(r));
  const needsAdmin = ADMIN_ROUTES.some((r) => pathname.startsWith(r));

  if (!needsAuth && !needsChef && !needsAdmin) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    if (!request.cookies.has("user_locale")) {
      response.cookies.set("user_locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    }
    return response;
  }

  // ── Read cookie ───────────────────────────────────────────────────────────
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Decode payload ────────────────────────────────────────────────────────
  const payload = decodeJwtPayload(token);

  if (!payload || !payload.sub || !payload.role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Check expiry ──────────────────────────────────────────────────────────
  if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("auth_token");
    return response;
  }

  const role = payload.role as string;

  // ── Role-gated routes ─────────────────────────────────────────────────────
  if (needsChef && role !== "CHEF" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (needsAdmin && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ── Inject identity headers for Server Components and API routes ──────────
  requestHeaders.set("x-user-id", String(payload.sub));
  requestHeaders.set("x-user-role", role);
  requestHeaders.set("x-chef-id", String(payload.chefId ?? ""));

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (!request.cookies.has("user_locale")) {
    response.cookies.set("user_locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  return response;
}