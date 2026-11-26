import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = await createClient(request);

  // 1. Protect Admin Route: Only authenticated firm Partners allowed
  if (pathname.startsWith("/admin")) {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("auth_required", "admin");
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Private by default for all API endpoints except explicit public endpoints
  const isPublicApi =
    pathname === "/api/health" ||
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/logout" ||
    (pathname === "/api/growth/consultation" && request.method === "POST") ||
    pathname.startsWith("/api/cron/") ||
    pathname.startsWith("/api/entity/") ||
    pathname === "/api/growth/cron" ||
    pathname === "/api/whatsapp/webhook";

  if (pathname.startsWith("/api/") && !isPublicApi) {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { success: false, error: auth.error || "Authentication required.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    // Partner-exclusive administrative routes
    const partnerOnly = [
      "/api/analytics/partner-realization",
      "/api/audit/peer-review",
      "/api/audit-trail",
      "/api/staff",
    ];
    if (
      partnerOnly.some((path) => pathname === path || pathname.startsWith(`${path}/`)) &&
      !(pathname === "/api/staff" && request.method === "GET" && (auth.role === "ARTICLE" || auth.role === "TEAM")) &&
      auth.role !== "PARTNER"
    ) {
      return NextResponse.json(
        { success: false, error: "Administrative partner access required.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Firm staff routes (Partner + Article Trainees + Team Members)
    const firmStaffOnly = [
      "/api/clients",
      "/api/dsc",
      "/api/credentials",
      "/api/portal-sync",
      "/api/billing/receipt",
      "/api/billing/agreements",
      "/api/billing/msme-recovery",
      "/api/billing/reconcile-bank",
      "/api/billing/imprest",
      "/api/whatsapp/parser",
      "/api/growth",
      "/api/gst",
      "/api/itr",
      "/api/tax-audit",
      "/api/tds",
      "/api/mca",
      "/api/schedule3",
      "/api/ais",
      "/api/parsers",
      "/api/migration",
      "/api/governance",
      "/api/vcfo",
      "/api/firm-autopilot",
      "/api/practice",
      "/api/telemetry",
      "/api/benchmark",
    ];
    if (
      firmStaffOnly.some((path) => pathname === path || pathname.startsWith(`${path}/`)) &&
      auth.role !== "PARTNER" &&
      auth.role !== "ARTICLE" &&
      auth.role !== "TEAM"
    ) {
      return NextResponse.json(
        { success: false, error: "Firm staff access required.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Client portal scoped permissions (strict allowlist)
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
        (pathname === "/api/billing/value-statement" && request.method === "GET") ||
        (pathname === "/api/auth/pin" && request.method === "POST");

      if (!isAllowedClientRoute) {
        return NextResponse.json(
          { success: false, error: "Forbidden for client account.", code: "FORBIDDEN" },
          { status: 403 }
        );
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
