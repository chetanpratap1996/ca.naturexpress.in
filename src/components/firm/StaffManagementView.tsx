"use client";

import React, { useState, useMemo, useEffect } from "react";
import { StaffMember, CompetencyTier, StaffRole, StaffSpecialization, ComplianceTask } from "@/lib/types";
import { toast } from "@/components/shared/ToastNotification";
import { openWhatsAppPreset } from "@/lib/whatsapp";
import { DEFAULT_FIRM_BRANDING } from "@/lib/config/branding";
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  Zap, 
  Edit3, 
  Phone, 
  Mail, 
  KeyRound, 
  Clock, 
  Layers, 
  Award, 
  Check, 
  X, 
  UserX, 
  ChevronRight,
  Send,
  RefreshCw,
  Sliders,
  CalendarCheck2,
  Receipt,
  Calculator,
  Scale,
  WalletCards,
  Building2,
  Plus
} from "lucide-react";
import { getTeamMemberTools, setTeamMemberTools } from "@/lib/auth/session";

interface StaffManagementViewProps {
  tasks: ComplianceTask[];
  onRefreshData?: () => Promise<void> | void;
}

export const PRACTICE_TOOLS = [
  { id: "tasks", label: "Tasks & Deadlines", icon: CalendarCheck2 },
  { id: "gst", label: "GST Suite", icon: Receipt },
  { id: "tax-audit", label: "Income Tax & Audit", icon: Calculator },
  { id: "notices-udin", label: "Notices & UDIN", icon: Scale },
  { id: "billing-wip", label: "Billing & WIP", icon: WalletCards },
  { id: "client-master", label: "Client Master & Desk", icon: Building2 },
];

export const SENIORITY_LEVELS: Record<CompetencyTier, { label: string; short: string; badge: string }> = {
  1: {
    label: "Associate (Year 1)",
    short: "Associate (Yr 1)",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
  2: {
    label: "Senior Associate (Year 2–3)",
    short: "Senior Associate",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
  },
  3: {
    label: "Manager / Qualified CA",
    short: "Manager / CA",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
  },
  4: {
    label: "Managing Partner (FCA)",
    short: "Partner (FCA)",
    badge: "bg-red-50 text-btred-logo border-red-200",
  },
};

const ALL_SPECIALIZATIONS: { id: StaffSpecialization; label: string }[] = [
  { id: "GST", label: "GST (1/3B/2B)" },
  { id: "INCOME_TAX", label: "Direct Tax (ITR)" },
  { id: "TAX_AUDIT", label: "Tax Audit (3CD)" },
  { id: "MCA_ROC", label: "MCA / ROC" },
  { id: "TDS", label: "TDS Returns" },
  { id: "BOOKKEEPING", label: "Bank OCR / Tally" },
];

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({ tasks, onRefreshData }) => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [isAutoAssigning, setIsAutoAssigning] = useState<boolean>(false);
  const [permissionsMap, setPermissionsMap] = useState<Record<string, string[]>>({});

  const getMemberAllowedTools = (memberId: string): string[] => {
    return permissionsMap[memberId] || getTeamMemberTools(memberId);
  };

  const handleToggleTool = (memberId: string, memberName: string, toolId: string) => {
    const current = getMemberAllowedTools(memberId);
    const hasTool = current.includes(toolId);
    let next: string[];
    if (hasTool) {
      if (current.length === 1) {
        toast.warning("Minimum 1 Tool Required", "A team member must retain access to at least 1 practice tool.");
        return;
      }
      next = current.filter(t => t !== toolId);
    } else {
      next = [...current, toolId];
    }
    setTeamMemberTools(memberId, next);
    setPermissionsMap(prev => ({ ...prev, [memberId]: next }));
    window.dispatchEvent(new CustomEvent("bt_permissions_changed", {
      detail: { memberId, tools: next }
    }));
    fetch("/api/staff", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: memberId, allowedTools: next }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
      })
      .catch(() => {
        toast.error("Sync Failed", "Could not persist tool permission change.");
      });
    const toolLabel = PRACTICE_TOOLS.find(t => t.id === toolId)?.label || toolId;
    toast.success(
      "Tool Access Updated",
      hasTool ? `Revoked ${toolLabel} for ${memberName}` : `Granted ${toolLabel} for ${memberName}`
    );
  };

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState<{
    fullName: string;
    phone: string;
    email: string;
    role: StaffRole;
    competencyTier: CompetencyTier;
    specializations: StaffSpecialization[];
    maxDailyTaskCapacity: number;
    icaiRegistrationNo: string;
    password: string;
  }>({
    fullName: "",
    phone: "",
    email: "",
    role: "ARTICLE_TRAINEE",
    competencyTier: 2,
    specializations: ["GST", "INCOME_TAX"],
    maxDailyTaskCapacity: 10,
    icaiRegistrationNo: "",
    password: "",
  });

  // Fetch staff data
  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/staff", { credentials: "include" });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.staff)) {
        setStaffList(data.staff);
      } else {
        setStaffList([]);
      }
    } catch (err) {
      console.error("Failed to fetch staff roster:", err);
      setStaffList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchesSearch =
        !searchQuery ||
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone.includes(searchQuery) ||
        (s.icaiRegistrationNo && s.icaiRegistrationNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTier = tierFilter === "ALL" || s.competencyTier === Number(tierFilter);
      const matchesRole = roleFilter === "ALL" || s.role === roleFilter;

      return matchesSearch && matchesTier && matchesRole;
    });
  }, [staffList, searchQuery, tierFilter, roleFilter]);

  // Executive summary KPIs
  const kpis = useMemo(() => {
    const activeStaff = staffList.filter((s) => s.status === "ACTIVE");
    const totalCapacity = activeStaff.reduce((sum, s) => sum + (s.maxDailyTaskCapacity || 10), 0);
    const totalAssigned = activeStaff.reduce((sum, s) => sum + (s.activeOpenTasksCount || 0), 0);
    const avgUtilization = totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : 0;

    return {
      totalStaff: staffList.length,
      activeArticles: activeStaff.filter((s) => s.role === "ARTICLE_TRAINEE").length,
      totalAssignedTasks: totalAssigned,
      avgUtilization,
    };
  }, [staffList]);

  // Handle Quick Rank Change
  const handleQuickRankChange = async (staffId: string, newTier: CompetencyTier) => {
    try {
      const res = await fetch("/api/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: staffId, competencyTier: newTier }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Seniority Updated", `Team member set to ${SENIORITY_LEVELS[newTier]?.label || "Associate"}.`);
        setStaffList((prev) =>
          prev.map((s) => (s.id === staffId ? { ...s, competencyTier: newTier } : s))
        );
      } else {
        toast.error("Update Failed", data.error || "Could not update rank.");
      }
    } catch {
      toast.error("Error", "Server error updating seniority.");
    }
  };

  // Handle WhatsApp Invite Dispatch
  const handleSendWhatsAppInvite = (member: StaffMember) => {
    const phoneDigits = member.phone.replace(/\D/g, "");
    const cleanPhone = phoneDigits.length >= 10 ? phoneDigits.slice(-10) : phoneDigits;
    const portalOrigin = typeof window !== "undefined" ? window.location.origin : "https://ca.naturexpress.in";

    const message = `*${DEFAULT_FIRM_BRANDING.firmName}*\nOfficial Practice Portal Invite\n\nDear ${member.fullName},\nYou have been registered as a Team Member (${SENIORITY_LEVELS[member.competencyTier]?.label || "Associate"}).\n\nLogin URL: ${portalOrigin}/?portal=staff\nEmail: ${member.email}\nPlease use the secure password shared by the Managing Partner to sign in.`;

    const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    toast.success("WhatsApp Invite Ready", `Opened invite message for ${member.fullName}.`);
  };

  // Handle Autonomous Work Assignment Autopilot Sweep
  const handleTriggerAutonomousSweep = async () => {
    setIsAutoAssigning(true);
    try {
      const res = await fetch("/api/tasks/auto-assign", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          "Workload Re-allocated",
          `Evaluated ${data.tasksEvaluated} tasks. Reassigned ${data.tasksReassigned} tasks based on tool access, seniority, and capacity.`
        );
        await fetchStaff();
        if (onRefreshData) await onRefreshData();
      } else {
        toast.error("Autopilot Dispatch Failed", data.error || "Could not execute dispatcher.");
      }
    } catch (err: any) {
      toast.error("Dispatch Error", err?.message || "Server error running autopilot sweep.");
    } finally {
      setIsAutoAssigning(false);
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setFormData({
      fullName: "",
      phone: "",
      email: "",
      role: "ARTICLE_TRAINEE",
      competencyTier: 2,
      specializations: ["GST", "INCOME_TAX"],
      maxDailyTaskCapacity: 10,
      icaiRegistrationNo: "",
      password: "",
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (member: StaffMember) => {
    setEditingStaff(member);
    const phone10 = member.phone.replace(/\D/g, "").slice(-10);
    setFormData({
      fullName: member.fullName,
      phone: phone10,
      email: member.email,
      role: member.role,
      competencyTier: member.competencyTier,
      specializations: member.specializations || ["GST"],
      maxDailyTaskCapacity: member.maxDailyTaskCapacity || 10,
      icaiRegistrationNo: member.icaiRegistrationNo || "",
      password: "",
    });
    setIsModalOpen(true);
  };

  // Save Staff (Add or Edit)
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || formData.phone.length !== 10) {
      toast.error("Validation Error", "Please provide a valid full name and 10-digit mobile number.");
      return;
    }
    if (!editingStaff && formData.password.trim().length < 8) {
      toast.error("Password Required", "Please set an initial password of at least 8 characters for the new team member.");
      return;
    }

    try {
      const url = "/api/staff";
      const method = editingStaff ? "PUT" : "POST";
      const payload = editingStaff ? { id: editingStaff.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          editingStaff ? "Staff Updated" : "Employee Added Successfully",
          `${formData.fullName} is now registered in the firm database.`
        );
        setIsModalOpen(false);
        fetchStaff();
        if (onRefreshData) onRefreshData();
      } else {
        toast.error("Save Failed", data.error || "Could not save employee details.");
      }
    } catch {
      toast.error("Error", "Server error saving employee.");
    }
  };

  // Toggle Deactivation
  const handleToggleDeactivate = async (member: StaffMember) => {
    const newStatus = member.status === "ACTIVE" ? "DEACTIVATED" : "ACTIVE";
    try {
      const res = await fetch("/api/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: member.id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          newStatus === "DEACTIVATED" ? "Account Deactivated" : "Account Reactivated",
          `${member.fullName}'s login access has been ${newStatus.toLowerCase()}.`
        );
        fetchStaff();
      }
    } catch {
      toast.error("Error", "Could not toggle staff status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-red-100 text-btred-logo rounded-lg">
                <Users className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Practice Team
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage team members, practice tool access (6 tools), and statutory workload.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold"
              title="Practice team directory with role-based access"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Active Practice Roster</span>
            </div>

            <button
              onClick={handleTriggerAutonomousSweep}
              disabled={isAutoAssigning}
              title="Manual override to re-balance work across available capacity"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50"
            >
              {isAutoAssigning ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              )}
              {isAutoAssigning ? "Re-balancing..." : "Re-balance Workload"}
            </button>

            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-btred-logo hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Add Team Member
            </button>
          </div>
        </div>

        {/* Real-Time KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Team Members
            </span>
            <div className="mt-1">
              <span className="text-2xl font-black text-slate-900">{kpis.totalStaff}</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Team Associates
            </span>
            <div className="mt-1">
              <span className="text-2xl font-black text-blue-600">{kpis.activeArticles}</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Assigned Tasks
            </span>
            <div className="mt-1">
              <span className="text-2xl font-black text-slate-900">{kpis.totalAssignedTasks}</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Capacity Load
            </span>
            <div className="mt-1">
              <span className="text-2xl font-black text-purple-700">{kpis.avgUtilization}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone, CRO no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-btred-logo"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-btred-logo font-medium cursor-pointer"
          >
            <option value="ALL">All Seniority Levels</option>
            <option value="4">Managing Partner (FCA)</option>
            <option value="3">Manager / Qualified CA</option>
            <option value="2">Senior Associate</option>
            <option value="1">Associate (Year 1)</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-btred-logo font-medium cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="ARTICLE_TRAINEE">Team Associates</option>
            <option value="PAID_CHARTERED_ACCOUNTANT">Qualified Paid CAs</option>
            <option value="MANAGING_PARTNER">Managing Partners</option>
          </select>
        </div>
      </div>

      {/* Staff Roster Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
          <RefreshCw className="w-6 h-6 animate-spin text-btred-logo mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading staff roster...</p>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
          <UserX className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No staff members found</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting search filters or click "Add Employee".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((member) => {
            const seniorityMeta = SENIORITY_LEVELS[member.competencyTier] || SENIORITY_LEVELS[2];
            const capacity = member.maxDailyTaskCapacity || 10;
            const currentAssigned = member.activeOpenTasksCount || 0;
            const utilizationPct = Math.min(100, Math.round((currentAssigned / capacity) * 100));

            return (
              <div
                key={member.id}
                className={`bg-white border rounded-xl p-4 shadow-sm transition hover:shadow-md ${
                  member.status === "DEACTIVATED"
                    ? "border-slate-200 opacity-60 bg-slate-50/50"
                    : "border-slate-200"
                }`}
              >
                {/* Top Member Header & Seniority Selector */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{member.fullName}</h3>
                      {member.status === "ACTIVE" ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Active in Office" />
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold shrink-0">
                          {member.status}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-slate-500 block truncate mt-0.5">
                      {member.role === "MANAGING_PARTNER"
                        ? "Managing Partner (FCA)"
                        : member.role === "PAID_CHARTERED_ACCOUNTANT"
                        ? "Qualified Paid CA"
                        : seniorityMeta.label}
                      {member.icaiRegistrationNo && ` • ${member.icaiRegistrationNo}`}
                    </span>
                  </div>

                  {/* Seniority Selector */}
                  <select
                    value={member.competencyTier}
                    onChange={(e) => handleQuickRankChange(member.id, Number(e.target.value) as CompetencyTier)}
                    disabled={member.status === "DEACTIVATED"}
                    className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 focus:outline-none focus:ring-1 focus:ring-btred-logo transition-colors cursor-pointer shrink-0"
                    title="Change Seniority Level"
                  >
                    <option value="1">Associate (Yr 1)</option>
                    <option value="2">Senior Associate</option>
                    <option value="3">Manager / CA</option>
                    <option value="4">Partner (FCA)</option>
                  </select>
                </div>

                {/* Live Workload Capacity Bar */}
                <div className="mt-3.5 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500 font-medium text-[11px]">Daily Task Load</span>
                    <span className="font-bold text-slate-800 text-[11px]">
                      {currentAssigned} / {capacity} Tasks ({utilizationPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        utilizationPct > 85
                          ? "bg-red-500"
                          : utilizationPct > 60
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${utilizationPct}%` }}
                    />
                  </div>
                </div>

                {/* Contact & Credentials Preview */}
                <div className="mt-3 text-[11px] text-slate-500 space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {member.phone}
                    </span>
                    <span className="font-mono text-slate-700 text-[10px] font-bold">
                      {member.email}
                    </span>
                  </div>
                </div>

                {/* CA Practice Tool Access Controls (6 Tools) */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] mb-2">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-btred-logo" />
                      Allowed Practice Tools
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {getMemberAllowedTools(member.id).length} of 6 Tools Active
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {PRACTICE_TOOLS.map((tool) => {
                      const ToolIcon = tool.icon;
                      const isAllowed = getMemberAllowedTools(member.id).includes(tool.id);
                      return (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() => handleToggleTool(member.id, member.fullName, tool.id)}
                          disabled={member.status === "DEACTIVATED"}
                          title={`Click to ${isAllowed ? "remove" : "grant"} ${tool.label} for ${member.fullName}`}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition border cursor-pointer ${
                            isAllowed
                              ? "bg-slate-900 text-white border-slate-900 shadow-2xs hover:bg-slate-800"
                              : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-800 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <ToolIcon className={`w-3 h-3 shrink-0 ${isAllowed ? "text-red-400" : "text-slate-400"}`} />
                            <span className="truncate">{tool.label}</span>
                          </div>
                          {isAllowed ? (
                            <Check className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />
                          ) : (
                            <Plus className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => handleSendWhatsAppInvite(member)}
                    className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold border border-emerald-200 transition"
                    title="Send WhatsApp Invite with Portal link and default PIN"
                  >
                    <Send className="w-3 h-3" />
                    WhatsApp Invite
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(member)}
                    className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                    title="Edit Employee & Specializations"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleToggleDeactivate(member)}
                    className={`p-1.5 rounded-lg transition ${
                      member.status === "ACTIVE"
                        ? "hover:bg-red-50 text-red-500"
                        : "hover:bg-emerald-50 text-emerald-600"
                    }`}
                    title={member.status === "ACTIVE" ? "Deactivate Employee" : "Reactivate Employee"}
                  >
                    {member.status === "ACTIVE" ? <UserX className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-red-100 text-btred-logo rounded-lg">
                  <UserPlus className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingStaff ? "Edit Employee" : "Add Employee"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kriti Jain"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-btred-logo"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Mobile Number (10 Digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="9823011928"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-btred-logo"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    placeholder="trainee@brainsandtaxes.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-btred-logo"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    ICAI Reg / CRO No
                  </label>
                  <input
                    type="text"
                    placeholder="CRO-0712490"
                    value={formData.icaiRegistrationNo}
                    onChange={(e) => setFormData({ ...formData, icaiRegistrationNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-btred-logo uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Practice Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as StaffRole })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-btred-logo font-medium"
                  >
                    <option value="ARTICLE_TRAINEE">Team Associate</option>
                    <option value="PAID_CHARTERED_ACCOUNTANT">Qualified Paid CA</option>
                    <option value="MANAGING_PARTNER">Managing Partner</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Seniority Level *
                  </label>
                  <select
                    value={formData.competencyTier}
                    onChange={(e) =>
                      setFormData({ ...formData, competencyTier: Number(e.target.value) as CompetencyTier })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-btred-logo font-medium"
                  >
                    <option value="1">Associate (Year 1 - Routine Filings)</option>
                    <option value="2">Senior Associate (Year 2–3 - Returns & Audit 3CD)</option>
                    <option value="3">Manager / Qualified CA (Complex Scrutiny & Review)</option>
                    <option value="4">Managing Partner (Final Sign-off & Representation)</option>
                  </select>
                </div>
              </div>

              {/* Specialization Checkboxes */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  Domain Specializations (Work Allocation Match)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_SPECIALIZATIONS.map((spec) => {
                    const checked = formData.specializations.includes(spec.id);
                    return (
                      <label
                        key={spec.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                          checked
                            ? "bg-red-50/60 border-red-200 text-btred-logo font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                specializations: [...formData.specializations, spec.id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                specializations: formData.specializations.filter((s) => s !== spec.id),
                              });
                            }
                          }}
                          className="rounded text-btred-logo focus:ring-btred-logo"
                        />
                        <span>{spec.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Daily Capacity and 4-digit PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Max Daily Task Capacity
                  </label>
                  <input
                    type="number"
                    min="4"
                    max="30"
                    value={formData.maxDailyTaskCapacity}
                    onChange={(e) => setFormData({ ...formData, maxDailyTaskCapacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-btred-logo"
                  />
                  <span className="text-[10px] text-slate-400">Protects staff from overload</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {editingStaff ? "Reset Password (Optional)" : "Staff Login Password *"}
                  </label>
                  <input
                    type="password"
                    minLength={editingStaff ? undefined : 8}
                    required={!editingStaff}
                    placeholder={editingStaff ? "Leave blank to keep existing" : "Min 8 characters"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-btred-logo font-mono"
                  />
                  <span className="text-[10px] text-slate-400">
                    Stored with PBKDF2-SHA256 salted hash
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-btred-logo hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  {editingStaff ? "Update Employee" : "Add Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
