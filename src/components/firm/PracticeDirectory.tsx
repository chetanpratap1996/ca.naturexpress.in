"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Building2, 
  ShieldCheck, 
  Check, 
  Plus, 
  Search, 
  Sparkles,
  Calendar,
  FileSpreadsheet,
  Calculator,
  Scale,
  CreditCard,
  UserCheck,
  Mail,
  Phone,
  Briefcase
} from "lucide-react";
import { ClientEntity } from "@/lib/types";
import { toast } from "@/components/shared/ToastNotification";
import { getTeamMemberTools, setTeamMemberTools } from "@/lib/auth/session";

interface PracticeDirectoryProps {
  clients?: ClientEntity[];
  onOpenClientMaster?: () => void;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  croRegNo: string;
  mentor: string;
  status: "Active" | "On Leave";
}

const DEFAULT_TEAM_ROSTER: TeamMember[] = [
  {
    id: "USR-ARTICLE-01",
    name: "Kriti Jain",
    email: "kriti.jain@gpa-ca.in",
    phone: "+91 98000 00002",
    designation: "Team Associate (Year 2)",
    croRegNo: "CRO022998",
    mentor: "CA Gunjan Jain, FCA",
    status: "Active"
  },
  {
    id: "USR-ARTICLE-02",
    name: "Aman Verma",
    email: "aman.verma@gpa-ca.in",
    phone: "+91 98000 00004",
    designation: "Team Associate (Year 1)",
    croRegNo: "CRO024192",
    mentor: "CA Gunjan Jain, FCA",
    status: "Active"
  },
  {
    id: "USR-ARTICLE-03",
    name: "Rahul Sharma",
    email: "rahul.sharma@gpa-ca.in",
    phone: "+91 98000 00005",
    designation: "Senior Team Associate",
    croRegNo: "CRO021876",
    mentor: "CA Gunjan Jain, FCA",
    status: "Active"
  },
  {
    id: "USR-ARTICLE-04",
    name: "Pooja Mehta",
    email: "pooja.mehta@gpa-ca.in",
    phone: "+91 98000 00006",
    designation: "Tax & Compliance Lead",
    croRegNo: "CRO020443",
    mentor: "CA Gunjan Jain, FCA",
    status: "Active"
  }
];

const AVAILABLE_TOOLS = [
  { id: "tasks", label: "Tasks & Deadlines", icon: Calendar },
  { id: "gst", label: "GST Suite", icon: FileSpreadsheet },
  { id: "tax-audit", label: "Income Tax & Audit", icon: Calculator },
  { id: "notices-udin", label: "Notices & UDIN", icon: Scale },
  { id: "billing-wip", label: "Billing & WIP", icon: CreditCard },
  { id: "client-master", label: "Client Master & Desk", icon: Building2 },
];

export const PracticeDirectory: React.FC<PracticeDirectoryProps> = ({
  clients = [],
  onOpenClientMaster
}) => {
  const [activeTab, setActiveTab] = useState<"team" | "clients">("team");
  const [searchQuery, setSearchQuery] = useState("");
  const [teamPermissions, setTeamPermissions] = useState<Record<string, string[]>>({});

  // Load permissions for each team member
  useEffect(() => {
    const loaded: Record<string, string[]> = {};
    DEFAULT_TEAM_ROSTER.forEach((member) => {
      loaded[member.id] = getTeamMemberTools(member.id);
    });
    setTeamPermissions(loaded);
  }, []);

  const handleToggleTool = (memberId: string, memberName: string, toolId: string) => {
    const current = teamPermissions[memberId] || ["tasks", "gst"];
    const hasTool = current.includes(toolId);
    const updated = hasTool
      ? current.filter((t) => t !== toolId)
      : [...current, toolId];

    // Guarantee tasks always remains or minimum 1 tool
    if (updated.length === 0) {
      toast.warning("Minimum 1 Tool Required", "A team member must have at least one tool enabled.");
      return;
    }

    setTeamPermissions((prev) => ({
      ...prev,
      [memberId]: updated,
    }));

    setTeamMemberTools(memberId, updated);

    // Notify other components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("bt_permissions_changed", { detail: { memberId, tools: updated } }));
    }

    const toolName = AVAILABLE_TOOLS.find((t) => t.id === toolId)?.label || toolId;
    toast.success(
      "Tool Access Updated",
      `${hasTool ? "Removed" : "Granted"} ${toolName} for ${memberName}.`
    );
  };

  const filteredTeam = DEFAULT_TEAM_ROSTER.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.croRegNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Directory Header Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-red-50 text-btred-logo border border-red-200">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Practice Directory
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Manage practice Team members, assign tool visibility, and view client rosters.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Toggle: Team vs Clients */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("team")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              activeTab === "team"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4 text-btred-logo" />
            <span>Team ({DEFAULT_TEAM_ROSTER.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("clients")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              activeTab === "clients"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Clients ({clients.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: TEAM TAB (Simple 6-button tool assignment) */}
      {activeTab === "team" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Team member by name or CRO..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>
            <span className="text-xs text-slate-500 font-bold self-end sm:self-auto">
              CA Controls: Click any tool button to grant or revoke access
            </span>
          </div>

          {/* Team Members List */}
          <div className="grid grid-cols-1 gap-3.5">
            {filteredTeam.map((member) => {
              const activeTools = teamPermissions[member.id] || ["tasks", "gst"];

              return (
                <div
                  key={member.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 p-4 sm:p-5 rounded-3xl shadow-xs transition space-y-3"
                >
                  {/* Member Overview Row */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-950 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-black text-slate-900">{member.name}</h3>
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                            {member.designation}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {member.croRegNo}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {member.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {member.phone}
                          </span>
                          <span>Mentor: {member.mentor}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-600 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                        {activeTools.length} of 6 Tools Active
                      </span>
                    </div>
                  </div>

                  {/* CA 6 Clickable Tool Buttons Row */}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">
                      Active Tools for {member.name}:
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                      {AVAILABLE_TOOLS.map((tool) => {
                        const Icon = tool.icon;
                        const isGranted = activeTools.includes(tool.id);

                        return (
                          <button
                            key={tool.id}
                            type="button"
                            onClick={() => handleToggleTool(member.id, member.name, tool.id)}
                            className={`flex items-center justify-between gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-black transition-all border text-left cursor-pointer active:scale-95 ${
                              isGranted
                                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-800"
                            }`}
                            title={`Click to ${isGranted ? "remove" : "grant"} ${tool.label}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Icon className={`w-3.5 h-3.5 shrink-0 ${isGranted ? "text-emerald-400" : "text-slate-400"}`} />
                              <span className="truncate text-[11px]">{tool.label}</span>
                            </div>
                            <div className="shrink-0">
                              {isGranted ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Plus className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: CLIENTS TAB */}
      {activeTab === "clients" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900">
              Practice Client Directory ({clients.length})
            </h2>
            {onOpenClientMaster && (
              <button
                onClick={onOpenClientMaster}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition"
              >
                Open Client Master Desk
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-black uppercase text-[10px]">
                  <th className="py-2.5 px-3">Client Entity</th>
                  <th className="py-2.5 px-3">PAN</th>
                  <th className="py-2.5 px-3">GSTIN</th>
                  <th className="py-2.5 px-3">Primary Contact</th>
                  <th className="py-2.5 px-3">Assigned Team</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {client.name}
                    </td>
                    <td className="py-3 px-3 font-mono">{client.pan}</td>
                    <td className="py-3 px-3 font-mono text-[11px]">{client.gstin}</td>
                    <td className="py-3 px-3">
                      <div>{client.primaryContact?.name}</div>
                      <div className="text-[10px] text-slate-400">{client.primaryContact?.phone}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                        Kriti Jain
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
