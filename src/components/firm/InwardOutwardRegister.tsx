"use client";

import React, { useState } from "react";
import { formatDate } from "@/lib/utils";
import { useTaxoData } from "@/lib/hooks/useTaxoData";
import { 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Search, 
  CheckCircle2, 
  Clock, 
  User, 
  MapPin, 
  Plus, 
  X, 
  FileCheck, 
  Building2 
} from "lucide-react";

interface DocumentMovementItem {
  id: string;
  type: "INWARD" | "OUTWARD";
  entityName: string;
  documentDescription: string;
  senderOrRecipient: string;
  mode: "COURIER" | "HAND_DELIVERY" | "REGISTERED_POST";
  courierTrackingNo?: string;
  receivedOrHandledBy: string;
  date: string;
  status: "IN_OFFICE_SAFE" | "RETURNED_TO_CLIENT" | "DISPATCHED";
  locationBin: string;
}

const INITIAL_MOVEMENTS: DocumentMovementItem[] = [
  {
    id: "MOV-01",
    type: "INWARD",
    entityName: "Apex AutoTech Private Limited",
    documentDescription: "Physical Share Certificate Books & Statutory Minute Books for Statutory Audit",
    senderOrRecipient: "Rajesh Sharma (Managing Director)",
    mode: "HAND_DELIVERY",
    receivedOrHandledBy: "Kriti Jain (Article)",
    date: "2026-10-24",
    status: "IN_OFFICE_SAFE",
    locationBin: "Cabinet A - Safe Locker 02"
  },
  {
    id: "MOV-02",
    type: "OUTWARD",
    entityName: "Zenith SaaS Technologies Private Limited",
    documentDescription: "Banker Loan Credit Appraisal Dossier with Green Seal & ICAI UDIN",
    senderOrRecipient: "HDFC Bank Credit Dept, Y.N. Road, Indore",
    mode: "COURIER",
    courierTrackingNo: "BLUEDART-IND-9928194",
    receivedOrHandledBy: "CA Gunjan Jain",
    date: "2026-10-25",
    status: "DISPATCHED",
    locationBin: "Outward Dispatched"
  },
  {
    id: "MOV-03",
    type: "INWARD",
    entityName: "OmniRetail Hypermarkets Private Limited",
    documentDescription: "Original Land Title Deeds for Section 148 Cash Scrutiny Justification",
    senderOrRecipient: "Aditya Singhal (Director)",
    mode: "REGISTERED_POST",
    courierTrackingNo: "SPEEDPOST-MP-4481029",
    receivedOrHandledBy: "Aman Verma (Article)",
    date: "2026-10-26",
    status: "IN_OFFICE_SAFE",
    locationBin: "Cabinet B - Vault Slot 07"
  }
];

export const InwardOutwardRegister: React.FC = () => {
  const { clients } = useTaxoData();
  const [movements, setMovements] = useState<DocumentMovementItem[]>(INITIAL_MOVEMENTS);
  const [filterType, setFilterType] = useState<"ALL" | "INWARD" | "OUTWARD">("ALL");
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newEntity, setNewEntity] = useState(clients[0]?.name || "");
  const [newDesc, setNewDesc] = useState("");
  const [newMode, setNewMode] = useState<"COURIER" | "HAND_DELIVERY" | "REGISTERED_POST">("HAND_DELIVERY");
  const [newBin, setNewBin] = useState("Cabinet A - Locker 1");

  React.useEffect(() => {
    if (!newEntity && clients.length > 0) {
      setNewEntity(clients[0]?.name || "");
    }
  }, [clients, newEntity]);

  const filtered = movements.filter((m) => {
    const matchesFilter = filterType === "ALL" || m.type === filterType;
    const matchesSearch =
      m.entityName.toLowerCase().includes(search.toLowerCase()) ||
      m.documentDescription.toLowerCase().includes(search.toLowerCase()) ||
      (m.courierTrackingNo && m.courierTrackingNo.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleAddInward = () => {
    if (!newDesc.trim()) return;
    const item: DocumentMovementItem = {
      id: `INW-${Date.now().toString().slice(-4)}`,
      type: "INWARD",
      entityName: newEntity,
      documentDescription: newDesc,
      senderOrRecipient: "Client Office",
      mode: newMode,
      receivedOrHandledBy: "Kriti Jain (Article)",
      date: new Date().toISOString().split("T")[0],
      status: "IN_OFFICE_SAFE",
      locationBin: newBin,
    };
    setMovements([item, ...movements]);
    setShowNewModal(false);
    setNewDesc("");
  };

  const handleReturnToClient = (id: string) => {
    setMovements((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: "RETURNED_TO_CLIENT" as const, locationBin: "Returned & Signed" } : m
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-red-50 text-btred-logo rounded-2xl border border-red-200">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              Physical Inward &amp; Outward Document Movement Register
              <span className="text-[11px] bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-0.5 rounded-full font-bold">
                ICAI Audit Logged
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Prevents lost original land title deeds, chequebooks, and audited balance sheets handed over by clients.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="bg-btred-logo hover:bg-btred-700 text-white text-xs font-black px-4 py-2.5 rounded-2xl transition flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" />
          Log Inward Document
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none touch-pan-x w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
              filterType === "ALL" ? "bg-btred-logo text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All Movement ({movements.length})
          </button>
          <button
            onClick={() => setFilterType("INWARD")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 whitespace-nowrap shrink-0 ${
              filterType === "INWARD" ? "bg-btred-logo text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
            Inward in Safe ({movements.filter(m => m.type === "INWARD").length})
          </button>
          <button
            onClick={() => setFilterType("OUTWARD")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 whitespace-nowrap shrink-0 ${
              filterType === "OUTWARD" ? "bg-btred-logo text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
            Outward ({movements.filter(m => m.type === "OUTWARD").length})
          </button>
        </div>

        <div className="w-full sm:w-64 relative">
          <Search className="w-4 h-4 text-slate-600 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search document, courier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-xs text-slate-800 pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-btred-logo font-medium"
          />
        </div>
      </div>

      {/* Movement List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white border border-dashed border-slate-200 rounded-3xl p-10 text-center space-y-3">
            <Package className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-black text-slate-700">No Physical Documents Logged</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Track incoming original deeds, cheque books, and audited balance sheets dispatched to bank branches or clients with sign-off audit trail.
            </p>
            <button
              onClick={() => setShowNewModal(true)}
              className="bg-btred-logo hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition inline-flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> Log Physical Movement
            </button>
          </div>
        ) : (
          filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3 hover:border-btred-logo transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                    item.type === "INWARD"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-red-50 text-btred-logo border border-red-200"
                  }`}
                >
                  {item.type === "INWARD" ? (
                    <ArrowDownLeft className="w-3 h-3" />
                  ) : (
                    <ArrowUpRight className="w-3 h-3" />
                  )}
                  {item.type} &bull; {item.mode.replace("_", " ")}
                </span>

                <span className="text-[10px] font-mono text-slate-600 font-bold">{item.id}</span>
              </div>

              <h4 className="text-sm font-black text-slate-900">{item.entityName}</h4>
              <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {item.documentDescription}
              </p>

              <div className="mt-3 space-y-1 text-[11px] text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>Custodian / Receiver:</span>
                  <strong className="text-slate-900">{item.receivedOrHandledBy}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Physical Storage Bin:</span>
                  <strong className="text-btred-logo">{item.locationBin}</strong>
                </div>
                {item.courierTrackingNo && (
                  <div className="flex justify-between">
                    <span>Tracking Number:</span>
                    <strong className="font-mono text-slate-800">{item.courierTrackingNo}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Date: {formatDate(item.date)}</span>

              {item.status === "IN_OFFICE_SAFE" ? (
                <button
                  onClick={() => handleReturnToClient(item.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black px-3 py-1.5 rounded-xl transition shadow-sm flex items-center gap-1"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  Return to Client (Sign)
                </button>
              ) : (
                <span className="text-emerald-700 font-black text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {item.status.replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>
        )))}
      </div>

      {/* NEW INWARD MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowNewModal(false)}
              className="absolute right-4 top-4 text-slate-600 hover:text-slate-800 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-btred-logo" />
              Log Inward Physical Document
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Client Entity:</label>
                {clients.length > 0 ? (
                  <select
                    value={newEntity}
                    onChange={(e) => setNewEntity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={newEntity}
                    onChange={(e) => setNewEntity(e.target.value)}
                    placeholder="Enter client entity name"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Document Description:</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g., Original Property Sale Deed, HDFC Bank Passbook, or Signed Tax Audit 3CD pages..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Physical Safe Location:</label>
                <input
                  type="text"
                  value={newBin}
                  onChange={(e) => setNewBin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleAddInward}
                className="bg-btred-logo hover:bg-btred-700 text-white text-xs font-black px-4 py-2 rounded-xl transition shadow-sm"
              >
                Save to Inward Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
