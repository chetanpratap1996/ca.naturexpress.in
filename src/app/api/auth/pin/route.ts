import { NextRequest, NextResponse } from "next/server";
import { updateClientPin } from "@/lib/auth/enterpriseAuth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { entityId, currentPin, newPin } = body;

    if (!entityId || !currentPin || !newPin) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (entityId, currentPin, newPin)." },
        { status: 400 }
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
