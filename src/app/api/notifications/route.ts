import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, createNotification } from "@/lib/server/db";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { NotificationItem } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    const db = ensureDatabase();
    let notifications: NotificationItem[] = db.notifications || [];

    // Filter by role & entity if authenticated
    if (auth.isAuthenticated) {
      if (auth.role === "CLIENT") {
        notifications = notifications.filter((n) => 
          n.recipientRole === "CLIENT" && !!auth.clientEntityId && n.recipientEntityId === auth.clientEntityId
        );
      } else if (auth.role === "ARTICLE") {
        notifications = notifications.filter((n) => 
          n.recipientRole === "ALL" || 
          n.recipientRole === "ARTICLE"
        );
      } else if (auth.role === "PARTNER") {
        notifications = notifications.filter((n) => 
          n.recipientRole === "ALL" || 
          n.recipientRole === "PARTNER"
        );
      }
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || auth.role !== "PARTNER") {
      return NextResponse.json({ success: false, error: "Partner access required." }, { status: auth.isAuthenticated ? 403 : 401 });
    }

    const body = await req.json();
    const { title, message, category, priority, targetTab, recipientRole, recipientEntityId, metadata } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, error: "Title and message are required." }, { status: 400 });
    }

    const notif = await createNotification(
      title,
      message,
      category || "SYSTEM",
      priority || "NORMAL",
      targetTab,
      recipientRole || "ALL",
      recipientEntityId,
      metadata
    );

    return NextResponse.json({ success: true, notification: notif });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
    }
    const body = await req.json();
    const { action, id } = body; // action: "MARK_READ" | "MARK_ALL_READ" | "DELETE"

    const db = ensureDatabase();
    if (!db.notifications) db.notifications = [];

    const canSee = (notification: NotificationItem) => {
      if (auth.role === "PARTNER") return true;
      if (auth.role === "ARTICLE") return notification.recipientRole === "ALL" || notification.recipientRole === "ARTICLE";
      return notification.recipientRole === "CLIENT" && !!auth.clientEntityId && notification.recipientEntityId === auth.clientEntityId;
    };

    if (action === "MARK_ALL_READ") {
      if (auth.role !== "PARTNER") return NextResponse.json({ success: false, error: "Partner access required." }, { status: 403 });
      db.notifications = db.notifications.map((n) => ({ ...n, isRead: true }));
      await saveDatabase(db);
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (action === "MARK_READ" && id) {
      const idx = db.notifications.findIndex((n) => n.id === id);
      if (idx !== -1 && !canSee(db.notifications[idx])) return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
      if (idx !== -1) {
        db.notifications[idx].isRead = true;
        await saveDatabase(db);
      }
      return NextResponse.json({ success: true, message: "Notification marked as read." });
    }

    if (action === "DELETE" && id) {
      if (auth.role !== "PARTNER") return NextResponse.json({ success: false, error: "Partner access required." }, { status: 403 });
      db.notifications = db.notifications.filter((n) => n.id !== id);
      await saveDatabase(db);
      return NextResponse.json({ success: true, message: "Notification removed." });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
