import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { NotificationItem } from "@/lib/types";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid, listWorkspaceRecords, upsertWorkspaceRecord } from "@/lib/server/pgHelpers";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const firmId = await resolveFirmUuid(auth);
    const records = await listWorkspaceRecords<NotificationItem>(
      firmId,
      "NOTIFICATION",
      auth.role === "CLIENT" ? auth.clientEntityId || null : null
    );

    let notifications = records.map((r) => r.payload);

    if (auth.role === "CLIENT") {
      notifications = notifications.filter(
        (n) =>
          (auth.clientEntityId && n.recipientEntityId === auth.clientEntityId) ||
          n.recipientRole === "ALL" ||
          (n.recipientRole === "CLIENT" && !n.recipientEntityId)
      );
    } else if (auth.role === "ARTICLE" || auth.role === "TEAM") {
      notifications = notifications.filter(
        (n) => n.recipientRole === "ALL" || n.recipientRole === "ARTICLE"
      );
    }

    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ success: false, error: "Failed to load notifications." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !["PARTNER", "ARTICLE", "TEAM"].includes(auth.role || "")) {
      return NextResponse.json(
        { success: false, error: "Firm staff authorization required to dispatch notifications." },
        { status: auth.isAuthenticated ? 403 : 401 }
      );
    }

    const firmId = await resolveFirmUuid(auth);
    const body = await req.json();

    if (body.notifications && Array.isArray(body.notifications)) {
      const created: NotificationItem[] = [];
      for (const item of body.notifications) {
        if (!item.title || !item.message) continue;
        const newNotif: NotificationItem = {
          id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          title: String(item.title).slice(0, 200),
          message: String(item.message).slice(0, 2000),
          category: item.category || "COMPLIANCE",
          priority: item.priority || "NORMAL",
          targetTab: item.targetTab || "progress",
          actionUrl: item.actionUrl || item.targetTab || "progress",
          recipientRole: item.recipientRole || "CLIENT",
          recipientEntityId: item.recipientEntityId,
          isRead: false,
          createdAt: new Date().toISOString(),
          metadata: item.metadata || {},
        };
        await upsertWorkspaceRecord({
          firmId,
          entityId: item.recipientEntityId || null,
          recordType: "NOTIFICATION",
          matchKey: "id",
          matchValue: newNotif.id,
          payload: newNotif,
        });
        created.push(newNotif);
      }
      return NextResponse.json({ success: true, count: created.length, notifications: created });
    }

    const { title, message, category, priority, targetTab, recipientRole, recipientEntityId, metadata } = body;
    if (!title || !message) {
      return NextResponse.json({ success: false, error: "Title and message are required." }, { status: 400 });
    }

    const notif: NotificationItem = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: String(title).slice(0, 200),
      message: String(message).slice(0, 2000),
      category: category || "COMPLIANCE",
      priority: priority || "NORMAL",
      targetTab: targetTab || "tasks-matrix",
      actionUrl: targetTab || "tasks-matrix",
      recipientRole: recipientRole || "ALL",
      recipientEntityId,
      isRead: false,
      createdAt: new Date().toISOString(),
      metadata,
    };

    await upsertWorkspaceRecord({
      firmId,
      entityId: recipientEntityId || null,
      recordType: "NOTIFICATION",
      matchKey: "id",
      matchValue: notif.id,
      payload: notif,
    });

    return NextResponse.json({ success: true, notification: notif });
  } catch (error: any) {
    console.error("POST /api/notifications error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }

    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();
    const body = await req.json();
    const { action, id } = body;

    if (action === "DELETE" && id) {
      if (auth.role !== "PARTNER") {
        return NextResponse.json({ success: false, error: "Only partners can delete notifications." }, { status: 403 });
      }
      await pool.query(
        `DELETE FROM public.firm_workspace_records
         WHERE firm_id = $1 AND record_type = 'NOTIFICATION' AND payload->>'id' = $2`,
        [firmId, id]
      );
      return NextResponse.json({ success: true, message: "Notification removed." });
    }

    const records = await listWorkspaceRecords<NotificationItem>(
      firmId,
      "NOTIFICATION",
      auth.role === "CLIENT" ? auth.clientEntityId || null : null
    );

    if (action === "MARK_ALL_READ") {
      for (const rec of records) {
        const n = rec.payload;
        if (auth.role === "CLIENT") {
          const belongs =
            (auth.clientEntityId && n.recipientEntityId === auth.clientEntityId) ||
            n.recipientRole === "ALL" ||
            (n.recipientRole === "CLIENT" && !n.recipientEntityId);
          if (!belongs) continue;
        }
        if (!n.isRead) {
          await upsertWorkspaceRecord({
            firmId,
            entityId: rec.entity_id,
            recordType: "NOTIFICATION",
            matchKey: "id",
            matchValue: n.id,
            payload: { ...n, isRead: true },
          });
        }
      }
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (action === "MARK_READ" && id) {
      const target = records.find((r) => r.payload?.id === id);
      if (target) {
        if (
          auth.role === "CLIENT" &&
          auth.clientEntityId &&
          target.payload.recipientEntityId &&
          target.payload.recipientEntityId !== auth.clientEntityId
        ) {
          return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
        }
        await upsertWorkspaceRecord({
          firmId,
          entityId: target.entity_id,
          recordType: "NOTIFICATION",
          matchKey: "id",
          matchValue: id,
          payload: { ...target.payload, isRead: true },
        });
      }
      return NextResponse.json({ success: true, message: "Notification marked as read." });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
