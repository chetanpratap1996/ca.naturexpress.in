import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Refresh Supabase cookies safely
  const response = await createClient(request);

  // 2. Protect Admin Route: Only Partners with valid session allowed
  if (pathname.startsWith("/admin")) {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("auth_required", "admin");
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Protect Critical Mutation APIs: Require active authenticated session
  const isProtectedApiMutation = 
    request.method !== "GET" && 
    (
      pathname.startsWith("/api/clients") ||
      pathname.startsWith("/api/tasks") ||
      pathname.startsWith("/api/dsc") ||
      pathname.startsWith("/api/pay-to-release") ||
      pathname.startsWith("/api/invoices") ||
      pathname.startsWith("/api/portal-sync")
    );

  if (isProtectedApiMutation) {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Unauthorized: Active authenticated session token required for mutating practice data.",
          code: "MUTATION_BLOCKED_UNAUTHENTICATED"
        },
        { status: 401 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
