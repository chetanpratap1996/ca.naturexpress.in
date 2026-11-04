"use client";

import React, { useState } from "react";
import { CaLandingNav } from "./CaLandingNav";
import { CaHeroSection } from "./CaHeroSection";
import { CaGoogleMapsTrustStrip } from "./CaGoogleMapsTrustStrip";
import { CaPracticeAreas } from "./CaPracticeAreas";
import { CaComplianceHealthCheck } from "./CaComplianceHealthCheck";
import { CaDigitalAdvantage } from "./CaDigitalAdvantage";
import { CaCaseStudies } from "./CaCaseStudies";
import { CaPartnerLeadership } from "./CaPartnerLeadership";
import { CaStatutoryCalendar } from "./CaStatutoryCalendar";
import { CaGoogleMapOfficeHub } from "./CaGoogleMapOfficeHub";
import { CaFaqSection } from "./CaFaqSection";
import { CaEnterpriseFooter } from "./CaEnterpriseFooter";
import { CaMobileStickyBar } from "./CaMobileStickyBar";
import { CaBookingModal } from "./CaBookingModal";

interface CaEnterpriseLandingViewProps {
  onOpenLogin: (role?: "partner" | "article" | "client") => void;
  onEnterSandbox: (role: "partner" | "article" | "client") => void;
}

export const CaEnterpriseLandingView: React.FC<CaEnterpriseLandingViewProps> = ({
  onOpenLogin,
  onEnterSandbox,
}) => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingInitialService, setBookingInitialService] = useState("Corporate Statutory & Tax Audit");

  const handleOpenBooking = (service?: string) => {
    if (service) setBookingInitialService(service);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans antialiased overflow-x-hidden selection:bg-btred-600 selection:text-white pb-14 sm:pb-0">
      {/* 1. Executive Top Bar & Header Navigation */}
      <CaLandingNav 
        onOpenBooking={handleOpenBooking}
        onOpenLogin={onOpenLogin}
        onEnterSandbox={onEnterSandbox}
      />

      {/* 2. Master Institutional Hero Section */}
      <CaHeroSection 
        onOpenBooking={handleOpenBooking}
        onOpenLogin={onOpenLogin}
        onEnterSandbox={onEnterSandbox}
      />

      {/* 3. Google Maps Verified 4.9★ Local Authority Strip */}
      <CaGoogleMapsTrustStrip 
        onOpenBooking={() => handleOpenBooking("In-Office Indore Consultation")}
      />

      {/* 4. Eight Comprehensive Practice Verticals */}
      <CaPracticeAreas 
        onOpenBooking={handleOpenBooking}
      />

      {/* 5. Interactive Compliance Risk & Audit Health Check Engine */}
      <CaComplianceHealthCheck 
        onOpenBooking={handleOpenBooking}
      />

      {/* 6. The B&T Digital Advantage (Why We Outperform Traditional CAs) */}
      <CaDigitalAdvantage 
        onOpenLogin={onOpenLogin}
        onEnterSandbox={onEnterSandbox}
      />

      {/* 7. Real-world Case Studies & High-Stakes Wins */}
      <CaCaseStudies 
        onOpenBooking={handleOpenBooking}
      />

      {/* 8. Senior Leadership: CA Gunjan Jain, FCA Profile */}
      <CaPartnerLeadership 
        onOpenBooking={() => handleOpenBooking("Senior Partner Strategy Session")}
      />

      {/* 9. Statutory Compliance & Tax Deadlines Calendar */}
      <CaStatutoryCalendar 
        onOpenBooking={handleOpenBooking}
      />

      {/* 10. Head Office Location & Google Maps Hub */}
      <CaGoogleMapOfficeHub 
        onOpenBooking={() => handleOpenBooking("In-Office Head Office Meeting")}
      />

      {/* 11. Frequently Asked Questions Accordion */}
      <CaFaqSection 
        onOpenBooking={() => handleOpenBooking("General Advisory Inquiries")}
      />

      {/* 12. Institutional Regulatory Footer */}
      <CaEnterpriseFooter 
        onOpenBooking={() => handleOpenBooking("Engagement Retainer")}
        onOpenLogin={onOpenLogin}
        onEnterSandbox={onEnterSandbox}
      />

      {/* 13. Mobile Sticky Bottom Quick-Action Bar */}
      <CaMobileStickyBar 
        onOpenBooking={() => handleOpenBooking("Mobile Quick Consultation")}
        onOpenLogin={onOpenLogin}
      />

      {/* 14. Interactive Appointment & Consultation Booking Modal */}
      <CaBookingModal 
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        initialService={bookingInitialService}
      />
    </div>
  );
};
