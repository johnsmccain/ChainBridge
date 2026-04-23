import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * When MAINTENANCE_MODE=true is set in the server environment, every request
 * (except the maintenance page itself and static assets) is redirected to
 * /maintenance so visitors see a polished status page instead of errors.
 */
export function middleware(request: NextRequest) {
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === "true";
  const { pathname } = request.nextUrl;

  if (
    isMaintenanceMode &&
    !pathname.startsWith("/maintenance") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/favicon")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/maintenance";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
