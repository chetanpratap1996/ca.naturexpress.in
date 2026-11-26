import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/auth/serverAuth";
import { getPostgresPool } from "@/lib/server/postgres";
import { resolveFirmUuid, listWorkspaceRecords } from "@/lib/server/pgHelpers";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { NotificationItem, PayToReleaseConfig, PortalCredential } from "@/lib/types";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateServerRequest(request);
    if (!auth.isAuthenticated || !auth.role) {
      return NextResponse.json(
        { success: false, error: auth.error || "Authentication required." },
        { status: 401 }
      );
    }

    const isClientRole = auth.role === "CLIENT";
    const isStaffSubRole = auth.role === "ARTICLE" || auth.role === "TEAM";
    const firmId = await resolveFirmUuid(auth);
    const pool = getPostgresPool();

    if (isClientRole && !auth.clientEntityId && !auth.clientGroupId) {
      return NextResponse.json(
        { success: false, error: "Client account is missing entity or group scope." },
        { status: 403 }
      );
    }

    const [
      { rows: firmRows },
      { rows: groupRows },
      { rows: entityRows },
      { rows: taskRows },
      { rows: staffUserRows },
      { rows: invoiceRows },
      { rows: dscRows },
      { rows: docRows },
      { rows: auditRows },
      payCfgRecs,
      credRecs,
      notifRecs,
      noticeRecs,
      gstProfileRecs,
      gstFilingMetaRecs,
    ] = await Promise.all([
      pool.query("SELECT * FROM public.firms WHERE id = $1 LIMIT 1", [firmId]),
      pool.query("SELECT * FROM public.client_groups WHERE firm_id = $1 ORDER BY created_at DESC", [firmId]),
      pool.query("SELECT * FROM public.client_entities WHERE firm_id = $1 ORDER BY created_at DESC", [firmId]),
      pool.query("SELECT * FROM public.compliance_tasks WHERE firm_id = $1 ORDER BY due_date ASC", [firmId]),
      pool.query("SELECT id, full_name FROM public.users WHERE firm_id = $1", [firmId]),
      pool.query("SELECT * FROM public.invoices WHERE firm_id = $1 ORDER BY created_at DESC", [firmId]),
      isClientRole
        ? Promise.resolve({ rows: [] })
        : pool.query("SELECT * FROM public.dsc_vault WHERE firm_id = $1 ORDER BY valid_till ASC", [firmId]),
      pool.query("SELECT * FROM public.documents WHERE firm_id = $1 ORDER BY created_at DESC", [firmId]),
      isClientRole || isStaffSubRole
        ? Promise.resolve({ rows: [] })
        : pool.query("SELECT * FROM public.audit_logs WHERE firm_id = $1 ORDER BY created_at DESC LIMIT 200", [firmId]),
      listWorkspaceRecords<PayToReleaseConfig>(firmId, "PAY_TO_RELEASE_CONFIG", isClientRole ? auth.clientEntityId || null : null),
      isClientRole ? Promise.resolve([]) : listWorkspaceRecords<PortalCredential>(firmId, "PORTAL_CREDENTIAL"),
      listWorkspaceRecords<NotificationItem>(firmId, "NOTIFICATION", isClientRole ? auth.clientEntityId || null : null),
      isClientRole ? Promise.resolve([]) : listWorkspaceRecords<any>(firmId, "NOTICE_RECORD"),
      listWorkspaceRecords<any>(firmId, "GST_CLIENT_PROFILE"),
      isClientRole ? Promise.resolve([]) : listWorkspaceRecords<any>(firmId, "GST_FILING_METADATA"),
    ]);

    const gstProfileByEntity = new Map<string, any>();
    for (const r of gstProfileRecs) {
      const eid = r.entity_id || r.payload?.entityId;
      if (eid) gstProfileByEntity.set(eid, r.payload);
    }
    const gstFilingMetaByTask = new Map<string, any>();
    for (const r of gstFilingMetaRecs) {
      if (r.payload?.taskId) gstFilingMetaByTask.set(r.payload.taskId, r.payload);
    }

    const firm = firmRows[0];

    let mappedClients = entityRows.map((e: any) => {
      const parentGroup = groupRows.find((g: any) => g.id === e.group_id);
      const gstProf = gstProfileByEntity.get(e.id);
      const partnerName =
        (e.partner_in_charge_id && staffUserRows.find((u: any) => u.id === e.partner_in_charge_id)?.full_name) ||
        DEFAULT_FIRM_BRANDING.managingPartner;
      const articleName =
        (e.assigned_article_id && staffUserRows.find((u: any) => u.id === e.assigned_article_id)?.full_name) ||
        "Unassigned";
      return {
        id: e.id,
        groupId: e.group_id,
        groupName: parentGroup ? parentGroup.group_name : "Direct Practice Clients",
        name: e.entity_name,
        tradeName: gstProf?.tradeName || undefined,
        type: e.type,
        pan: e.pan,
        gstin: e.gstin || undefined,
        gstinRecords: Array.isArray(gstProf?.gstinRecords) ? gstProf.gstinRecords : undefined,
        gstFilingFrequency: gstProf?.gstFilingFrequency || undefined,
        onboardingMode: gstProf?.onboardingMode || undefined,
        onboardingChecklist: gstProf?.onboardingChecklist || undefined,
        gstHistory: Array.isArray(gstProf?.gstHistory) ? gstProf.gstHistory : undefined,
        serviceScope: Array.isArray(gstProf?.serviceScope) ? gstProf.serviceScope : undefined,
        cutoverDate: gstProf?.cutoverDate || undefined,
        lastFiledPeriods: gstProf?.lastFiledPeriods || undefined,
        digitalTxnPct: gstProf?.digitalTxnPct !== undefined ? Number(gstProf.digitalTxnPct) : undefined,
        registeredAddress: gstProf?.registeredAddress || undefined,
        directors: Array.isArray(gstProf?.directors) ? gstProf.directors : undefined,
        bankAccounts: Array.isArray(gstProf?.bankAccounts) ? gstProf.bankAccounts : undefined,
        complianceBaselines: Array.isArray(gstProf?.complianceBaselines) ? gstProf.complianceBaselines : undefined,
        cin: e.cin || undefined,
        tan: e.tan || undefined,
        turnoverCr: Number(e.turnover_cr || 0),
        partnerInCharge: partnerName,
        partnerInChargeId: e.partner_in_charge_id || undefined,
        assignedArticle: articleName,
        assignedArticleId: e.assigned_article_id || undefined,
        incorporationYear: e.incorporation_year || new Date().getFullYear(),
        penaltyRiskAccrued: Number(e.penalty_risk_accrued || 0),
        primaryContact: {
          name: e.primary_contact_name || parentGroup?.promoter_name || "Authorized Signatory",
          phone: e.primary_contact_phone || parentGroup?.promoter_phone || "",
          email: e.primary_contact_email || parentGroup?.promoter_email || "",
          designation: e.primary_contact_designation || "Director / Authorized Signatory",
        },
      };
    });

    if (isClientRole) {
      mappedClients = mappedClients.filter(
        (c: any) =>
          (auth.clientEntityId && c.id === auth.clientEntityId) ||
          (!auth.clientEntityId && auth.clientGroupId && c.groupId === auth.clientGroupId)
      );
    }

    const allowedEntityIds = new Set(mappedClients.map((c: any) => c.id));
    const allowedGroupIds = new Set(mappedClients.map((c: any) => c.groupId));

    const mappedGroups = groupRows
      .filter((g: any) => !isClientRole || allowedGroupIds.has(g.id))
      .map((g: any) => ({
        id: g.id,
        name: g.group_name,
        promoterName: g.promoter_name,
        promoterPhone: g.promoter_phone,
        promoterEmail: g.promoter_email,
        totalEntities: mappedClients.filter((e: any) => e.groupId === g.id).length,
        totalTurnoverCr: mappedClients
          .filter((e: any) => e.groupId === g.id)
          .reduce((acc: number, curr: any) => acc + Number(curr.turnoverCr || 0), 0),
        unbilledWipTotal: isClientRole ? 0 : Number(g.unbilled_wip_total || 0),
        overdueFeesTotal: Number(g.overdue_fees_total || 0),
        entityIds: mappedClients.filter((e: any) => e.groupId === g.id).map((e: any) => e.id),
      }));

    const clientById = new Map(mappedClients.map((c: any) => [c.id, c]));
    const staffNameById = new Map(staffUserRows.map((u: any) => [u.id, u.full_name]));

    const mappedTasks = taskRows
      .filter((t: any) => !isClientRole || allowedEntityIds.has(t.entity_id))
      .map((t: any) => {
        const ent: any = clientById.get(t.entity_id);
        const meta = gstFilingMetaByTask.get(t.id);
        return {
          id: t.id,
          entityId: t.entity_id,
          entityName: ent ? ent.name : "Practice Client",
          groupId: ent ? ent.groupId : "",
          category: t.category,
          title: t.title,
          period: t.period,
          dueDate: t.due_date ? new Date(t.due_date).toISOString().split("T")[0] : "2026-11-30",
          status: t.status,
          assignedTo: (t.assigned_to_id && staffNameById.get(t.assigned_to_id)) || "Unassigned",
          assignedStaffId: t.assigned_to_id || undefined,
          reviewedBy: (t.reviewed_by_id && staffNameById.get(t.reviewed_by_id)) || DEFAULT_FIRM_BRANDING.managingPartner,
          priority: t.priority,
          penaltyRisk: Number(t.penalty_risk || 0),
          accruingDailyPenalty: Number(t.accruing_daily_penalty || 0),
          missingDocumentsCount: Array.isArray(t.missing_docs_list) ? t.missing_docs_list.length : 0,
          missingDocumentsList: Array.isArray(t.missing_docs_list) ? t.missing_docs_list : [],
          chaseCount: t.chase_count || 0,
          arnNumber: t.arn_number || undefined,
          officialUdin: t.official_udin || undefined,
          filingDate: t.filing_date ? new Date(t.filing_date).toISOString().split("T")[0] : undefined,
          gstin: meta?.gstin || ent?.gstin || undefined,
          challanCin: meta?.challanCin || undefined,
          taxPayableAmount: meta?.taxPayableAmount !== undefined ? Number(meta.taxPayableAmount) : undefined,
          section50Interest: meta?.section50Interest !== undefined ? Number(meta.section50Interest) : undefined,
          lateFeeAmount: meta?.lateFeeAmount !== undefined ? Number(meta.lateFeeAmount) : undefined,
          isNilReturn: meta?.isNilReturn || false,
          outwardTaxBreakdown: meta?.outwardTaxBreakdown || undefined,
          rcmTax: meta?.rcmTax !== undefined ? Number(meta.rcmTax) : undefined,
          itcUtilized: meta?.itcUtilized || undefined,
          cashPaid: meta?.cashPaid !== undefined ? Number(meta.cashPaid) : undefined,
        };
      });

    const mappedInvoices = invoiceRows
      .filter((inv: any) => !isClientRole || allowedEntityIds.has(inv.entity_id))
      .map((inv: any) => {
        const ent: any = clientById.get(inv.entity_id);
        return {
          id: inv.id,
          invoiceNo: inv.invoice_no,
          entityId: inv.entity_id,
          entityName: ent ? ent.name : "Practice Client",
          groupId: ent ? ent.groupId : "",
          serviceDescription: inv.service_description,
          sacCode: inv.sac_code || "998231",
          taxableAmount: Number(inv.taxable_amount || 0),
          gstRate: Number(inv.gst_rate || 18),
          gstAmount: Number(inv.gst_amount || 0),
          amount: Number(inv.total_amount || 0),
          dueDate: inv.due_date ? new Date(inv.due_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          status: inv.status || "PENDING",
          clientUtrNumber: inv.client_utr_number || undefined,
          clientPaymentMode: inv.client_payment_mode || undefined,
          clientPaymentDate: inv.client_payment_date ? new Date(inv.client_payment_date).toISOString().split("T")[0] : undefined,
          clientPayerNote: inv.client_payer_note || undefined,
          reconciledAt: inv.reconciled_at ? new Date(inv.reconciled_at).toISOString() : undefined,
        };
      });

    const mappedDsc = isClientRole
      ? []
      : dscRows.map((d: any) => {
          const ent: any = clientById.get(d.entity_id);
          const validTill = d.valid_till ? new Date(d.valid_till).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
          const daysToExpiry = Math.ceil((new Date(validTill).getTime() - Date.now()) / 86400000);
          return {
            id: d.id,
            entityId: d.entity_id,
            entityName: ent ? ent.name : "Practice Client",
            groupId: ent ? ent.groupId : "",
            holderName: d.holder_name,
            pan: d.holder_pan,
            serialNumber: d.serial_number,
            tokenType: d.token_type || "ePass2003",
            validTill,
            daysToExpiry,
            expiryStatus: daysToExpiry <= 0 ? "EXPIRED" : daysToExpiry <= 30 ? "EXPIRING_SOON" : "ACTIVE",
            currentCustodian: d.checked_out_at ? "Checked Out (Staff)" : "Firm Master Safe",
            vaultSlot: d.vault_slot || "Slot A-01",
            checkedOutAt: d.checked_out_at ? new Date(d.checked_out_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined,
            checkedOutPurpose: d.checked_out_purpose || undefined,
          };
        });

    const mappedDocuments = docRows
      .filter((doc: any) => !isClientRole || allowedEntityIds.has(doc.entity_id))
      .map((doc: any) => {
        const ent: any = clientById.get(doc.entity_id);
        const bytes = Number(doc.file_size_bytes || 0);
        return {
          id: doc.id,
          entityId: doc.entity_id,
          entityName: ent ? ent.name : "Client Entity",
          taskId: doc.task_id || undefined,
          category: doc.category || "BANK_STATEMENT",
          fileName: doc.file_name,
          fileSize: bytes > 0 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : "500 KB",
          storagePath: doc.storage_path || undefined,
          uploadedAt: doc.created_at ? new Date(doc.created_at).toISOString() : new Date().toISOString(),
          financialYear: doc.financial_year || "FY 2026-27",
          uploadedBy: doc.uploaded_by_id ? "CLIENT_PWA" : "FIRM_STAFF",
          isPasswordProtected: false,
          isUnlocked: true,
          reviewStatus: doc.review_status || "PENDING_REVIEW",
          reviewNotes: doc.review_notes || undefined,
          reviewedAt: doc.reviewed_at ? new Date(doc.reviewed_at).toISOString() : undefined,
        };
      });

    const mappedAuditTrail = auditRows.map((a: any) => ({
      id: a.id,
      timestamp: a.created_at,
      actorName: a.actor_name,
      actorRole: a.actor_role,
      entityName: a.entity_name,
      action: a.action,
      details: a.details,
      category: a.category,
    }));

    const mappedPayConfigs = payCfgRecs
      .map((r) => r.payload)
      .filter((p) => !isClientRole || allowedEntityIds.has(p.entityId));

    const mappedNotifications = notifRecs
      .map((r) => r.payload)
      .filter(
        (n) =>
          !isClientRole ||
          (n.recipientEntityId && allowedEntityIds.has(n.recipientEntityId)) ||
          n.recipientRole === "ALL" ||
          (n.recipientRole === "CLIENT" && !n.recipientEntityId)
      );

    const firmMetrics: any = {
      name: firm?.firm_name || DEFAULT_FIRM_BRANDING.firmName,
      companyName: DEFAULT_FIRM_BRANDING.companyName,
      frn: firm?.frn || DEFAULT_FIRM_BRANDING.frn,
      totalClients: mappedClients.length,
      activeEntities: mappedClients.length,
      criticalDeadlinesNext72h: mappedTasks.filter(
        (t: any) => t.priority === "CRITICAL" && t.status !== "FILED_AND_COMPLETED"
      ).length,
      complianceHealthScore: 100,
      firmUpiVpa: firm?.firm_upi_vpa || DEFAULT_FIRM_BRANDING.firmUpiVpa,
    };

    if (!isClientRole) {
      firmMetrics.pendingCollections = mappedInvoices
        .filter((i: any) => i.status !== "PAID")
        .reduce((sum: number, i: any) => sum + i.amount, 0);
      if (!isStaffSubRole) {
        firmMetrics.unbilledWipAmount = mappedGroups.reduce((s: number, g: any) => s + g.unbilledWipTotal, 0);
      }
    }

    return NextResponse.json({
      success: true,
      source: "POSTGRES_LIVE",
      data: {
        firmMetrics,
        groups: mappedGroups,
        clients: mappedClients,
        tasks: mappedTasks,
        invoices: mappedInvoices,
        dscTokens: mappedDsc,
        portalCredentials: credRecs.map((r) => r.payload),
        documents: mappedDocuments,
        notices: noticeRecs.map((r) => r.payload),
        auditTrail: mappedAuditTrail,
        payToReleaseConfigs: mappedPayConfigs,
        notifications: mappedNotifications,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Critical error in GET /api/data:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "Durable practice database is unavailable." },
      { status: 503 }
    );
  }
}
