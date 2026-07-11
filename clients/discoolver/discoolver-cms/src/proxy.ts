import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Skip public auth routes
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const userDataCookie = request.cookies.get("user_data");
  if (!userDataCookie?.value) {
    return NextResponse.next();
  }

  try {
    const user = JSON.parse(userDataCookie.value) as {
      recommended?: boolean;
      idRecommendeds?: number[];
    };

    if (user.recommended && user.idRecommendeds && user.idRecommendeds.length > 0) {
      const allowedPath = `/recommended/${user.idRecommendeds[0]}`;

      // Allow access only to their specific business page
      if (pathname === allowedPath) {
        return NextResponse.next();
      }

      // Redirect any other route to their business page
      return NextResponse.redirect(new URL(allowedPath, request.url));
    }
  } catch {
    // Malformed cookie — let the layout handle auth
  }

  return NextResponse.next();
}

export const config = {
  // Only match real page routes — exclude all Next.js internals, static assets and files with extensions
  matcher: ["/((?!_next|api|favicon\\.ico|.*\\..*).*)" ],
};
