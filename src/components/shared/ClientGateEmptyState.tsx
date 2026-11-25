"use client";

import React from "react";
import { Building2, ShieldCheck } from "lucide-react";
import { UniversalClientSelector } from "@/components/shared/UniversalClientSelector";

interface ClientGateEmptyStateProps {
  moduleTitle: string;
  description: string;
}

export const ClientGateEmptyState: React.FC<ClientGateEmptyStateProps> = ({
  moduleTitle,
  description,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
        <Building2 className="w-6 h-6" />
      </div>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <ShieldCheck className="w-3.5 h-3.5" /> Client Selection Required
      </div>
      <h3 className="text-xl font-black text-slate-900">{moduleTitle}</h3>
      <p className="text-xs text-slate-600 max-w-lg mx-auto">{description}</p>
      <div className="flex justify-center pt-2">
        <UniversalClientSelector />
      </div>
    </div>
  );
};
