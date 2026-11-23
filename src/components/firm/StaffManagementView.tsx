"use client";

import React, { useState, useMemo, useEffect } from "react";
import { StaffMember, CompetencyTier, StaffRole, StaffSpecialization, ComplianceTask } from "@/lib/types";
import { toast } from "@/components/shared/ToastNotification";
import { openWhatsAppPreset } from "@/lib/whatsapp";
import { INITIAL_STAFF_MEMBERS } from "@/lib/data/mockData";
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
  Sliders
} from "lucide-react";

interface StaffManagementViewProps {
  tasks: ComplianceTask[];
  onRefreshData?: () => Promise<void> | void;
}

const TIER_DESCRIPTIONS: Record<CompetencyTier, { label: string; badge: string; description: string }> = {
  1: {
    label: "Tier 1: Junior Article",
    badge: "bg-slate-100 text-slate-700 border-slate-300",
    description: "Bookkeeping, Bank OCR, DIR-3 KYC, GSTR-1 Nil / Simple Outward",
  },
  2: {
    label: "Tier 2: Intermediate Article",
    badge: "bg-blue-100 text-blue-800 border-blue-300",
    description: "GSTR-3B Monthly, TDS 26Q Quarterly, ITR-1 to 4 Individual / Firm",
  },
  3: {
    label: "Tier 3: Senior Article",
    badge: "bg-purple-100 text-purple-800 border-purple-300",
    description: "Form 3CD Clauses 22/31/44, Corporate ITR-6, MCA AOC-4/MGT-7",
  },
  4: {
    label: "Tier 4: Manager / Paid CA",
    badge: "bg-red-100 text-btred-logo border-red-300",
    description: "Scrutiny Defense 143(2)/148, Complex Notices, Partner Review & UDIN",
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
    tempPin: string;
  }>({
    fullName: "",
    phone: "",
    email: "",
    role: "ARTICLE_TRAINEE",
    competencyTier: 2,
    specializations: ["GST", "INCOME_TAX"],
    maxDailyTaskCapacity: 10,
    icaiRegistrationNo: "",
    tempPin: "",
  });

  // Fetch staff data
  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/staff");
      const data = await res.json();
      if (data.success && Array.isArray(data.staff) && data.staff.length > 0) {
        setStaffList(data.staff);
      } else {
        // Fallback to initial practice roster enriched with real task stats
        const enriched = INITIAL_STAFF_MEMBERS.map((m) => {
          const open = tasks.filter(t => t.status !== "FILED_AND_COMPLETED" && (t.assignedTo === m.fullName || (t.assignedTo && t.assignedTo.includes(m.fullName.split(" ")[0])))).length;
          const completed = tasks.filter(t => t.status === "FILED_AND_COMPLETED" && (t.assignedTo === m.fullName || (t.assignedTo && t.assignedTo.includes(m.fullName.split(" ")[0])))).length;
          return {
            ...m,
            activeOpenTasksCount: open,
            completedTasksThisMonth: completed,
            capacityUtilizationPct: Math.min(100, Math.round((open / (m.maxDailyTaskCapacity || 10)) * 100))
          };
        });
        setStaffList(enriched);
      }
    } catch (err) {
      console.warn("Staff API fallback to mock roster:", err);
      setStaffList(INITIAL_STAFF_MEMBERS);
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
        body: JSON.stringify({ id: staffId, competencyTier: newTier }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Competency Rank Updated", `Staff member updated to Tier ${newTier}.`);
        setStaffList((prev) =>
          prev.map((s) => (s.id === staffId ? { ...s, competencyTier: newTier } : s))
        );
      } else {
        toast.error("Update Failed", data.error || "Could not update rank.");
      }
    } catch {
      toast.error("Error", "Server error updating rank.");
    }
  };

  // Handle WhatsApp Invite Dispatch
  const handleSendWhatsAppInvite = (member: StaffMember) => {
    const phoneDigits = member.phone.replace(/\D/g, "");
    const cleanPhone = phoneDigits.length >= 10 ? phoneDigits.slice(-10) : phoneDigits;
    const defaultPin = member.tempPin || (cleanPhone.length >= 4 ? cleanPhone.slice(-4) : "1234");
    
    const message = `*GPA & Co., Chartered Accountants*\nOfficial Practice Portal Invite\n\nDear ${member.fullName},\nYou have been registered as an ${member.role === "ARTICLE_TRAINEE" ? "Article Trainee" : "Team Member"} (Tier ${member.competencyTier}).\n\n👉 *Login URL:* https://brainsandtaxes.com/?portal=staff\n📱 *Mobile:* +91 ${cleanPhone}\n🔑 *Your 4-Digit Access PIN:* ${defaultPin}\n\nPlease log in and review your assigned statutory compliance queue.`;

    const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    toast.success("WhatsApp Invite Ready", `Dispatched onboarding credentials to ${member.fullName}.`);
  };

  // Handle Autonomous Work Assignment Autopilot Sweep
  const handleTriggerAutonomousSweep = async () => {
    setIsAutoAssigning(true);
    try {
      const res = await fetch("/api/tasks/auto-assign", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(
          "2035 Autopilot Dispatch Completed",
          `Evaluated ${data.tasksEvaluated} tasks. Reassigned ${data.tasksReassigned} tasks to balance firm workload.`
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
      tempPin: "",
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
      tempPin: member.tempPin || phone10.slice(-4),
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

    try {
      const url = "/api/staff";
      const method = editingStaff ? "PUT" : "POST";
      const payload = editingStaff ? { id: editingStaff.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
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
                Employees
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage staff, competency ranking, and workload capacity.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleTriggerAutonomousSweep}
              disabled={isAutoAssigning}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              {isAutoAssigning ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              )}
              {isAutoAssigning ? "Assigning..." : "Auto-Assign Work"}
            </button>

            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-btred-logo hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Add Employee
            </button>
          </div>
        </div>

        {/* Real-Time KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Employees
            </span>
            <div className="mt-1">
              <span className="text-2xl font-black text-slate-900">{kpis.totalStaff}</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Articles
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
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-btred-logo font-medium"
          >
            <option value="ALL">All Competency Tiers</option>
            <option value="4">Tier 4: Manager / Paid CA</option>
            <option value="3">Tier 3: Senior Article</option>
            <option value="2">Tier 2: Intermediate Article</option>
            <option value="1">Tier 1: Junior Article</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-btred-logo font-medium"
          >
            <option value="ALL">All Roles</option>
            <option value="ARTICLE_TRAINEE">Article Trainees</option>
            <option value="PAID_CHARTERED_ACCOUNTANT">Paid Chartered Accountants</option>
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
            const tierMeta = TIER_DESCRIPTIONS[member.competencyTier] || TIER_DESCRIPTIONS[2];
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
                {/* Top Member Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{member.fullName}</h3>
                      {member.status === "ACTIVE" ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active in Office" />
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                          {member.status}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 block">
                      {member.role === "MANAGING_PARTNER"
                        ? "Managing Partner (FCA)"
                        : member.role === "PAID_CHARTERED_ACCOUNTANT"
                        ? "Qualified Paid CA"
                        : "Article Trainee"}
                      {member.icaiRegistrationNo && ` • ${member.icaiRegistrationNo}`}
                    </span>
                  </div>

                  {/* Competency Rank Dropdown */}
                  <select
                    value={member.competencyTier}
                    onChange={(e) => handleQuickRankChange(member.id, Number(e.target.value) as CompetencyTier)}
                    disabled={member.status === "DEACTIVATED"}
                    className="text-[11px] font-bold px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-btred-logo"
                  >
                    <option value="1">Tier 1 ⭐</option>
                    <option value="2">Tier 2 ⭐⭐</option>
                    <option value="3">Tier 3 ⭐⭐⭐</option>
                    <option value="4">Tier 4 ⭐⭐⭐⭐</option>
                  </select>
                </div>

                {/* Tier Description Badge */}
                <div className="mt-2.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${tierMeta.badge}`}>
                    {tierMeta.label}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-1" title={tierMeta.description}>
                    {tierMeta.description}
                  </p>
                </div>

                {/* Domain Specialization Badges */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {(member.specializations || []).map((spec) => (
                    <span
                      key={spec}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200"
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Live Workload Capacity Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500 font-medium text-[11px]">Daily Task Load</span>
                    <span className="font-bold text-slate-800 text-[11px]">
                      {currentAssigned} / {capacity} Tasks ({utilizationPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        utilizationPct > 85
                          ? "bg-red-500"
                          : utilizationPct > 60
                          ? "bg-purple-600"
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
                      PIN: {member.tempPin || member.phone.slice(-4)}
                    </span>
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
                    placeholder="e.g. Aman Verma"
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
                    <option value="ARTICLE_TRAINEE">Article Trainee</option>
                    <option value="PAID_CHARTERED_ACCOUNTANT">Paid Chartered Accountant</option>
                    <option value="MANAGING_PARTNER">Managing Partner</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Competency Rank (1 to 4) *
                  </label>
                  <select
                    value={formData.competencyTier}
                    onChange={(e) =>
                      setFormData({ ...formData, competencyTier: Number(e.target.value) as CompetencyTier })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-btred-logo font-bold"
                  >
                    <option value="1">Tier 1: Junior (Bookkeeping & OCR)</option>
                    <option value="2">Tier 2: Intermediate (GSTR-3B & TDS 26Q)</option>
                    <option value="3">Tier 3: Senior (ITR-6 & 3CD Audit)</option>
                    <option value="4">Tier 4: Manager / Sign-off</option>
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
                    4-Digit Access PIN
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="e.g. 1928"
                    value={formData.tempPin}
                    onChange={(e) => setFormData({ ...formData, tempPin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-btred-logo font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">
                    Default: Last 4 digits of phone ({formData.phone.slice(-4) || "0000"})
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
