import { NextResponse, type NextRequest } from "next/server";

// BookNook's Next.js-server proxy (Next 16's replacement for middleware).
// Two jobs, both invisible to the browser:
//
// 1. API proxy — the client only ever calls same-origin /api/library/* paths
//    (see src/lib/backend.ts). Requests are rewritten here to the standalone
//    Express backend, whose URL lives solely in the backend-only
//    LIBRARY_API_URL env var: the backend's existence (its URL) is removed
//    from the client bundle entirely. Request headers — including the
//    Better Auth JWT in Authorization — plus the method and body are
//    forwarded unchanged by the rewrite.
//
// 2. Private-page gate — signed-out visitors are bounced to /login before
//    a private page renders. The Better Auth session cookie is checked on
//    the server; RequireAuth stays on the pages as the client-side second
//    layer and real-session validator.

// Server-only base URL of the Express backend (LIBRARY_API_URL in
// .env.local / the server env). Never prefixed NEXT_PUBLIC_ — it must not
// reach the browser. Trailing slashes are trimmed so joining never
// produces a double slash.
const BACKEND_URL = (process.env.LIBRARY_API_URL ?? "").replace(/\/+$/, "");

// Better Auth's session cookie (httpOnly). On HTTPS deployments the
// __Secure- prefix is applied.
const SESSION_COOKIES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

// Pages only signed-in readers may open. /books (All Books) stays public;
// /books/:title (Book Details) is private.
const PRIVATE_PAGES = new Set(["/add-book", "/my-books", "/my-borrows", "/my-profile"]);

function hasSessionCookie(request: NextRequest) {
  return SESSION_COOKIES.some((name) => request.cookies.has(name));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // --- 1. API proxy: /api/library/* -> the Express backend --------------
  if (pathname.startsWith("/api/library")) {
    // Write-protection, first line: every mutation (POST/PATCH/DELETE)
    // must carry a Better Auth session cookie. Deployment-checker bots
    // ("Prodcheck …" by Deploy Bot, "E2E Deployment Check …" by E2E Bot)
    // and AI crawlers have no session, so their junk requests are
    // answered here and never reach the backend — the bot-added-book
    // problem is cut off at the source. The backend's own JWT check on
    // write routes stays as the second layer.
    if (
      request.method !== "GET" &&
      request.method !== "HEAD" &&
      request.method !== "OPTIONS" &&
      !hasSessionCookie(request)
    ) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    if (!BACKEND_URL) {
      // No backend configured — answer with JSON so the pages' existing
      // !response.ok handling falls back to the offline/local data.
      return NextResponse.json(
        { message: "Library backend is not configured." },
        { status: 503 }
      );
    }

    // Built as a fresh URL from the backend base ("https://host" + the
    // stripped path + the query) so no part of the original request's
    // host/port can leak into the destination.
    const suffix = pathname.slice("/api/library".length) || "/";
    const target = new URL(`${BACKEND_URL}${suffix}${search}`);

    return NextResponse.rewrite(target);
  }

  // --- 2. Private pages: redirect signed-out visitors to /login ---------
  // Strip a trailing slash so "/my-books/" is treated like "/my-books".
  const path = pathname.replace(/\/+$/, "") || "/";
  const isPrivate =
    PRIVATE_PAGES.has(path) || /^\/books\/.+/.test(path);

  if (isPrivate && !hasSessionCookie(request)) {
    // Book details (reached via the cards' "View Details") gets a
    // friendlier interstitial: a "Please login first" page offering
    // Login and Register. The other private pages are navbar entries,
    // so they go straight to /login. Both carry the destination along —
    // the login page folds it into the booknook-next sessionStorage key
    // so sign-in returns the reader to the page they were headed to.
    const target = new URL(
      /^\/books\/.+/.test(path) ? "/please-login" : "/login",
      request.url
    );

    target.searchParams.set("next", `${pathname}${search}`);

    return NextResponse.redirect(target);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // The library API proxy (same-origin path the client fetches).
    "/api/library/:path*",

    // Private pages — /books/:path* also matches bare /books, which the
    // function above explicitly keeps public.
    "/books/:path*",
    "/add-book",
    "/my-books",
    "/my-borrows",
    "/my-profile",
  ],
};
