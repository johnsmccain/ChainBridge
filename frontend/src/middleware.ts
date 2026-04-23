import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from "@/lib/i18n/config";

const PUBLIC_FILE = /\.[^/]+$/;

function getLocaleSegment(pathname: string): SupportedLocale | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment && isSupportedLocale(segment)) {
    return segment;
  }
  return null;
}

function stripLocalePrefix(pathname: string, locale: SupportedLocale | null): string {
  if (!locale) return pathname;
  const stripped = pathname.replace(new RegExp(`^/${locale}`), "");
  return stripped.length > 0 ? stripped : "/";
}

/**
 * When MAINTENANCE_MODE=true is set in the server environment, every request
 * (except the maintenance page itself and static assets) is redirected to
 * /maintenance so visitors see a polished status page instead of errors.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const locale = getLocaleSegment(pathname);
  const cookieLocale = request.cookies.get("cb-locale")?.value;
  const effectiveLocale =
    locale ?? (cookieLocale && isSupportedLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE);

  const pathnameWithoutLocale = stripLocalePrefix(pathname, locale);

  const isMaintenanceMode = process.env.MAINTENANCE_MODE === "true";

  if (isMaintenanceMode && !pathnameWithoutLocale.startsWith("/maintenance")) {
    const url = request.nextUrl.clone();
    url.pathname = `/${effectiveLocale}/maintenance`;
    return NextResponse.redirect(url);
  }

  if (!locale) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname =
      pathname === "/" ? `/${effectiveLocale}` : `/${effectiveLocale}${pathname}`;
    return NextResponse.redirect(redirectUrl);
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = pathnameWithoutLocale;

  const response = NextResponse.rewrite(rewriteUrl);
  response.cookies.set("cb-locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|api).*)"],
};
