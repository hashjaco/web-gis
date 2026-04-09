import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/embed(.*)",
  "/privacy",
  "/terms",
  "/pricing",
  "/api/webhooks(.*)",
  "/api/embed(.*)",
]);

const isAuthRequiredRoute = createRouteMatcher([
  "/api/projects(.*)",
  "/api/features(.*)",
  "/api/layers(.*)",
  "/api/uploads(.*)",
  "/api/export(.*)",
  "/api/analysis(.*)",
  "/api/admin(.*)",
  "/api/user(.*)",
]);

const isGuestAllowedApi = createRouteMatcher([
  "/api/geocode(.*)",
  "/api/route(.*)",
]);

const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
);

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.size === 0) return true;
  return ALLOWED_ORIGINS.has(origin);
}

function addCorsHeaders(response: NextResponse, origin: string | null) {
  if (origin && isOriginAllowed(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.headers.set("Access-Control-Max-Age", "86400");
}

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    const preflight = new NextResponse(null, { status: 204 });
    addCorsHeaders(preflight, origin);
    return preflight;
  }

  if (isPublicRoute(request) || isGuestAllowedApi(request)) {
    // Always allow: public pages, geocode, routing (rate-limited in handlers)
  } else if (isAuthRequiredRoute(request)) {
    const isProjectGet =
      request.method === "GET" && /^\/api\/projects/.test(request.nextUrl.pathname);
    if (!isProjectGet) {
      await auth.protect();
    }
  }
  // Dashboard pages (GET) are accessible to guests — no auth.protect()

  const response = NextResponse.next();
  addCorsHeaders(response, origin);
  return response;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
