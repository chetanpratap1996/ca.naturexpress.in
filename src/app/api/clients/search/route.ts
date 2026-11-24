import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase } from "@/lib/server/db";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { ClientEntity } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim().toLowerCase();
    const typeFilter = searchParams.get("type") || "ALL";
    const partnerFilter = searchParams.get("partner") || "ALL";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));

    const db = ensureDatabase();
    let allClients: ClientEntity[] = db.clients || [];

    // Filter by query (Name, TradeName, PAN, GSTIN across all registrations, CIN, Phone, Email, ID)
    if (query) {
      allClients = allClients.filter((client) => {
        // Direct field matching
        if (
          client.name?.toLowerCase().includes(query) ||
          client.tradeName?.toLowerCase().includes(query) ||
          client.pan?.toLowerCase().includes(query) ||
          client.cin?.toLowerCase().includes(query) ||
          client.id?.toLowerCase().includes(query) ||
          client.tan?.toLowerCase().includes(query) ||
          client.primaryContact?.name?.toLowerCase().includes(query) ||
          client.primaryContact?.phone?.toLowerCase().includes(query) ||
          client.primaryContact?.email?.toLowerCase().includes(query)
        ) {
          return true;
        }

        // Primary GSTIN match
        if (client.gstin?.toLowerCase().includes(query)) {
          return true;
        }

        // Multi-GSTIN records match
        if (client.gstinRecords && client.gstinRecords.length > 0) {
          const matchInGstinRecords = client.gstinRecords.some(
            (g) =>
              g.gstin?.toLowerCase().includes(query) ||
              g.stateName?.toLowerCase().includes(query) ||
              g.stateCode?.toLowerCase().includes(query) ||
              g.tradeName?.toLowerCase().includes(query)
          );
          if (matchInGstinRecords) return true;
        }

        return false;
      });
    }

    // Filter by entity type
    if (typeFilter && typeFilter !== "ALL") {
      allClients = allClients.filter((c) => c.type === typeFilter);
    }

    // Filter by partner
    if (partnerFilter && partnerFilter !== "ALL") {
      allClients = allClients.filter(
        (c) => c.partnerInCharge?.toLowerCase() === partnerFilter.toLowerCase()
      );
    }

    const total = allClients.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedClients = allClients.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      clients: paginatedClients,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error: any) {
    console.error("Error in /api/clients/search:", error);
    return NextResponse.json(
      { success: false, error: "Internal search error", clients: [], total: 0 },
      { status: 500 }
    );
  }
}
