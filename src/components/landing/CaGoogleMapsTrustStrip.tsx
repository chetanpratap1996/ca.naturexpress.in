"use client";

import React from "react";
import { 
  MapPin, 
  Star, 
  Phone, 
  Clock, 
  ExternalLink, 
  CheckCircle2, 
  Navigation, 
  Building2,
  Calendar,
  MessageSquare
} from "lucide-react";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";

interface CaGoogleMapsTrustStripProps {
  onOpenBooking: () => void;
}

export const CaGoogleMapsTrustStrip: React.FC<CaGoogleMapsTrustStripProps> = ({
  onOpenBooking,
}) => {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("GPA & Co. Chartered Accountants NM Verge YN Road Indore")}`;

  return (
    <section id="local-authority" className="py-12 sm:py-16 px-4 sm:px-8 bg-slate-50 border-b border-slate-200/90">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left 7 Columns: Google Maps Rating & Authority */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>Indore Head Office • Google Verified Chartered Accountancy Practice</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Visiting from Google Maps or Local Indore Reference?
              </h2>

              <p className="text-sm text-slate-600 leading-relaxed">
                Whether you need in-person corporate audit discussions, defense for a tax scrutiny notice, or confidential CFO advisory, our doors at <strong>NM Verge, Y.N. Road</strong> are open. We maintain executive conference rooms equipped for seamless promoter and director sessions.
              </p>

              {/* Verified Address & Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <MapPin className="w-5 h-5 text-btred-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Head Office Address</div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      {DEFAULT_FIRM_BRANDING.headOffice}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <Clock className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Consultation Timings</div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Mon – Sat: 10:00 AM – 7:30 PM
                      <span className="block text-[11px] text-slate-500">(Sunday by prior appointment)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-sm transition flex items-center gap-2"
                >
                  <Navigation className="w-4 h-4 text-btred-400" />
                  <span>Open in Google Maps (Directions)</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>

                <button
                  onClick={onOpenBooking}
                  className="px-5 py-2.5 rounded-xl bg-btred-600 hover:bg-btred-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book In-Office Meeting</span>
                </button>

                <a
                  href={`tel:${DEFAULT_FIRM_BRANDING.partnerPhone.replace(/\s+/g, "")}`}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-btred-600" />
                  <span>Call Reception</span>
                </a>
              </div>
            </div>

            {/* Right 5 Columns: Google Rating Showcase Card */}
            <div className="lg:col-span-5 bg-gradient-to-br from-amber-50/50 via-white to-red-50/30 rounded-2xl p-6 border border-amber-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-amber-100 pb-4">
                <div>
                  <div className="text-3xl font-black text-slate-900 flex items-center gap-2">
                    <span>4.9</span>
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-500" />
                      ))}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">
                    180+ Verified Client Reviews
                  </div>
                </div>

                <div className="w-12 h-12 rounded-xl bg-white border border-amber-200 flex items-center justify-center shadow-xs">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
              </div>

              {/* Client Review Quotes */}
              <div className="space-y-2.5 text-xs">
                <div className="bg-white/90 p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-800 font-bold mb-1">
                    <span>Manufacturing Director (Sanwer Road)</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Verified Review</span>
                  </div>
                  <p className="text-slate-600 text-[11px] italic">
                    &ldquo;CA Gunjan Jain successfully resolved our long-pending GST ITC dispute saving ₹36 Lakhs. Most tech-savvy and responsive CA firm in Central India.&rdquo;
                  </p>
                </div>

                <div className="bg-white/90 p-3 rounded-xl border border-slate-200/70 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-800 font-bold mb-1">
                    <span>Fintech Founder (Indore / Bangalore)</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Verified Review</span>
                  </div>
                  <p className="text-slate-600 text-[11px] italic">
                    &ldquo;Their 24/7 client portal gives us real-time audited P&amp;L and banker dockets in seconds. World-class service for startups.&rdquo;
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Serving Indore, Pithampur, Dewas, Bhopal, Mumbai &amp; Pan-India</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
