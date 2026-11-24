import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, createNotification } from "@/lib/server/db";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { NotificationItem } from "@/lib/types";

// Standard Practice Default Notifications (Clean, verified statutory alerts for registered firm clients)
const STANDARD_PARTNER_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-gstr1-pratwi",
    recipientRole: "PARTNER",
    title: "Statutory Deadline: GSTR-1 Monthly Outward Supplies",
    message: "Pratwi Solutions Private Limited (GSTIN: 09AANCP9915B1Z4) GSTR-1 return filing scheduled. Sales register mapped under Rule 59(6) compliance protocol.",
    category: "COMPLIANCE",
    priority: "HIGH",
    targetTab: "gst-filing",
    actionUrl: "gst-filing",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    metadata: { 
      clientName: "Pratwi Solutions Private Limited", 
      clientPhone: "+91 80771 70715",
      entityId: "ddd33056-b6dc-46ca-b145-cd111045aff7",
      statutoryAct: "CGST Section 37 / Rule 59",
      actionLabel: "Review & File GSTR-1",
      demandOrAmount: "₹0 Penalty",
      badgeText: "Compliant"
    }
  },
  {
    id: "notif-gstr3b-pratwi",
    recipientRole: "PARTNER",
    title: "Statutory Compliance: GSTR-3B Return & ITC Match",
    message: "Pratwi Solutions Private Limited monthly GSTR-3B summary and GSTR-2B Input Tax Credit reconciliation prepared by Kriti Jain.",
    category: "COMPLIANCE",
    priority: "HIGH",
    targetTab: "gst-filing",
    actionUrl: "gst-filing",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    metadata: { 
      clientName: "Pratwi Solutions Private Limited", 
      clientPhone: "+91 80771 70715",
      entityId: "ddd33056-b6dc-46ca-b145-cd111045aff7",
      statutoryAct: "CGST Section 39 / Rule 61",
      actionLabel: "Review GSTR-3B",
      demandOrAmount: "ITC Reconciled",
      badgeText: "On Track"
    }
  },
  {
    id: "notif-tds-pratwi",
    recipientRole: "PARTNER",
    title: "TDS Deposit Advice: Challan 281 Deposit",
    message: "Monthly TDS deduction advice u/s 200(1) verified for Pratwi Solutions Private Limited. Deposit slip ready for review.",
    category: "COMPLIANCE",
    priority: "NORMAL",
    targetTab: "tasks",
    actionUrl: "tasks",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    metadata: { 
      clientName: "Pratwi Solutions Private Limited", 
      clientPhone: "+91 80771 70715",
      entityId: "ddd33056-b6dc-46ca-b145-cd111045aff7",
      statutoryAct: "Income Tax Section 200(1)",
      actionLabel: "View Challan",
      demandOrAmount: "Challan 281",
      badgeText: "Due 07th"
    }
  },
  {
    id: "notif-dsc-pratwi",
    recipientRole: "PARTNER",
    title: "DSC Token Vault: Chetan Pratap Singh (Director)",
    message: "Class 3 USB DSC hardware token for Director Chetan Pratap Singh verified in office custody safe (Locker A-01). Status active and compliant.",
    category: "SECURITY",
    priority: "NORMAL",
    targetTab: "dsc",
    actionUrl: "dsc",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    metadata: { 
      clientName: "Pratwi Solutions Private Limited", 
      clientPhone: "+91 80771 70715",
      entityId: "ddd33056-b6dc-46ca-b145-cd111045aff7",
      statutoryAct: "MCA V3 / Class 3 Token",
      actionLabel: "Open DSC Vault",
      demandOrAmount: "Custody Safe A-01",
      badgeText: "Active"
    }
  }
];

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    const db = ensureDatabase();
    let notifications: NotificationItem[] = db.notifications || [];

    const url = new URL(req.url);
    const queryRole = url.searchParams.get("role");
    const queryClientEntityId = url.searchParams.get("clientEntityId");

    const effectiveRole = auth.isAuthenticated ? auth.role : (queryRole || "ALL");
    const effectiveEntityId = (auth.isAuthenticated && auth.role === "CLIENT" && auth.clientEntityId)
      ? auth.clientEntityId
      : queryClientEntityId;

    // Purge legacy sweep spam or broken "/admin" targetTab entries
    const initialCount = notifications.length;
    notifications = notifications.filter((n) => {
      const isSweepSpam = n.title.includes("Autonomous 9-Cycle") || n.title.includes("Practice Sweep");
      const isBrokenAdmin = n.targetTab === "/admin" || n.actionUrl === "/admin";
      return !isSweepSpam && !isBrokenAdmin;
    });

    // Client View
    if (effectiveRole === "CLIENT") {
      const allClients = db.clients || [];
      const targetClient = (effectiveEntityId
        ? allClients.find((c) => c.id === effectiveEntityId || c.pan === effectiveEntityId || (effectiveEntityId.includes("pratwi") && (c.id.includes("PRATWI") || c.name.toLowerCase().includes("pratwi"))))
        : allClients[0]) || {
        id: "CLI-PRATWI-01",
        name: "Pratwi Solutions Private Limited",
        pan: "AANCP9915B",
        gstin: "09AANCP9915B1Z4",
      };

      const isPratwi = targetClient.id === "CLI-PRATWI-01" || targetClient.id === "client-pratwi";
      let clientNotifs = notifications.filter((n) =>
        (n.recipientEntityId === targetClient.id || (isPratwi && (n.recipientEntityId === "client-pratwi" || n.recipientEntityId === "CLI-PRATWI-01"))) ||
        (n.recipientRole === "CLIENT" && (!n.recipientEntityId || n.recipientEntityId === targetClient.id || (isPratwi && (n.recipientEntityId === "client-pratwi" || n.recipientEntityId === "CLI-PRATWI-01")))) ||
        (n.recipientRole === "ALL" )
      );

      // If no valid client notifications exist, seed realistic statutory compliance intimations
      if (clientNotifs.length === 0) {
        const defaultRealNotifs: NotificationItem[] = [
          {
            id: `notif-gstr1-${targetClient.id}`,
            recipientRole: "CLIENT",
            recipientEntityId: targetClient.id,
            title: `GSTR-1 Outward Supplies Filing Due (Cutoff: 11 Nov 2026)`,
            message: `Form GSTR-1 for October 2026 is due on 11 Nov 2026 for ${targetClient.name} (GSTIN: ${targetClient.gstin || "09AANCP9915B1Z4"}). Sales data mapped under Rule 59(6) compliance protocol.`,
            category: "COMPLIANCE",
            priority: "HIGH",
            targetTab: "progress",
            isRead: false,
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
          {
            id: `notif-gstr3b-${targetClient.id}`,
            recipientRole: "CLIENT",
            recipientEntityId: targetClient.id,
            title: `GSTR-3B Statutory Summary & ITC Reconciliation (Cutoff: 20 Nov 2026)`,
            message: `Mandatory monthly return GSTR-3B for October 2026 is due on 20 Nov 2026. Input Tax Credit (ITC) electronic matching vs GSTR-2B underway by GPA & Co.`,
            category: "COMPLIANCE",
            priority: "URGENT",
            targetTab: "progress",
            isRead: false,
            createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          },
          {
            id: `notif-tds-${targetClient.id}`,
            recipientRole: "CLIENT",
            recipientEntityId: targetClient.id,
            title: `TDS Challan 281 Deposit Intimation (October 2026)`,
            message: `Statutory cutoff for monthly TDS deposit under Section 200(1) is 07 Nov 2026. Advance payment advice and calculation verified by Lead CA.`,
            category: "COMPLIANCE",
            priority: "HIGH",
            targetTab: "progress",
            isRead: false,
            createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
          },
          {
            id: `notif-shield-${targetClient.id}`,
            recipientRole: "CLIENT",
            recipientEntityId: targetClient.id,
            title: `Executive Statutory Shield Active (98% Compliant)`,
            message: `Official compliance health verified by GPA & Co., Chartered Accountants (FRN 024310C). All company KYC documents and director risk profiles are up to date.`,
            category: "NOTICE",
            priority: "NORMAL",
            targetTab: "director-risk",
            isRead: true,
            createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
          }
        ];

        notifications.unshift(...defaultRealNotifs);
        clientNotifs = defaultRealNotifs;
      }

      // Apply dynamic token replacement
      clientNotifs = clientNotifs.map((n) => ({
        ...n,
        title: n.title.replace(/{{clientName}}/g, targetClient.name),
        message: n.message
          .replace(/{{clientName}}/g, targetClient.name)
          .replace(/{{gstin}}/g, targetClient.gstin || "09AANCP9915B1Z4")
          .replace(/{{pan}}/g, targetClient.pan),
      }));

      if (notifications.length !== initialCount) {
        db.notifications = notifications;
        await saveDatabase(db);
      }

      const unreadCount = clientNotifs.filter((n) => !n.isRead).length;
      return NextResponse.json({
        success: true,
        notifications: clientNotifs,
        unreadCount
      });
    }

    // Partner / Staff View: Ensure baseline alerts exist and are clean
    let partnerNotifs = notifications.filter((n) =>
      n.recipientRole === "ALL" ||
      n.recipientRole === "PARTNER" ||
      (effectiveRole === "ARTICLE" && n.recipientRole === "ARTICLE")
    );

    // If partner has no active alerts or needs baseline alerts seeded
    if (partnerNotifs.length < 4) {
      for (const std of STANDARD_PARTNER_NOTIFICATIONS) {
        if (!notifications.some((existing) => existing.id === std.id || existing.title === std.title)) {
          notifications.push(std);
        }
      }
      partnerNotifs = notifications.filter((n) =>
        n.recipientRole === "ALL" ||
        n.recipientRole === "PARTNER" ||
        (effectiveRole === "ARTICLE" && n.recipientRole === "ARTICLE")
      );
    }

    // Save cleaned database
    if (notifications.length !== initialCount) {
      db.notifications = notifications;
      await saveDatabase(db);
    }

    // Sort by createdAt descending
    partnerNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const unreadCount = partnerNotifs.filter((n) => !n.isRead).length;
    return NextResponse.json({
      success: true,
      notifications: partnerNotifs,
      unreadCount
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    const body = await req.json();

    // Support batch notifications dispatch (from client broadcaster)
    if (body.notifications && Array.isArray(body.notifications)) {
      const db = ensureDatabase();
      if (!db.notifications) db.notifications = [];

      const created: NotificationItem[] = [];
      for (const item of body.notifications) {
        const newNotif: NotificationItem = {
          id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          title: item.title,
          message: item.message,
          category: item.category || "COMPLIANCE",
          priority: item.priority || "NORMAL",
          targetTab: item.targetTab || "progress",
          actionUrl: item.actionUrl || item.targetTab || "progress",
          recipientRole: item.recipientRole || "CLIENT",
          recipientEntityId: item.recipientEntityId,
          isRead: false,
          createdAt: new Date().toISOString(),
          metadata: item.metadata || {}
        };
        db.notifications.unshift(newNotif);
        created.push(newNotif);
      }
      await saveDatabase(db);
      return NextResponse.json({ success: true, count: created.length, notifications: created });
    }

    const { title, message, category, priority, targetTab, recipientRole, recipientEntityId, metadata } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, error: "Title and message are required." }, { status: 400 });
    }

    const notif = await createNotification(
      title,
      message,
      category || "COMPLIANCE",
      priority || "NORMAL",
      targetTab || "tasks-matrix",
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
    const body = await req.json();
    const { action, id, clientEntityId, role } = body;

    const db = ensureDatabase();
    if (!db.notifications) db.notifications = [];

    const isClient = (auth.isAuthenticated && auth.role === "CLIENT") || role === "CLIENT";

    if (action === "MARK_ALL_READ") {
      if (isClient) {
        db.notifications = db.notifications.map((n) => {
          if (!clientEntityId || n.recipientEntityId === clientEntityId || n.recipientRole === "CLIENT") {
            return { ...n, isRead: true };
          }
          return n;
        });
      } else {
        db.notifications = db.notifications.map((n) => ({ ...n, isRead: true }));
      }
      await saveDatabase(db);
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (action === "MARK_READ" && id) {
      const idx = db.notifications.findIndex((n) => n.id === id);
      if (idx !== -1) {
        db.notifications[idx].isRead = true;
        await saveDatabase(db);
      }
      return NextResponse.json({ success: true, message: "Notification marked as read." });
    }

    if (action === "DELETE" && id) {
      db.notifications = db.notifications.filter((n) => n.id !== id);
      await saveDatabase(db);
      return NextResponse.json({ success: true, message: "Notification removed." });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
