import React, { useState } from "react";
import {
  Clock, Send, Calendar, CheckSquare, Square, RefreshCw, AlertTriangle,
  Sparkles, User, BadgeAlert, CheckCircle2, QrCode, Smartphone,
  Users, ClipboardList, HelpCircle, BookOpen, MapPin, FileText, Check, X, ShieldAlert,
  Award, Search
} from "lucide-react";
import { Employee, Task, LeaveRequest, Attendance } from "../types";
import QRScannerModal from "./QRScannerModal";

interface EmployeeViewProps {
  currentUser: Employee;
  tasks: Task[];
  leaves: LeaveRequest[];
  attendances: Attendance[];
  employees: Employee[];
  onPunch: (type: "check_in" | "check_out") => void;
  onSubmitLeave: (leaveData: { type: string; startDate: string; endDate: string; reason: string }) => void;
  onUpdateTaskStatus: (taskId: string, status: string) => void;
  loadingLeaveSubmit: boolean;
  onRefreshState: () => void;
  activeTab: string;
}

export default function EmployeeView({
  currentUser,
  tasks,
  leaves,
  attendances,
  employees,
  onPunch,
  onSubmitLeave,
  onUpdateTaskStatus,
  loadingLeaveSubmit,
  onRefreshState,
  activeTab
}: EmployeeViewProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  // Leave request form states
  const [leaveType, setLeaveType] = useState("Congés Annuels");
  const [startDate, setStartDate] = useState("2026-07-10");
  const [endDate, setEndDate] = useState("2026-07-15");
  const [reason, setReason] = useState("");
  const [showAiPreAnalysis, setShowAiPreAnalysis] = useState(false);

  // Colleague search state
  const [collabSearch, setCollabSearch] = useState("");

  // Employee Profile & Settings States
  const [empPhone, setEmpPhone] = useState("+33 6 12 34 56 78");
  const [empSkills, setEmpSkills] = useState(["React", "TypeScript", "Node.js", "Tailwind CSS", "Git", "Docker"]);
  const [newSkill, setNewSkill] = useState("");
  const [empNotifyEmail, setEmpNotifyEmail] = useState(true);
  const [empNotifySms, setEmpNotifySms] = useState(false);
  const [empPassword, setEmpPassword] = useState("••••••••••••");

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim() && !empSkills.includes(newSkill.trim())) {
      setEmpSkills([...empSkills, newSkill.trim()]);
      setNewSkill("");
      alert("Nouvelle compétence déclarée au Moteur d'affectation IA.");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setEmpSkills(empSkills.filter(s => s !== skillToRemove));
  };

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) {
      onSubmitLeave({
        type: leaveType,
        startDate,
        endDate,
        reason
      });
      setReason("");
      setShowAiPreAnalysis(true);
      alert("Demande de congé transmise aux RH. Le moteur IA d'AutoFlow va procéder à l'analyse d'impact d'équipe.");
    }
  };

  // Filter lists for current user
  const myTasks = tasks.filter((t) => t.assignedTo === currentUser.id);
  const myLeaves = leaves.filter((l) => l.employeeId === currentUser.id);
  const myAttendances = attendances.filter((a) => a.employeeId === currentUser.id);

  // Check today's punch status
  const todayDateStr = new Date().toISOString().split("T")[0];
  const todayAttendance = myAttendances.find((a) => a.date === todayDateStr);

  const getAttendanceStatusBadge = (status: string) => {
    switch (status) {
      case "Présent":
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">À l'heure</span>;
      case "Retard":
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">En retard</span>;
      case "Absent":
        return <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Absence</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 border border-gray-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{status}</span>;
    }
  };

  const getTaskStatusLabel = (status: string) => {
    return status === "Terminée" ? "Terminée" : status === "En cours" ? "En cours" : "À faire";
  };

  return (
    <div className="flex-1 bg-[#f8faf9] h-full p-4 md:p-8 overflow-y-auto relative font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">
            {activeTab === "dashboard" && "Mon Espace Collaborateur"}
            {activeTab === "analyses" && "Pointeuse de Présence QR Code"}
            {activeTab === "structure" && "Registre d'Équipe & Contacts"}
            {activeTab === "rapports" && "Mes Demandes de Congés & PTO"}
            {activeTab === "support" && "Manuel d'Intégration & Aide"}
            {activeTab === "settings" && "Paramètres Profil & Compte"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeTab === "dashboard" && `Bonjour, ${currentUser.name} • Suivi de vos objectifs d'ingénierie et de votre ponctualité`}
            {activeTab === "analyses" && "Pointez votre arrivée et départ en scannant le QR code d'accueil rotatif"}
            {activeTab === "structure" && "Coordonnées et statut de disponibilité de vos collègues d'ingénierie"}
            {activeTab === "rapports" && "Planifiez vos absences et suivez les validations de vos congés en temps réel"}
            {activeTab === "support" && "Tout savoir sur le règlement intérieur d'AutoFlow, le pointage et la télémétrie"}
            {activeTab === "settings" && "Gerez vos coordonnées de contact, vos compétences professionnelles déclarées et vos alertes"}
          </p>
        </div>

        {/* Quick check-in feedback */}
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3.5 py-2 rounded-xl shadow-xs text-xs font-mono font-medium text-gray-600">
          <span>Pointage du Jour :</span>
          {todayAttendance ? (
            <span className="text-emerald-600 font-bold">● {todayAttendance.status === "Présent" ? "À l'heure" : "En retard"}</span>
          ) : (
            <span className="text-red-500 font-bold">● Non pointé</span>
          )}
        </div>
      </div>

      {/* ==================== TAB 1: DASHBOARD ==================== */}
      {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
          {/* Main tasks list */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div>
              <h2 className="text-base font-display font-bold text-gray-900">Mes Tâches Assignées</h2>
              <p className="text-xs text-gray-500 mt-0.5">Mettez à jour le statut de vos objectifs pour informer automatiquement votre manager</p>
            </div>

            {myTasks.length === 0 ? (
              <div className="py-12 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
                <p className="text-xs text-gray-400 font-semibold">Aucune tâche ne vous est assignée pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myTasks.map((task) => (
                  <div key={task.id} className="p-4 bg-gray-50 border border-gray-100 hover:border-brand-primary/15 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">{task.title}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          task.priority === "Critique" ? "bg-red-50 text-red-700 border-red-200" :
                          task.priority === "Haute" ? "bg-orange-50 text-orange-700 border-orange-200" :
                          "bg-blue-50 text-blue-700 border-blue-100"
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{task.description}</p>
                      <p className="text-[10px] text-gray-400 mt-1">Échéance : <b>{task.dueDate}</b></p>
                    </div>

                    <select
                      value={task.status}
                      onChange={(e) => onUpdateTaskStatus(task.id, e.target.value)}
                      className="text-[10px] font-bold text-gray-700 bg-white border border-gray-200 rounded px-2.5 py-1.5 focus:outline-none"
                    >
                      <option value="À faire">À faire</option>
                      <option value="En cours">En cours</option>
                      <option value="Terminée">Terminée</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick balances & trackers */}
          <div className="lg:col-span-4 space-y-6">
            {/* PTO balance */}
            <div className="bg-brand-dark p-6 rounded-3xl text-white border border-brand-primary/25 shadow-md">
              <span className="text-[10px] font-mono font-bold tracking-widest text-brand-neon uppercase">SOLDE DE CONGÉS</span>
              <h3 className="text-4xl font-display font-bold mt-3 font-mono">25 jours</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">Congés payés cumulés disponibles pour l'année fiscale en cours.</p>
              
              <div className="border-t border-brand-primary/25 pt-4 mt-4 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Pris ce mois :</span>
                  <span className="text-white font-bold">2 jours</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>En cours de validation :</span>
                  <span className="text-brand-neon font-bold">
                    {myLeaves.filter(l => l.status === "En attente").length} jours
                  </span>
                </div>
              </div>
            </div>

            {/* Punctuality metrics */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">PONCTUALITÉ & BILAN</h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-2xl flex items-center justify-between text-xs font-semibold text-gray-700">
                  <span>Taux de présence globale :</span>
                  <span className="text-emerald-600 font-mono">96.8%</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl flex items-center justify-between text-xs font-semibold text-gray-700">
                  <span>Nombre de retards constatés :</span>
                  <span className="text-amber-600 font-mono">{currentUser.delayHistoryCount || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: POINTAGE QR CODE ==================== */}
      {activeTab === "analyses" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
          {/* Historical punches */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-display font-bold text-gray-900 text-base mb-2">Historique Personnel des Présences</h3>
            <p className="text-xs text-gray-500 mb-6">Suivi chronologique de vos heures de service et signatures d'accueil</p>

            <div className="divide-y divide-gray-50">
              {myAttendances.length === 0 ? (
                <p className="py-8 text-center text-gray-400 text-xs">Aucun historique de présence disponible.</p>
              ) : (
                myAttendances.map((att) => (
                  <div key={att.id} className="py-4 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-gray-800">
                        {new Date(att.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <div className="flex gap-4 text-gray-400 text-[10px] mt-1 font-mono">
                        <span>Entrée: {att.clockIn || "--:--"}</span>
                        <span>Sortie: {att.clockOut || "--:--"}</span>
                      </div>
                    </div>
                    {getAttendanceStatusBadge(att.status)}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pointeuse interactive interface */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-brand-dark p-6 rounded-3xl border border-brand-primary/25 shadow-lg text-white space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-brand-neon uppercase font-mono">Pointeuse Digitale</span>
                <Clock className="w-5 h-5 text-brand-neon animate-pulse" />
              </div>

              <div className="bg-[#011410] border border-brand-primary/30 p-4 rounded-2xl text-center">
                <h3 className="text-3xl font-display font-bold text-white font-mono tracking-widest">
                  {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </h3>
                <p className="text-[9px] text-brand-neon uppercase font-bold tracking-wider mt-1">
                  {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}
                </p>
              </div>

              <div className="text-xs text-gray-300 space-y-2 border-y border-brand-primary/20 py-3 font-medium">
                <div className="flex justify-between">
                  <span>Statut du Pointage :</span>
                  <span>
                    {todayAttendance ? (
                      <span className="text-brand-neon font-bold">{todayAttendance.status === "Présent" ? "À l'heure" : "En retard"}</span>
                    ) : (
                      <span className="text-gray-400 font-bold">Non pointé</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Enregistré à l'arrivée :</span>
                  <span>{todayAttendance?.clockIn || "--:--"}</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Enregistré au départ :</span>
                  <span>{todayAttendance?.clockOut || "--:--"}</span>
                </div>
              </div>

              {/* Arrivee/Depart Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onPunch("check_in")}
                  disabled={!!todayAttendance?.clockIn}
                  className="py-2.5 rounded-xl bg-brand-neon hover:bg-emerald-300 text-brand-dark text-xs font-bold tracking-wider uppercase transition-colors disabled:opacity-40 disabled:hover:bg-brand-neon cursor-pointer text-center"
                >
                  Arrivée
                </button>
                <button
                  onClick={() => onPunch("check_out")}
                  disabled={!todayAttendance?.clockIn || !!todayAttendance?.clockOut}
                  className="py-2.5 rounded-xl bg-brand-primary hover:bg-brand-medium text-white border border-brand-neon/20 text-xs font-bold tracking-wider uppercase transition-colors disabled:opacity-40 disabled:hover:bg-brand-primary cursor-pointer text-center"
                >
                  Départ
                </button>
              </div>

              {/* Anti-Cheat scanning action */}
              <div className="pt-2 border-t border-brand-primary/10">
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-primary via-emerald-600 to-brand-neon hover:opacity-95 text-white text-xs font-bold tracking-wide uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border border-brand-neon/20"
                >
                  <QrCode className="w-4 h-4 text-brand-neon" />
                  <span>Scanner mon pointage</span>
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-1.5 font-medium leading-relaxed">
                  Scannez de façon sécurisée le code temporaire affiché sur la borne d'accueil physique des locaux.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: COLLEAGUES DIRECTORY ==================== */}
      {activeTab === "structure" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-display font-bold text-gray-900 mb-2">Annuaire de l'Équipe Ingénierie</h3>
            <p className="text-xs text-gray-500 mb-6">Contactez et vérifiez le statut de présence de vos collègues de sprint en direct.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.filter(e => e.id !== currentUser.id && e.department === currentUser.department).map((collab) => (
                <div key={collab.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col justify-between h-36 hover:bg-white transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <img src={collab.avatar} alt={collab.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" referrerPolicy="no-referrer" />
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">{collab.name}</h4>
                        <p className="text-[9px] text-gray-400 font-mono uppercase tracking-widest">Ingénieur</p>
                      </div>
                    </div>

                    <span className={`w-2.5 h-2.5 rounded-full ${
                      collab.availability === "available" ? "bg-emerald-500" :
                      collab.availability === "leave" ? "bg-amber-400" :
                      "bg-red-500"
                    }`} title={collab.availability} />
                  </div>

                  <div className="mt-3 text-[11px] text-gray-500 space-y-1">
                    <p className="truncate"><b>E-mail :</b> {collab.email}</p>
                    <p><b>Téléphone :</b> {collab.phone || "+33 6 00 00 00 00"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: REQUEST LEAVE ==================== */}
      {activeTab === "rapports" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
          {/* Submit form */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-display font-bold text-gray-900 text-base mb-4">Déposer une Demande de Congé</h3>
            
            <form onSubmit={handleSubmitLeave} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Type d'absence</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-900 bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  >
                    <option>Congés Annuels</option>
                    <option>RTT</option>
                    <option>Arrêt Maladie</option>
                    <option>Congé Sans Solde</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Date de début</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Date de fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Motif ou justification de la demande</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Justifiez brièvement votre demande de congé pour l'algorithme d'impact IA..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loadingLeaveSubmit}
                  className="px-5 py-2.5 bg-brand-dark hover:bg-[#04281f] text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 shadow-md flex items-center gap-2"
                >
                  {loadingLeaveSubmit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Soumettre au Service RH</span>
                </button>
              </div>
            </form>
          </div>

          {/* History tracker */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="font-display font-bold text-gray-900 text-sm">Suivi de mes PTO & Congés</h3>
            <div className="space-y-3.5">
              {myLeaves.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Aucune demande soumise.</p>
              ) : (
                myLeaves.map((leave) => (
                  <div key={leave.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-gray-800">{leave.type}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{leave.startDate} au {leave.endDate} ({leave.durationDays} Jours)</p>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      leave.status === "Approuvé" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                      leave.status === "Refusé" ? "bg-red-50 text-red-700 border border-red-200" :
                      "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: HANDBOOK ==================== */}
      {activeTab === "support" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-display font-bold text-gray-900 mb-2 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-primary" /> Manuel du Collaborateur - AutoFlow
            </h3>
            <p className="text-xs text-gray-500 mb-6">Réglementation, bonnes pratiques de télétravail, pointage QR et gestion de vos demandes de PTO.</p>

            <div className="space-y-5 text-xs text-gray-600 leading-relaxed">
              <div>
                <h4 className="font-bold text-gray-800 mb-1 flex items-center gap-1">
                  <Smartphone className="w-4 h-4 text-brand-primary" /> Règle de pointage par QR Code
                </h4>
                <p>
                  Pour éliminer la triche et certifier votre présence physique, vous devez obligatoirement scanner le QR code d'accueil affiché sur la borne d'entrée à votre arrivée le matin. Le code change toutes les 15 secondes. En cas d'échec ou d'expiration, rechargez l'appareil photo et réessayez.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-emerald-500" /> Soumission des Congés et Automatisation IA
                </h4>
                <p>
                  Lorsque vous demandez un congé payé ou un RTT, l'intelligence d'AutoFlow effectue instantanément un diagnostic de surcharge du projet. Si votre absence présente un risque de retard de livraison, le système suggère un plan de réallocation de vos tâches critiques vers d'autres ingénieurs compétents avant d'envoyer la demande aux RH.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 6: SETTINGS (PARAMETRES COMPTE COLLABORATEUR) ==================== */}
      {activeTab === "settings" && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Account Info & declared skills */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Contact details */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5 border-b border-gray-50 pb-4">
                  <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 border border-blue-100/50">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-gray-900 text-sm">Informations Personnelles</h3>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">Mettez à jour vos informations de contact professionnelles</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        Adresse E-mail (Lecture seule)
                      </label>
                      <input
                        type="email"
                        value={currentUser.email}
                        readOnly
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-400 bg-gray-50 cursor-not-allowed font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        Numéro de téléphone
                      </label>
                      <input
                        type="text"
                        value={empPhone}
                        onChange={(e) => setEmpPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills Declaration for AI Matching */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5 border-b border-gray-50 pb-4">
                  <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100/50">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-gray-900 text-sm">Vos Compétences d'Affectation IA</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Déclarez vos technologies clés pour guider le moteur décisionnel d'objectifs</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                      Compétences Actives
                    </span>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {empSkills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold rounded-lg inline-flex items-center gap-1.5"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="text-indigo-400 hover:text-indigo-700 transition-colors font-bold text-[10px] cursor-pointer"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleAddSkill} className="flex gap-2 pt-2 border-t border-gray-50">
                    <input
                      type="text"
                      placeholder="ex: Vue.js, Python, PostgreSQL..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-brand-dark hover:bg-[#04281f] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      Ajouter
                    </button>
                  </form>
                </div>
              </div>

            </div>

            {/* Right Column: Profile summary */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Profile Overview Card */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-16 h-16 rounded-full object-cover border border-gray-200 mx-auto mb-4"
                  referrerPolicy="no-referrer"
                />
                <h3 className="font-display font-bold text-gray-900 text-sm">{currentUser.name}</h3>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-mono text-[9px]">{currentUser.department}</p>
                
                <div className="mt-4 pt-3.5 border-t border-gray-50 text-left space-y-2 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Identifiant :</span>
                    <span className="font-mono text-gray-800">{currentUser.id}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Statut :</span>
                    <span className="font-bold text-emerald-600">● Actif en poste</span>
                  </div>
                </div>
              </div>

              {/* Notification Prefs */}
              <div className="bg-brand-dark p-6 rounded-3xl text-white border border-brand-primary/20">
                <h4 className="font-display font-bold text-sm text-brand-neon mb-4">Alertes Automatisées</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300">Alerte e-mail pour nouvelles tâches</span>
                    <button
                      type="button"
                      onClick={() => setEmpNotifyEmail(!empNotifyEmail)}
                      className={`w-9 h-5 rounded-full p-0.5 relative transition-colors cursor-pointer ${empNotifyEmail ? "bg-brand-medium" : "bg-gray-700"}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${empNotifyEmail ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300">Alerte SMS de validation congé</span>
                    <button
                      type="button"
                      onClick={() => setEmpNotifySms(!empNotifySms)}
                      className={`w-9 h-5 rounded-full p-0.5 relative transition-colors cursor-pointer ${empNotifySms ? "bg-brand-medium" : "bg-gray-700"}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${empNotifySms ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* QR Scanner modal overlay */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        currentUser={currentUser}
        onPunchSuccess={onRefreshState}
      />

    </div>
  );
}
