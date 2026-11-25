"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { formatCurrencyINR } from "@/lib/utils";
import { toast } from "@/components/shared/ToastNotification";
import { playSuccessChime, playSoftClick } from "@/lib/audio/soundEffects";
import {
  RecoMatcher,
  Gstr2bInvoice,
  BooksPurchaseInvoice,
  ReconciledRecord,
  RecoManualOverride,
} from "@/lib/gst/recoMatcher";
import { parseOfficialGstr2bJson, parsePurchaseRegisterCsv } from "@/lib/parsers/gstr2bParser";
import { ItcClassifier } from "@/lib/gst/itcClassifier";
import {
  Rule42And43Engine,
  Rule42CalculationResult,
  Rule43CapitalGoodsItem,
  Rule43MonthlyResult,
  Rule42AnnualTrueUpResult,
} from "@/lib/gst/rule42And43Engine";
import { VendorRiskEngine, VendorComplianceProfile, VendorGstnStatus } from "@/lib/gst/vendorRiskEngine";
import { VendorNoticeGenerator, GeneratedNotice } from "@/lib/gst/vendorNoticeGenerator";
import { useClientContext } from "@/lib/context/ClientContext";
import { UniversalClientSelector } from "@/components/shared/UniversalClientSelector";
import { gstFetchJson, getPeriodsForFy, toGstnReturnPeriod } from "@/lib/gst/gstClientFetch";
import {
  parsePurchaseExcelBuffer,
  parseGstr2bExcelBuffer,
  parseDelimitedTextToTable,
  readExcelSheetsFromBuffer,
  autoDetectColumnMapping,
  downloadWorkbookXlsx,
  type ColumnMapping,
} from "@/lib/parsers/excelGstParser";
import { pullPurchaseVouchersFromTallyPrime } from "@/lib/gst/tallyConnector";

import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Send,
  Download,
  RefreshCw,
  Search,
  MessageSquare,
  ShieldCheck,
  Check,
  ShieldAlert,
  Clock,
  Sparkles,
  Upload,
  FileText,
  Plus,
  Trash2,
  Copy,
  X,
  Calculator,
  FileCheck,
  AlertCircle,
  Mail,
  Scale,
  Zap,
  Layers,
  Building2,
  FolderOpen,
  Globe,
} from "lucide-react";

export const Gstr2bReconciler: React.FC = () => {
  const {
    selectedClient,
    selectedGstin,
    selectedFy,
    selectedPeriod,
    selectPeriod,
    isFirmWideView,
    openCommandPalette,
  } = useClientContext();

  const fyPeriods = useMemo(() => getPeriodsForFy(selectedFy), [selectedFy]);
  const activePeriod = selectedPeriod || fyPeriods[fyPeriods.length - 1] || "October 2026";
  const activeGstin = useMemo(() => {
    if (isFirmWideView || !selectedClient) return "";
    return selectedGstin || selectedClient.gstin || selectedClient.gstinRecords?.[0]?.gstin || "";
  }, [isFirmWideView, selectedClient, selectedGstin]);

  const [activeTab, setActiveTab] = useState<"matrix" | "sec17_5" | "rule42_43" | "notices">("matrix");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [toleranceInr, setToleranceInr] = useState<number>(5.0);
  const [isLoadingReco, setIsLoadingReco] = useState(false);

  // Datasets (strictly loaded from upload or DB — never hardcoded demo invoices)
  const [gstr2bList, setGstr2bList] = useState<Gstr2bInvoice[]>([]);
  const [booksList, setBooksList] = useState<BooksPurchaseInvoice[]>([]);
  const [overrides, setOverrides] = useState<Record<string, RecoManualOverride>>({});
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Live GSTN Vendor Verification Cache
  const [verifiedVendors, setVerifiedVendors] = useState<
    Record<
      string,
      {
        status: VendorGstnStatus;
        legalName?: string;
        regDate?: string;
        gstr1Filed?: number;
        gstr1Total?: number;
        gstr3bFiled?: number;
        gstr3bTotal?: number;
      }
    >
  >({});
  const [verifyingVendorGstin, setVerifyingVendorGstin] = useState<string | null>(null);

  // Modals & Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [json2bFile, setJson2bFile] = useState<File | null>(null);
  const [booksFile, setBooksFile] = useState<File | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [isFetchingPortal2b, setIsFetchingPortal2b] = useState(false);
  const [isPullingTally, setIsPullingTally] = useState(false);
  const [isBatchVerifying, setIsBatchVerifying] = useState(false);
  const [showClientDocsModal, setShowClientDocsModal] = useState(false);
  const [clientDocsList, setClientDocsList] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [booksMappingPreview, setBooksMappingPreview] = useState<{
    headers: string[];
    mapping: ColumnMapping;
    sampleRows: any[][];
    buffer?: ArrayBuffer;
    isExcel: boolean;
  } | null>(null);
  const [isTable4DrawerOpen, setIsTable4DrawerOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<GeneratedNotice | null>(null);
  const [noticePhoneInput, setNoticePhoneInput] = useState("");
  const [pendingNoticeRecord, setPendingNoticeRecord] = useState<ReconciledRecord | null>(null);

  // Rule 42 & 43 State
  const [r42TotalInputTax, setR42TotalInputTax] = useState<number>(0);
  const [r42NonBusiness, setR42NonBusiness] = useState<number>(0);
  const [r42ExemptInput, setR42ExemptInput] = useState<number>(0);
  const [r42BlockedInput, setR42BlockedInput] = useState<number>(0);
  const [r42TaxableInput, setR42TaxableInput] = useState<number>(0);
  const [r42ExemptTurnover, setR42ExemptTurnover] = useState<number>(0);
  const [r42TotalTurnover, setR42TotalTurnover] = useState<number>(0);
  const [r43Assets, setR43Assets] = useState<Rule43CapitalGoodsItem[]>([]);
  const [newAssetDesc, setNewAssetDesc] = useState("");
  const [newAssetInv, setNewAssetInv] = useState("");
  const [newAssetDate, setNewAssetDate] = useState("");
  const [newAssetCost, setNewAssetCost] = useState("");
  const [newAssetTax, setNewAssetTax] = useState("");
  const [newAssetMonths, setNewAssetMonths] = useState("1");

  // Annual Rule 42(2) True-Up State
  const [annualCommonC2, setAnnualCommonC2] = useState<number>(0);
  const [annualExemptE, setAnnualExemptE] = useState<number>(0);
  const [annualTotalF, setAnnualTotalF] = useState<number>(0);
  const [annualMonthlyPaid, setAnnualMonthlyPaid] = useState<number>(0);
  const [annualFilingDate, setAnnualFilingDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [isSavingRule42, setIsSavingRule42] = useState(false);

  // Load persisted reconciliation & Rule 42/43 whenever GSTIN or Period changes
  const loadSavedWorkspace = useCallback(async () => {
    if (!activeGstin) {
      setGstr2bList([]);
      setBooksList([]);
      setOverrides({});
      setLastSavedAt(null);
      return;
    }
    setIsLoadingReco(true);
    try {
      const [recoRes, r42Res] = await Promise.all([
        gstFetchJson<any>(
          `/api/gst/reconciliation?clientGstin=${encodeURIComponent(activeGstin)}&taxPeriod=${encodeURIComponent(activePeriod)}&tolerance=${toleranceInr}`
        ),
        gstFetchJson<any>(
          `/api/gst/rule42-43?clientGstin=${encodeURIComponent(activeGstin)}&taxPeriod=${encodeURIComponent(activePeriod)}`
        ),
      ]);

      if (recoRes.ok && recoRes.data?.found) {
        setGstr2bList(recoRes.data.gstr2bInvoices || []);
        setBooksList(recoRes.data.booksInvoices || []);
        setOverrides(recoRes.data.overrides || {});
        setLastSavedAt(recoRes.data.updatedAt || null);
      } else {
        setGstr2bList([]);
        setBooksList([]);
        setOverrides({});
        setLastSavedAt(null);
      }

      if (r42Res.ok && r42Res.data?.found && r42Res.data?.record) {
        const rec = r42Res.data.record;
        if (rec.rule42Inputs) {
          setR42TotalInputTax(Number(rec.rule42Inputs.totalInputTaxInr || 0));
          setR42NonBusiness(Number(rec.rule42Inputs.nonBusinessInputTaxInr || 0));
          setR42ExemptInput(Number(rec.rule42Inputs.exemptSuppliesInputTaxInr || 0));
          setR42BlockedInput(Number(rec.rule42Inputs.blockedInputTaxInr || 0));
          setR42TaxableInput(Number(rec.rule42Inputs.taxableSuppliesInputTaxInr || 0));
          setR42ExemptTurnover(Number(rec.rule42Inputs.exemptTurnoverInr || 0));
          setR42TotalTurnover(Number(rec.rule42Inputs.totalTurnoverInr || 0));
        }
        if (Array.isArray(rec.capitalAssets)) {
          setR43Assets(rec.capitalAssets);
        } else {
          setR43Assets([]);
        }
        if (rec.annualTrueUpInputs) {
          setAnnualCommonC2(Number(rec.annualTrueUpInputs.annualTotalCommonCredit_C2 || 0));
          setAnnualExemptE(Number(rec.annualTrueUpInputs.annualExemptTurnover_E || 0));
          setAnnualTotalF(Number(rec.annualTrueUpInputs.annualTotalTurnover_F || 0));
          setAnnualMonthlyPaid(Number(rec.annualTrueUpInputs.totalMonthlyReversalsAlreadyPaid || 0));
        }
      } else {
        setR43Assets([]);
      }
    } catch {
      // Keep clean empty state
    } finally {
      setIsLoadingReco(false);
    }
  }, [activeGstin, activePeriod, toleranceInr]);

  useEffect(() => {
    loadSavedWorkspace();
  }, [loadSavedWorkspace]);

  // Execute Deterministic Reconciliation + Sec 17(5) Classification + Overrides
  const recoReport = useMemo(() => {
    const raw = RecoMatcher.reconcile({
      taxPeriod: activePeriod,
      clientGstin: activeGstin || "",
      gstr2bInvoices: gstr2bList,
      booksInvoices: booksList,
      toleranceInr,
      overrides,
    });

    for (const record of raw.records) {
      if (overrides[record.id]) {
        record.manualOverride = overrides[record.id];
      }
      const cls = ItcClassifier.classify({
        hsnOrSacCode: record.hsnCode,
        itemDescription: record.itemDescription,
        vendorTradeName: record.vendorName,
      });
      if (cls.isBlocked) {
        record.section17_5Blocked = true;
        record.blockedCategory = cls.categoryTitle;
        if (!record.statutoryAuditTrail.includes("[BLOCKED:")) {
          record.statutoryAuditTrail = `${record.statutoryAuditTrail} [BLOCKED: ${cls.reason}]`;
        }
        if (record.manualOverride !== "ALLOW_EXCEPTION") {
          record.recommendedAction = cls.auditRecommendation;
        }
      }
    }
    return RecoMatcher.recomputeSummary(raw);
  }, [gstr2bList, booksList, activePeriod, activeGstin, toleranceInr, overrides]);

  // Auto-sync Rule 42 T & T3 from Reconciliation when Rule 42 inputs are currently zero
  const handleSyncRule42FromReco = () => {
    setR42TotalInputTax(Math.max(0, recoReport.summary.total2bItc));
    setR42BlockedInput(Math.max(0, recoReport.summary.ineligibleSec17_5Itc));
    toast.success("Synced from 2B Matcher", "Populated Total Input Tax (T) and Sec 17(5) Blocked (T3).");
  };

  const persistReconciliation = async (next2bList: Gstr2bInvoice[], nextBooksList: BooksPurchaseInvoice[]) => {
    const { ok, data } = await gstFetchJson<any>("/api/gst/reconciliation", {
      method: "POST",
      body: JSON.stringify({
        taxPeriod: activePeriod,
        clientGstin: activeGstin,
        gstr2bInvoices: next2bList,
        booksInvoices: nextBooksList,
        toleranceInr,
        overrides,
      }),
    });

    if (!ok || !data?.success) {
      toast.error("Save Failed", data?.error || "Could not save reconciliation to database.");
      return false;
    }
    setLastSavedAt(new Date().toISOString());
    playSuccessChime();
    window.dispatchEvent(new CustomEvent("bt_autopilot_sweep_completed"));
    return true;
  };

  const handleSelectBooksFile = async (file: File) => {
    setBooksFile(file);
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
      const buffer = await file.arrayBuffer();
      const sheets = readExcelSheetsFromBuffer(buffer);
      const first = sheets[0];
      if (first && first.headers.length > 0) {
        setBooksMappingPreview({
          headers: first.headers,
          mapping: autoDetectColumnMapping(first.headers),
          sampleRows: first.rows.slice(0, 3),
          buffer,
          isExcel: true,
        });
      }
    } else if (lower.endsWith(".csv") || lower.endsWith(".tsv") || lower.endsWith(".txt")) {
      const text = await file.text();
      const tbl = parseDelimitedTextToTable(text);
      if (tbl.headers.length > 0) {
        setBooksMappingPreview({
          headers: tbl.headers,
          mapping: autoDetectColumnMapping(tbl.headers),
          sampleRows: tbl.rows.slice(0, 3),
          isExcel: false,
        });
      }
    } else {
      setBooksMappingPreview(null);
    }
  };

  // Upload & Process Files
  const handleProcessUploadedFiles = async () => {
    if (!activeGstin) {
      toast.error("Select Client GSTIN", "Select a client and GSTIN first before uploading.");
      return;
    }
    if (!json2bFile && !booksFile) {
      toast.error("Files Required", "Select a GSTR-2B (.json/.xlsx) and/or Purchase Register (.xlsx/.csv/.tsv/.xml).");
      return;
    }

    setIsProcessingUpload(true);
    try {
      let next2bList = gstr2bList;
      let nextBooksList = booksList;

      if (json2bFile) {
        const lower2b = json2bFile.name.toLowerCase();
        if (lower2b.endsWith(".xlsx") || lower2b.endsWith(".xls")) {
          const buf = await json2bFile.arrayBuffer();
          const res2b = parseGstr2bExcelBuffer(buf);
          if (res2b.success && res2b.invoices.length > 0) {
            next2bList = res2b.invoices;
            setGstr2bList(res2b.invoices);
            toast.success("GSTR-2B Excel Parsed", `${res2b.invoices.length} portal invoices extracted.`);
          } else {
            toast.error("GSTR-2B Excel Error", res2b.errors[0] || "Could not parse GSTR-2B Excel.");
            setIsProcessingUpload(false);
            return;
          }
        } else {
          const text = await json2bFile.text();
          const res2b = parseOfficialGstr2bJson(text);
          if (res2b.success && res2b.invoices.length > 0) {
            next2bList = res2b.invoices;
            setGstr2bList(res2b.invoices);
            toast.success(
              "GSTR-2B Parsed",
              `${res2b.totalInvoices} records (Tax: ₹${res2b.totalTax.toLocaleString("en-IN")})`
            );
          } else {
            toast.error("GSTR-2B Parse Error", res2b.errors[0] || "Could not parse GSTR-2B JSON.");
            setIsProcessingUpload(false);
            return;
          }
        }
      }

      if (booksFile) {
        const lowerBk = booksFile.name.toLowerCase();
        if (lowerBk.endsWith(".xlsx") || lowerBk.endsWith(".xls")) {
          const buf = booksMappingPreview?.buffer || (await booksFile.arrayBuffer());
          const resBooks = parsePurchaseExcelBuffer(buf, booksMappingPreview?.mapping);
          if (resBooks.success && resBooks.invoices.length > 0) {
            nextBooksList = resBooks.invoices;
            setBooksList(resBooks.invoices);
            toast.success("Purchase Excel Parsed", `${resBooks.invoices.length} vouchers extracted.`);
          } else {
            toast.error("Books Excel Error", resBooks.errors[0] || "Could not parse Purchase Excel.");
            setIsProcessingUpload(false);
            return;
          }
        } else {
          const text = await booksFile.text();
          const resBooks = parsePurchaseRegisterCsv(text);
          if (resBooks.success && resBooks.invoices.length > 0) {
            nextBooksList = resBooks.invoices;
            setBooksList(resBooks.invoices);
            toast.success(
              "Purchase Register Parsed",
              `${resBooks.totalInvoices} vouchers (Tax: ₹${resBooks.totalTax.toLocaleString("en-IN")})`
            );
          } else {
            toast.error("Books Parse Error", resBooks.errors[0] || "Could not parse Purchase Register.");
            setIsProcessingUpload(false);
            return;
          }
        }
      }

      const saved = await persistReconciliation(next2bList, nextBooksList);
      if (saved) {
        setIsUploadModalOpen(false);
        setJson2bFile(null);
        setBooksFile(null);
        setBooksMappingPreview(null);
        toast.success("Reconciliation Saved", `Saved for ${activeGstin} (${activePeriod}).`);
      }
    } catch (e: any) {
      toast.error("Upload Error", e?.message || "Failed to process files.");
    } finally {
      setIsProcessingUpload(false);
    }
  };

  const handleFetch2bFromGstn = async () => {
    if (!activeGstin) return;
    setIsFetchingPortal2b(true);
    try {
      const returnPeriod = toGstnReturnPeriod(activePeriod);
      const { ok, data } = await gstFetchJson<any>("/api/gst/sync-portal", {
        method: "POST",
        body: JSON.stringify({ action: "FETCH_2B", gstin: activeGstin, returnPeriod }),
      });
      if (!ok || !data?.success || !Array.isArray(data.invoices) || data.invoices.length === 0) {
        toast.warning(
          "GSTN 2B Pull Unavailable",
          data?.errors?.[0] || data?.error || "Portal GSP requires taxpayer OTP session or no B2B invoices found. Use JSON/Excel upload."
        );
        return;
      }
      setGstr2bList(data.invoices);
      await persistReconciliation(data.invoices, booksList);
      toast.success("GSTR-2B Fetched from GSTN", `${data.totalInvoices} invoices loaded & reconciled.`);
    } catch (err: any) {
      toast.error("GSTN 2B Fetch Error", err?.message || "Failed to connect to GSTN GSP.");
    } finally {
      setIsFetchingPortal2b(false);
    }
  };

  const handlePullPurchaseFromTally = async () => {
    if (!activeGstin) return;
    setIsPullingTally(true);
    try {
      const mMap: Record<string, string> = {
        jan: "01", january: "01", feb: "02", february: "02", mar: "03", march: "03",
        apr: "04", april: "04", may: "05", jun: "06", june: "06", jul: "07", july: "07",
        aug: "08", august: "08", sep: "09", september: "09", oct: "10", october: "10",
        nov: "11", november: "11", dec: "12", december: "12",
      };
      const parts = activePeriod.trim().match(/^([A-Za-z]+)\s+(\d{4})$/);
      const mm = parts ? mMap[parts[1].toLowerCase()] || "04" : "04";
      const yr = parts ? Number(parts[2]) : new Date().getFullYear();
      const lastDay = new Date(yr, Number(mm), 0).getDate();
      const res = await pullPurchaseVouchersFromTallyPrime({
        companyName: selectedClient?.tradeName || selectedClient?.name,
        fromDateYYYYMMDD: `${yr}${mm}01`,
        toDateYYYYMMDD: `${yr}${mm}${String(lastDay).padStart(2, "0")}`,
      });
      if (!res.ok) {
        toast.warning("TallyPrime Pull Failed", res.error || "Could not reach TallyPrime at localhost:9000.");
        return;
      }
      if (res.invoices.length === 0) {
        toast.warning("No Purchase Vouchers", `TallyPrime returned 0 Purchase vouchers for ${activePeriod}.`);
        return;
      }
      setBooksList(res.invoices);
      await persistReconciliation(gstr2bList, res.invoices);
      toast.success("TallyPrime Synced", `Pulled & reconciled ${res.invoices.length} Purchase vouchers.`);
    } catch (err: any) {
      toast.error("TallyPrime Error", err?.message || "Failed to pull from TallyPrime.");
    } finally {
      setIsPullingTally(false);
    }
  };

  const handleOpenClientDocs = async () => {
    if (!selectedClient?.id) return;
    setShowClientDocsModal(true);
    setIsLoadingDocs(true);
    try {
      const { ok, data } = await gstFetchJson<any>(
        `/api/gst/client-docs?entityId=${encodeURIComponent(selectedClient.id)}`
      );
      if (ok && data?.success) setClientDocsList(data.documents || []);
    } catch {
      setClientDocsList([]);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleImportClientDoc = async (doc: any, target: "2B" | "BOOKS") => {
    try {
      const { ok, data } = await gstFetchJson<any>(
        `/api/gst/client-docs?documentId=${encodeURIComponent(doc.id)}`
      );
      if (!ok || !data?.base64) {
        toast.error("Import Failed", data?.error || "Document binary unavailable.");
        return;
      }
      const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
      const lower = String(data.fileName || "").toLowerCase();

      if (target === "2B") {
        const res2b =
          lower.endsWith(".xlsx") || lower.endsWith(".xls")
            ? parseGstr2bExcelBuffer(bytes.buffer)
            : parseOfficialGstr2bJson(new TextDecoder().decode(bytes));
        if (!res2b.success || res2b.invoices.length === 0) {
          toast.error("Parse Error", res2b.errors[0] || "Invalid 2B format.");
          return;
        }
        setGstr2bList(res2b.invoices);
        await persistReconciliation(res2b.invoices, booksList);
        toast.success("Imported 2B from Client Docs", `${res2b.invoices.length} invoices loaded.`);
      } else {
        const resBk =
          lower.endsWith(".xlsx") || lower.endsWith(".xls")
            ? parsePurchaseExcelBuffer(bytes.buffer)
            : parsePurchaseRegisterCsv(new TextDecoder().decode(bytes));
        if (!resBk.success || resBk.invoices.length === 0) {
          toast.error("Parse Error", resBk.errors[0] || "Invalid Purchase Register format.");
          return;
        }
        setBooksList(resBk.invoices);
        await persistReconciliation(gstr2bList, resBk.invoices);
        toast.success("Imported Books from Client Docs", `${resBk.invoices.length} vouchers loaded.`);
      }
      setShowClientDocsModal(false);
    } catch (err: any) {
      toast.error("Import Error", err?.message || "Failed to import document.");
    }
  };

  // Manual Override Persistence
  const handleSetOverride = async (recordId: string, overrideVal: RecoManualOverride) => {
    playSoftClick();
    const nextOverrides = { ...overrides };
    if (overrideVal === "DEFAULT") delete nextOverrides[recordId];
    else nextOverrides[recordId] = overrideVal;
    setOverrides(nextOverrides);

    if (activeGstin && (gstr2bList.length > 0 || booksList.length > 0)) {
      const { ok } = await gstFetchJson("/api/gst/reconciliation", {
        method: "PATCH",
        body: JSON.stringify({
          clientGstin: activeGstin,
          taxPeriod: activePeriod,
          overrides: nextOverrides,
        }),
      });
      if (ok) toast.success("Audit Override Saved", `Updated classification to ${overrideVal.replace(/_/g, " ")}.`);
    }
  };

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return recoReport.records.filter((r) => {
      const isBlockedEff =
        r.manualOverride === "FORCE_BLOCKED_17_5" ||
        (r.section17_5Blocked && r.manualOverride !== "ALLOW_EXCEPTION");
      let matchesFilter = true;
      if (filterStatus === "EXACT") matchesFilter = r.matchStatus === "EXACT_MATCH" && !isBlockedEff;
      else if (filterStatus === "FUZZY")
        matchesFilter = (r.matchStatus === "FUZZY_MATCHED" || r.matchStatus === "DATE_LEEWAY_MATCHED") && !isBlockedEff;
      else if (filterStatus === "ROUNDING") matchesFilter = r.matchStatus === "ROUNDING_MATCHED";
      else if (filterStatus === "MISMATCH") matchesFilter = r.matchStatus === "VALUE_MISMATCH" || r.taxHeadMismatch;
      else if (filterStatus === "MISSING_2B") matchesFilter = r.matchStatus === "MISSING_IN_2B";
      else if (filterStatus === "MISSING_BOOKS") matchesFilter = r.matchStatus === "MISSING_IN_BOOKS";
      else if (filterStatus === "SEC_17_5") matchesFilter = isBlockedEff;
      else if (filterStatus === "RULE_37A") matchesFilter = r.rule37aRisk;
      else if (filterStatus === "HELD") matchesFilter = r.manualOverride === "HOLD_NEXT_PERIOD";

      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        r.vendorName.toLowerCase().includes(q) ||
        r.vendorGstin.toLowerCase().includes(q) ||
        (r.gstr2bInvoiceNo && r.gstr2bInvoiceNo.toLowerCase().includes(q)) ||
        (r.booksInvoiceNo && r.booksInvoiceNo.toLowerCase().includes(q));

      return matchesFilter && matchesSearch;
    });
  }, [recoReport.records, filterStatus, search]);

  // Real Vendor Risk Profiles (strictly derived from uploaded data + live GSTN lookup)
  const vendorProfiles = useMemo<VendorComplianceProfile[]>(() => {
    const map = new Map<
      string,
      {
        gstin: string;
        name: string;
        taxable: number;
        itc: number;
        invoices: ReconciledRecord[];
      }
    >();

    for (const r of recoReport.records) {
      if (!r.vendorGstin) continue;
      if (!map.has(r.vendorGstin)) {
        map.set(r.vendorGstin, {
          gstin: r.vendorGstin,
          name: r.vendorName,
          taxable: 0,
          itc: 0,
          invoices: [],
        });
      }
      const entry = map.get(r.vendorGstin)!;
      entry.taxable += r.gstr2bTaxableValue || r.booksTaxableValue;
      entry.itc += r.gstr2bTotalTax || r.booksTotalTax;
      entry.invoices.push(r);
    }

    return Array.from(map.values()).map((v) => {
      const missingIn2bCount = v.invoices.filter((i) => i.matchStatus === "MISSING_IN_2B").length;
      const unfiled3bIn2bCount = v.invoices.filter(
        (i) => i.matchStatus !== "MISSING_IN_2B" && i.rule37aRisk
      ).length;
      const verified = verifiedVendors[v.gstin];

      return VendorRiskEngine.evaluateRisk({
        vendorGstin: v.gstin,
        tradeName: v.name,
        legalName: verified?.legalName,
        gstnStatus: verified?.status || "UNVERIFIED",
        verifiedViaGstn: Boolean(verified),
        dateOfRegistration: verified?.regDate,
        totalInvoicesCount: v.invoices.length,
        gstr1FiledCount: verified?.gstr1Filed,
        gstr1TotalCount: verified?.gstr1Total,
        gstr3bFiledCount: verified?.gstr3bFiled,
        gstr3bTotalCount: verified?.gstr3bTotal,
        missingIn2bCount,
        unfiled3bIn2bCount,
        totalTaxableValueInr: v.taxable,
        totalItcInr: v.itc,
        invoicesOver180DaysUnpaid: v.invoices
          .filter((i) => i.rule37_180DayRisk)
          .map((i) => ({
            invoiceNo: i.booksInvoiceNo || i.gstr2bInvoiceNo || "UNKNOWN",
            taxableValue: i.booksTaxableValue,
            itcAmount: i.booksTotalTax,
            daysOld: 181,
          })),
      });
    });
  }, [recoReport.records, verifiedVendors]);

  const handleVerifyVendorGstin = async (vendorGstin: string) => {
    setVerifyingVendorGstin(vendorGstin);
    try {
      const { ok, data } = await gstFetchJson<any>(
        `/api/gst/lookup?gstin=${encodeURIComponent(vendorGstin)}&returns=true&fy=${encodeURIComponent(selectedFy)}`
      );
      if (!ok || !data?.success || !data?.data) {
        toast.warning("GSTN Lookup Unavailable", data?.error || "Could not fetch live vendor GSTN profile.");
        return;
      }
      const p = data.data;
      const statusStr = String(p.status || "").toUpperCase();
      const status: VendorGstnStatus = statusStr.includes("CANCEL")
        ? "CANCELLED"
        : statusStr.includes("SUSPEND")
        ? "SUSPENDED"
        : "ACTIVE";

      const retList: any[] = data.returnsData?.returns || data.returns || [];
      const r1 = retList.filter((r) => String(r.returnType || "").includes("1"));
      const r3b = retList.filter((r) => String(r.returnType || "").includes("3B"));

      setVerifiedVendors((prev) => ({
        ...prev,
        [vendorGstin]: {
          status,
          legalName: p.legalName,
          regDate: p.registrationDate,
          gstr1Filed: r1.filter((r) => String(r.filingStatus).toUpperCase().includes("FILED")).length,
          gstr1Total: r1.length || undefined,
          gstr3bFiled: r3b.filter((r) => String(r.filingStatus).toUpperCase().includes("FILED")).length,
          gstr3bTotal: r3b.length || undefined,
        },
      }));
      toast.success("Vendor Verified", `${p.legalName} — ${status}`);
    } catch (err: any) {
      toast.error("Verification Error", err?.message || "Failed to verify vendor GSTN.");
    } finally {
      setVerifyingVendorGstin(null);
    }
  };

  const handleBatchVerifyAllVendors = async () => {
    const gstins = vendorProfiles.map((v) => v.vendorGstin).filter((g) => g && g.length === 15);
    if (gstins.length === 0) return;
    setIsBatchVerifying(true);
    try {
      const { ok, data } = await gstFetchJson<any>("/api/gst/sync-portal", {
        method: "POST",
        body: JSON.stringify({ action: "BATCH_VENDOR_VERIFY", gstins, fy: selectedFy }),
      });
      if (!ok || !data?.success || !data.results) {
        toast.warning("Batch Verify Unavailable", data?.error || "Could not verify vendors against GSTN.");
        return;
      }
      setVerifiedVendors((prev) => ({ ...prev, ...data.results }));
      toast.success("Batch GSTN Verification Complete", `Verified ${Object.keys(data.results).length} suppliers live.`);
    } catch (err: any) {
      toast.error("Batch Verify Error", err?.message || "Failed batch vendor check.");
    } finally {
      setIsBatchVerifying(false);
    }
  };

  // Rule 42 & 43 Calculations
  const r42Result = useMemo<Rule42CalculationResult>(() => {
    return Rule42And43Engine.calculateMonthlyRule42({
      taxPeriod: activePeriod,
      totalInputTaxInr: r42TotalInputTax,
      nonBusinessInputTaxInr: r42NonBusiness,
      exemptSuppliesInputTaxInr: r42ExemptInput,
      blockedInputTaxInr: r42BlockedInput,
      taxableSuppliesInputTaxInr: r42TaxableInput,
      exemptTurnoverInr: r42ExemptTurnover,
      totalTurnoverInr: r42TotalTurnover,
    });
  }, [
    activePeriod,
    r42TotalInputTax,
    r42NonBusiness,
    r42ExemptInput,
    r42BlockedInput,
    r42TaxableInput,
    r42ExemptTurnover,
    r42TotalTurnover,
  ]);

  const r43Result = useMemo<Rule43MonthlyResult>(() => {
    return Rule42And43Engine.calculateMonthlyRule43({
      taxPeriod: activePeriod,
      capitalAssets: r43Assets,
      exemptTurnoverInr: r42ExemptTurnover,
      totalTurnoverInr: r42TotalTurnover,
    });
  }, [activePeriod, r43Assets, r42ExemptTurnover, r42TotalTurnover]);

  const annualTrueUpResult = useMemo<Rule42AnnualTrueUpResult>(() => {
    return Rule42And43Engine.calculateAnnualTrueUpRule42({
      financialYear: `FY ${selectedFy}`,
      annualTotalCommonCredit_C2: annualCommonC2,
      annualExemptTurnover_E: annualExemptE,
      annualTotalTurnover_F: annualTotalF,
      totalMonthlyReversalsAlreadyPaid: annualMonthlyPaid,
      trueUpFilingDate: annualFilingDate,
    });
  }, [selectedFy, annualCommonC2, annualExemptE, annualTotalF, annualMonthlyPaid, annualFilingDate]);

  const handleSaveRule42And43 = async () => {
    if (!activeGstin) {
      toast.error("Select GSTIN", "Select a client GSTIN to save Rule 42/43 workpaper.");
      return;
    }
    setIsSavingRule42(true);
    try {
      await Promise.all([
        gstFetchJson("/api/gst/rule42-43", {
          method: "POST",
          body: JSON.stringify({
            mode: "RULE_42_MONTHLY",
            clientGstin: activeGstin,
            taxPeriod: activePeriod,
            totalInputTaxInr: r42TotalInputTax,
            nonBusinessInputTaxInr: r42NonBusiness,
            exemptSuppliesInputTaxInr: r42ExemptInput,
            blockedInputTaxInr: r42BlockedInput,
            taxableSuppliesInputTaxInr: r42TaxableInput,
            exemptTurnoverInr: r42ExemptTurnover,
            totalTurnoverInr: r42TotalTurnover,
          }),
        }),
        gstFetchJson("/api/gst/rule42-43", {
          method: "POST",
          body: JSON.stringify({
            mode: "RULE_43_CAPITAL_GOODS",
            clientGstin: activeGstin,
            taxPeriod: activePeriod,
            capitalAssets: r43Assets,
            exemptTurnoverInr: r42ExemptTurnover,
            totalTurnoverInr: r42TotalTurnover,
          }),
        }),
        gstFetchJson("/api/gst/rule42-43", {
          method: "POST",
          body: JSON.stringify({
            mode: "RULE_42_ANNUAL_TRUE_UP",
            clientGstin: activeGstin,
            taxPeriod: activePeriod,
            financialYear: `FY ${selectedFy}`,
            annualTotalCommonCredit_C2: annualCommonC2,
            annualExemptTurnover_E: annualExemptE,
            annualTotalTurnover_F: annualTotalF,
            totalMonthlyReversalsAlreadyPaid: annualMonthlyPaid,
            trueUpFilingDate: annualFilingDate,
          }),
        }),
      ]);
      toast.success("Rule 42/43 Workpaper Saved", `Persisted for ${activeGstin} (${activePeriod}).`);
    } catch (err: any) {
      toast.error("Save Failed", err?.message || "Failed to save Rule 42/43 workpaper.");
    } finally {
      setIsSavingRule42(false);
    }
  };

  // Notice Dispatcher
  const buildNoticeForRecord = (record: ReconciledRecord, phoneOverride?: string) => {
    return VendorNoticeGenerator.generateNotice({
      buyerEntityName: selectedClient?.tradeName || selectedClient?.name || "Client Assessee",
      buyerGstin: activeGstin,
      vendorTradeName: record.vendorName,
      vendorGstin: record.vendorGstin,
      vendorContactPhone: phoneOverride ?? record.vendorPhone ?? "",
      taxPeriod: activePeriod,
      invoices: [
        {
          invoiceNumber: record.booksInvoiceNo || record.gstr2bInvoiceNo || "INV",
          invoiceDate: record.booksDate || record.gstr2bDate || "",
          taxableValue: record.booksTaxableValue || record.gstr2bTaxableValue,
          igst: record.booksIgst || record.gstr2bIgst,
          cgst: record.booksCgst || record.gstr2bCgst,
          sgst: record.booksSgst || record.gstr2bSgst,
          totalTax: record.booksTotalTax || record.gstr2bTotalTax,
          totalInvoiceValue:
            (record.booksTaxableValue || record.gstr2bTaxableValue) +
            (record.booksTotalTax || record.gstr2bTotalTax),
          reason:
            record.matchStatus === "MISSING_IN_2B"
              ? "NOT_IN_GSTR_2B"
              : record.rule37aRisk
              ? "GSTR_3B_UNFILED"
              : "TAX_MISMATCH",
          discrepancyDetails: record.statutoryAuditTrail,
        },
      ],
    });
  };

  const handleGenerateNotice = (record: ReconciledRecord) => {
    playSoftClick();
    setPendingNoticeRecord(record);
    setNoticePhoneInput(record.vendorPhone || "");
    const notice = buildNoticeForRecord(record, record.vendorPhone || "");
    setSelectedNotice(notice);
    setIsNoticeModalOpen(true);
  };

  const handleArchiveAndSendNotice = async () => {
    if (!pendingNoticeRecord) return;
    const notice = buildNoticeForRecord(pendingNoticeRecord, noticePhoneInput);
    setSelectedNotice(notice);
    await gstFetchJson("/api/gst/vendor-notice", {
      method: "POST",
      body: JSON.stringify({
        buyerEntityName: selectedClient?.tradeName || selectedClient?.name || "Client Assessee",
        buyerGstin: activeGstin,
        vendorTradeName: pendingNoticeRecord.vendorName,
        vendorGstin: pendingNoticeRecord.vendorGstin,
        vendorContactPhone: noticePhoneInput,
        taxPeriod: activePeriod,
        invoices: [
          {
            invoiceNumber: pendingNoticeRecord.booksInvoiceNo || pendingNoticeRecord.gstr2bInvoiceNo || "INV",
            invoiceDate: pendingNoticeRecord.booksDate || pendingNoticeRecord.gstr2bDate || "",
            taxableValue: pendingNoticeRecord.booksTaxableValue || pendingNoticeRecord.gstr2bTaxableValue,
            igst: pendingNoticeRecord.booksIgst || pendingNoticeRecord.gstr2bIgst,
            cgst: pendingNoticeRecord.booksCgst || pendingNoticeRecord.gstr2bCgst,
            sgst: pendingNoticeRecord.booksSgst || pendingNoticeRecord.gstr2bSgst,
            totalTax: pendingNoticeRecord.booksTotalTax || pendingNoticeRecord.gstr2bTotalTax,
            totalInvoiceValue:
              (pendingNoticeRecord.booksTaxableValue || pendingNoticeRecord.gstr2bTaxableValue) +
              (pendingNoticeRecord.booksTotalTax || pendingNoticeRecord.gstr2bTotalTax),
            reason:
              pendingNoticeRecord.matchStatus === "MISSING_IN_2B"
                ? "NOT_IN_GSTR_2B"
                : pendingNoticeRecord.rule37aRisk
                ? "GSTR_3B_UNFILED"
                : "TAX_MISMATCH",
          },
        ],
      }),
    });
    window.open(notice.whatsappUrl, "_blank", "noopener,noreferrer");
    toast.success("Notice Archived & Opened", `Recorded in audit trail for ${pendingNoticeRecord.vendorName}.`);
    setIsNoticeModalOpen(false);
  };

  const handleBatchArchiveVendorNotices = async () => {
    const defaulters = recoReport.records.filter(
      (r) => r.matchStatus === "MISSING_IN_2B" || r.rule37aRisk || r.matchStatus === "VALUE_MISMATCH"
    );
    if (defaulters.length === 0) return;

    const grouped = new Map<string, ReconciledRecord[]>();
    for (const r of defaulters) {
      if (!grouped.has(r.vendorGstin)) grouped.set(r.vendorGstin, []);
      grouped.get(r.vendorGstin)!.push(r);
    }

    const digestLines: string[] = [];
    for (const [gstin, recs] of grouped.entries()) {
      const first = recs[0];
      const invPayload = recs.map((r) => ({
        invoiceNumber: r.booksInvoiceNo || r.gstr2bInvoiceNo || "INV",
        invoiceDate: r.booksDate || r.gstr2bDate || "",
        taxableValue: r.booksTaxableValue || r.gstr2bTaxableValue,
        igst: r.booksIgst || r.gstr2bIgst,
        cgst: r.booksCgst || r.gstr2bCgst,
        sgst: r.booksSgst || r.gstr2bSgst,
        totalTax: r.booksTotalTax || r.gstr2bTotalTax,
        totalInvoiceValue: (r.booksTaxableValue || r.gstr2bTaxableValue) + (r.booksTotalTax || r.gstr2bTotalTax),
        reason: (r.matchStatus === "MISSING_IN_2B"
          ? "NOT_IN_GSTR_2B"
          : r.rule37aRisk
          ? "GSTR_3B_UNFILED"
          : "TAX_MISMATCH") as "NOT_IN_GSTR_2B" | "GSTR_3B_UNFILED" | "TAX_MISMATCH",
      }));
      await gstFetchJson("/api/gst/vendor-notice", {
        method: "POST",
        body: JSON.stringify({
          buyerEntityName: selectedClient?.tradeName || selectedClient?.name || "Client Assessee",
          buyerGstin: activeGstin,
          vendorTradeName: first.vendorName,
          vendorGstin: gstin,
          vendorContactPhone: first.vendorPhone || "",
          taxPeriod: activePeriod,
          invoices: invPayload,
        }),
      });
      const totalRisk = invPayload.reduce((s, i) => s + i.totalTax, 0);
      digestLines.push(`${first.vendorName} (${gstin}) | ${recs.length} Inv | Tax Risk ₹${totalRisk.toLocaleString("en-IN")}`);
    }

    navigator.clipboard?.writeText(digestLines.join("\n")).catch(() => {});
    toast.success("Batch Notices Archived", `Archived ${grouped.size} consolidated vendor notices & copied digest.`);
  };

  // Multi-head Tally XML Export (single or batch)
  const buildTallyVoucherXml = (record: ReconciledRecord) => {
    const companyName = (selectedClient?.tradeName || selectedClient?.name || "Client Entity").replace(/&/g, "&amp;");
    const partyName = record.vendorName.replace(/&/g, "&amp;");
    const invNo = (record.gstr2bInvoiceNo || "").replace(/&/g, "&amp;");
    const totalAmt = (record.gstr2bTaxableValue + record.gstr2bTotalTax).toFixed(2);
    const dt = (record.gstr2bDate || new Date().toISOString().split("T")[0]).replace(/-/g, "");
    const vchType = record.isCreditNote ? "Debit Note" : "Purchase";

    const taxLedgers: string[] = [];
    if (record.gstr2bIgst > 0) {
      taxLedgers.push(`<ALLLEDGERENTRIES.LIST><LEDGERNAME>Input IGST</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-${record.gstr2bIgst.toFixed(2)}</AMOUNT></ALLLEDGERENTRIES.LIST>`);
    }
    if (record.gstr2bCgst > 0) {
      taxLedgers.push(`<ALLLEDGERENTRIES.LIST><LEDGERNAME>Input CGST</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-${record.gstr2bCgst.toFixed(2)}</AMOUNT></ALLLEDGERENTRIES.LIST>`);
    }
    if (record.gstr2bSgst > 0) {
      taxLedgers.push(`<ALLLEDGERENTRIES.LIST><LEDGERNAME>Input SGST</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-${record.gstr2bSgst.toFixed(2)}</AMOUNT></ALLLEDGERENTRIES.LIST>`);
    }
    if (record.gstr2bCess > 0) {
      taxLedgers.push(`<ALLLEDGERENTRIES.LIST><LEDGERNAME>Input Cess</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-${record.gstr2bCess.toFixed(2)}</AMOUNT></ALLLEDGERENTRIES.LIST>`);
    }

    return `<TALLYMESSAGE xmlns:UDF="TallyUDF">
  <VOUCHER VCHTYPE="${vchType}" ACTION="Create">
    <DATE>${dt}</DATE>
    <VOUCHERTYPENAME>${vchType}</VOUCHERTYPENAME>
    <REFERENCE>${invNo}</REFERENCE>
    <PARTYLEDGERNAME>${partyName}</PARTYLEDGERNAME>
    <PARTYGSTIN>${record.vendorGstin}</PARTYGSTIN>
    <PERSISTEDVIEW>Invoice View</PERSISTEDVIEW>
    <ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>${partyName}</LEDGERNAME>
      <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
      <AMOUNT>${totalAmt}</AMOUNT>
    </ALLLEDGERENTRIES.LIST>
    <ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>Purchase Account</LEDGERNAME>
      <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
      <AMOUNT>-${record.gstr2bTaxableValue.toFixed(2)}</AMOUNT>
    </ALLLEDGERENTRIES.LIST>
    ${taxLedgers.join("\n    ")}
  </VOUCHER>
</TALLYMESSAGE>`;
  };

  const handleExportTallyMissingXml = (recordsToExport: ReconciledRecord[], filenameSuffix: string) => {
    if (recordsToExport.length === 0) return;
    playSuccessChime();
    const companyName = (selectedClient?.tradeName || selectedClient?.name || "Client Entity").replace(/&/g, "&amp;");
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES><SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY></STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        ${recordsToExport.map(buildTallyVoucherXml).join("\n")}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Tally_Vouchers_${filenameSuffix.replace(/[^a-zA-Z0-9]/g, "_")}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Tally XML Generated", `Exported ${recordsToExport.length} voucher(s) with IGST/CGST/SGST split.`);
  };

  // Export CSV Workpaper
  const handleExportRecoCsv = () => {
    if (recoReport.records.length === 0) return;
    const headers = [
      "Vendor GSTIN", "Vendor Name", "Match Status", "2B Invoice No", "2B Date",
      "2B Taxable", "2B IGST", "2B CGST", "2B SGST", "2B Cess", "2B Total Tax",
      "Books Invoice No", "Books Date", "Books Taxable", "Books Total Tax",
      "Tax Variance", "Sec 17(5) Blocked", "Rule 37A Risk", "Tax Head Mismatch",
      "Manual Override", "Audit Trail"
    ];
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = recoReport.records.map((r) => [
      r.vendorGstin, r.vendorName, r.matchStatus, r.gstr2bInvoiceNo || "", r.gstr2bDate || "",
      r.gstr2bTaxableValue, r.gstr2bIgst, r.gstr2bCgst, r.gstr2bSgst, r.gstr2bCess, r.gstr2bTotalTax,
      r.booksInvoiceNo || "", r.booksDate || "", r.booksTaxableValue, r.booksTotalTax,
      r.taxVariance, r.section17_5Blocked ? "YES" : "NO", r.rule37aRisk ? "YES" : "NO",
      r.taxHeadMismatch ? "YES" : "NO", r.manualOverride || "DEFAULT", r.statutoryAuditTrail
    ].map(esc).join(","));

    const csv = [headers.map(esc).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GSTR2B_Reco_${activeGstin}_${activePeriod.replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSV Exported", "Full reconciliation workpaper downloaded.");
  };

  const handleExportMultiSheetXlsx = () => {
    if (recoReport.records.length === 0) return;
    const toRow = (r: ReconciledRecord) => ({
      VendorGSTIN: r.vendorGstin,
      VendorName: r.vendorName,
      MatchStatus: r.matchStatus,
      "2B_InvNo": r.gstr2bInvoiceNo || "",
      "2B_Date": r.gstr2bDate || "",
      "2B_Taxable": r.gstr2bTaxableValue,
      "2B_IGST": r.gstr2bIgst,
      "2B_CGST": r.gstr2bCgst,
      "2B_SGST": r.gstr2bSgst,
      "2B_TotalTax": r.gstr2bTotalTax,
      Books_InvNo: r.booksInvoiceNo || "",
      Books_Date: r.booksDate || "",
      Books_Taxable: r.booksTaxableValue,
      Books_TotalTax: r.booksTotalTax,
      TaxVariance: r.taxVariance,
      Sec17_5_Blocked: r.section17_5Blocked ? "YES" : "NO",
      Rule37A_Risk: r.rule37aRisk ? "YES" : "NO",
      ManualOverride: r.manualOverride || "DEFAULT",
      AuditTrail: r.statutoryAuditTrail,
    });
    downloadWorkbookXlsx(
      `GSTR2B_Audit_Workpaper_${activeGstin}_${activePeriod.replace(/\s+/g, "_")}.xlsx`,
      [
        {
          name: "Table4_Summary",
          rows: [
            { Particular: "Client GSTIN", Value: activeGstin },
            { Particular: "Period", Value: activePeriod },
            { Particular: "GSTR-2B Total ITC", Value: recoReport.summary.total2bItc },
            { Particular: "Books Total ITC", Value: recoReport.summary.totalBooksItc },
            { Particular: "Eligible 4(A)(5) ITC", Value: recoReport.summary.matchedEligibleItc },
            { Particular: "Sec 17(5) Blocked 4(B)(1)", Value: recoReport.summary.ineligibleSec17_5Itc },
            { Particular: "Missing in 2B Count", Value: recoReport.summary.missingIn2b },
            { Particular: "Missing in Books Count", Value: recoReport.summary.missingInBooks },
          ],
        },
        { name: "All_Reconciliation", rows: recoReport.records.map(toRow) },
        {
          name: "Missing_In_2B",
          rows: recoReport.records.filter((r) => r.matchStatus === "MISSING_IN_2B").map(toRow),
        },
        {
          name: "Missing_In_Books",
          rows: recoReport.records.filter((r) => r.matchStatus === "MISSING_IN_BOOKS").map(toRow),
        },
        {
          name: "Sec17_5_Blocked",
          rows: recoReport.records.filter((r) => r.section17_5Blocked || !r.itcAvailableIn2b).map(toRow),
        },
      ]
    );
    toast.success("Excel Workpaper Downloaded", "5-sheet GSTR-2B audit workbook generated.");
  };

  const totalCombinedReversal4B2 =
    Math.round((r42Result.totalMonthlyReversal + r43Result.monthlyExemptReversal_Te + recoReport.summary.table4B2_TemporaryReversal.total) * 100) / 100;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                Sec 16(2)(aa) &bull; Circular 170/02/2022-GST
              </span>
              {lastSavedAt && (
                <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Saved {lastSavedAt.split("T")[0]}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              GSTR-2B Reconciliation &amp; Table 4 Engine
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <UniversalClientSelector variant="full" />

            {/* Return Period Selector */}
            <select
              value={activePeriod}
              onChange={(e) => selectPeriod(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none"
            >
              {fyPeriods.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* Tolerance */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700">
              <Scale className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={toleranceInr}
                onChange={(e) => setToleranceInr(parseFloat(e.target.value))}
                className="bg-transparent font-semibold text-slate-900 outline-none cursor-pointer"
              >
                <option value={1.0}>± ₹1</option>
                <option value={2.0}>± ₹2</option>
                <option value={5.0}>± ₹5</option>
                <option value={10.0}>± ₹10</option>
              </select>
            </div>

            <button
              onClick={handleFetch2bFromGstn}
              disabled={!activeGstin || isFetchingPortal2b}
              className="px-2.5 py-2 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 border border-indigo-200 text-indigo-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
              title="Fetch GSTR-2B directly from GSTN Portal via GSP API"
            >
              <Globe className={`w-3.5 h-3.5 ${isFetchingPortal2b ? "animate-spin" : ""}`} />
              {isFetchingPortal2b ? "Fetching 2B..." : "Fetch 2B API"}
            </button>

            <button
              onClick={handlePullPurchaseFromTally}
              disabled={!activeGstin || isPullingTally}
              className="px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
              title="Pull live Purchase Vouchers from TallyPrime XML Server (localhost:9000)"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPullingTally ? "animate-spin" : ""}`} />
              {isPullingTally ? "Pulling Tally..." : "Tally (9000)"}
            </button>

            <button
              onClick={handleOpenClientDocs}
              disabled={!selectedClient?.id}
              className="px-2.5 py-2 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
              title="Import GSTR-2B or Purchase Register from Client Uploaded Documents"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Client Docs
            </button>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              disabled={!activeGstin}
              className="px-3 py-2 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              Upload 2B &amp; Books
            </button>

            <button
              onClick={() => setIsTable4DrawerOpen(true)}
              disabled={recoReport.records.length === 0}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
            >
              <FileCheck className="w-3.5 h-3.5" />
              GSTR-3B Table 4
            </button>
          </div>
        </div>

        {/* Statutory Telemetry Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-100">
          <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-500 uppercase block">Books Net ITC</span>
            <span className="text-sm font-bold text-slate-900 font-mono mt-0.5 block">
              {formatCurrencyINR(recoReport.summary.totalBooksItc)}
            </span>
            <span className="text-[10px] text-slate-500">{booksList.length} Vouchers</span>
          </div>

          <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-500 uppercase block">GSTR-2B Net ITC</span>
            <span className="text-sm font-bold text-blue-900 font-mono mt-0.5 block">
              {formatCurrencyINR(recoReport.summary.total2bItc)}
            </span>
            <span className="text-[10px] text-blue-600">{gstr2bList.length} Docs</span>
          </div>

          <div className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-200">
            <span className="text-[10px] font-semibold text-emerald-700 uppercase block">Net Eligible 4(C)</span>
            <span className="text-sm font-bold text-emerald-900 font-mono mt-0.5 block">
              {formatCurrencyINR(recoReport.summary.netItc4C.total)}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold">
              {recoReport.summary.exactMatches + recoReport.summary.fuzzyMatches + recoReport.summary.roundingMatches} Matched
            </span>
          </div>

          <div className="bg-amber-50/50 rounded-lg p-3 border border-amber-200">
            <span className="text-[10px] font-semibold text-amber-700 uppercase block">Sec 17(5) / Ineligible</span>
            <span className="text-sm font-bold text-amber-900 font-mono mt-0.5 block">
              {formatCurrencyINR(recoReport.summary.ineligibleSec17_5Itc)}
            </span>
            <span className="text-[10px] text-amber-600 font-semibold">Table 4(B)(1)</span>
          </div>

          <div className="bg-rose-50/50 rounded-lg p-3 border border-rose-200">
            <span className="text-[10px] font-semibold text-rose-700 uppercase block">Missing in 2B</span>
            <span className="text-sm font-bold text-rose-900 font-mono mt-0.5 block">
              {formatCurrencyINR(recoReport.summary.provisionalMissing2bItc)}
            </span>
            <span className="text-[10px] text-rose-600 font-semibold">
              {recoReport.summary.missingIn2b} Docs (Barred)
            </span>
          </div>

          <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-200">
            <span className="text-[10px] font-semibold text-indigo-700 uppercase block">Unclaimed in Books</span>
            <span className="text-sm font-bold text-indigo-900 font-mono mt-0.5 block">
              {formatCurrencyINR(recoReport.summary.unclaimed2bItc)}
            </span>
            <span className="text-[10px] text-indigo-600 font-semibold">
              {recoReport.summary.missingInBooks} In 2B
            </span>
          </div>
        </div>
      </div>

      {/* Prompt if no client/GSTIN selected */}
      {!activeGstin ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Select a Client &amp; GSTIN</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            GSTR-2B reconciliation runs per GSTIN and return period. Select a specific client entity from the switcher to load or upload GSTR-2B &amp; Purchase Register files.
          </p>
          <button
            onClick={() => openCommandPalette("CLIENTS")}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
          >
            Select Client
          </button>
        </div>
      ) : (
        <>
          {/* 4 SUB-TABS */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
            <div className="flex items-center gap-2">
              {[
                { id: "matrix", label: `Reconciliation (${recoReport.records.length})`, icon: Layers },
                { id: "sec17_5", label: `Sec 17(5) & Vendor Risk (${vendorProfiles.length})`, icon: ShieldAlert },
                { id: "rule42_43", label: "Rule 42 & 43 Reversals", icon: Calculator },
                { id: "notices", label: "Vendor Notices", icon: MessageSquare },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      playSoftClick();
                      setActiveTab(tab.id as any);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap ${
                      activeTab === tab.id
                        ? "bg-red-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {recoReport.records.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleExportMultiSheetXlsx}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Export .xlsx
                </button>
                <button
                  onClick={handleExportRecoCsv}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
                {recoReport.summary.missingInBooks > 0 && (
                  <button
                    onClick={() =>
                      handleExportTallyMissingXml(
                        recoReport.records.filter((r) => r.matchStatus === "MISSING_IN_BOOKS"),
                        `${activeGstin}_${activePeriod}`
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Batch Tally XML ({recoReport.summary.missingInBooks})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Empty state when no reconciliation uploaded yet */}
          {activeTab === "matrix" && !isLoadingReco && recoReport.records.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
              <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">
                No Reconciliation Saved for {activeGstin} ({activePeriod})
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Upload the official GSTN GSTR-2B JSON and your Tally / ERP Purchase Register (CSV, TSV, or Tally XML) to reconcile ITC and populate GSTR-3B Table 4.
              </p>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" /> Upload 2B &amp; Purchase Register
              </button>
            </div>
          )}

          {/* TAB 1: RECONCILIATION MATRIX */}
          {activeTab === "matrix" && recoReport.records.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    { id: "ALL", label: "All", count: recoReport.records.length },
                    { id: "EXACT", label: "Exact", count: recoReport.summary.exactMatches },
                    { id: "FUZZY", label: "Fuzzy/Date", count: recoReport.summary.fuzzyMatches },
                    { id: "ROUNDING", label: `Round ±₹${toleranceInr}`, count: recoReport.summary.roundingMatches },
                    { id: "MISMATCH", label: "Mismatch", count: recoReport.summary.valueMismatches },
                    { id: "MISSING_2B", label: "Missing in 2B", count: recoReport.summary.missingIn2b },
                    { id: "MISSING_BOOKS", label: "Missing in Books", count: recoReport.summary.missingInBooks },
                    {
                      id: "SEC_17_5",
                      label: "17(5) Blocked",
                      count: recoReport.records.filter(
                        (r) => r.manualOverride === "FORCE_BLOCKED_17_5" || (r.section17_5Blocked && r.manualOverride !== "ALLOW_EXCEPTION")
                      ).length,
                    },
                    { id: "RULE_37A", label: "Rule 37A", count: recoReport.records.filter((r) => r.rule37aRisk).length },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilterStatus(f.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                        filterStatus === f.id
                          ? "bg-red-600 text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {f.label}
                      <span className={`px-1.5 text-[10px] rounded-full ${filterStatus === f.id ? "bg-white/20" : "bg-slate-200"}`}>
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search vendor, invoice, GSTIN..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <th className="p-3">Vendor &amp; GSTIN</th>
                        <th className="p-3">2B Ref / Books Inv</th>
                        <th className="p-3 text-right">Taxable (₹)</th>
                        <th className="p-3 text-right">Tax Breakdown (₹)</th>
                        <th className="p-3 text-center">Match Status</th>
                        <th className="p-3">Classification &amp; Override</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRecords.map((r) => {
                        const isBlockedEff =
                          r.manualOverride === "FORCE_BLOCKED_17_5" ||
                          (r.section17_5Blocked && r.manualOverride !== "ALLOW_EXCEPTION");
                        const igst = r.gstr2bIgst || r.booksIgst;
                        const cgst = r.gstr2bCgst || r.booksCgst;
                        const sgst = r.gstr2bSgst || r.booksSgst;

                        return (
                          <tr key={r.id} className="hover:bg-slate-50/60 transition">
                            <td className="p-3">
                              <strong className="block font-bold text-slate-900">{r.vendorName}</strong>
                              <span className="font-mono text-[11px] text-slate-500">{r.vendorGstin}</span>
                              {r.isCreditNote && (
                                <span className="ml-1.5 px-1.5 py-0.5 bg-purple-100 text-purple-800 text-[9px] font-bold rounded">
                                  CRN (-)
                                </span>
                              )}
                              {r.isRcm && (
                                <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-bold rounded">
                                  RCM 4(A)(3)
                                </span>
                              )}
                            </td>

                            <td className="p-3 font-mono text-[11px]">
                              <div>
                                <span className="text-slate-400 font-bold">2B: </span>
                                <span className={r.gstr2bInvoiceNo ? "font-bold text-slate-800" : "text-rose-500"}>
                                  {r.gstr2bInvoiceNo || "MISSING"}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-bold">BK: </span>
                                <span className={r.booksInvoiceNo ? "text-slate-700" : "text-indigo-600"}>
                                  {r.booksInvoiceNo || "MISSING"}
                                </span>
                              </div>
                            </td>

                            <td className="p-3 text-right font-mono">
                              <div className="font-bold text-slate-900">
                                {r.isCreditNote ? "-" : ""}
                                {formatCurrencyINR(r.gstr2bTaxableValue || r.booksTaxableValue)}
                              </div>
                              {r.taxableVariance !== 0 && (
                                <span className="text-[10px] text-rose-600">Var: {r.taxableVariance}</span>
                              )}
                            </td>

                            <td className="p-3 text-right font-mono">
                              <div
                                className={`font-bold ${
                                  isBlockedEff ? "text-amber-700" : r.matchStatus === "MISSING_IN_2B" ? "text-rose-600" : "text-emerald-700"
                                }`}
                              >
                                {r.isCreditNote ? "-" : ""}
                                {formatCurrencyINR(r.gstr2bTotalTax || r.booksTotalTax)}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {igst > 0 ? `I:${igst}` : `C:${cgst} S:${sgst}`}
                              </div>
                            </td>

                            <td className="p-3 text-center">
                              {r.matchStatus === "EXACT_MATCH" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" /> Exact
                                </span>
                              )}
                              {r.matchStatus === "FUZZY_MATCHED" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200">
                                  <Sparkles className="w-3 h-3" /> Fuzzy {r.confidenceScore}%
                                </span>
                              )}
                              {r.matchStatus === "ROUNDING_MATCHED" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-full border border-purple-200">
                                  Round-Off
                                </span>
                              )}
                              {r.matchStatus === "DATE_LEEWAY_MATCHED" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-50 text-cyan-700 text-[10px] font-bold rounded-full border border-cyan-200">
                                  Date Leeway
                                </span>
                              )}
                              {r.matchStatus === "VALUE_MISMATCH" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200">
                                  <AlertTriangle className="w-3 h-3" /> {r.taxHeadMismatch ? "Tax Head Diff" : "Mismatch"}
                                </span>
                              )}
                              {r.matchStatus === "MISSING_IN_2B" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-full border border-rose-200">
                                  <AlertCircle className="w-3 h-3" /> Missing in 2B
                                </span>
                              )}
                              {r.matchStatus === "MISSING_IN_BOOKS" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full border border-indigo-200">
                                  <Plus className="w-3 h-3" /> Unclaimed
                                </span>
                              )}
                            </td>

                            <td className="p-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {isBlockedEff ? (
                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded">
                                      4(B)(1) Sec 17(5)
                                    </span>
                                  ) : r.manualOverride === "HOLD_NEXT_PERIOD" ? (
                                    <span className="px-1.5 py-0.5 bg-slate-200 text-slate-800 text-[10px] font-bold rounded">
                                      Held for Next Period
                                    </span>
                                  ) : r.rule37aRisk ? (
                                    <span className="px-1.5 py-0.5 bg-rose-100 text-rose-900 text-[10px] font-bold rounded">
                                      Rule 37A Risk
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-bold rounded">
                                      {r.isImport ? "4(A)(1)" : r.isRcm ? "4(A)(3)" : r.isIsd ? "4(A)(4)" : "4(A)(5) Eligible"}
                                    </span>
                                  )}

                                  <select
                                    value={r.manualOverride || "DEFAULT"}
                                    onChange={(e) => handleSetOverride(r.id, e.target.value as RecoManualOverride)}
                                    className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-700"
                                    title="CA Audit Override"
                                  >
                                    <option value="DEFAULT">Auto Classification</option>
                                    <option value="ALLOW_EXCEPTION">Allow (17(5) Exception)</option>
                                    <option value="FORCE_BLOCKED_17_5">Force Block 17(5)</option>
                                    <option value="HOLD_NEXT_PERIOD">Hold for Next Month</option>
                                  </select>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-tight max-w-xs">
                                  {r.recommendedAction}
                                </p>
                              </div>
                            </td>

                            <td className="p-3 text-right">
                              {r.matchStatus === "MISSING_IN_BOOKS" ? (
                                <button
                                  onClick={() => handleExportTallyMissingXml([r], r.gstr2bInvoiceNo || "voucher")}
                                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg border border-indigo-200 inline-flex items-center gap-1"
                                >
                                  <Download className="w-3 h-3" /> Tally XML
                                </button>
                              ) : r.matchStatus === "MISSING_IN_2B" || r.rule37aRisk || r.matchStatus === "VALUE_MISMATCH" ? (
                                <button
                                  onClick={() => handleGenerateNotice(r)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg inline-flex items-center gap-1"
                                >
                                  <Send className="w-3 h-3" /> Notice
                                </button>
                              ) : (
                                <span className="text-[11px] text-emerald-600 font-bold inline-flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5" /> Reconciled
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SECTION 17(5) BLOCKED ITEMS & VENDOR RISK */}
          {activeTab === "sec17_5" && (
            <div className="space-y-6">
              {/* Section 17(5) Invoice Review Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Section 17(5) &amp; Portal Ineligible Invoices (Table 4(B)(1))
                    </h3>
                    <p className="text-xs text-slate-500">
                      Review auto-flagged blocked credits or apply statutory exceptions (e.g. Plant &amp; Machinery, Subcontracting).
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                    Total Blocked: {formatCurrencyINR(recoReport.summary.ineligibleSec17_5Itc)}
                  </span>
                </div>

                {recoReport.records.filter(
                  (r) =>
                    r.section17_5Blocked ||
                    r.manualOverride === "FORCE_BLOCKED_17_5" ||
                    !r.itcAvailableIn2b ||
                    r.posMismatch
                ).length === 0 ? (
                  <p className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl">
                    No Section 17(5) or portal-ineligible invoices detected in this period.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                      <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">Vendor &amp; Invoice</th>
                          <th className="p-2.5">Category / Reason</th>
                          <th className="p-2.5 text-right">Blocked ITC</th>
                          <th className="p-2.5 text-right">Override</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recoReport.records
                          .filter(
                            (r) =>
                              r.section17_5Blocked ||
                              r.manualOverride === "FORCE_BLOCKED_17_5" ||
                              !r.itcAvailableIn2b ||
                              r.posMismatch
                          )
                          .map((r) => (
                            <tr key={r.id}>
                              <td className="p-2.5">
                                <div className="font-bold text-slate-900">{r.vendorName}</div>
                                <div className="font-mono text-[10px] text-slate-500">
                                  {r.booksInvoiceNo || r.gstr2bInvoiceNo} • HSN {r.hsnCode || "N/A"}
                                </div>
                              </td>
                              <td className="p-2.5 text-slate-700">
                                {r.blockedCategory || r.itcIneligibilityReason || "Manual Sec 17(5) Block"}
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-amber-800">
                                {formatCurrencyINR(r.gstr2bTotalTax || r.booksTotalTax)}
                              </td>
                              <td className="p-2.5 text-right">
                                <select
                                  value={r.manualOverride || "DEFAULT"}
                                  onChange={(e) => handleSetOverride(r.id, e.target.value as RecoManualOverride)}
                                  className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-[11px] font-semibold"
                                >
                                  <option value="DEFAULT">Block in 4(B)(1)</option>
                                  <option value="ALLOW_EXCEPTION">Allow (Eligible Exception)</option>
                                  <option value="HOLD_NEXT_PERIOD">Hold for Next Month</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Vendor Compliance Profiles */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Supplier Compliance &amp; Rule 37A Risk Matrix ({vendorProfiles.length} Suppliers)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Batch-verify every vendor&apos;s GSTN registration status and GSTR-1/3B filing rate in one click.
                  </p>
                </div>
                <button
                  onClick={handleBatchVerifyAllVendors}
                  disabled={isBatchVerifying || vendorProfiles.length === 0}
                  className="px-3 py-2 bg-slate-900 hover:bg-black disabled:opacity-50 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBatchVerifying ? "animate-spin" : ""}`} />
                  {isBatchVerifying ? "Verifying Vendors..." : `Verify All Vendors (${vendorProfiles.length})`}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vendorProfiles.map((v) => (
                  <div key={v.vendorGstin} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{v.vendorTradeName}</h4>
                        <span className="font-mono text-xs text-slate-500">{v.vendorGstin}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
                          v.gstnStatus === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : v.gstnStatus === "UNVERIFIED"
                            ? "bg-slate-100 text-slate-600 border-slate-300"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {v.gstnStatus}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-600">Risk Score:</span>
                        <strong
                          className={`font-mono ${
                            v.riskLevel === "LOW"
                              ? "text-emerald-700"
                              : v.riskLevel === "MEDIUM"
                              ? "text-amber-700"
                              : "text-rose-700"
                          }`}
                        >
                          {v.compositeRiskScore}/100 ({v.riskLevel})
                        </strong>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            v.riskLevel === "LOW"
                              ? "bg-emerald-500"
                              : v.riskLevel === "MEDIUM"
                              ? "bg-amber-500"
                              : "bg-rose-600"
                          }`}
                          style={{ width: `${v.compositeRiskScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">GSTR-1 Rate</span>
                        <strong className="text-slate-800 font-mono">
                          {v.gstr1FilingRatePercentage !== null ? `${v.gstr1FilingRatePercentage}%` : "Not Verified"}
                        </strong>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">GSTR-3B Rate</span>
                        <strong className="text-slate-800 font-mono">
                          {v.gstr3bFilingRatePercentage !== null ? `${v.gstr3bFilingRatePercentage}%` : "Not Verified"}
                        </strong>
                      </div>
                    </div>

                    {v.statutoryViolations.length > 0 && (
                      <ul className="text-[11px] text-rose-700 space-y-1 list-disc pl-4">
                        {v.statutoryViolations.map((vio, i) => (
                          <li key={i}>{vio}</li>
                        ))}
                      </ul>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleVerifyVendorGstin(v.vendorGstin)}
                        disabled={verifyingVendorGstin === v.vendorGstin}
                        className="px-2.5 py-1.5 bg-slate-900 hover:bg-black text-white text-[11px] font-semibold rounded-lg inline-flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${verifyingVendorGstin === v.vendorGstin ? "animate-spin" : ""}`} />
                        <span>Verify GSTN</span>
                      </button>
                      <button
                        onClick={() => {
                          const rec = recoReport.records.find((r) => r.vendorGstin === v.vendorGstin);
                          if (rec) handleGenerateNotice(rec);
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg inline-flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" /> Notice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: RULE 42 & 43 WORKPAPER */}
          {activeTab === "rule42_43" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Rule 42 Common Credit Reversal ({activePeriod})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Apportionment of common ITC across taxable, zero-rated, and exempt supplies for GSTR-3B Table 4(B)(2).
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {recoReport.records.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSyncRule42FromReco}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold"
                      >
                        Pull T &amp; T3 from 2B
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveRule42And43}
                      disabled={isSavingRule42}
                      className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                    >
                      {isSavingRule42 ? "Saving..." : "Save Workpaper"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  {[
                    { label: "Total Input Tax (T)", val: r42TotalInputTax, set: setR42TotalInputTax },
                    { label: "Non-Business (T1)", val: r42NonBusiness, set: setR42NonBusiness },
                    { label: "Excl. Exempt (T2)", val: r42ExemptInput, set: setR42ExemptInput },
                    { label: "Sec 17(5) (T3)", val: r42BlockedInput, set: setR42BlockedInput },
                    { label: "Excl. Taxable (T4)", val: r42TaxableInput, set: setR42TaxableInput },
                    { label: "Exempt Turnover (E)", val: r42ExemptTurnover, set: setR42ExemptTurnover },
                    { label: "Total Turnover (F)", val: r42TotalTurnover, set: setR42TotalTurnover },
                  ].map((fld) => (
                    <div key={fld.label} className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">{fld.label}</label>
                      <input
                        type="number"
                        min={0}
                        value={fld.val}
                        onChange={(e) => fld.set(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100">
                    <span className="text-[10px] font-bold text-blue-700 uppercase block">Common Credit (C2)</span>
                    <span className="text-lg font-black text-blue-950 font-mono mt-1 block">
                      {formatCurrencyINR(r42Result.commonCredit_C2)}
                    </span>
                  </div>
                  <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-100">
                    <span className="text-[10px] font-bold text-amber-700 uppercase block">Exempt Reversal (D1)</span>
                    <span className="text-lg font-black text-amber-950 font-mono mt-1 block">
                      {formatCurrencyINR(r42Result.exemptReversal_D1)}
                    </span>
                    <span className="text-[11px] text-amber-700">Ratio: {(r42Result.turnoverRatio_E_by_F * 100).toFixed(2)}%</span>
                  </div>
                  <div className="bg-purple-50/60 rounded-xl p-4 border border-purple-100">
                    <span className="text-[10px] font-bold text-purple-700 uppercase block">Non-Business 5% (D2)</span>
                    <span className="text-lg font-black text-purple-950 font-mono mt-1 block">
                      {formatCurrencyINR(r42Result.nonBusinessReversal_D2)}
                    </span>
                  </div>
                  <div className="bg-rose-50/60 rounded-xl p-4 border border-rose-100">
                    <span className="text-[10px] font-bold text-rose-700 uppercase block">Rule 42 Reversal</span>
                    <span className="text-lg font-black text-rose-950 font-mono mt-1 block">
                      {formatCurrencyINR(r42Result.totalMonthlyReversal)}
                    </span>
                    <span className="text-[11px] text-rose-700 font-bold">Table 4(B)(2)</span>
                  </div>
                </div>
              </div>

              {/* Rule 43 Capital Goods Asset Register */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Rule 43 Capital Goods Reversal (60-Month Useful Life)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Monthly Reversal Te = (E / F) × (Tc / 60).
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg">
                    Monthly Te: {formatCurrencyINR(r43Result.monthlyExemptReversal_Te)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <input
                    type="text"
                    placeholder="Asset Description"
                    value={newAssetDesc}
                    onChange={(e) => setNewAssetDesc(e.target.value)}
                    className="sm:col-span-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                  />
                  <input
                    type="text"
                    placeholder="Invoice No"
                    value={newAssetInv}
                    onChange={(e) => setNewAssetInv(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                  />
                  <input
                    type="number"
                    placeholder="ITC (₹)"
                    value={newAssetTax}
                    onChange={(e) => setNewAssetTax(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                  />
                  <input
                    type="number"
                    min={1}
                    max={60}
                    placeholder="Month (1-60)"
                    value={newAssetMonths}
                    onChange={(e) => setNewAssetMonths(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newAssetDesc.trim() || !newAssetTax) return;
                      setR43Assets((prev) => [
                        ...prev,
                        {
                          id: `cap-${Date.now()}`,
                          assetDescription: newAssetDesc.trim(),
                          invoiceNumber: newAssetInv.trim() || "INV",
                          invoiceDate: newAssetDate || new Date().toISOString().split("T")[0],
                          capitalCostInr: parseFloat(newAssetCost) || 0,
                          totalInputTaxInr: parseFloat(newAssetTax) || 0,
                          monthsElapsed: Math.min(60, Math.max(1, parseInt(newAssetMonths, 10) || 1)),
                        },
                      ]);
                      setNewAssetDesc("");
                      setNewAssetInv("");
                      setNewAssetTax("");
                    }}
                    className="bg-slate-900 hover:bg-black text-white font-bold rounded-lg px-3 py-1.5"
                  >
                    + Add Asset
                  </button>
                </div>

                {r43Assets.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                      <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">Asset</th>
                          <th className="p-2.5">Invoice</th>
                          <th className="p-2.5 text-right">Total ITC (A)</th>
                          <th className="p-2.5 text-center">Months Elapsed</th>
                          <th className="p-2.5 text-right">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {r43Assets.map((a) => (
                          <tr key={a.id}>
                            <td className="p-2.5 font-semibold text-slate-900">{a.assetDescription}</td>
                            <td className="p-2.5 font-mono">{a.invoiceNumber}</td>
                            <td className="p-2.5 text-right font-mono">{formatCurrencyINR(a.totalInputTaxInr)}</td>
                            <td className="p-2.5 text-center font-mono">{a.monthsElapsed}/60</td>
                            <td className="p-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => setR43Assets((p) => p.filter((x) => x.id !== a.id))}
                                className="text-rose-600 hover:text-rose-800"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Annual Rule 42(2) True-Up */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">
                  Rule 42(2) Annual True-Up Reconciliation (FY {selectedFy})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Annual Common C2</label>
                    <input
                      type="number"
                      value={annualCommonC2}
                      onChange={(e) => setAnnualCommonC2(parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Annual Exempt (E)</label>
                    <input
                      type="number"
                      value={annualExemptE}
                      onChange={(e) => setAnnualExemptE(parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Annual Total (F)</label>
                    <input
                      type="number"
                      value={annualTotalF}
                      onChange={(e) => setAnnualTotalF(parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Paid in 12 Months</label>
                    <input
                      type="number"
                      value={annualMonthlyPaid}
                      onChange={(e) => setAnnualMonthlyPaid(parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">True-Up Filing Date</label>
                    <input
                      type="date"
                      value={annualFilingDate}
                      onChange={(e) => setAnnualFilingDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                    />
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>{annualTrueUpResult.reportingAction}</span>
                  <span className="font-mono font-bold text-slate-900 shrink-0">
                    Diff: {formatCurrencyINR(annualTrueUpResult.differentialAmountInr)} | Int: {formatCurrencyINR(annualTrueUpResult.interestPayableSec50)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VENDOR NOTICES */}
          {activeTab === "notices" && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Defaulting Vendor Requisitions (Sec 16(2)(aa) &amp; Rule 37A)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Invoices missing in GSTR-2B, mismatched in value, or flagged for supplier GSTR-3B default.
                  </p>
                </div>
                <button
                  onClick={handleBatchArchiveVendorNotices}
                  className="px-3 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Batch Archive &amp; Copy Defaulters
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recoReport.records
                  .filter((r) => r.matchStatus === "MISSING_IN_2B" || r.rule37aRisk || r.matchStatus === "VALUE_MISMATCH")
                  .map((r) => (
                    <div key={r.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{r.vendorName}</h4>
                          <span className="font-mono text-xs text-slate-500">{r.vendorGstin}</span>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800">
                          {r.matchStatus === "MISSING_IN_2B"
                            ? "Missing in 2B"
                            : r.rule37aRisk
                            ? "Rule 37A Unfiled"
                            : "Value Mismatch"}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Invoice:</span>
                          <strong className="font-mono">{r.booksInvoiceNo || r.gstr2bInvoiceNo}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">ITC at Risk:</span>
                          <strong className="font-mono text-rose-600">
                            {formatCurrencyINR(r.booksTotalTax || r.gstr2bTotalTax)}
                          </strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGenerateNotice(r)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Draft &amp; Send Notice
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: GSTR-3B TABLE 4 STATUTORY BREAKDOWN (CBIC Circular 170) */}
      {isTable4DrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  GSTR-3B Table 4 Summary — {activeGstin} ({activePeriod})
                </h3>
                <p className="text-xs text-slate-500">CBIC Circular No. 170/02/2022-GST (Net of Credit Notes)</p>
              </div>
              <button onClick={() => setIsTable4DrawerOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-2.5">Table 4 Line Item</th>
                    <th className="p-2.5 text-right">IGST (₹)</th>
                    <th className="p-2.5 text-right">CGST (₹)</th>
                    <th className="p-2.5 text-right">SGST (₹)</th>
                    <th className="p-2.5 text-right">Cess (₹)</th>
                    <th className="p-2.5 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {[
                    { label: "4(A)(1) Import of Goods", row: recoReport.summary.table4A1_ImportGoods },
                    { label: "4(A)(3) Inward Supplies (RCM)", row: recoReport.summary.table4A3_Rcm },
                    { label: "4(A)(4) Inward Supplies from ISD", row: recoReport.summary.table4A4_Isd },
                    { label: "4(A)(5) All Other ITC (Gross)", row: recoReport.summary.table4A5_AllOtherGross },
                    { label: "Less 4(B)(1) Sec 17(5) / Permanent", row: recoReport.summary.table4B1_PermanentReversal, isNeg: true },
                    {
                      label: "Less 4(B)(2) Rule 37 / 42 / 43 Reversals",
                      row: {
                        igst: recoReport.summary.table4B2_TemporaryReversal.igst,
                        cgst: recoReport.summary.table4B2_TemporaryReversal.cgst,
                        sgst: recoReport.summary.table4B2_TemporaryReversal.sgst,
                        cess: recoReport.summary.table4B2_TemporaryReversal.cess,
                        total: totalCombinedReversal4B2,
                      },
                      isNeg: true,
                    },
                  ].map((item) => (
                    <tr key={item.label} className={item.isNeg ? "text-amber-800 bg-amber-50/30" : ""}>
                      <td className="p-2.5 font-sans font-semibold text-slate-800">{item.label}</td>
                      <td className="p-2.5 text-right">{item.row.igst.toLocaleString("en-IN")}</td>
                      <td className="p-2.5 text-right">{item.row.cgst.toLocaleString("en-IN")}</td>
                      <td className="p-2.5 text-right">{item.row.sgst.toLocaleString("en-IN")}</td>
                      <td className="p-2.5 text-right">{item.row.cess.toLocaleString("en-IN")}</td>
                      <td className="p-2.5 text-right font-bold">{item.row.total.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-50 text-emerald-950 font-bold border-t-2 border-emerald-500">
                    <td className="p-2.5 font-sans">4(C) Net ITC Available [4(A) - 4(B)]</td>
                    <td className="p-2.5 text-right">{recoReport.summary.netItc4C.igst.toLocaleString("en-IN")}</td>
                    <td className="p-2.5 text-right">{recoReport.summary.netItc4C.cgst.toLocaleString("en-IN")}</td>
                    <td className="p-2.5 text-right">{recoReport.summary.netItc4C.sgst.toLocaleString("en-IN")}</td>
                    <td className="p-2.5 text-right">{recoReport.summary.netItc4C.cess.toLocaleString("en-IN")}</td>
                    <td className="p-2.5 text-right">
                      {Math.round((recoReport.summary.netItc4C.total - r42Result.totalMonthlyReversal - r43Result.monthlyExemptReversal_Te) * 100) / 100}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(recoReport.summary, null, 2));
                  toast.success("Copied Table 4 JSON", "Table 4 summary copied to clipboard.");
                  setIsTable4DrawerOpen(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FILE UPLOAD */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Upload GSTR-2B &amp; Purchase Register — {activeGstin} ({activePeriod})
                </h3>
                <p className="text-[11px] text-slate-500">
                  GSTN GSTR-2B (.json or multi-sheet .xlsx) + Purchase Register (.xlsx, .xls, .csv, .tsv, .xml)
                </p>
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block border-2 border-dashed border-blue-200 bg-blue-50/40 rounded-xl p-4 text-center cursor-pointer hover:bg-blue-50 transition">
                <FileSpreadsheet className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <span className="text-xs font-bold text-slate-800 block">
                  {json2bFile ? (
                    <span className="text-emerald-700 flex items-center justify-center gap-1">
                      <Check className="w-4 h-4" /> {json2bFile.name}
                    </span>
                  ) : (
                    "Select Official GSTR-2B (.json or .xlsx)"
                  )}
                </span>
                <input
                  type="file"
                  accept=".json,.xlsx,.xls"
                  onChange={(e) => e.target.files?.[0] && setJson2bFile(e.target.files[0])}
                  className="hidden"
                />
              </label>

              <label className="block border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-100 transition">
                <FileText className="w-5 h-5 text-slate-700 mx-auto mb-1" />
                <span className="text-xs font-bold text-slate-800 block">
                  {booksFile ? (
                    <span className="text-emerald-700 flex items-center justify-center gap-1">
                      <Check className="w-4 h-4" /> {booksFile.name}
                    </span>
                  ) : (
                    "Select Purchase Register (.xlsx, .xls, .csv, .tsv, .xml)"
                  )}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  TallyPrime Excel/CSV/XML, Busy, Zoho Books, Marg ERP
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.tsv,.txt,.xml"
                  onChange={(e) => e.target.files?.[0] && handleSelectBooksFile(e.target.files[0])}
                  className="hidden"
                />
              </label>

              {booksMappingPreview && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 text-[11px]">
                  <div className="font-bold text-slate-700">
                    Column Mapping Preview ({booksMappingPreview.headers.length} columns detected)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        ["gstinCol", "Vendor GSTIN"],
                        ["nameCol", "Party Name"],
                        ["invNoCol", "Invoice No"],
                        ["dateCol", "Invoice Date"],
                        ["taxableCol", "Taxable Value"],
                        ["igstCol", "IGST"],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key}>
                        <span className="text-[10px] font-semibold text-slate-500 block">{label}</span>
                        <select
                          disabled={!booksMappingPreview.isExcel}
                          value={booksMappingPreview.mapping[key]}
                          onChange={(e) =>
                            setBooksMappingPreview((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    mapping: { ...prev.mapping, [key]: Number(e.target.value) },
                                  }
                                : null
                            )
                          }
                          className="mt-0.5 w-full rounded border border-slate-200 bg-white px-1.5 py-1 text-[11px]"
                        >
                          <option value={-1}>-- Not Mapped --</option>
                          {booksMappingPreview.headers.map((h, idx) => (
                            <option key={idx} value={idx}>
                              {h || `Col ${idx + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={isProcessingUpload || (!json2bFile && !booksFile)}
                onClick={handleProcessUploadedFiles}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isProcessingUpload ? "Reconciling & Saving..." : "Reconcile & Save"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VENDOR NOTICE */}
      {isNoticeModalOpen && selectedNotice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Vendor Requisition — {selectedNotice.vendorTradeName}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">{selectedNotice.vendorGstin}</p>
              </div>
              <button onClick={() => setIsNoticeModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs">
              <label className="font-bold text-slate-700 block mb-1">Vendor WhatsApp Number (with 91 country code)</label>
              <input
                type="text"
                value={noticePhoneInput}
                onChange={(e) => setNoticePhoneInput(e.target.value)}
                placeholder="e.g. 919820011223"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>

            <textarea
              rows={8}
              readOnly
              value={selectedNotice.whatsappMessageText}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setIsNoticeModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedNotice.whatsappMessageText);
                  toast.success("Copied", "Notice text copied to clipboard.");
                }}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg"
              >
                Copy Text
              </button>
              <button
                onClick={handleArchiveAndSendNotice}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Save &amp; Open WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CLIENT DOCS PICKER */}
      {showClientDocsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Import from Client Uploaded Vault — {selectedClient?.name}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pull uploaded JSON/Excel/CSV/Tally XML directly into GSTR-2B or Purchase Books.
                </p>
              </div>
              <button onClick={() => setShowClientDocsModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            {isLoadingDocs ? (
              <div className="py-8 text-center text-xs text-slate-500">Scanning client vault...</div>
            ) : clientDocsList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No GST JSON/Excel/CSV/XML files found in Document Vault for this client.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {clientDocsList.map((d) => (
                  <div key={d.id} className="flex items-center justify-between py-2.5 text-xs gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{d.file_name}</div>
                      <div className="text-[10px] text-slate-500">{d.category} • FY {d.financial_year || selectedFy}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleImportClientDoc(d, "2B")}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold"
                      >
                        Load as 2B
                      </button>
                      <button
                        onClick={() => handleImportClientDoc(d, "BOOKS")}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-black text-white text-[11px] font-semibold"
                      >
                        Load as Books
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
