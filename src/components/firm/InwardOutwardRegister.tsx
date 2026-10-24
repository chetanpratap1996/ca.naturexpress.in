"use client";

import React, { useState } from "react";
import { formatDate } from "@/lib/utils";
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
    id: "INW-2026-081",
    type: "INWARD",
    entityName: "Apex Precision Technologies Pvt Ltd",
    documentDescription: "Original Land Title Deed & Industrial MIDC Lease Agreement (Plot 42, Chakan)",
    senderOrRecipient: "Suresh Kulkarni (CFO)",
    mode: "HAND_DELIVERY",
    receivedOrHandledBy: "Rohan Verma (Article)",
    date: "2026-10-21",
    status: "IN_OFFICE_SAFE",
    locationBin: "Master Safe - Fireproof Locker 1",
  },
  {
    id: "INW-2026-082",
    type: "INWARD",
    entityName: "Zenora Logistics & Cold Chain LLP",
    documentDescription: "Bank Cheque Book & Original Vehicle Hypothecation NOCs from ICICI Bank",
    senderOrRecipient: "BlueDart Express",
    mode: "COURIER",
    courierTrackingNo: "BD-889102914-IN",
    receivedOrHandledBy: "Ananya Iyer (Article)",
    date: "2026-10-22",
    status: "IN_OFFICE_SAFE",
    locationBin: "Audit Cabinet 3 - Bin 18",
  },
  {
    id: "OUT-2026-044",
    type: "OUTWARD",
    entityName: "Dr. Vikramaditya Somani",
    documentDescription: "Certified True Copies of ITR-3 & Audited Balance Sheet with Physical UDIN Stamp",
    senderOrRecipient: "SBI Commercial Branch Manager, Fort",
    mode: "COURIER",
    courierTrackingNo: "DTDC-4401928",
    receivedOrHandledBy: "Rohan Verma (Article)",
    date: "2026-10-20",
    status: "DISPATCHED",
    locationBin: "Dispatched",
  },
  {
    id: "OUT-2026-045",
    type: "OUTWARD",
    entityName: "Heritage Silks & Retail Fabrics",
    documentDescription: "Original Festive Sales Bill Books (Vol 1-4) returned after GST Assessment",
    senderOrRecipient: "Harish Parekh (Partner)",
    mode: "HAND_DELIVERY",
    receivedOrHandledBy: "Pooja Deshmukh (Article)",
    date: "2026-10-19",
    status: "RETURNED_TO_CLIENT",
    locationBin: "Client Handover Acknowledged",
  },
];

export const InwardOutwardRegister: React.FC = () => {
  const [movements, setMovements] = useState<DocumentMovementItem[]>(INITIAL_MOVEMENTS);
  const [filterType, setFilterType] = useState<"ALL" | "INWARD" | "OUTWARD">("ALL");
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newEntity, setNewEntity] = useState("Apex Precision Technologies Pvt Ltd");
  const [newDesc, setNewDesc] = useState("");
  const [newMode, setNewMode] = useState<"COURIER" | "HAND_DELIVERY" | "REGISTERED_POST">("HAND_DELIVERY");
  const [newBin, setNewBin] = useState("Cabinet A - Locker 1");

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
      receivedOrHandledBy: "Rohan Verma (Article)",
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterType === "ALL" ? "bg-btblack text-white shadow-sm" : "bg-slate-100 text-slate-700"
            }`}
          >
            All Movement ({movements.length})
          </button>
          <button
            onClick={() => setFilterType("INWARD")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              filterType === "INWARD" ? "bg-btblack text-white shadow-sm" : "bg-slate-100 text-slate-700"
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
            Inward in Safe ({movements.filter(m => m.type === "INWARD").length})
          </button>
          <button
            onClick={() => setFilterType("OUTWARD")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              filterType === "OUTWARD" ? "bg-btblack text-white shadow-sm" : "bg-slate-100 text-slate-700"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-500" />
            Outward / Dispatched ({movements.filter(m => m.type === "OUTWARD").length})
          </button>
        </div>

        <div className="w-full sm:w-64 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
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
        {filtered.map((item) => (
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
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  {item.type === "INWARD" ? (
                    <ArrowDownLeft className="w-3 h-3" />
                  ) : (
                    <ArrowUpRight className="w-3 h-3" />
                  )}
                  {item.type} &bull; {item.mode.replace("_", " ")}
                </span>

                <span className="text-[10px] font-mono text-slate-400 font-bold">{item.id}</span>
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
        ))}
      </div>

      {/* NEW INWARD MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowNewModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-800 p-1"
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
                <select
                  value={newEntity}
                  onChange={(e) => setNewEntity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none"
                >
                  <option value="Apex Precision Technologies Pvt Ltd">Apex Precision Technologies Pvt Ltd</option>
                  <option value="Zenora Logistics & Cold Chain LLP">Zenora Logistics & Cold Chain LLP</option>
                  <option value="Matrix Cloud Infotech Solutions Pvt Ltd">Matrix Cloud Infotech Solutions Pvt Ltd</option>
                  <option value="Dr. Vikramaditya Somani">Dr. Vikramaditya Somani</option>
                </select>
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
