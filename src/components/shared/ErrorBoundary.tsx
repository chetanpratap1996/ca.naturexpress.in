"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Trash2, ChevronDown, ChevronUp, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  public handleFullReset = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.warn("Storage clear error:", e);
      }
      // Redirect cleanly to root without query params
      window.location.href = window.location.origin + window.location.pathname;
    }
  };

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || "An unexpected client-side error occurred";
      const errorStack = this.state.error?.stack || "";

      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-5 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-btred-logo flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                {this.props.fallbackTitle || "Portal Recovery Mode"}
              </h2>
              <p className="text-xs text-slate-600">
                A client session discrepancy was caught and isolated. You can reload or perform a clean storage reset below.
              </p>
            </div>

            {/* Error Message Box */}
            <div className="bg-red-50/60 border border-red-200 rounded-2xl p-3.5 text-left text-xs font-mono text-btred-logo break-words">
              <span className="font-bold text-slate-500 block text-[10px] uppercase tracking-wider mb-1">
                Caught Error:
              </span>
              {errorMessage}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" /> Quick Reload
              </button>

              <button
                onClick={this.handleFullReset}
                className="w-full sm:w-auto bg-btred-logo hover:bg-red-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md shadow-red-500/25 transition flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Storage &amp; Reset
              </button>
            </div>

            {/* Expandable Technical Details */}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 transition"
              >
                <span>{this.state.showDetails ? "Hide technical details" : "View technical details"}</span>
                {this.state.showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {this.state.showDetails && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-left overflow-x-auto max-h-48 text-[10px] font-mono text-slate-700 space-y-2">
                  <div>
                    <strong className="text-slate-900">Name:</strong> {this.state.error?.name}
                  </div>
                  <div>
                    <strong className="text-slate-900">Message:</strong> {errorMessage}
                  </div>
                  {errorStack && (
                    <div className="whitespace-pre-wrap text-slate-500">
                      {errorStack}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
