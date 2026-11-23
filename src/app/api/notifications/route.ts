import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, saveDatabase, createNotification } from "@/lib/server/db";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { NotificationItem } from "@/lib/types";

// Standard Practice Default Notifications (Clean, realistic statutory alerts)
const STANDARD_PARTNER_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-gstr3b-apex",
    recipientRole: "PARTNER",
    title: "Statutory Deadline (<72h): GSTR-3B Monthly Filing",
    message: "Apex AutoTech Private Limited monthly GSTR-3B return is due on 20-Oct-2026. Action required to avoid Section 47 late fees and 18% interest.",
    category: "COMPLIANCE",
    priority: "CRITICAL",
    targetTab: "gst-filing",
    actionUrl: "gst-filing",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    metadata: { 
      clientName: "Apex AutoTech Private Limited", 
      clientPhone: "+919820011223",
      entityId: "client-apex",
      statutoryAct: "Section 39 / Rule 88B",
      actionLabel: "Review & File (GSTR-3B)",
      demandOrAmount: "₹1,55,800 Net Tax",
      badgeText: "Due in 48h"
    }
  },
  {
    id: "notif-notice-omni",
    recipientRole: "PARTNER",
    title: "Statutory Scrutiny Notice: Section 148 Reassessment",
    message: "OmniRetail Hypermarkets Private Limited received reassessment notice from NFAC (Demand: ₹42,50,000). Statutory reply limitation ends in 19 days.",
    category: "NOTICE",
    priority: "CRITICAL",
    targetTab: "notices",
    actionUrl: "notices",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    metadata: { 
      clientName: "OmniRetail Hypermarkets Private Limited", 
      clientPhone: "+919811022334",
      entityId: "client-omni",
      statutoryAct: "NFAC Section 148 Reassessment",
      actionLabel: "Open Defense Dossier",
      demandOrAmount: "₹42,50,000 Exposure",
      badgeText: "19 Days Left"
    }
  },
  {
    id: "notif-pay-pratwi",
    recipientRole: "PARTNER",
    title: "Fee Payment Reconciled: ₹59,000 (UPI)",
    message: "Pratwi Solutions Private Limited settled Invoice #GPA/2026-27/098 via UPI (UTR: AUTOUPI982341982). Pay-to-Release fee gate automatically unlocked deliverables.",
    category: "BILLING",
    priority: "HIGH",
    targetTab: "billing-matrix",
    actionUrl: "billing-matrix",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    metadata: { 
      clientName: "Pratwi Solutions Private Limited", 
      clientPhone: "+919920033445",
      entityId: "client-pratwi",
      statutoryAct: "MSME 43B(h) / Pay-to-Release",
      actionLabel: "Unlock Deliverables",
      demandOrAmount: "₹59,000 Settled",
      badgeText: "UTR Matched"
    }
  },
  {
    id: "notif-stmt-singhal",
    recipientRole: "PARTNER",
    title: "Inbound Document Vaulted: HDFC Bank Statement",
    message: "Singhal Logistics uploaded encrypted statement via WhatsApp. Automatically decrypted using Entity DNA; 8 vouchers mapped and ready for Tally sync.",
    category: "DOCUMENT",
    priority: "NORMAL",
    targetTab: "bank-parser",
    actionUrl: "bank-parser",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    metadata: { 
      clientName: "Singhal Logistics & Warehousing", 
      clientPhone: "+919730044556",
      entityId: "client-singhal",
      statutoryAct: "WhatsApp AI / Tally XML Bridge",
      actionLabel: "Review & Post to Tally",
      demandOrAmount: "8 Vouchers Ready",
      badgeText: "Auto-Decrypted"
    }
  },
  {
    id: "notif-audit-apex",
    recipientRole: "PARTNER",
    title: "Tax Audit u/s 44AB: Form 3CD Workpapers Ready",
    message: "Form 3CD final certification for Apex AutoTech Private Limited is prepared. Awaiting Partner digital sign-off and 60-day UDIN registration.",
    category: "COMPLIANCE",
    priority: "HIGH",
    targetTab: "itr-matrix",
    actionUrl: "itr-matrix",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    metadata: { 
      clientName: "Apex AutoTech Private Limited", 
      clientPhone: "+919820011223",
      entityId: "client-apex",
      statutoryAct: "Section 44AB / Form 3CD",
      actionLabel: "Audit Form 3CD",
      demandOrAmount: "₹34,200 Tax Saved",
      badgeText: "Awaiting Sign-off"
    }
  },
  {
    id: "notif-udin-apex",
    recipientRole: "PARTNER",
    title: "UDIN 60-Day Mandate: Form 3CD Certification",
    message: "Form 3CD for Apex AutoTech was signed 52 days ago. Only 8 days remaining to register UDIN on ICAI portal before statutory non-compliance.",
    category: "UDIN",
    priority: "HIGH",
    targetTab: "udin-vault",
    actionUrl: "udin-vault",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    metadata: { 
      clientName: "Apex AutoTech Private Limited", 
      clientPhone: "+919820011223",
      entityId: "client-apex",
      statutoryAct: "ICAI SQC-1 / UDIN 60-Day Mandate",
      actionLabel: "Generate UDIN",
      demandOrAmount: "8 Days Remaining",
      badgeText: "Mandate Risk"
    }
  },
  {
    id: "notif-dsc-apex",
    recipientRole: "PARTNER",
    title: "DSC Token Expiry Alert: Director Rajesh Sharma",
    message: "Class 3 USB DSC token for Director Rajesh Sharma (Apex AutoTech) expires in 18 days. Physical token custody safe requires renewal to prevent MCA lockout.",
    category: "SECURITY",
    priority: "HIGH",
    targetTab: "dsc",
    actionUrl: "dsc",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    metadata: { 
      clientName: "Apex AutoTech Private Limited", 
      clientPhone: "+919820011223",
      entityId: "client-apex",
      statutoryAct: "MCA V3 / Class 3 Hardware Token",
      actionLabel: "Open DSC Vault",
      demandOrAmount: "Locker Rack #4",
      badgeText: "Expires in 18d"
    }
  },
  {
    id: "notif-notice-asmt10",
    recipientRole: "PARTNER",
    title: "GST Scrutiny Notice: Form ASMT-10 (DRC-01A)",
    message: "Apex AutoTech Private Limited has an active DRC-01A ITC mismatch notice (Demand: ₹18,50,000). Statutory legal defense reply drafting in progress.",
    category: "NOTICE",
    priority: "HIGH",
    targetTab: "notices",
    actionUrl: "notices",
    isRead: true,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    metadata: { 
      clientName: "Apex AutoTech Private Limited", 
      clientPhone: "+919820011223",
      entityId: "client-apex",
      statutoryAct: "CGST Section 61 / Rule 99",
      actionLabel: "Review Reply Draft",
      demandOrAmount: "₹18,50,000 Exposure",
      badgeText: "Under Review"
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
        (n.recipientRole === "ALL" && !n.message.toLowerCase().includes("apex autotech"))
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
