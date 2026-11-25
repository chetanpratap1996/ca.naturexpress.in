import { NextRequest, NextResponse } from "next/server";
import { updateClientPin } from "@/lib/auth/enterpriseAuth";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !auth.firmId) {
      return NextResponse.json(
        { success: false, error: "Authentication required to update security PIN." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const entityId = typeof body.entityId === "string" ? body.entityId.trim() : "";
    const currentPin = typeof body.currentPin === "string" ? body.currentPin.trim() : "";
    const newPin = typeof body.newPin === "string" ? body.newPin.trim() : "";

    if (!entityId || !newPin) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (entityId, newPin)." },
        { status: 400 }
      );
    }

    const isPartner = auth.role === "PARTNER";
    if (!isPartner && auth.role !== "CLIENT") {
      return NextResponse.json(
        { success: false, error: "Only the client entity or a firm partner can update a client PIN." },
        { status: 403 }
      );
    }

    if (auth.role === "CLIENT") {
      if (!auth.clientEntityId || auth.clientEntityId !== entityId) {
        return NextResponse.json(
          { success: false, error: "Unauthorized: You may only modify PINs for your own entity." },
          { status: 403 }
        );
      }
      if (!currentPin) {
        return NextResponse.json(
          { success: false, error: "Current PIN is required." },
          { status: 400 }
        );
      }
    }

    const result = await updateClientPin(
      entityId,
      auth.firmId,
      currentPin,
      newPin,
      isPartner && !currentPin
    );

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
