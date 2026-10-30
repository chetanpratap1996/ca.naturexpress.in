import { NextRequest, NextResponse } from "next/server";
import { updateClientPin } from "@/lib/auth/enterpriseAuth";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { success: false, error: "Authentication required to update security PIN." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { entityId, currentPin, newPin } = body;

    if (!entityId || !currentPin || !newPin) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (entityId, currentPin, newPin)." },
        { status: 400 }
      );
    }

    // Role-based authorization check:
    // Clients can only update their own entity's PIN.
    if (auth.role === "CLIENT" && auth.clientEntityId && auth.clientEntityId !== entityId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: You may only modify PINs for your own entity." },
        { status: 403 }
      );
    }

    const result = await updateClientPin(entityId, currentPin, newPin);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to update PIN." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Security PIN updated successfully.",
    });
  } catch (err: any) {
    console.error("Auth pin API error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error while updating PIN." },
      { status: 500 }
    );
  }
}
