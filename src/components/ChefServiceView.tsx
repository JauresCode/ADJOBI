import React, { useState } from "react";
import {
  Search, Plus, Bell, Settings, Calendar, User, Sparkles, ShieldAlert,
  Cpu, CheckCircle2, AlertCircle, Clock, Trash2, Send, BarChart3,
  Layers, CheckSquare, Award, MessageSquare, BookOpen, AlertTriangle,
  Users, ClipboardList
} from "lucide-react";
import { Employee, Task, AIDecisionLog, UserRole } from "../types";

interface ChefServiceViewProps {
  tasks: Task[];
  employees: Employee[];
  decisionLogs: AIDecisionLog[];
  onCreateTask: (taskData: { title: string; description: string; priority: string; requiredSkills: string[]; autoAssign: boolean; department: string }) => void;
  onUpdateTaskStatus: (taskId: string, status: string) => void;
  onAddComment: (taskId: string, commentText: string) => void;
  onToggleEmployeeAbsence: (empId: string, currentAvailability: string) => void;
  loadingAssignment: boolean;
  activeTab: string;
}

export default function ChefServiceView({
  tasks,
  employees,
  decisionLogs,
  onCreateTask,
  onUpdateTaskStatus,
  onAddComment,
  onToggleEmployeeAbsence,
  loadingAssignment,
  activeTab
}: ChefServiceViewProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Create task form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"Faible" | "Moyenne" | "Haute" | "Critique">("Moyenne");
  const [skillsStr, setSkillsStr] = useState("React, TypeScript");
  const [autoAssign, setAutoAssign] = useState(true);

  // Comment state
  const [activeTaskIdComment, setActiveTaskIdComment] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  // Chef Service Settings States
  const [chefMaxWorkload, setChefMaxWorkload] = useState("120");
  const [chefMinRestHours, setChefMinRestHours] = useState("11");
  const [chefSlaHours, setChefSlaHours] = useState("4");
  const [chefNotifyDelay, setChefNotifyDelay] = useState(true);
  const [chefNotifyConflict, setChefNotifyConflict] = useState(true);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (title) {
      onCreateTask({
        title,
        description,
        priority,
        requiredSkills: skillsStr.split(",").map(s => s.trim()).filter(s => s.length > 0),
        autoAssign,
        department: "Ingénierie"
      });
      setTitle("");
      setDescription("");
      setSkillsStr("React, TypeScript");
      setIsCreateOpen(false);
      alert("Demande de tâche soumise au Moteur d'Assignation IA.");
    }
  };

  const submitComment = (taskId: string) => {
    if (commentText.trim()) {
      onAddComment(taskId, commentText);
      setCommentText("");
    }
  };

  // Filter tasks & employees for the department (Ingénierie)
  const deptTasks = tasks.filter(t => t.department === "Ingénierie");
  const deptEmployees = employees.filter(e => e.department === "Ingénierie");

  const getPriorityColor = (prio: string) => {
    switch (prio) {
      case "Critique": return "bg-red-50 text-red-700 border-red-200";
      case "Haute": return "bg-orange-50 text-orange-700 border-orange-200";
      case "Moyenne": return "bg-blue-50 text-blue-700 border-blue-100";
      default: return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Terminée": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "En retard": return <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />;
      case "En cours": return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  // Assistant Virtual recommendations match logic
  const getRecommededEmployee = (requiredSkills: string[]) => {
    // Find employee in Ingénierie with best skill match and lowest workload
    const candidates = deptEmployees.filter(e => e.availability === "available" && e.isActive !== false);
    if (candidates.length === 0) return null;
    
    let bestCandidate = candidates[0];
    let maxMatchCount = -1;
    
    candidates.forEach(cand => {
      const matchCount = cand.skills.filter(s => requiredSkills.some(req => req.toLowerCase().includes(s.toLowerCase()))).length;
      if (matchCount > maxMatchCount) {
        maxMatchCount = matchCount;
        bestCandidate = cand;
      } else if (matchCount === maxMatchCount && cand.workload < bestCandidate.workload) {
        bestCandidate = cand;
      }
    });
    
    return bestCandidate;
  };

  return (
    <div className="flex-1 bg-[#f8faf9] h-full p-4 md:p-8 overflow-y-auto relative font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">
            {activeTab === "dashboard" && "Direction du Service Ingénierie"}
            {activeTab === "analyses" && "Performance & Activité d'Équipe"}
            {activeTab === "structure" && "Registre opérationnel d'Équipe"}
            {activeTab === "rapports" && "Suivi d'Attribution Opérationnelle"}
            {activeTab === "support" && "Support & Guide Méthodologique"}
            {activeTab === "settings" && "Paramètres du Service"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeTab === "dashboard" && "Chef de Service • Gestion réactive des objectifs techniques, répartition de la charge de sprint"}
            {activeTab === "analyses" && "Analyses prédictives du taux d'occupation de l'équipe et goulots d'étranglement de compétences"}
            {activeTab === "structure" && "Suivez le taux d'occupation, déclarez les indisponibilités et ajustez les fiches d'équipe"}
            {activeTab === "rapports" && "Historique des décisions automatisées prises par l'IA et répartition des ressources"}
            {activeTab === "support" && "Règles d'évaluation des compétences et procédures de secours d'urgence d'AutoFlow"}
            {activeTab === "settings" && "Configurez la charge maximale tolérée, les SLA d'urgence et les alertes d'occupation"}
          </p>
        </div>

        {/* Global actions row */}
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-sm text-xs text-gray-500 font-mono">
          <span className="w-2.5 h-2.5 bg-brand-neon rounded-full animate-pulse" />
          <span>Service Actif • Ingénierie</span>
        </div>
      </div>

      {/* ==================== CREATE TASK OVERLAY MODAL ==================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-gray-100 shadow-2xl p-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-lg text-gray-900">Nouveau Besoin d'Ingénierie</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-sm">✕</button>
            </div>
            
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Intitulé de l'objectif</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Corriger le bug d'affichage de la borne QR"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Cahier des charges / description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Décrivez précisément l'objectif technique et les livrables..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Priorité d'urgence</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white font-semibold"
                  >
                    <option value="Faible">Faible</option>
                    <option value="Moyenne">Moyenne</option>
                    <option value="Haute">Haute</option>
                    <option value="Critique">Critique</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Compétences requises (séparées par virgules)</label>
                  <input
                    type="text"
                    value={skillsStr}
                    onChange={(e) => setSkillsStr(e.target.value)}
                    placeholder="React, CSS, Node.js"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900"
                  />
                </div>
              </div>

              <div className="bg-brand-dark/5 p-4 rounded-2xl flex items-center justify-between border border-brand-dark/10">
                <div>
                  <h4 className="text-xs font-bold text-brand-dark">Assignation Assistée par l'IA</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Laisser l'assistant AutoFlow RH calculer la charge et désigner le candidat optimal</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoAssign(!autoAssign)}
                  className="w-12 h-6 bg-brand-primary/60 rounded-full p-0.5 relative transition-all"
                >
                  <div className={`w-5 h-5 bg-brand-neon rounded-full shadow transition-transform ${autoAssign ? "translate-x-6" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Show matching simulator preview */}
              {autoAssign && title && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-1.5 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-brand-neon animate-pulse" />
                    <span>Recommandation Assistant Virtuel</span>
                  </div>
                  {(() => {
                    const reqSkills = skillsStr.split(",").map(s => s.trim());
                    const matched = getRecommededEmployee(reqSkills);
                    if (matched) {
                      return (
                        <div className="mt-2 flex items-center gap-2">
                          <img src={matched.avatar} alt={matched.name} className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <p className="text-xs font-bold text-gray-800">{matched.name}</p>
                            <p className="text-[10px] text-emerald-700">Adéquation : <b>{matched.skills.filter(s => reqSkills.some(r => r.toLowerCase().includes(s.toLowerCase()))).length > 0 ? "Excellente" : "Optimale"}</b> (Charge actuelle : {matched.workload}%)</p>
                          </div>
                        </div>
                      );
                    }
                    return <p className="text-[10px] text-emerald-700 mt-1">Aucun candidat libre, la tâche sera placée en attente.</p>;
                  })()}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-xs font-semibold">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-dark text-white rounded-xl text-xs font-semibold hover:bg-[#04281f]">Créer l'Objectif</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== TAB 1: DASHBOARD ==================== */}
      {activeTab === "dashboard" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top warning banner if workload is high */}
          <div className="bg-brand-dark border border-brand-primary/20 text-white p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-brand-primary/40 rounded-xl text-brand-neon border border-brand-neon/20 shrink-0">
                <Cpu className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-display font-bold text-brand-neon uppercase tracking-wider">Ajustement de Surcharge IA Activé</h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">Le département d'ingénierie opère à un rythme de sprint. L'intelligence d'AutoFlow équilibre automatiquement la répartition des tâches pour éviter l'épuisement professionnel.</p>
              </div>
            </div>
            <span className="bg-brand-primary/50 text-brand-neon border border-brand-neon/20 px-3 py-1.5 rounded-xl font-mono text-[10px] uppercase font-bold text-center">MODE ACTIF</span>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
              <span className="text-3xl font-bold text-gray-800 font-mono">{deptTasks.length}</span>
              <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-wider">Tâches Ingénierie</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
              <span className="text-3xl font-bold text-emerald-600 font-mono">
                {deptEmployees.filter(e => e.availability === "available" && e.isActive !== false).length} / {deptEmployees.length}
              </span>
              <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-wider">Membres Disponibles</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
              <span className="text-3xl font-bold text-brand-primary font-mono">
                {(deptEmployees.reduce((acc, e) => acc + e.workload, 0) / deptEmployees.length).toFixed(0)} %
              </span>
              <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-wider">Charge d'Équipe Moyenne</p>
            </div>
          </div>

          {/* Side by side tasks list and decisions logs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-display font-bold text-gray-900 text-sm mb-4">Objectifs Prioritaires Actifs</h3>
              <div className="space-y-3">
                {deptTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">{task.title}</h4>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400">
                        <span>Assigné à : <b>{task.assignedToName || "Personne"}</b></span>
                        <span>•</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                      </div>
                    </div>
                    {getStatusIcon(task.status)}
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-display font-bold text-gray-900 text-sm mb-4">Derniers Arbitrages IA</h3>
              <div className="space-y-3">
                {decisionLogs.slice(0, 2).map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                    <p className="font-bold text-gray-800 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-brand-neon shrink-0" />
                      {log.title}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{log.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: ASSIGNATION INTUITIVE ==================== */}
      {activeTab === "analyses" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-display font-bold text-gray-900">Moteur d'Assignation Intelligente</h3>
                <p className="text-xs text-gray-500 mt-0.5">Saisissez un besoin d'ingénierie et l'assistant recommandera l'objectif d'allocation parfait</p>
              </div>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2.5 bg-brand-dark hover:bg-[#04281f] text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-brand-neon" />
                <span>Nouveau Besoin</span>
              </button>
            </div>

            {/* Simulated interactive workbench */}
            <div className="p-8 bg-gray-50 rounded-2xl border border-gray-200/50 text-center space-y-4">
              <div className="w-12 h-12 bg-brand-dark text-brand-neon rounded-full flex items-center justify-center mx-auto shadow-md">
                <Cpu className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="font-display font-bold text-gray-900 text-sm">Prêt pour l'analyse d'attribution</h4>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  Cliquez sur le bouton <b>"Nouveau Besoin"</b> en haut à droite, saisissez l'objectif technologique et découvrez l'appariement algorithmique de l'assistant virtuel en fonction des compétences de l'équipe et de leur niveau d'occupation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: REGISTRE D'ÉQUIPE ==================== */}
      {activeTab === "structure" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Members list */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-display font-bold text-gray-900 text-base mb-2">Registre opérationnel d'Équipe</h3>
            <p className="text-xs text-gray-500 mb-6">Suivez le taux d'occupation, les compétences clés et marquez les absences temporaires pour forcer la réattribution.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {deptEmployees.map((emp) => (
                <div key={emp.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col justify-between h-44 hover:bg-white hover:shadow-xs transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <img src={emp.avatar} alt={emp.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" referrerPolicy="no-referrer" />
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">{emp.name}</h4>
                        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">Ingénieur</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleEmployeeAbsence(emp.id, emp.availability)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                        emp.availability === "available"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : emp.availability === "leave"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {emp.availability === "available" ? "Disponible" : emp.availability === "leave" ? "Congé" : "Absent"}
                    </button>
                  </div>

                  {/* Skills tags */}
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1">
                      {emp.skills.slice(0, 4).map((s, i) => (
                        <span key={i} className="text-[9px] bg-white text-gray-600 px-1.5 py-0.5 rounded border border-gray-100 font-semibold">{s}</span>
                      ))}
                    </div>
                  </div>

                  {/* Workload */}
                  <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span>Charge de travail : <b>{emp.workload || 0}%</b></span>
                    <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-primary rounded-full" style={{ width: `${emp.workload || 0}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: SUIVI DES OBJECTIFS ==================== */}
      {activeTab === "rapports" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header search */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un objectif, livrable, collaborateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-xs rounded-xl border border-gray-200"
              />
            </div>

            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button onClick={() => setStatusFilter("all")} className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${statusFilter === "all" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500"}`}>Tous</button>
              <button onClick={() => setStatusFilter("À faire")} className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${statusFilter === "À faire" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500"}`}>À faire</button>
              <button onClick={() => setStatusFilter("En cours")} className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${statusFilter === "En cours" ? "bg-white text-blue-600 shadow-xs" : "text-gray-500"}`}>En cours</button>
              <button onClick={() => setStatusFilter("Terminée")} className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${statusFilter === "Terminée" ? "bg-white text-emerald-600 shadow-xs" : "text-gray-500"}`}>Terminées</button>
            </div>
          </div>

          {/* List panel */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-display font-bold text-gray-900 text-base mb-6">Registre Général d'Ingénierie</h3>

            <div className="space-y-4">
              {deptTasks.filter(t => {
                const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || (t.assignedToName && t.assignedToName.toLowerCase().includes(searchQuery.toLowerCase()));
                const matchesStatus = statusFilter === "all" || t.status === statusFilter;
                return matchesSearch && matchesStatus;
              }).map((task) => (
                <div key={task.id} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-xs transition-all space-y-3">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-gray-900">{task.title}</h4>
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">{task.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={task.status}
                        onChange={(e) => onUpdateTaskStatus(task.id, e.target.value)}
                        className="text-[10px] font-bold text-gray-700 bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none"
                      >
                        <option value="À faire">À faire</option>
                        <option value="En cours">En cours</option>
                        <option value="En attente">En attente</option>
                        <option value="Terminée">Terminée</option>
                        <option value="En retard">En retard</option>
                        <option value="Annulée">Annulée</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100/60 flex items-center justify-between flex-wrap gap-2 text-[10px] text-gray-400 font-medium">
                    <span>Assigné à : <b>{task.assignedToName || "Non assigné"}</b></span>
                    <span>Échéance : {task.dueDate}</span>
                    
                    <button
                      onClick={() => setActiveTaskIdComment(activeTaskIdComment === task.id ? null : task.id)}
                      className="text-brand-primary font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Commentaires ({task.comments?.length || 0})</span>
                    </button>
                  </div>

                  {/* Expand comments block */}
                  {activeTaskIdComment === task.id && (
                    <div className="bg-gray-100 p-3 rounded-xl border border-gray-200 space-y-3.5 mt-3">
                      <div className="space-y-2">
                        {task.comments?.map((comment) => (
                          <div key={comment.id} className="text-xs bg-white p-2.5 rounded-lg border border-gray-200/50">
                            <p className="text-gray-400 text-[10px] font-semibold flex justify-between">
                              <span>{comment.user}</span>
                              <span>{new Date(comment.timestamp).toLocaleTimeString()}</span>
                            </p>
                            <p className="text-gray-700 mt-1 leading-relaxed">{comment.text}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Ajouter un commentaire de suivi..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') submitComment(task.id); }}
                          className="flex-1 px-3 py-1.5 text-xs border border-gray-200 bg-white rounded-lg"
                        />
                        <button
                          onClick={() => submitComment(task.id)}
                          className="p-1.5 bg-brand-dark hover:bg-[#04281f] text-brand-neon rounded-lg"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: SUPPORT CHEF ==================== */}
      {activeTab === "support" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-lg font-display font-bold text-gray-900 mb-2 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-primary" /> Guide Opérationnel pour Chefs de Service
              </h3>
              <p className="text-xs text-gray-500 mb-6">
                Optimisez la distribution de vos tâches d'équipe et apprenez à déléguer efficacement en cas d'alerte de surcharge.
              </p>

              <div className="space-y-4 text-xs text-gray-600 leading-relaxed">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <h4 className="font-bold text-gray-800 mb-1 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-brand-neon animate-pulse" /> Recommandations Virtuelles IA
                  </h4>
                  <p>
                    L'IA calcule l'indice d'adéquation de chaque ingénieur en fonction des technologies requises (ex: React, Node.js, CSS) et de sa charge globale actuelle (en pourcentage de sprint). Préférez toujours l'auto-assignation pour équilibrer la fatigue et le stress.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <h4 className="font-bold text-gray-800 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Gestion des Absences et Redistribution d'Urgence
                  </h4>
                  <p>
                    En cas de maladie d'un membre de l'équipe, marquez-le comme "Absent" d'un simple clic dans l'onglet <b>Registre d'Équipe</b>. L'assistant virtuel calculera et redirigera automatiquement ses livrables d'ingénierie actifs vers d'autres candidats compétents et disponibles.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4 text-xs">
              <h4 className="font-display font-bold text-gray-900">FAQ de la Borne d'Accueil</h4>
              <div>
                <p className="text-gray-900 font-bold">Q: Comment mes collaborateurs pointent-ils ?</p>
                <p className="text-gray-500 text-[11px] mt-0.5">R: Ils ouvrent leur tableau de bord personnel, puis cliquent sur "Scanner mon pointage" devant l'écran d'affichage de la borne.</p>
              </div>
              <div>
                <p className="text-gray-900 font-bold">Q: Où sont calculés les retards ?</p>
                <p className="text-gray-500 text-[11px] mt-0.5">R: Le serveur valide l'heure du scan par rapport à l'heure théorique de début de poste définie pour l'entreprise.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 6: SETTINGS (PARAMETRES CHEF DE SERVICE) ==================== */}
      {activeTab === "settings" && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Workload & SLA rules */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Workload Limits & Rules */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5 border-b border-gray-50 pb-4">
                  <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100/50">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-gray-900 text-sm">Limites de Charge d'Équipe (Moteur IA)</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Spécifiez les seuils de fatigue pour guider l'affectation intelligente</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        Charge Maximale autorisée par personne (%)
                      </label>
                      <input
                        type="number"
                        value={chefMaxWorkload}
                        onChange={(e) => setChefMaxWorkload(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        Repos Minimum obligatoire entre tâches (h)
                      </label>
                      <input
                        type="number"
                        value={chefMinRestHours}
                        onChange={(e) => setChefMinRestHours(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-50">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Délai de SLA de traitement d'Urgence (heures)
                    </label>
                    <select
                      value={chefSlaHours}
                      onChange={(e) => setChefSlaHours(e.target.value)}
                      className="w-full sm:w-1/2 px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    >
                      <option value="2">2 heures (SLA Critique)</option>
                      <option value="4">4 heures (Recommandé)</option>
                      <option value="12">12 heures</option>
                      <option value="24">24 heures (Standard)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Service Notification rules */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5 border-b border-gray-50 pb-4">
                  <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100/50">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-gray-900 text-sm">Alertes Opérationnelles de Service</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Soyez notifié en temps réel lors de décalages ou d'incidents d'équipe</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">Alerter en cas de retard répété</span>
                      <span className="text-[11px] text-gray-500">
                        Notifier le chef de service si un ingénieur cumule 3 retards ou anomalies de pointage.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChefNotifyDelay(!chefNotifyDelay)}
                      className={`w-11 h-6 rounded-full p-0.5 relative transition-colors cursor-pointer ${chefNotifyDelay ? "bg-brand-medium" : "bg-gray-200"}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${chefNotifyDelay ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>

                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">Détecter les conflits d'absence</span>
                      <span className="text-[11px] text-gray-500">
                        Avertir instantanément si deux ingénieurs clés du même pôle de compétences demandent des congés en même temps.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChefNotifyConflict(!chefNotifyConflict)}
                      className={`w-11 h-6 rounded-full p-0.5 relative transition-colors cursor-pointer ${chefNotifyConflict ? "bg-brand-medium" : "bg-gray-200"}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${chefNotifyConflict ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Information */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Profile Card */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100/50 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="font-display font-bold text-gray-900 text-sm">Fiche Chef de Service</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Vous dirigez le pôle Ingénierie. Vous possédez les droits de planification et de modification d'indisponibilités opérationnelles.
                </p>
                <div className="mt-4 pt-3.5 border-t border-gray-50 text-left space-y-2 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Collaborateurs :</span>
                    <span className="font-bold text-indigo-600">6 Ingénieurs actifs</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Code Service :</span>
                    <span className="font-mono text-[10px]">DEPT_ENG_001</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
