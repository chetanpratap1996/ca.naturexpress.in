"use client";

import React, { useState } from "react";
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
  Sparkles
} from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface CaBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: string;
}

export const CaBookingModal: React.FC<CaBookingModalProps> = ({
  isOpen,
  onClose,
  initialService = "General Corporate Advisory",
}) => {
  const [meetingType, setMeetingType] = useState<"in-person" | "virtual">("in-person");
  const [service, setService] = useState(initialService);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("11:30 AM");
  const [notes, setNotes] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setIsSubmitted(true);
  };

  const constructWhatsAppUrl = () => {
    const text = `*New Consultation Request - Brains & Taxes (GPA & Co.)*
👤 *Client Name:* ${name}
🏢 *Company/Entity:* ${companyName || "Proprietorship / Individual"}
📞 *Contact:* ${phone}
📧 *Email:* ${email || "Not provided"}
📋 *Service:* ${service}
📍 *Meeting Mode:* ${meetingType === "in-person" ? "In-Office (Indore Y.N. Road)" : "Google Meet / Phone"}
🗓 *Preferred Date & Time:* ${preferredDate || "Earliest Available"} at ${preferredTime}
📝 *Notes:* ${notes || "Requesting strategic tax & audit consultation."}`;

    return `https://wa.me/${DEFAULT_FIRM_BRANDING.whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-2xl overflow-hidden my-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 via-red-50/40 to-slate-50 border-b border-slate-200 px-5 sm:px-7 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-btred-50 border border-btred-100 flex items-center justify-center text-btred-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Schedule Strategic Consultation
              </h3>
              <p className="text-xs text-slate-500">
                With Senior Partner CA Gunjan Jain (FCA) &amp; Enterprise Advisory Team
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-4">
            {/* Consultation Mode Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Consultation Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMeetingType("in-person")}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition ${
                    meetingType === "in-person"
                      ? "border-btred-600 bg-red-50/50 text-slate-900 ring-2 ring-red-100"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700"
                  }`}
                >
                  <MapPin className={`w-4 h-4 flex-shrink-0 ${meetingType === "in-person" ? "text-btred-600" : "text-slate-500"}`} />
                  <div>
                    <div className="text-xs font-bold">In-Office (Indore)</div>
                    <div className="text-[11px] text-slate-500 truncate">NM Verge, Y.N. Road</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMeetingType("virtual")}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition ${
                    meetingType === "virtual"
                      ? "border-btred-600 bg-red-50/50 text-slate-900 ring-2 ring-red-100"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700"
                  }`}
                >
                  <Video className={`w-4 h-4 flex-shrink-0 ${meetingType === "virtual" ? "text-btred-600" : "text-slate-500"}`} />
                  <div>
                    <div className="text-xs font-bold">Virtual / Video Call</div>
                    <div className="text-[11px] text-slate-500 truncate">Google Meet or Phone</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Practice Service Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Practice Area / Required Service
              </label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-btred-500/20 focus:border-btred-500 transition"
              >
                <option value="Corporate Statutory & Tax Audit">Corporate Statutory &amp; Tax Audit (Companies Act / 3CD)</option>
                <option value="Income Tax Scrutiny & Faceless Appeals">Income Tax Scrutiny, Search &amp; Faceless Appeals (Sec 148/143)</option>
                <option value="GST Audit, SCN Defense & ITC Recovery">GST Audit, SCN Defense &amp; ITC Recovery (DRC-01 / 2B)</option>
                <option value="Virtual CFO & Working Capital Advisory">Virtual CFO &amp; Bank CMA Data for Working Capital / CC Limits</option>
                <option value="MSME Section 43B(h) Audit & Compliance">MSME Section 43B(h) Audit &amp; 15/45-Day Payment Shield</option>
                <option value="Startup Desk, 80-IAC & Angel Tax">Startup Desk, DPIIT 80-IAC Tax Exemption &amp; Angel Tax Valuation</option>
                <option value="Company Incorporation & ROC Compliance">Company Incorporation, LLP &amp; Secretarial ROC Filings</option>
                <option value="Cross-Border, FEMA & Form 15CA/CB">Cross-Border Foreign Remittance, Form 15CA/CB &amp; NRI Taxation</option>
                <option value="High Net-Worth Capital Gains & Wealth">Capital Gains, Family Office Structuring &amp; Trust Taxation</option>
                <option value="Switching Existing CA Firm">Seamless Switch of Existing Accounts from Current CA</option>
              </select>
            </div>

            {/* Personal & Entity Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Rajesh Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-btred-500/20 focus:border-btred-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company / Entity Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Apex Infra Solutions Pvt Ltd"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-btred-500/20 focus:border-btred-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number (WhatsApp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98XXX XXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-btred-500/20 focus:border-btred-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Email Address
                </label>
                <input
                  type="email"
                  placeholder="director@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-btred-500/20 focus:border-btred-500"
                />
              </div>
            </div>

            {/* Timing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-btred-500/20 focus:border-btred-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Time Slot
                </label>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-btred-500/20 focus:border-btred-500"
                >
                  <option value="10:30 AM">10:30 AM (Morning Slot)</option>
                  <option value="11:30 AM">11:30 AM (Mid-Morning Slot)</option>
                  <option value="02:30 PM">02:30 PM (Afternoon Slot)</option>
                  <option value="04:30 PM">04:30 PM (Evening Slot)</option>
                  <option value="06:00 PM">06:00 PM (Executive Post-Hours)</option>
                </select>
              </div>
            </div>

            {/* Brief Query */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Specific Challenge or Deadline (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g., Received Section 148 Notice with 15 days deadline, or planning ₹25 Cr turnover manufacturing unit setup."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-btred-500/20 focus:border-btred-500 resize-none"
              ></textarea>
            </div>

            {/* Regulatory Privacy Note */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-start gap-2 text-[11px] text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Confidentiality Assured:</strong> All financial discussions are strictly protected under Section 126 of the Indian Evidence Act and ICAI Code of Ethics.
              </span>
            </div>

            {/* Buttons */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-btred-600 hover:bg-btred-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <span>Confirm &amp; Proceed to WhatsApp</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        ) : (
          /* Confirmation State with Direct 1-Tap WhatsApp Link */
          <div className="p-7 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                Consultation Request Logged!
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                Thank you, <strong>{name}</strong>. Senior Partner CA Gunjan Jain and our corporate desk have received your appointment request for <strong>{service}</strong>.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left max-w-md mx-auto text-xs space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Meeting Format:</span>
                <span className="font-semibold">{meetingType === "in-person" ? "In-Office (Indore Y.N. Road)" : "Virtual / Phone"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Date:</span>
                <span className="font-semibold">{preferredDate || "Earliest Slot Today"} at {preferredTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact Number:</span>
                <span className="font-semibold">{phone}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={constructWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
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
                Close Window
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
