import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";

const BRIDGE_FILE = path.join(process.cwd(), ".data", "tax_bridge_store.json");

function readStore(): Record<string, any> {
  try {
    if (!fs.existsSync(BRIDGE_FILE)) return {};
    return JSON.parse(fs.readFileSync(BRIDGE_FILE, "utf8")) || {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, any>) {
  const dir = path.dirname(BRIDGE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(BRIDGE_FILE, JSON.stringify(store, null, 2), "utf8");
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId") || "";
    const ay = searchParams.get("ay") || "";
    if (!clientId) {
      return NextResponse.json({ success: false, error: "clientId required" }, { status: 400 });
    }
    if (auth.role === "CLIENT" && auth.clientEntityId && auth.clientEntityId !== clientId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const store = readStore();
    return NextResponse.json({
      success: true,
      payload: store[`${clientId}::${ay}`] || null,
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to read tax workspace" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || auth.role === "CLIENT") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const clientId = String(body?.clientId || "").trim();
    const ay = String(body?.assessmentYear || "").trim();
    if (!clientId) {
      return NextResponse.json({ success: false, error: "clientId required" }, { status: 400 });
    }
    const store = readStore();
    const key = `${clientId}::${ay}`;
    const updated = {
      ...(store[key] || {}),
      ...body,
      clientId,
      assessmentYear: ay,
      serverUpdatedAt: new Date().toISOString(),
      serverUpdatedBy: auth.user?.name || auth.user?.email || "Firm Staff",
    };
    store[key] = updated;
    writeStore(store);
    return NextResponse.json({ success: true, payload: updated });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to save tax workspace" }, { status: 500 });
  }
}
