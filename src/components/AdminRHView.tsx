import React, { useState } from "react";
import {
  Search, Plus, Bell, Settings, Heart, Calendar, RefreshCw, Sparkles,
  User, AlertTriangle, ShieldCheck, Check, X, Users, ClipboardList,
  Filter, CheckSquare, Award, Smartphone, HelpCircle, Phone, BookOpen
} from "lucide-react";
import { Employee, LeaveRequest, Attendance } from "../types";

interface AdminRHViewProps {
  leaves: LeaveRequest[];
  employees: Employee[];
  attendances: Attendance[];
  onApproveLeave: (leaveId: string) => void;
  onRefuseLeave: (leaveId: string) => void;
  onTriggerReassignment: (empId: string) => void;
  loadingLeaveId: string | null;
  reassignmentLogs: string[];
  activeTab: string;
  onRefreshState: () => void;
}

const getRoleLabel = (role: string) => {
  switch (role) {
    case "super_admin": return "Super Administrateur";
    case "hr_admin": return "Administrateur RH";
    case "chef_service": return "Chef de Service";
    case "employee": return "Collaborateur";
    default: return role;
  }
};

export default function AdminRHView({
  leaves,
  employees,
  attendances,
  onApproveLeave,
  onRefuseLeave,
  onTriggerReassignment,
  loadingLeaveId,
  reassignmentLogs,
  activeTab,
  onRefreshState
}: AdminRHViewProps) {
  const [attendanceFilter, setAttendanceFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  
  const [showReassignmentToast, setShowReassignmentToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  // Custom reason modal for refusal
  const [refusalLeaveId, setRefusalLeaveId] = useState<string | null>(null);
  const [refusalReason, setRefusalReason] = useState("");

  // HR Settings States
  const [rhCheckInTime, setRhCheckInTime] = useState("09:00");
  const [rhCheckOutTime, setRhCheckOutTime] = useState("18:00");
  const [rhToleratedDelay, setRhToleratedDelay] = useState("15");
  const [rhSickCertificate, setRhSickCertificate] = useState(true);
  const [rhLeaveAllowance, setRhLeaveAllowance] = useState("25");

  const handleApprove = async (leave: LeaveRequest) => {
    onApproveLeave(leave.id);
    
    // If it's Marcus Chen or an urgent sickness, trigger automatic task reassignments!
    if (leave.urgency || leave.employeeId === "EMP005") {
      setToastMessage(`Détection IA : Réaffectation d'urgence initiée pour les tâches actives de ${leave.employeeName}.`);
      setShowReassignmentToast(true);
      setTimeout(() => {
        onTriggerReassignment(leave.employeeId);
        setShowReassignmentToast(false);
      }, 3000);
    }
  };

  const handleRefuseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (refusalLeaveId && refusalReason) {
      // Execute standard refusal
      onRefuseLeave(refusalLeaveId);
      alert(`Demande de congé ${refusalLeaveId} refusée. Motif communiqué : "${refusalReason}"`);
      setRefusalLeaveId(null);
      setRefusalReason("");
    }
  };

  const getUrgencyClass = (isUrgent: boolean) => {
    return isUrgent
      ? "border-red-500 ring-2 ring-red-500/10 shadow-red-100"
      : "border-gray-100 hover:border-gray-200";
  };

  // Filter punch logs
  const filteredAttendances = attendances.filter(att => {
    const emp = employees.find(e => e.id === att.employeeId);
    const name = emp ? emp.name.toLowerCase() : "";
    const dept = emp ? emp.department : "";
    
    const matchesSearch = name.includes(searchQuery.toLowerCase()) || att.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === "all" || dept === selectedDept;
    
    let matchesStatus = true;
    if (attendanceFilter === "ontime") matchesStatus = att.status === "Présent";
    else if (attendanceFilter === "late") matchesStatus = att.status === "Retard";
    else if (attendanceFilter === "absent") matchesStatus = att.status === "Absent";
    
    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="flex-1 bg-[#f8faf9] h-full p-4 md:p-8 overflow-y-auto relative font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">
            {activeTab === "dashboard" && "Portail Ressources Humaines"}
            {activeTab === "analyses" && "Rapports de Pointage & Activité"}
            {activeTab === "structure" && "Registre Global des Employés"}
            {activeTab === "rapports" && "Suivi des Congés & Absences"}
            {activeTab === "support" && "Guide d'Aide & Procédures RH"}
            {activeTab === "settings" && "Configuration des Règles RH"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeTab === "dashboard" && "Administrateur RH • Suivi de l'absentéisme, des pointages par QR Code et des indicateurs de présence"}
            {activeTab === "analyses" && "Analyse détaillée des retards, des heures travaillées et des anomalies de pointage d'équipe"}
            {activeTab === "structure" && "Consultez, recherchez et gérez les fiches collaborateurs ainsi que leurs compétences opérationnelles"}
            {activeTab === "rapports" && "Validation des demandes de congés et déclenchement automatique du plan de réaffectation IA"}
            {activeTab === "support" && "Guide méthodologique et manuel réglementaire pour la gestion des temps de présence d'AutoFlow"}
            {activeTab === "settings" && "Ajustez les heures réglementaires d'arrivée, les tolérances aux retards et les allocations de congé de l'entreprise"}
          </p>
        </div>

        {/* Global actions row */}
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-sm text-xs text-gray-500 font-mono">
          <span className="w-2.5 h-2.5 bg-[#10b981] rounded-full animate-pulse" />
          <span>Pointage Connecté</span>
        </div>
      </div>

      {/* ==================== TOAST & MODAL OVERLAYS ==================== */}
      {showReassignmentToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-dark border border-brand-neon p-4 rounded-2xl shadow-2xl text-white max-w-sm flex items-start gap-3 animate-slide-in">
          <div className="p-2 bg-brand-primary/40 rounded-xl border border-brand-neon/30 text-brand-neon shrink-0 animate-spin">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-brand-neon uppercase tracking-wider">Moteur de Décision IA Actif</h4>
            <p className="text-[11px] text-gray-300 mt-0.5 leading-relaxed">{toastMessage}</p>
          </div>
        </div>
      )}

      {refusalLeaveId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full border border-gray-100 shadow-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-lg text-gray-900">Motiver le Rejet du Congé</h3>
              <button onClick={() => setRefusalLeaveId(null)} className="text-gray-400 hover:text-gray-600 font-bold text-sm">✕</button>
            </div>
            <form onSubmit={handleRefuseSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">Raison du refus (Sera notifiée au collaborateur)</label>
                <textarea
                  rows={3}
                  required
                  value={refusalReason}
                  onChange={(e) => setRefusalReason(e.target.value)}
                  placeholder="ex: Surcharge opérationnelle temporaire dans le département, réessayez la semaine prochaine."
                  className="w-full px-3.5 py-2.5 text-xs text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setRefusalLeaveId(null)} className="flex-1 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500">Annuler</button>
                <button type="submit" className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold">Confirmer le Refus</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== TAB 1: DASHBOARD ==================== */}
      {activeTab === "dashboard" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Row: Attendance Donuts and Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-gray-900 text-base">Présence du Personnel</h3>
                <p className="text-xs text-gray-500 mt-0.5">Taux mesurés aujourd'hui en temps réel via pointage QR Code</p>
              </div>

              <div className="grid grid-cols-3 gap-4 py-6">
                {/* Donut 1: Presence */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                      <circle
                        cx="50" cy="50" r="40" stroke="#10b981" strokeWidth="8" fill="transparent"
                        strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.94)}
                        strokeLinecap="round" className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-xl font-display font-bold text-gray-900">94%</span>
                      <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider">PRÉSENCE</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-2 font-medium">+2.4% vs mois dernier</span>
                </div>

                {/* Donut 2: Absence */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                      <circle
                        cx="50" cy="50" r="40" stroke="#ef4444" strokeWidth="8" fill="transparent"
                        strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.04)}
                        strokeLinecap="round" className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-xl font-display font-bold text-gray-900">4%</span>
                      <span className="text-[8px] font-bold text-red-600 uppercase tracking-wider">ABSENCE</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-2 font-medium">Objectif: &lt; 5%</span>
                </div>

                {/* Donut 3: Punctuality */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                      <circle
                        cx="50" cy="50" r="40" stroke="#0284c7" strokeWidth="8" fill="transparent"
                        strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.87)}
                        strokeLinecap="round" className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-xl font-display font-bold text-gray-900">87%</span>
                      <span className="text-[8px] font-bold text-sky-600 uppercase tracking-wider">PONCTUEL</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-2 font-medium">Cible : 90%</span>
                </div>
              </div>
            </div>

            {/* Total Workforce */}
            <div className="lg:col-span-4 bg-brand-dark p-6 rounded-3xl border border-brand-primary/25 shadow-lg text-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-widest text-brand-neon uppercase">EFFECTIF TOTAL</span>
                  <div className="p-2 bg-brand-primary/40 rounded-lg border border-brand-neon/20">
                    <Users className="w-4 h-4 text-brand-neon" />
                  </div>
                </div>
                <h3 className="text-4xl font-display font-bold mt-4">1 248</h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">Employés actifs répartis sur l'ensemble de l'organisation.</p>
              </div>

              <div className="border-t border-brand-primary/30 pt-4 mt-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center text-gray-400">
                  <span>Nouveaux recrutés :</span>
                  <span className="font-bold text-brand-neon">+14</span>
                </div>
                <div className="flex justify-between items-center text-gray-400">
                  <span>Taux d'attrition :</span>
                  <span className="font-bold text-white">2.4%</span>
                </div>
              </div>
            </div>

          </div>

          {/* Validations de Congés Horizontal Scroll */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-display font-bold text-gray-900">Validations de Congés</h2>
                <p className="text-xs text-gray-500 mt-0.5">Demandes de congés en attente soumises par le personnel</p>
              </div>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x select-none">
              {leaves.map((leave) => {
                const isPending = leave.status === "En attente";
                const isApproved = leave.status === "Approuvé";
                const isRefused = leave.status === "Refusé";

                return (
                  <div
                    key={leave.id}
                    className={`w-[320px] shrink-0 bg-white p-5 rounded-2xl border shadow-sm snap-start transition-all relative flex flex-col justify-between ${getUrgencyClass(
                      leave.urgency && isPending
                    )}`}
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <img src={leave.employeeAvatar} alt={leave.employeeName} className="w-10 h-10 rounded-full object-cover border border-gray-100" referrerPolicy="no-referrer" />
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">{leave.employeeName}</h4>
                          <p className="text-[10px] text-gray-400 font-medium">{leave.employeeRole}</p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          <span>{leave.type}</span>
                        </div>
                        <p className="text-[10px] font-mono text-gray-500">
                          Du {leave.startDate} au {leave.endDate} ({leave.durationDays} Jours)
                        </p>

                        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 mt-2">
                          <p className="text-[10px] text-gray-600 italic leading-relaxed">
                            "{leave.reason}"
                          </p>
                        </div>

                        {leave.urgency && isPending && (
                          <div className="bg-red-50 border border-red-100 p-2 rounded-xl text-red-700 text-[9px] font-bold flex items-center gap-1.5 uppercase tracking-wider mt-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-bounce" />
                            <span>Demande Urgente</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
                      <div className="bg-emerald-50/50 border border-emerald-500/10 p-2.5 rounded-xl">
                        <div className="flex items-center gap-1 text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-brand-neon" />
                          <span>Analyse d'impact IA</span>
                        </div>
                        <p className="text-[10px] text-emerald-950 leading-relaxed">
                          {leave.aiAnalysis || "Évaluation opérationnelle en cours par le Moteur Intelligent..."}
                        </p>
                      </div>

                      <div className="flex gap-2.5">
                        {isPending ? (
                          loadingLeaveId === leave.id ? (
                            <div className="w-full flex items-center justify-center py-2 text-xs text-gray-400">
                              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                              <span>Envoi...</span>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => setRefusalLeaveId(leave.id)}
                                className="flex-1 py-2 rounded-xl border border-red-100 hover:bg-red-50 text-red-600 text-xs font-semibold transition-all cursor-pointer"
                              >
                                Refuser
                              </button>
                              <button
                                onClick={() => handleApprove(leave)}
                                className="flex-1 py-2 rounded-xl bg-brand-neon hover:bg-emerald-300 text-brand-dark text-xs font-bold transition-all cursor-pointer shadow-md shadow-brand-neon/10"
                              >
                                Approuver
                              </button>
                            </>
                          )
                        ) : (
                          <div className="w-full py-1.5 rounded-xl bg-gray-50 border border-gray-200/50 text-center text-xs font-semibold text-gray-400 flex items-center justify-center gap-1.5">
                            {isApproved ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-500" />
                                <span className="text-emerald-700">Approuvé</span>
                              </>
                            ) : (
                              <>
                                <X className="w-4 h-4 text-red-500" />
                                <span className="text-red-700">Refusé</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Decision log console */}
          {reassignmentLogs.length > 0 && (
            <div className="bg-brand-dark border border-brand-primary/30 p-5 rounded-3xl text-white space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-neon animate-pulse" />
                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-brand-neon">Console d'Automate d'Attribution IA</h3>
              </div>
              <div className="font-mono text-xs text-gray-300 space-y-1.5 max-h-40 overflow-y-auto bg-black/40 p-3.5 rounded-xl">
                {reassignmentLogs.map((log, index) => (
                  <p key={index} className="leading-relaxed">
                    <span className="text-brand-neon font-bold">● [AI-SYS]</span> {log}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 2: ATTENDANCE TRACKING ==================== */}
      {activeTab === "analyses" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header search */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par collaborateur, identifiant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-xs rounded-xl border border-gray-200"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="text-xs border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 text-gray-600 font-medium"
              >
                <option value="all">Tous les départements</option>
                <option value="Direction">Direction</option>
                <option value="Ressources Humaines">RH</option>
                <option value="Ingénierie">Ingénierie</option>
                <option value="Marketing">Marketing</option>
              </select>

              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button onClick={() => setAttendanceFilter("all")} className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${attendanceFilter === "all" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500"}`}>Tous</button>
                <button onClick={() => setAttendanceFilter("ontime")} className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${attendanceFilter === "ontime" ? "bg-white text-emerald-600 shadow-xs" : "text-gray-500"}`}>À l'heure</button>
                <button onClick={() => setAttendanceFilter("late")} className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${attendanceFilter === "late" ? "bg-white text-amber-600 shadow-xs" : "text-gray-500"}`}>Retards</button>
                <button onClick={() => setAttendanceFilter("absent")} className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${attendanceFilter === "absent" ? "bg-white text-red-600 shadow-xs" : "text-gray-500"}`}>Absents</button>
              </div>
            </div>
          </div>

          {/* Punch logs table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display font-bold text-gray-900 text-base">Historique des Pointages du Jour</h3>
                <p className="text-xs text-gray-500 mt-0.5">Scans enregistrés via la borne de QR code d'accueil dynamique</p>
              </div>
              <button onClick={onRefreshState} className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl transition-all cursor-pointer">
                <RefreshCw className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3">
                    <th className="pb-3.5 pl-2">Collaborateur</th>
                    <th className="pb-3.5">Heure Arrivée</th>
                    <th className="pb-3.5">Heure Départ</th>
                    <th className="pb-3.5">Durée travaillée</th>
                    <th className="pb-3.5">Statut</th>
                    <th className="pb-3.5 text-right pr-2">Retard constaté</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredAttendances.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400 text-xs">Aucun pointage enregistré aujourd'hui.</td>
                    </tr>
                  ) : (
                    filteredAttendances.map((att) => {
                      const emp = employees.find(e => e.id === att.employeeId);
                      return (
                        <tr key={att.id} className="group hover:bg-gray-50/50 transition-colors">
                          <td className="py-3.5 pl-2">
                            <div className="flex items-center gap-3">
                              <img src={emp?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} alt={emp?.name} className="w-9 h-9 rounded-full object-cover border border-gray-100" referrerPolicy="no-referrer" />
                              <div>
                                <h4 className="text-xs font-semibold text-gray-900">{emp?.name || "Employé Externe"}</h4>
                                <p className="text-[10px] text-gray-400 font-mono">{att.employeeId} ({emp?.department})</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 text-xs text-gray-600 font-medium font-mono">{att.clockIn || "--:--"}</td>
                          <td className="py-3.5 text-xs text-gray-600 font-medium font-mono">{att.clockOut || "--:--"}</td>
                          <td className="py-3.5 text-xs text-gray-600 font-medium">{att.hoursWorked > 0 ? `${att.hoursWorked.toFixed(1)} h` : "Service actif"}</td>
                          <td className="py-3.5">
                            {att.status === "Présent" && <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">À L'HEURE</span>}
                            {att.status === "Retard" && <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold">EN RETARD</span>}
                            {att.status === "Absent" && <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-bold">ABSENT</span>}
                            {att.status !== "Présent" && att.status !== "Retard" && att.status !== "Absent" && <span className="px-2 py-0.5 rounded bg-gray-50 text-gray-500 text-[10px] font-bold">{att.status}</span>}
                          </td>
                          <td className="py-3.5 text-right pr-2 text-xs font-semibold text-gray-700">
                            {att.delayMinutes > 0 ? (
                              <span className="text-amber-600">+{att.delayMinutes} min</span>
                            ) : (
                              <span className="text-emerald-600">--</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: REGISTRE DU PERSONNEL ==================== */}
      {activeTab === "structure" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par compétences, poste, nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-xs rounded-xl border border-gray-200"
              />
            </div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 text-gray-600 font-medium"
            >
              <option value="all">Tous les départements</option>
              <option value="Direction">Direction</option>
              <option value="Ressources Humaines">RH</option>
              <option value="Ingénierie">Ingénierie</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.filter(emp => {
              const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    emp.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                    getRoleLabel(emp.role).toLowerCase().includes(searchQuery.toLowerCase());
              const matchesDept = selectedDept === "all" || emp.department === selectedDept;
              return matchesSearch && matchesDept;
            }).map((emp) => (
              <div key={emp.id} className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img src={emp.avatar} alt={emp.name} className="w-12 h-12 rounded-full object-cover border border-gray-100" referrerPolicy="no-referrer" />
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{emp.name}</h4>
                        <p className="text-xs text-brand-primary font-semibold">{getRoleLabel(emp.role)}</p>
                      </div>
                    </div>
                    {emp.availability === "available" && <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" title="Disponible" />}
                    {emp.availability === "leave" && <span className="w-2.5 h-2.5 bg-amber-400 rounded-full" title="Congé" />}
                    {emp.availability === "absent" && <span className="w-2.5 h-2.5 bg-red-500 rounded-full" title="Absent" />}
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>Département :</span>
                      <span className="font-semibold text-gray-700">{emp.department}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>E-mail :</span>
                      <span className="font-mono text-gray-700 select-all">{emp.email}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Tél :</span>
                      <span className="font-mono text-gray-700">{emp.phone || "+33 6 00 00 00 00"}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Date d'embauche :</span>
                      <span className="text-gray-700 font-semibold">{emp.joinedDate}</span>
                    </div>
                  </div>

                  {/* Skills / competencies array (for decision engine) */}
                  <div className="mt-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-brand-primary" /> Compétences d'Affectation IA
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {emp.skills.map((skill, i) => (
                        <span key={i} className="text-[10px] font-semibold bg-brand-dark/5 text-brand-dark px-2 py-0.5 rounded border border-brand-dark/10">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-50 flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">Assigned Workload : <b>{emp.workload || 0}%</b></span>
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-primary rounded-full" style={{ width: `${emp.workload || 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: LEAVE REQUESTS ==================== */}
      {activeTab === "rapports" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-display font-bold text-gray-900 text-base mb-2">Validation Croisée des Congés & Absences</h3>
            <p className="text-xs text-gray-500 mb-6">Consultez l'historique complet et validez les nouvelles demandes d'absence avec motivation d'audit.</p>

            <div className="space-y-4">
              {leaves.map((leave) => (
                <div key={leave.id} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <img src={leave.employeeAvatar} alt={leave.employeeName} className="w-10 h-10 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-900">{leave.employeeName}</span>
                        <span className="text-[10px] text-gray-400 font-medium font-mono">{leave.employeeId}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                          leave.status === "En attente" ? "bg-amber-100 text-amber-800" :
                          leave.status === "Approuvé" ? "bg-emerald-100 text-emerald-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {leave.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 font-semibold mt-1">{leave.type} ({leave.durationDays} Jours)</p>
                      <p className="text-[11px] text-gray-500 italic mt-1 bg-white p-2 border border-gray-100 rounded-xl">"{leave.reason}"</p>
                      <p className="text-[10px] text-gray-400 mt-1.5">Du {leave.startDate} au {leave.endDate}</p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {leave.status === "En attente" ? (
                      <>
                        <button
                          onClick={() => setRefusalLeaveId(leave.id)}
                          className="px-3.5 py-2 text-xs font-bold border border-red-200 hover:bg-red-50 text-red-600 rounded-xl"
                        >
                          Refuser
                        </button>
                        <button
                          onClick={() => handleApprove(leave)}
                          className="px-3.5 py-2 text-xs font-bold bg-brand-neon hover:bg-emerald-300 text-brand-dark rounded-xl shadow-md shadow-brand-neon/15"
                        >
                          Approuver
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-mono font-bold text-gray-400 uppercase">DEMANDE CLÔTURÉE</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: SUPPORT RH ==================== */}
      {activeTab === "support" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-lg font-display font-bold text-gray-900 mb-2 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-primary" /> Guide Opérationnel RH - AutoFlow
              </h3>
              <p className="text-xs text-gray-500 mb-6">
                Apprenez à administrer la plateforme, à gérer la rotation du pointage et à réagir en cas d'alerte de surcharge.
              </p>

              <div className="space-y-5 text-xs text-gray-600 leading-relaxed">
                <div>
                  <h4 className="font-bold text-gray-800 mb-1 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-500" /> Plan de Secours IA / Reallocation Automatique
                  </h4>
                  <p>
                    Si un employé clé (par exemple, Marcus Chen, développeur principal) est marqué "Absent" d'urgence (maladie constatée ou congé d'urgence accepté), l'intelligence artificielle est déclenchée pour réévaluer toutes ses tâches d'ingénierie critiques en cours. Le système recherche automatiquement les collaborateurs disponibles possédant les compétences requises, simule leur charge de travail future et propose un plan de secours complet.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-800 mb-1 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-brand-primary" /> Diagnostic d'accès au Pointage QR
                  </h4>
                  <p>
                    La borne QR Code d'accueil tourne sur tous les navigateurs de l'entreprise. En tant qu'administrateur RH, vous pouvez accéder au menu <b>Borne QR d'Accueil</b> pour déployer le panneau d'entrée. En cas d'erreur de pointage, rappelez aux employés qu'ils doivent scanner le code en moins de 15 secondes avant la rotation suivante.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h4 className="font-display font-bold text-gray-900 text-sm mb-4">Contact d'Assistance</h4>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Une question réglementaire sur la gestion des temps de présence ou besoin de modifier le SLA de pointage ?
              </p>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/50 space-y-2 text-xs">
                <p className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-4 h-4 text-brand-primary" /> <b>+33 1 45 78 90 12</b>
                </p>
                <p className="text-gray-400 font-mono text-[10px]">support-rh@autoflow.io</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 6: SETTINGS (PARAMETRES RH) ==================== */}
      {activeTab === "settings" && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Presence Rules & Leave Policies */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Presence Hours Rules */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5 border-b border-gray-50 pb-4">
                  <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100/50">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-gray-900 text-sm">Politique d'Horaires & Présence</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Configurez les plages de pointage et les critères de retard</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        Heure d'arrivée réglementaire
                      </label>
                      <input
                        type="time"
                        value={rhCheckInTime}
                        onChange={(e) => setRhCheckInTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-primary bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        Heure de départ réglementaire
                      </label>
                      <input
                        type="time"
                        value={rhCheckOutTime}
                        onChange={(e) => setRhCheckOutTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-primary bg-white"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-50">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-gray-800">Délai de Tolérance aux Retards (minutes)</span>
                      <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {rhToleratedDelay} min
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      step="5"
                      value={rhToleratedDelay}
                      onChange={(e) => setRhToleratedDelay(e.target.value)}
                      className="w-full accent-emerald-500 h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                      <span>Strict (0 min)</span>
                      <span>Flexible (1 heure)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leave Policy settings */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5 border-b border-gray-50 pb-4">
                  <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100/50">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-gray-900 text-sm">Gestion des Réglementations de Congés</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Établissez les quotas légaux de repos de l'entreprise</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Nombre de jours de congés payés par an
                    </label>
                    <input
                      type="number"
                      value={rhLeaveAllowance}
                      onChange={(e) => setRhLeaveAllowance(e.target.value)}
                      className="w-full sm:w-1/2 px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">Justificatif médical obligatoire</span>
                        <span className="text-[11px] text-gray-500">
                          Exiger l'envoi d'un certificat d'arrêt de travail numérisé dès le premier jour d'absence pour maladie.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRhSickCertificate(!rhSickCertificate)}
                        className={`w-11 h-6 rounded-full p-0.5 relative transition-colors cursor-pointer ${rhSickCertificate ? "bg-emerald-500" : "bg-gray-200"}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${rhSickCertificate ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Information & Manual Actions */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Profile Card Admin */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/50 flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8" />
                </div>
                <h3 className="font-display font-bold text-gray-900 text-sm">Fiche Administrateur Actif</h3>
                <p className="text-xs text-gray-500 mt-1">Vous disposez d'accès d'écriture totale pour les fiches RH et de validation légale.</p>
                <div className="mt-4 pt-3.5 border-t border-gray-50 text-left space-y-2 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Permissions :</span>
                    <span className="font-bold text-emerald-600">Validation & Audit</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Clé de signature :</span>
                    <span className="font-mono text-[10px]">AUTH_HR_9831X</span>
                  </div>
                </div>
              </div>

              {/* Quick Sync */}
              <div className="bg-brand-dark p-6 rounded-3xl text-white border border-brand-primary/20">
                <h4 className="font-display font-bold text-sm text-brand-neon mb-1.5">Synchronisation des Présences</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed mb-4">
                  Les pointages de tous les collaborateurs sont calculés et rafraîchis automatiquement via le protocole d'écoute de la borne QR.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onRefreshState();
                    alert("Données des pointages et congés synchronisées avec le serveur d'AutoFlow.");
                  }}
                  className="w-full py-2 bg-brand-medium text-white hover:bg-brand-primary rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Forcer la synchronisation
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
