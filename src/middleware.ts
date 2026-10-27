import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // Local preview data is intentionally available only to the development server.
  // Production builds always require a Supabase session and a verified firm profile.
  if (process.env.NODE_ENV !== "production") return NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const isApiRequest = request.nextUrl.pathname.startsWith("/api/");

  if (!supabaseUrl || !supabaseKey) {
    return isApiRequest
      ? NextResponse.json({ success: false, error: "Authentication service is not configured." }, { status: 503 })
      : NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  if (!isApiRequest) return response;

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id,firm_id,role,is_active,full_name")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ success: false, error: "Workspace access could not be verified." }, { status: 503 });
  }
  if (!profile || !profile.is_active || !profile.firm_id) {
    return NextResponse.json({ success: false, error: "This account is not active in a firm workspace." }, { status: 403 });
  }

  const { data: firm, error: firmError } = await supabase
    .from("firms")
    .select("firm_name,frn")
    .eq("id", profile.firm_id)
    .maybeSingle();

  if (firmError) {
    return NextResponse.json({ success: false, error: "Workspace access could not be verified." }, { status: 503 });
  }
  if (!firm) {
    return NextResponse.json({ success: false, error: "This workspace is not enabled for this deployment." }, { status: 403 });
  }

  const path = request.nextUrl.pathname;
  const isClientPortalRoute = path === "/api/client-portal" || path.startsWith("/api/client-portal/");
  const isStaffPortalRoute = path === "/api/staff-portal" || path.startsWith("/api/staff-portal/");
  const isStaffTaskUpdateRoute = path.startsWith("/api/staff-portal/tasks/");
  const isStaffDocumentUploadRoute = path === "/api/staff-portal/documents";
  const isClient = ["CLIENT_PROMOTER", "CLIENT_ACCOUNTANT"].includes(profile.role);
  const isStaff = ["PAID_CA_MANAGER", "ARTICLE_TRAINEE"].includes(profile.role);
  const method = request.method.toUpperCase();
  // Client portal routes use normalized tables protected by entity-level RLS.
  // The legacy JSON-backed routes remain unavailable to client accounts.
  if (isClient && !isClientPortalRoute) {
    return NextResponse.json({ success: false, error: "Client workspace access is limited to its securely scoped portal." }, { status: 403 });
  }

  if (isStaff && !isStaffPortalRoute) {
    return NextResponse.json({ success: false, error: "Staff access is limited to explicitly assigned client entities." }, { status: 403 });
  }
  if (isStaff && method !== "GET" && !(isStaffTaskUpdateRoute && method === "PATCH") && !(isStaffDocumentUploadRoute && method === "POST")) {
    return NextResponse.json({ success: false, error: "This staff workflow is not enabled for this request." }, { status: 403 });
  }

  if (!isClient && !isStaff && !["SUPER_ADMIN", "PARTNER"].includes(profile.role)) {
    return NextResponse.json({ success: false, error: "This account does not have API access." }, { status: 403 });
  }

  const isPartner = ["SUPER_ADMIN", "PARTNER"].includes(profile.role);
  const isWrite = !["GET", "HEAD", "OPTIONS"].includes(method);
  if (isWrite) {
    const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL;
    let expectedOrigin = request.nextUrl.origin;
    try {
      if (configuredOrigin) expectedOrigin = new URL(configuredOrigin).origin;
    } catch {
      return NextResponse.json({ success: false, error: "The application origin is not configured correctly." }, { status: 503 });
    }
    if (request.headers.get("origin") !== expectedOrigin) {
      return NextResponse.json({ success: false, error: "Request origin could not be verified." }, { status: 403 });
    }
  }
  const partnerOnlyPaths = [
    "/api/data",
    "/api/data/export",
    "/api/analytics/partner-realization",
    "/api/audit/peer-review",
    "/api/clients",
    "/api/client-access",
    "/api/staff-access",
    "/api/documents",
    "/api/audit-trail",
    "/api/pay-to-release",
    "/api/invoices",
    "/api/notices",
    "/api/pilot-scorecard",
  ];

  if (!isPartner && partnerOnlyPaths.includes(path)) {
    return NextResponse.json({ success: false, error: "Partner authorization is required for this action." }, { status: 403 });
  }

  // These handlers currently simulate filing, payment confirmation, audit
  // sign-off, and bank-PDF decryption. Keep their write operations disabled
  // until they are replaced with verified integrations and scoped storage.
  if (isWrite && ["/api/portal-sync", "/api/pay-to-release", "/api/audit/peer-review", "/api/whatsapp/parser", "/api/audit-trail"].includes(path)) {
    return NextResponse.json({ success: false, error: "This workflow is unavailable until its verified production integration is configured." }, { status: 503 });
  }

  if (!isPartner && !isClientPortalRoute && !isStaffPortalRoute && isWrite && !["/api/documents", "/api/dsc"].includes(path)) {
    return NextResponse.json({ success: false, error: "Partner authorization is required for this action." }, { status: 403 });
  }

  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set("x-workspace-firm-id", profile.firm_id);
  forwardedHeaders.set("x-workspace-user-id", profile.id);
  forwardedHeaders.set("x-workspace-user-name", profile.full_name || "Firm user");
  forwardedHeaders.set("x-workspace-user-role", profile.role);
  forwardedHeaders.set("x-workspace-firm-name", firm.firm_name);
  forwardedHeaders.set("x-workspace-firm-frn", firm.frn);
  const authorizedResponse = NextResponse.next({ request: { headers: forwardedHeaders } });
  if (isApiRequest) {
    authorizedResponse.headers.set("Cache-Control", "private, no-store, max-age=0");
    authorizedResponse.headers.set("Pragma", "no-cache");
  }
  response.cookies.getAll().forEach((cookie) => authorizedResponse.cookies.set(cookie));
  return authorizedResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - icon.svg (app icon)
     * - images, png, jpg, etc.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
