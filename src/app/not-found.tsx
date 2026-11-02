import Link from "next/link";
import { BtLogo } from "@/components/shared/BtLogo";
import { ArrowLeft, Home, ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center space-y-5">
        <div className="flex justify-center">
          <BtLogo size="lg" showTagline={false} />
        </div>
        <div className="w-12 h-12 bg-red-50 text-btred-logo rounded-2xl flex items-center justify-center mx-auto border border-red-100 shadow-xs">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-black text-slate-900">404 - Page Not Found</h1>
          <p className="text-xs text-slate-500 font-medium">
            The compliance resource, filing dossier, or portal view you requested does not exist or has been moved.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-btred-logo hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Return to SaaS Gateway</span>
          </Link>
        </div>
        <p className="text-[10px] text-slate-400">
          TaxoBrain Enterprise CA Practice Management OS &bull; ICAI FRN: 022998C
        </p>
      </div>
    </div>
  );
}
