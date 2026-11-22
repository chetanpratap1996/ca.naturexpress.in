import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = await createClient(request);

  // 1. Protect Admin Route: Only Partners with valid session allowed
  if (pathname.startsWith("/admin")) {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("auth_required", "admin");
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Private by default for all API endpoints except public auth, consultation, & token-secured cron routes
  const isPublicApi = 
    pathname === "/api/auth/login" || 
    pathname === "/api/auth/logout" ||
    pathname === "/api/growth/consultation" ||
    pathname === "/api/notifications" ||
    pathname.startsWith("/api/cron/") ||
    pathname === "/api/growth/cron" ||
    pathname === "/api/whatsapp/webhook" ||
    pathname === "/api/gst/lookup" ||
    pathname.startsWith("/api/gst/hsn") ||
    pathname === "/api/litigation/notice-parse" ||
    pathname === "/api/litigation/predictive-risk" ||
    pathname === "/api/billing/value-statement" ||
    pathname === "/api/pay-to-release";
  if (pathname.startsWith("/api/") && !isPublicApi) {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { success: false, error: auth.error || "Authentication required.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    // Firm-exclusive administrative routes
    const partnerOnly = [
      "/api/analytics/partner-realization",
      "/api/audit/peer-review",
      "/api/audit-trail",
    ];
    if (partnerOnly.some((path) => pathname === path || pathname.startsWith(`${path}/`)) && auth.role !== "PARTNER") {
      return NextResponse.json({ success: false, error: "Administrative partner access required.", code: "FORBIDDEN" }, { status: 403 });
    }

    // Firm staff routes (Partner + Article Trainees)
    const firmStaffOnly = [
      "/api/clients",
      "/api/dsc",
      "/api/portal-sync",
      "/api/billing/receipt",
      "/api/whatsapp/parser",
    ];
    if (firmStaffOnly.some((path) => pathname === path || pathname.startsWith(`${path}/`)) && auth.role !== "PARTNER" && auth.role !== "ARTICLE") {
      return NextResponse.json({ success: false, error: "Firm staff access required.", code: "FORBIDDEN" }, { status: 403 });
    }

    // Client portal scoped permissions
    if (auth.role === "CLIENT") {
      const isAllowedClientRoute =
        pathname === "/api/session" ||
        pathname === "/api/data" ||
        (pathname === "/api/notifications" && (request.method === "GET" || request.method === "PATCH")) ||
        (pathname === "/api/tasks" && request.method === "GET") ||
        (pathname === "/api/documents" && (request.method === "GET" || request.method === "POST")) ||
        (pathname === "/api/documents/download" && request.method === "GET") ||
        (pathname === "/api/invoices" && (request.method === "GET" || request.method === "PATCH" || request.method === "POST")) ||
        (pathname === "/api/pay-to-release" && (request.method === "GET" || request.method === "POST")) ||
        (pathname === "/api/litigation/notice-parse" && request.method === "POST") ||
        (pathname === "/api/auth/pin" && request.method === "POST");

      if (!isAllowedClientRoute) {
        return NextResponse.json({ success: false, error: "Forbidden for client account.", code: "FORBIDDEN" }, { status: 403 });
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
