import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// US geo-block for Base hackathon compliance.
// Vercel Edge provides request.geo; fall back to CDN country headers.
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/blocked" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const country =
    (request as any).geo?.country ||
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    "";

  if (country.toUpperCase() === "US") {
    const url = request.nextUrl.clone();
    url.pathname = "/blocked";
    url.searchParams.set("country", country);
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
