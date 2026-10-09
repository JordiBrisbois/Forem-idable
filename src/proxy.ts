import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { runtimeConfig } from "@/config/runtime";

const PUBLIC_EXACT = [
  "/",
  "/about",
  "/privacy",
  "/applications",
  "/setup",
  "/favicon.ico",
  "/sitemap.xml",
  "/robots.txt",
];
const PUBLIC_PREFIXES = [
  "/api/auth/",
  "/api/setup",
  "/api/locations",
  "/api/offers",
  "/api/providers",
  "/api/featured-searches",
  "/api/calendar/subscriptions",
  "/api/pdf",
  "/api/external",
  "/_next",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((path) => pathname.startsWith(path));
}

const JOB_MODULE_PREFIXES = [
  "/api/search-history",
  "/api/offers",
  "/api/pdf",
  "/api/providers",
  "/api/locations",
  "/api/featured-searches",
  "/api/scout",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const next = () => NextResponse.next({ request: { headers: requestHeaders } });

  if (
    !runtimeConfig.features.jobSearch &&
    JOB_MODULE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.json(
      { error: "Module de recherche d'offres désactivé." },
      { status: 404 }
    );
  }

  if (!runtimeConfig.features.jobSearch && pathname === "/scout") {
    return NextResponse.redirect(new URL("/applications", request.url));
  }

  // Allow public paths without auth check
  if (isPublicPath(pathname)) {
    return next();
  }

  // Check for session cookie presence (actual validation happens in API routes)
  const sessionCookie = request.cookies.get(runtimeConfig.app.sessionCookieName);
  if (!sessionCookie?.value) {
    // For API routes, return 403
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // For pages, redirect to home
    return NextResponse.redirect(new URL("/", request.url));
  }

  return next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
