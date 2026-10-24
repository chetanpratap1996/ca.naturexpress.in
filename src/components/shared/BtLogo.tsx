"use client";

import React from "react";

interface BtLogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export const BtLogo: React.FC<BtLogoProps> = ({ size = "md", showTagline = true }) => {
  const dimensions = {
    sm: { w: 38, h: 42, text: "text-[8px]" },
    md: { w: 48, h: 54, text: "text-[10px]" },
    lg: { w: 68, h: 76, text: "text-[12px]" },
  }[size];

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Exact Vector Replica of B&T Logo */}
      <svg
        width={dimensions.w}
        height={dimensions.h}
        viewBox="0 0 100 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 drop-shadow-sm"
      >
        {/* Outer White Card with subtle border */}
        <rect x="2" y="2" width="96" height="106" rx="16" fill="white" stroke="#e5e7eb" strokeWidth="3" />

        {/* 3 Red Vertical Pillars */}
        <rect x="10" y="8" width="24" height="78" rx="3" fill="#e52320" />
        <rect x="38" y="8" width="24" height="78" rx="3" fill="#e52320" />
        <rect x="66" y="8" width="24" height="78" rx="3" fill="#e52320" />

        {/* Horizontal Black Pinstripes Across Pillars */}
        <rect x="10" y="34" width="80" height="3" fill="#18181b" />
        <rect x="10" y="40" width="80" height="3" fill="#18181b" />
        <rect x="10" y="46" width="80" height="3" fill="#18181b" />

        {/* Bold Black Letters "B", "&", "T" */}
        <text
          x="22"
          y="72"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="36"
          fill="#18181b"
          textAnchor="middle"
        >
          B
        </text>
        <text
          x="50"
          y="72"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="34"
          fill="#18181b"
          textAnchor="middle"
        >
          &amp;
        </text>
        <text
          x="78"
          y="72"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="36"
          fill="#18181b"
          textAnchor="middle"
        >
          T
        </text>

        {/* "B R A I N S & T A X E S" in Red at bottom */}
        <text
          x="50"
          y="100"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="10"
          letterSpacing="2"
          fill="#e52320"
          textAnchor="middle"
        >
          BRAINS &amp; TAXES
        </text>
      </svg>

      {showTagline && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-black text-base sm:text-lg text-slate-900 tracking-tight">Brains &amp; Taxes</span>
            <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-btred-600 border border-red-200">
              Tax &amp; Advisory
            </span>
          </div>
          <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Documents, Filings &amp; Vault</span>
        </div>
      )}
    </div>
  );
};
