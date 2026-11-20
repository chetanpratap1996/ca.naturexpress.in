"use client";

import React, { useState } from "react";
import { 
  MapPin, 
  Navigation, 
  Phone, 
  Mail, 
  Clock, 
  ExternalLink, 
  Building2, 
  ShieldCheck, 
  Calendar,
  MessageSquare,
  Car,
  Compass,
  CheckCircle2,
  Copy,
  Check,
  Layers,
  Sparkles,
  Lock,
  Wifi,
  CornerDownRight,
  Maximize2
} from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface CaGoogleMapOfficeHubProps {
  onOpenBooking: () => void;
}

export const CaGoogleMapOfficeHub: React.FC<CaGoogleMapOfficeHubProps> = ({
  onOpenBooking,
}) => {
  const [activeView, setActiveView] = useState<"map" | "commute" | "facilities">("map");
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Exact Google Maps place link for Brains & Taxes Pvt. Ltd. / NM Verge, YN Road
  const googleMapsPlaceUrl = "https://maps.google.com/?cid=14163993356075902551&q=Brains+%26+Taxes+Pvt.+Ltd.+Indore";
  const fullAddressText = "Office No. 103, NM Verge, Y.N. Road, Indore, Madhya Pradesh - 452001 (Landmark: Near Regal Square & MP High Court)";

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(fullAddressText);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2200);
  };

  const commuteTimes = [
    { from: "Vijay Nagar / AB Road Corridor", time: "12-15 Mins", route: "Direct via AB Road / Industry House", icon: "🏢" },
    { from: "Pithampur Industrial SEZ", time: "40-45 Mins", route: "Via Rau-Pithampur Bypass", icon: "🏭" },
    { from: "Indore Airport (IDR)", time: "20-25 Mins", route: "Via Airport Road / Bada Ganpati", icon: "✈️" },
    { from: "Indore Junction Railway Station", time: "7-10 Mins", route: "Via Regal Square & MG Road", icon: "🚆" },
    { from: "Sanwer Road Industrial Belt", time: "22-26 Mins", route: "Via Laxmi Bai Nagar / Fort Road", icon: "⚙️" },
    { from: "Palasia / New Palasia", time: "4-6 Mins", route: "Direct adjacent corridor", icon: "📍" },
  ];

  const executiveFacilities = [
    {
      title: "Confidential Promoter Boardroom",
      desc: "Soundproof 12-person suite for executive board meetings, bank consortium discussions, and M&A diligence.",
      icon: <Building2 className="w-5 h-5 text-btred-600" />
    },
    {
      title: "Encrypted Video Appellate Bridge",
      desc: "High-speed dual-redundant fiber links for virtual hearings before NFAC, CIT(Appeals), and ITAT benches.",
      icon: <Wifi className="w-5 h-5 text-blue-600" />
    },
    {
      title: "Hardware Token & DSC Vault",
      desc: "Fireproof, regulated physical safe for client Digital Signature Certificates (DSC) and e-filing keys.",
      icon: <Lock className="w-5 h-5 text-amber-600" />
    },
    {
      title: "Reserved Client Visitor Parking",
      desc: "Dedicated surface and basement parking spots reserved exclusively for corporate promoters and clients.",
      icon: <Car className="w-5 h-5 text-emerald-600" />
    }
  ];

  return (
    <section id="office-location" className="py-16 sm:py-24 px-4 sm:px-8 bg-white border-b border-slate-200/90 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-red-50/60 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-btred-600 text-xs font-bold mb-3 shadow-2xs">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>Practice Headquarters &bull; Central Executive Desk</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Indore Practice Headquarters &amp; Meeting Desk
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Centrally anchored in the prime corporate corridor of Indore on Y.N. Road. Engineered for confidential promoter conferences, board presentations, and tax audits.
          </p>
        </div>

        {/* Master Office Hub Frame */}
        <div className="bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden shadow-xl">
          
          {/* Top Control Bar: View Switcher */}
          <div className="p-3 sm:p-5 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setActiveView("map")}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  activeView === "map"
                    ? "bg-red-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900"
                }`}
              >
                <MapPin className={`w-3.5 h-3.5 ${activeView === "map" ? "text-white" : "text-slate-400"}`} />
                <span>Live Google Map</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView("commute")}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  activeView === "commute"
                    ? "bg-red-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900"
                }`}
              >
                <Compass className={`w-3.5 h-3.5 ${activeView === "commute" ? "text-white" : "text-slate-400"}`} />
                <span>Commute Times</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView("facilities")}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  activeView === "facilities"
                    ? "bg-red-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900"
                }`}
              >
                <Building2 className={`w-3.5 h-3.5 ${activeView === "facilities" ? "text-white" : "text-slate-400"}`} />
                <span>Executive Suites</span>
              </button>
            </div>

            {/* Quick Status Pill */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto shrink-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Open Mon&ndash;Sat (10:00 AM &ndash; 7:30 PM)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 w-full">
            
            {/* Left 7 Columns: Embedded Google Map / View Area with Motion */}
            <div className="lg:col-span-7 relative min-h-[350px] sm:min-h-[500px] bg-slate-200 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col w-full max-w-full overflow-hidden">
              
              {/* Tab 1: Live Interactive Google Map Embed */}
              {activeView === "map" && (
                <div className="relative w-full h-full min-h-[350px] sm:min-h-[500px] flex-1 animate-fadeIn overflow-hidden">
                  {/* Verified Google Maps iframe for Brains & Taxes Pvt. Ltd. */}
                  <iframe
                    title="Brains & Taxes Pvt. Ltd. - Office No. 103 NM Verge YN Road Indore"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14719.670849714143!2d75.85544588715817!3d22.731299700000008!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3962fd90df37ef4d%3A0xc490559862761657!2sBrains%20%26%20Taxes%20Pvt.%20Ltd.!5e0!3m2!1sen!2sin!4v1794775702195!5m2!1sen!2sin"
                    className="w-full h-full min-h-[350px] sm:min-h-[500px] border-0"
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />

                  {/* Floating Luxury Glassmorphism Location Badge */}
                  <div className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4 right-2.5 sm:right-auto sm:max-w-xs z-10">
                    <div className="bg-white/95 backdrop-blur-md text-slate-900 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 animate-float">
                      <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                            BT
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-slate-900 flex items-center gap-1.5 truncate">
                              <span className="truncate">Brains &amp; Taxes</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium truncate">
                              Office 103, NM Verge
                            </div>
                          </div>
                        </div>

                        <span className="text-[9px] font-black uppercase tracking-wider bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-200 shrink-0">
                          HQ
                        </span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px] gap-2">
                        <span className="text-slate-600 truncate">Opposite High Court</span>
                        <button
                          type="button"
                          onClick={handleCopyAddress}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center gap-1 shrink-0"
                          title="Copy Full Address"
                        >
                          {copiedAddress ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-[10px] text-emerald-700">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-500" />
                              <span className="text-[10px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Floating Action Button (Bottom Left) */}
                  <div className="absolute bottom-2.5 sm:bottom-4 left-2.5 sm:left-4 right-2.5 sm:right-auto z-10 flex flex-wrap items-center gap-2">
                    <a
                      href="https://maps.app.goo.gl/uX3b4hK3xYw1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] sm:text-xs font-bold shadow-md flex items-center justify-center gap-2 transition group"
                    >
                      <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white group-hover:scale-110 transition-transform" />
                      <span>Google Maps App</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  </div>

                </div>
              )}

              {/* Tab 2: Commute Guide View */}
              {activeView === "commute" && (
                <div className="p-6 sm:p-8 bg-white text-slate-900 flex-1 flex flex-col justify-between animate-fadeIn space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-red-600 mb-1">
                      <Compass className="w-4 h-4 text-red-600" />
                      <span>Indore Regional Travel Times</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900">
                      Strategic Central Location on Y.N. Road
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Direct connectivity from major corporate corridors, industrial estates, and transit hubs across Indore and MP.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {commuteTimes.map((item, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-red-300 transition">
                        <div className="flex items-center justify-between">
                          <span className="text-lg">{item.icon}</span>
                          <span className="text-xs font-black text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            {item.time}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1.5">{item.from}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{item.route}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                    <span>Visiting from outstation? We arrange airport pickup for visiting corporate delegations.</span>
                    <button
                      type="button"
                      onClick={() => setActiveView("map")}
                      className="text-xs font-bold text-red-600 hover:text-red-700 transition"
                    >
                      Return to Map &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Facilities View */}
              {activeView === "facilities" && (
                <div className="p-6 sm:p-8 bg-white text-slate-900 flex-1 flex flex-col justify-between animate-fadeIn space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700 mb-1">
                      <Building2 className="w-4 h-4 text-amber-600" />
                      <span>Executive Suite Infrastructure</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900">
                      Built for Confidential Corporate Fiduciary Work
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Every square foot at NM Verge is configured to guarantee strict client data secrecy and professional comfort.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {executiveFacilities.map((f, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-red-300 transition">
                        <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mb-2.5 text-red-600">
                          {f.icon}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{f.title}</h4>
                        <p className="text-[11px] text-slate-600 mt-1 leading-normal">{f.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 text-right">
                    <button
                      type="button"
                      onClick={() => setActiveView("map")}
                      className="text-xs font-bold text-red-600 hover:text-red-700 transition"
                    >
                      Switch to Live Map &rarr;
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Right 5 Columns: Head Office Profile & Immediate Action Hub */}
            <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 space-y-6 bg-white flex flex-col justify-between">
              
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-btred-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                    Official Head Office Address
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">
                    Office No. 103, NM Verge
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 font-bold mt-1">
                    Y.N. Road, Indore, Madhya Pradesh &ndash; 452001
                  </p>
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-500 leading-normal">
                    <CornerDownRight className="w-3.5 h-3.5 text-btred-600 shrink-0 mt-0.5" />
                    <span><strong>Key Landmarks:</strong> Near Regal Square, Opposite High Court of MP Bench &amp; New Palasia Corridor.</span>
                  </div>
                </div>

                {/* Contact Desk Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  
                  {/* Managing Partner Direct Phone */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-red-300 transition group">
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-btred-600" />
                      <span>Managing Partner Direct</span>
                    </div>
                    <a
                      href={`tel:${DEFAULT_FIRM_BRANDING.partnerPhone.replace(/\s+/g, "")}`}
                      className="font-bold text-slate-900 group-hover:text-btred-600 transition block truncate"
                    >
                      {DEFAULT_FIRM_BRANDING.partnerPhone}
                    </a>
                  </div>

                  {/* WhatsApp Desk */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition group">
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp Practice Desk</span>
                    </div>
                    <a
                      href={`https://wa.me/${DEFAULT_FIRM_BRANDING.whatsappNumber}?text=${encodeURIComponent("Hello CA Gunjan Jain, I would like to visit your office at NM Verge, Y.N. Road for an audit discussion.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-emerald-700 group-hover:text-emerald-800 transition block truncate"
                    >
                      +91 {DEFAULT_FIRM_BRANDING.whatsappNumber}
                    </a>
                  </div>

                  {/* Corporate Email */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition group">
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>Corporate Inquiries</span>
                    </div>
                    <a
                      href={`mailto:${DEFAULT_FIRM_BRANDING.email}`}
                      className="font-bold text-slate-900 group-hover:text-btred-600 transition block truncate"
                    >
                      {DEFAULT_FIRM_BRANDING.email}
                    </a>
                  </div>

                  {/* Office Hours */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Consultation Hours</span>
                    </div>
                    <div className="font-bold text-slate-900 text-[11px]">
                      10:00 AM &ndash; 7:30 PM
                    </div>
                    <span className="text-[10px] text-slate-500">Mon &ndash; Sat (By appointment)</span>
                  </div>

                </div>

                {/* Building Highlights */}
                <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Reserved on-premise client valet and visitor parking.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-btred-600 shrink-0" />
                    <span>Strict client confidentiality guaranteed under ICAI professional standards.</span>
                  </div>
                </div>

              </div>

              {/* Call-to-Action Desk */}
              <div className="pt-4 border-t border-slate-200 space-y-2.5">
                <button
                  type="button"
                  onClick={onOpenBooking}
                  className="w-full py-3.5 rounded-xl bg-btred-600 hover:bg-btred-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 group"
                >
                  <Calendar className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                  <span>Schedule In-Office Appointment at NM Verge</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://wa.me/${DEFAULT_FIRM_BRANDING.whatsappNumber}?text=${encodeURIComponent("Hello CA Gunjan Jain, I would like to visit your office at NM Verge, Y.N. Road for a consultation.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition flex items-center justify-center gap-1.5 text-center"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-200 transition flex items-center justify-center gap-1.5 text-center"
                  >
                    {copiedAddress ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-emerald-700">Address Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>Copy Address</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
