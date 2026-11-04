"use client";

import React from "react";
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
  Car
} from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface CaGoogleMapOfficeHubProps {
  onOpenBooking: () => void;
}

export const CaGoogleMapOfficeHub: React.FC<CaGoogleMapOfficeHubProps> = ({
  onOpenBooking,
}) => {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("GPA & Co. Chartered Accountants NM Verge YN Road Indore 452001")}`;

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-8 bg-white border-b border-slate-200/90">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-btred-600 text-xs font-bold mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span>Head Office &amp; Strategic Hub</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Indore Practice Headquarters &amp; Meeting Desk
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Conveniently situated in the commercial heart of Indore on Y.N. Road. Designed for confidential promoter conferences, board presentations, and tax audits.
          </p>
        </div>

        {/* Office & Map Layout */}
        <div className="bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* Left 6 Columns: Interactive Map View / Directions */}
            <div className="lg:col-span-6 relative min-h-[380px] bg-slate-200 border-b lg:border-b-0 lg:border-r border-slate-200">
              {/* Responsive Google Maps Embed */}
              <iframe
                title="GPA & Co. Chartered Accountants Office Location"
                src="https://maps.google.com/maps?q=Y.N.+Road,+Indore,+Madhya+Pradesh+452001&t=&z=15&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full min-h-[380px] border-0"
                loading="lazy"
                allowFullScreen
              ></iframe>

              {/* Floating Map Overlay Button */}
              <div className="absolute bottom-4 left-4 right-4 sm:right-auto z-10">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-slate-900/95 hover:bg-black text-white text-xs font-bold shadow-lg backdrop-blur flex items-center justify-center gap-2 transition"
                >
                  <Navigation className="w-4 h-4 text-btred-400" />
                  <span>Navigate with Google Maps App</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              </div>
            </div>

            {/* Right 6 Columns: Head Office Profile & Timings */}
            <div className="lg:col-span-6 p-6 sm:p-10 space-y-6 bg-white">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-btred-600">
                  Physical Office Details
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  Office No. 103, NM Verge
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Y.N. Road, Indore, Madhya Pradesh - 452001
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Landmarks: Near Regal Square, High Court Bench &amp; New Palasia
                </p>
              </div>

              {/* Contact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-btred-600" />
                    <span>Managing Partner Direct</span>
                  </div>
                  <a
                    href={`tel:${DEFAULT_FIRM_BRANDING.partnerPhone.replace(/\s+/g, "")}`}
                    className="font-bold text-slate-900 hover:text-btred-600 transition"
                  >
                    {DEFAULT_FIRM_BRANDING.partnerPhone}
                  </a>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Desk</span>
                  </div>
                  <a
                    href={`https://wa.me/${DEFAULT_FIRM_BRANDING.whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-emerald-700 hover:text-emerald-800 transition"
                  >
                    +91 79999 95897
                  </a>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>Corporate Audit Inquiries</span>
                  </div>
                  <a
                    href={`mailto:${DEFAULT_FIRM_BRANDING.email}`}
                    className="font-bold text-slate-900 hover:text-btred-600 transition"
                  >
                    {DEFAULT_FIRM_BRANDING.email}
                  </a>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Consultation Hours</span>
                  </div>
                  <div className="font-bold text-slate-900">
                    10:00 AM – 7:30 PM (Mon–Sat)
                  </div>
                </div>
              </div>

              {/* Office Facilities */}
              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-slate-500" />
                  <span>Reserved client parking available on premises.</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Private conference suites for confidential promoter &amp; investor meetings.</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={onOpenBooking}
                  className="px-6 py-3 rounded-xl bg-btred-600 hover:bg-btred-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Schedule In-Office Appointment</span>
                </button>

                <a
                  href={`https://wa.me/${DEFAULT_FIRM_BRANDING.whatsappNumber}?text=${encodeURIComponent("Hello CA Gunjan Jain, I would like to visit your office on Y.N. Road for a consultation.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1.5"
                >
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
