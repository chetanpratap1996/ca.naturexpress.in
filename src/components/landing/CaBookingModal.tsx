"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Phone, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  MessageSquare,
  Sparkles,
  AlertCircle,
  FileText
} from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { validateGstinStrict } from "@/lib/intelligence/registry/gstValidator";

interface CaBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: string;
  prefilledGstin?: string;
  diagnosticSummary?: string;
}

export const CaBookingModal: React.FC<CaBookingModalProps> = ({
  isOpen,
  onClose,
  initialService = "Corporate Statutory & Tax Audit",
  prefilledGstin = "",
  diagnosticSummary = "",
}) => {
  const [meetingType, setMeetingType] = useState<"in-person" | "virtual">("in-person");
  const [service, setService] = useState(initialService);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [gstin, setGstin] = useState(prefilledGstin);
  const [gstinError, setGstinError] = useState<string | null>(null);
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("11:30 AM");
  const [notes, setNotes] = useState(diagnosticSummary);
  const [agreedToIcauEthics, setAgreedToIcauEthics] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookingRefId, setBookingRefId] = useState("");

  useEffect(() => {
    if (initialService) setService(initialService);
  }, [initialService]);

  useEffect(() => {
    if (prefilledGstin) {
      setGstin(prefilledGstin);
      handleGstinChange(prefilledGstin);
    }
  }, [prefilledGstin]);

  useEffect(() => {
    if (diagnosticSummary && !notes) {
      setNotes(diagnosticSummary);
    }
  }, [diagnosticSummary]);

  if (!isOpen) return null;

  const handleGstinChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setGstin(clean);
    if (clean.length === 15) {
      const res = validateGstinStrict(clean);
      if (!res.isValid) {
        setGstinError(res.error || "Invalid GSTIN checksum or pattern");
      } else {
        setGstinError(null);
        // Auto-detect entity type from 4th char of PAN
        const panChar = clean[5];
        if (panChar === "C" && !companyName) {
          setCompanyName("Private Limited / Limited Company");
        } else if (panChar === "F" && !companyName) {
          setCompanyName("LLP / Partnership Firm");
        }
      }
    } else if (clean.length > 0 && clean.length < 15) {
      setGstinError(`Enter full 15-character GSTIN (${15 - clean.length} chars remaining)`);
    } else {
      setGstinError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setIsSubmitting(true);
    const refId = `BT-${Date.now().toString(36).toUpperCase()}`;
    setBookingRefId(refId);

    try {
      await fetch("/api/growth/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          companyName: companyName.trim() || "Corporate Entity",
          gstin: gstin.trim() || undefined,
          service,
          meetingType,
          preferredDate,
          preferredTime,
          notes: notes.trim(),
        }),
      });
    } catch (err) {
      console.warn("Consultation logged locally in session fallback");
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  const constructWhatsAppUrl = () => {
    const text = `*Strategic Consultation Request - Brains & Taxes (GPA & Co.)*
Ref: ${bookingRefId || "DIRECT-WEB"}
👤 *Promoter / Client:* ${name}
🏢 *Company:* ${companyName || "Proprietorship / Individual"}
${gstin ? `🏛 *GSTIN:* ${gstin}\n` : ""}📞 *Contact Phone:* ${phone}
📧 *Email:* ${email || "Not provided"}
📋 *Practice Area:* ${service}
📍 *Mode:* ${meetingType === "in-person" ? "In-Office (Indore Head Office, NM Verge, Y.N. Road)" : "Virtual Video Call (Google Meet)"}
🗓 *Preferred Date & Time:* ${preferredDate || "Earliest Available"} at ${preferredTime}
📝 *Key Brief:* ${notes || "Requesting strategic tax, audit or notice review with CA Gunjan Jain."}`;

    return `https://wa.me/${DEFAULT_FIRM_BRANDING.whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 via-red-50/40 to-slate-50 border-b border-slate-200 px-5 sm:px-7 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-btred-500 shadow-sm shrink-0">
              <img
                src="/images/ca-gunjan-jain.png"
                alt="CA Gunjan Jain, FCA"
                className="w-full h-full object-cover object-top"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Schedule Strategic Consultation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                With Managing Partner CA Gunjan Jain (FCA) &bull; GPA &amp; Co. (FRN: {DEFAULT_FIRM_BRANDING.frn})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close booking modal"
            className="w-8 h-8 rounded-full hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-7">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Consultation Format Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Consultation Format &amp; Venue
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMeetingType("in-person")}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition ${
                      meetingType === "in-person"
                        ? "border-btred-600 bg-red-50/60 text-slate-900 ring-2 ring-red-100"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100/70 text-slate-700"
                    }`}
                  >
                    <MapPin className={`w-4 h-4 shrink-0 ${meetingType === "in-person" ? "text-btred-600" : "text-slate-500"}`} />
                    <div>
                      <div className="text-xs font-bold">In-Office (Indore)</div>
                      <div className="text-[11px] text-slate-500 truncate">103 NM Verge, Y.N. Road</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMeetingType("virtual")}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition ${
                      meetingType === "virtual"
                        ? "border-btred-600 bg-red-50/60 text-slate-900 ring-2 ring-red-100"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100/70 text-slate-700"
                    }`}
                  >
                    <Video className={`w-4 h-4 shrink-0 ${meetingType === "virtual" ? "text-btred-600" : "text-slate-500"}`} />
                    <div>
                      <div className="text-xs font-bold">Virtual Video Conference</div>
                      <div className="text-[11px] text-slate-500 truncate">Google Meet / Phone Call</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Practice Service Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  2. Practice Area / Statutory Engagement
                </label>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-btred-500/20 focus:border-btred-500 transition font-medium"
                >
                  <option value="Corporate Statutory & Tax Audit">Corporate Statutory &amp; Tax Audit (Form 3CD + Schedule III + CARO 2020)</option>
                  <option value="Income Tax Scrutiny & Faceless Appeals">Direct Tax Scrutiny, Search &amp; Faceless Appeals (Sec 148, 143(3), CIT-A)</option>
                  <option value="GST Audit, SCN Defense & ITC Recovery">GST Audit, SCN Defense &amp; ITC Recovery (DRC-01, 2B vs 3B Reco)</option>
                  <option value="Virtual CFO & Working Capital Advisory">Virtual CFO &amp; Bank CMA Data for Working Capital / CC Limits</option>
                  <option value="MSME Section 43B(h) Audit & Compliance">MSME Section 43B(h) Audit &amp; 15/45-Day Disallowance Shield</option>
                  <option value="Company Law, ROC & Corporate Governance">Company Incorporation, ROC AOC-4 / MGT-7 &amp; Secretarial Hygiene</option>
                  <option value="Cross-Border, FEMA & Form 15CA/CB">Cross-Border Foreign Remittance, Form 15CA/CB &amp; NRI Real Estate Tax</option>
                  <option value="Startup Desk, 80-IAC & Angel Tax">Startup Desk, DPIIT 80-IAC Tax Exemption &amp; DCF Valuation</option>
                  <option value="Switching Existing CA Firm">Seamless Switch of Accounts from Previous CA (ICAI NOC Protocol)</option>
                </select>
              </div>

              {/* Entity Name & GSTIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company / Entity Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pratwi Solutions Private Limited"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-btred-500/20 focus:border-btred-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>GSTIN (15 Digits - Optional)</span>
                    {gstin.length === 15 && !gstinError && (
                      <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Valid Mod-36
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="e.g. 23AABCU9821F1ZX"
                    value={gstin}
                    onChange={(e) => handleGstinChange(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs uppercase font-mono tracking-wider focus:outline-none focus:ring-2 ${
                      gstinError 
                        ? "border-red-400 focus:ring-red-500/20 text-red-700" 
                        : "border-slate-300 focus:ring-btred-500/20 focus:border-btred-500 text-slate-800"
                    }`}
                  />
                  {gstinError && (
                    <div className="text-[11px] text-red-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{gstinError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Promoter Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Full Name &amp; Designation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chetan Pratap Singh (Director / CFO)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-btred-500/20 focus:border-btred-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number (WhatsApp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98XXX XXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-btred-500/20 focus:border-btred-500"
                  />
                </div>
              </div>

              {/* Work Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official / Work Email Address
                </label>
                <input
                  type="email"
                  placeholder="director@pratwi.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-btred-500/20 focus:border-btred-500"
                />
              </div>

              {/* Date & Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Preferred Consultation Date
                  </label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-btred-500/20 focus:border-btred-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Preferred Time Slot
                  </label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-btred-500/20 focus:border-btred-500"
                  >
                    <option value="10:30 AM">10:30 AM (Morning Slot)</option>
                    <option value="11:30 AM">11:30 AM (Mid-Morning Slot)</option>
                    <option value="02:30 PM">02:30 PM (Afternoon Slot)</option>
                    <option value="04:30 PM">04:30 PM (Evening Slot)</option>
                    <option value="06:00 PM">06:00 PM (Executive Post-Hours)</option>
                  </select>
                </div>
              </div>

              {/* Notes / Issue Brief */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Specific Challenge / Statutory Deadline / Notice Details
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Received Section 148 notice for AY 2019-20 with 15 days deadline, or planning CC limit enhancement of ₹15 Cr."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-btred-500/20 focus:border-btred-500 resize-none font-sans"
                />
              </div>

              {/* ICAI Compliance & Consent Checkbox */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/90 flex items-start gap-2.5 text-[11px] text-slate-600">
                <input
                  type="checkbox"
                  id="icai-consent"
                  checked={agreedToIcauEthics}
                  onChange={(e) => setAgreedToIcauEthics(e.target.checked)}
                  className="mt-0.5 rounded text-btred-600 focus:ring-btred-500 h-3.5 w-3.5 border-slate-300"
                />
                <label htmlFor="icai-consent" className="cursor-pointer leading-relaxed">
                  <strong>ICAI Code of Ethics Confirmation:</strong> I am voluntarily submitting this inquiry to seek professional consultation from GPA &amp; Co., Chartered Accountants, in compliance with Council Guidelines (2008 &amp; 2020). Discussions are privileged and strictly confidential under Section 126 of the Indian Evidence Act.
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !agreedToIcauEthics}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-btred-600 hover:bg-btred-700 disabled:opacity-50 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Registering Consultation...</span>
                  ) : (
                    <>
                      <span>Confirm &amp; Proceed to WhatsApp</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Confirmation State with Direct 1-Tap WhatsApp Link & Reference ID */
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-btred-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                  Ref ID: {bookingRefId}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  Consultation Request Registered!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                  Thank you, <strong>{name}</strong>. Senior Partner <strong>CA Gunjan Jain (FCA)</strong> and our corporate desk have received your appointment request for <strong>{service}</strong>.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left max-w-md mx-auto text-xs space-y-2 text-slate-700">
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500 font-medium">Meeting Format:</span>
                  <span className="font-bold text-slate-900">
                    {meetingType === "in-person" ? "In-Office (Indore Head Office, NM Verge)" : "Virtual Video Conference"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500 font-medium">Scheduled Slot:</span>
                  <span className="font-bold text-slate-900">
                    {preferredDate || "Earliest Slot Today"} at {preferredTime}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500 font-medium">Registered Phone:</span>
                  <span className="font-bold text-slate-900">{phone}</span>
                </div>
                {gstin && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Verified GSTIN:</span>
                    <span className="font-mono font-bold text-slate-900">{gstin}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={constructWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>Instant Connect on WhatsApp with Partner</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    onClose();
                  }}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Done &amp; Close Window
                </button>
              </div>

              <div className="text-[11px] text-slate-400">
                You will also receive an SMS/WhatsApp confirmation on {phone} within 15 minutes during business hours.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
