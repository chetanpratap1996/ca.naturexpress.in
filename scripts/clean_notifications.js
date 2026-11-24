const fs = require('fs');

const path = 'G:/CA-firm/src/app/api/notifications/route.ts';
let code = fs.readFileSync(path, 'utf8');

const newNotifications = `// Standard Practice Default Notifications (Clean, verified statutory alerts for registered firm clients)
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
];`;

const startIdx = code.indexOf('// Standard Practice Default Notifications');
const endIdx = code.indexOf('export async function GET(req: NextRequest) {');

if (startIdx !== -1 && endIdx !== -1) {
  code = code.slice(0, startIdx) + newNotifications + '\n\n' + code.slice(endIdx);
  fs.writeFileSync(path, code, 'utf8');
  console.log('SUCCESS: Updated notifications route.ts with clean real client notifications');
} else {
  console.error('Could not find indices in notifications route.ts', { startIdx, endIdx });
}
