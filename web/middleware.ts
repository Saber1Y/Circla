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

  const blocked = country.toUpperCase() === "US";
  const url = request.nextUrl.clone();
  if (blocked) {
    url.pathname = "/blocked";
    url.searchParams.set("country", country);
  }

  // Coinbase Smart Wallet opens a popup and talks back via window.opener.
  // Telegram's embedded WebView wraps the app in a cross-origin frame, so
  // without same-origin-allow-popups the popup cannot reach its opener and
  // connect fails. Applies to both the plain response and the US rewrite.
  const res = blocked
    ? NextResponse.rewrite(url)
    : NextResponse.next();
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
