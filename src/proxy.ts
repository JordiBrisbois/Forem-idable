import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_EXACT = ["/", "/about", "/privacy", "/favicon.ico", "/sitemap.xml", "/robots.txt"];
const PUBLIC_PREFIXES = [
  "/api/auth/",
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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths without auth check
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie presence (actual validation happens in API routes)
  const sessionCookie = request.cookies.get("forem_idable_session");
  if (!sessionCookie?.value) {
    // For API routes, return 403
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // For pages, redirect to home
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
