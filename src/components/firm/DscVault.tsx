"use client";

import React, { useState } from "react";
import { DscRecord } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { 
  KeyRound, 
  AlertTriangle, 
  User, 
  Search, 
  CheckCircle2, 
  MapPin, 
  ArrowRightLeft, 
  Clock, 
  Check, 
  ShieldCheck, 
  Send,
  Zap,
  Lock
} from "lucide-react";

interface DscVaultProps {
  tokens: DscRecord[];
}

export const DscVault: React.FC<DscVaultProps> = ({ tokens }) => {
  const [tokenList, setTokenList] = useState<DscRecord[]>(tokens);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "checked-out" | "expiring-soon">("all");
  const [checkoutModalToken, setCheckoutModalToken] = useState<DscRecord | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string>("Rohan Verma (Article)");
  const [checkoutPurpose, setCheckoutPurpose] = useState<string>("Statutory Filing Sign-off");
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  React.useEffect(() => {
    setTokenList(tokens);
  }, [tokens]);

  const filtered = tokenList.filter((t) => {
    const matchesSearch =
      t.entityName.toLowerCase().includes(search.toLowerCase()) ||
      t.holderName.toLowerCase().includes(search.toLowerCase()) ||
      t.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.vaultSlot.toLowerCase().includes(search.toLowerCase());

    if (activeFilter === "checked-out") {
      return matchesSearch && t.currentCustodian !== "Firm Master Safe";
    }
    if (activeFilter === "expiring-soon") {
      return matchesSearch && (t.daysToExpiry <= 30 || t.expiryStatus === "EXPIRED");
    }
    return matchesSearch;
  });

  const handleReturnToSafe = async (id: string) => {
    setTokenList((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              currentCustodian: "Firm Master Safe",
              checkedOutAt: undefined,
              checkedOutPurpose: undefined,
            }
          : t
      )
    );
    try {
      await fetch("/api/dsc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId: id,
          action: "RETURN",
        }),
      });
    } catch (e) {
      console.error(e);
    }
    setActionSuccessToast("Token returned safely to Master Safe! Custody logged.");
    setTimeout(() => setActionSuccessToast(null), 4000);
  };

  const handleConfirmCheckout = async () => {
    if (!checkoutModalToken) return;
    const token = checkoutModalToken;
    setTokenList((prev) =>
      prev.map((t) =>
        t.id === token.id
          ? {
              ...t,
              currentCustodian: selectedStaff,
              checkedOutAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              checkedOutPurpose: checkoutPurpose,
            }
          : t
      )
    );
    try {
      await fetch("/api/dsc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId: token.id,
          action: "CHECKOUT",
          staffName: selectedStaff,
          purpose: checkoutPurpose,
        }),
      });
    } catch (e) {
      console.error(e);
    }
    setActionSuccessToast(`Token checked out to ${selectedStaff}! Custody transfer logged to audit ledger.`);
    setCheckoutModalToken(null);
    setTimeout(() => setActionSuccessToast(null), 4000);
  };

  const expiringCount = tokenList.filter((t) => t.daysToExpiry <= 30 || t.expiryStatus === "EXPIRED").length;
  const checkedOutCount = tokenList.filter((t) => t.currentCustodian !== "Firm Master Safe").length;

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {actionSuccessToast && (
        <div className="bg-emerald-950 border border-emerald-500 text-emerald-200 p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-black text-white">{actionSuccessToast}</span>
          </div>
          <span className="bg-emerald-800 text-white text-[10px] font-black px-2 py-0.5 rounded">
            CUSTODY LOG UPDATED
          </span>
        </div>
      )}

      {/* Vault Summary (Crisp White Card) */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-red-50 text-btred-logo rounded-2xl border border-red-200 shadow-sm">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              Physical DSC USB Token Vault &amp; Custody Radar
              <span className="text-[11px] bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-0.5 rounded-full font-bold">
                Class 3 FIPS Certified
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Tracks 420 physical USB dongles (ePass2003, ProxKey, mToken). Prevents lost hardware, midnight filing panics, and un-renewed certificates.
            </p>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              activeFilter === "all" ? "bg-btblack text-white shadow-sm" : "bg-slate-100 text-slate-700"
            }`}
          >
            All Vault ({tokenList.length})
          </button>
          <button
            onClick={() => setActiveFilter("checked-out")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              activeFilter === "checked-out" ? "bg-btblack text-white shadow-sm" : "bg-slate-100 text-slate-700"
            }`}
          >
            Checked Out ({checkedOutCount})
          </button>
          <button
            onClick={() => setActiveFilter("expiring-soon")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              activeFilter === "expiring-soon" ? "bg-btred-logo text-white shadow-sm" : "bg-red-50 text-btred-logo border border-red-200"
            }`}
          >
            Expiring &le; 30 Days ({expiringCount})
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Company, Director Name, Serial Number, or Vault Locker Bin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-xs text-slate-800 pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-btred-logo font-medium"
          />
        </div>
      </div>

      {/* Tokens List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.map((token) => {
          const isExpiring = token.daysToExpiry <= 30;
          const isExpired = token.daysToExpiry <= 0;
          const isInSafe = token.currentCustodian === "Firm Master Safe";

          return (
            <div
              key={token.id}
              className={`bg-white border rounded-3xl p-5 flex flex-col justify-between shadow-sm transition group hover:shadow-md ${
                isExpired 
                  ? "border-red-300 ring-2 ring-red-100" 
                  : isExpiring 
                  ? "border-amber-300" 
                  : "border-slate-200 hover:border-btred-logo"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                    {token.tokenType}
                  </span>

                  {isExpired ? (
                    <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-red-100 text-btred-logo border border-red-200">
                      <AlertTriangle className="w-3 h-3" />
                      EXPIRED ({Math.abs(token.daysToExpiry)}d ago)
                    </span>
                  ) : isExpiring ? (
                    <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                      <Clock className="w-3 h-3" />
                      Expires in {token.daysToExpiry} Days
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Valid ({token.daysToExpiry}d left)
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-black text-slate-900 line-clamp-1">{token.entityName}</h4>
                <p className="text-xs text-slate-600 font-medium mt-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Signatory: <strong className="text-slate-900">{token.holderName}</strong>
                </p>

                {/* Vault Location & Custody Box */}
                <div className="mt-3.5 p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs font-medium">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-btred-logo" />
                      Physical Slot:
                    </span>
                    <span className="font-mono font-bold text-slate-900">{token.vaultSlot}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Current Custodian:</span>
                    <span className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                      isInSafe 
                        ? "bg-slate-200 text-slate-800" 
                        : "bg-red-50 text-btred-logo border border-red-200"
                    }`}>
                      {token.currentCustodian}
                    </span>
                  </div>

                  {token.checkedOutAt && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      <span>Checked Out At:</span>
                      <span className="font-semibold">{token.checkedOutAt}</span>
                    </div>
                  )}
                </div>

                {isExpiring && (
                  <div className="mt-2.5 p-2 bg-red-50 border border-red-200 rounded-xl text-[10px] text-red-900 flex items-center justify-between font-bold">
                    <span>Class 3 Renewal Required</span>
                    <button 
                      onClick={() => alert(`Generated Class 3 DSC renewal fee invoice (₹2,500) and dispatched WhatsApp alert to ${token.holderName}`)}
                      className="text-btred-logo underline cursor-pointer hover:text-btred-700 font-black"
                    >
                      Bill ₹2,500 Renewal
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Card Action */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 truncate max-w-[130px]">
                  {token.serialNumber}
                </span>

                {isInSafe ? (
                  <button
                    onClick={() => setCheckoutModalToken(token)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black px-3 py-1.5 rounded-xl transition flex items-center gap-1 border border-slate-300"
                  >
                    <ArrowRightLeft className="w-3 h-3 text-btred-logo" />
                    Check Out Token
                  </button>
                ) : (
                  <button
                    onClick={() => handleReturnToSafe(token.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3 h-3" />
                    Return to Safe
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CHECKOUT MODAL */}
      {checkoutModalToken && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative animate-in fade-in zoom-in-95">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-btred-logo" />
              Check Out Physical DSC Token
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Physical custody log for {checkoutModalToken.holderName} &bull; {checkoutModalToken.entityName}
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Assign Custodian (Staff):</label>
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none"
                >
                  <option value="Rohan Verma (Article - Year 2)">Rohan Verma (Article - Year 2)</option>
                  <option value="Ananya Iyer (Article - Year 3)">Ananya Iyer (Article - Year 3)</option>
                  <option value="Pooja Deshmukh (Article - Year 1)">Pooja Deshmukh (Article - Year 1)</option>
                  <option value="CA Gunjan Jain (Partner)">CA Gunjan Jain (Partner)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Filing Purpose / Engagement:</label>
                <input
                  type="text"
                  value={checkoutPurpose}
                  onChange={(e) => setCheckoutPurpose(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 text-[11px] font-medium">
                <strong>ICAI Audit Rule:</strong> Tokens must be returned to the locker before 7:00 PM daily. Cannot leave firm premises.
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setCheckoutModalToken(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCheckout}
                className="bg-btblack hover:bg-slate-800 text-white text-xs font-black px-4 py-2 rounded-xl transition shadow-sm"
              >
                Confirm &amp; Start Timer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
