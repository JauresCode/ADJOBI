import React, { useState } from "react";
import {
  Search, Plus, Bell, Settings, ShieldCheck, Cpu, Activity, Server,
  ArrowUpRight, ArrowDownRight, MoreVertical, ShieldAlert, CpuIcon,
  Check, LogOut, Power, Database, Layers, Globe, RefreshCw, Eye, AlertCircle, HelpCircle, FileText
} from "lucide-react";
import { Employee, SystemAlert, UserRole } from "../types";

interface SuperAdminViewProps {
  employees: Employee[];
  alerts: SystemAlert[];
  onInviteAdmin: (newAdmin: { name: string; email: string; role: UserRole; department: string }) => void;
  onUpdateRole: (empId: string, newRole: UserRole) => void;
  activeTab: string;
}

export default function SuperAdminView({
  employees,
  alerts,
  onInviteAdmin,
  onUpdateRole,
  activeTab
}: SuperAdminViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [auditCategory, setAuditCategory] = useState<string>("all");
  
  // Dashboard Simplified Directory local filters
  const [dbSearch, setDbSearch] = useState("");
  const [dbDept, setDbDept] = useState("all");
  
  // Settings system parameters
  const [settingsModel, setSettingsModel] = useState<"gemini-3.5-flash" | "gemini-3.5-pro">("gemini-3.5-flash");
  const [settingsAutoAssign, setSettingsAutoAssign] = useState(true);
  const [settingsTimeout, setSettingsTimeout] = useState("60");
  const [settingsQrInterval, setSettingsQrInterval] = useState("15");
  const [settingsWhitelist, setSettingsWhitelist] = useState(false);
  const [settingsTempLevel, setSettingsTempLevel] = useState(0.2);
  const [isDbBackupSaved, setIsDbBackupSaved] = useState(false);
  
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("hr_admin");
  const [newDept, setNewDept] = useState("Ressources Humaines");
  
  const [aiEngine, setAiEngine] = useState<"gemini" | "gpt4">("gemini");
  const [showConfigModels, setShowConfigModels] = useState(false);

  // Audit Logs Mock Data
  const [auditLogs, setAuditLogs] = useState([
    { id: "LOG001", timestamp: "2026-06-23T15:45:00Z", user: "Super Admin", action: "Modification du moteur d'IA", details: "Mise à jour du moteur principal de décision vers Gemini 3.5 Flash", category: "Système", status: "success" },
    { id: "LOG002", timestamp: "2026-06-23T15:12:30Z", user: "Serveur", action: "Rotation de Clé QR Code", details: "Génération automatique d'un nouveau jeton de sécurité d'accueil (AFQR_839AX)", category: "Sécurité", status: "success" },
    { id: "LOG003", timestamp: "2026-06-23T14:55:12Z", user: "Marcus Chen", action: "Approbation de Congé d'urgence", details: "Validation d'arrêt maladie pour Marcus Chen (Déclenchement du plan de réallocation IA)", category: "Ressources Humaines", status: "success" },
    { id: "LOG004", timestamp: "2026-06-23T14:30:00Z", user: "Super Admin", action: "Modification de Rôle", details: "Changement de rôle pour Emma Durand de Chef de Service à Admin RH", category: "Sécurité", status: "success" },
    { id: "LOG005", timestamp: "2026-06-23T12:00:00Z", user: "Système", action: "Sauvegarde de base de données", details: "Sauvegarde incrémentielle quotidienne réussie (Firestore & State)", category: "Système", status: "success" },
    { id: "LOG006", timestamp: "2026-06-23T10:15:22Z", user: "Borne d'Accueil", action: "Pointage Bloqué - Anti-Triche", details: "Tentative de scan avec un code expiré par l'identifiant EMP008 (Rejeté)", category: "Sécurité", status: "warning" },
    { id: "LOG007", timestamp: "2026-06-23T09:02:15Z", user: "Emma Durand", action: "Pointage Réussi via QR", details: "Arrivée enregistrée à 09:02 pour Emma Durand (Statut: À l'heure)", category: "Ressources Humaines", status: "success" },
    { id: "LOG008", timestamp: "2026-06-23T08:58:10Z", user: "Marcus Chen", action: "Pointage Réussi via QR", details: "Arrivée enregistrée à 08:58 pour Marcus Chen (Statut: À l'heure)", category: "Ressources Humaines", status: "success" },
  ]);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName && newEmail) {
      onInviteAdmin({
        name: newName,
        email: newEmail,
        role: newRole,
        department: newDept
      });
      // Add log
      const newLog = {
        id: "LOG" + Date.now(),
        timestamp: new Date().toISOString(),
        user: "Super Admin",
        action: "Invitation Collaborateur",
        details: `Invitation de ${newName} (${newEmail}) comme ${newRole}`,
        category: "Sécurité",
        status: "success"
      };
      setAuditLogs(prev => [newLog, ...prev]);
      setNewName("");
      setNewEmail("");
      setIsInviteOpen(false);
    }
  };

  const handleToggleActive = async (empId: string, currentActive: boolean) => {
    try {
      const targetActive = !currentActive;
      const res = await fetch("/api/employees/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: empId, isActive: targetActive })
      });
      if (res.ok) {
        onUpdateRole(empId, employees.find(e => e.id === empId)?.role || "employee"); // Triggers state reload in App.tsx
        
        // Add audit log
        const empName = employees.find(e => e.id === empId)?.name || "Employé";
        const newLog = {
          id: "LOG" + Date.now(),
          timestamp: new Date().toISOString(),
          user: "Super Admin",
          action: targetActive ? "Réactivation de compte" : "Désactivation de compte",
          details: `Statut d'accès modifié pour ${empName} (Actif: ${targetActive ? 'OUI' : 'NON'})`,
          category: "Sécurité",
          status: "success"
        };
        setAuditLogs(prev => [newLog, ...prev]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "super_admin": return "Super Admin";
      case "hr_admin": return "Admin RH";
      case "chef_service": return "Chef de Service";
      case "employee": return "Employé";
      default: return role;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <span className="bg-slate-100 text-slate-800 border border-slate-200/60 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">SUPER ADMIN</span>;
      case "hr_admin":
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">ADMIN RH</span>;
      case "chef_service":
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">CHEF SERVICE</span>;
      case "employee":
        return <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">COLLABORATEUR</span>;
      default:
        return null;
    }
  };

  // Filter logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" ? true : emp.role === roleFilter;
    const matchesDept = deptFilter === "all" ? true : emp.department === deptFilter;
    return matchesSearch && matchesRole && matchesDept;
  });

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = auditCategory === "all" ? true : log.category === auditCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="flex-1 bg-[#f8faf9] h-full p-4 md:p-8 overflow-y-auto relative font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">
            {activeTab === "dashboard" && "Tableau de Bord Central"}
            {activeTab === "analyses" && "Analyses & Télémétrie Système"}
            {activeTab === "structure" && "Gestion des Comptes & Rôles"}
            {activeTab === "rapports" && "Journal d'Audit et Logs de Sécurité"}
            {activeTab === "support" && "Guide d'Aide & Support Technique"}
            {activeTab === "settings" && "Paramètres Globaux du Système"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeTab === "dashboard" && "Super Administrateur • Vue d'ensemble de l'automatisation RH et de l'infrastructure"}
            {activeTab === "analyses" && "Surveillance des performances de l'IA, de la base de données et des temps de réponse"}
            {activeTab === "structure" && "Créer, modifier, activer ou désactiver les profils d'accès de l'entreprise"}
            {activeTab === "rapports" && "Historique immuable des événements critiques et des actions administratives"}
            {activeTab === "support" && "Manuel d'exploitation, configuration du pointage QR et maintenance"}
            {activeTab === "settings" && "Configurez l'intelligence artificielle Gemini, les règles de sécurité et les automatisations globales d'AutoFlow"}
          </p>
        </div>

        {/* Global actions row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {activeTab === "structure" && (
            <button
              onClick={() => setIsInviteOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-dark hover:bg-[#04281f] rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-brand-neon" />
              <span>Créer un Compte</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-sm text-xs text-gray-500 font-mono">
            <span className="w-2.5 h-2.5 bg-brand-neon rounded-full animate-pulse" />
            <span>Moteur Gemini 3.5 Actif</span>
          </div>
        </div>
      </div>

      {/* ==================== TAB 1: DASHBOARD ==================== */}
      {activeTab === "dashboard" && (
        <div className="space-y-8 animate-fadeIn">
          {/* 4 Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-36">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">SANTÉ SYSTÈME</p>
                  <h3 className="text-3xl font-display font-bold text-gray-900 mt-2 font-mono">99.98 %</h3>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100/50">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold mt-4">
                <ArrowUpRight className="w-4 h-4" />
                <span>Optimal</span>
                <span className="text-gray-400 font-normal ml-1">aucun incident</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-36">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">NŒUDS DE CALCUL</p>
                  <h3 className="text-3xl font-display font-bold text-gray-900 mt-2 font-mono">4 serveurs</h3>
                </div>
                <div className="p-3 bg-brand-dark rounded-xl text-brand-neon border border-brand-primary/20">
                  <Server className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-brand-neon bg-brand-dark text-[10px] font-mono px-2 py-0.5 rounded-md self-start mt-4">
                <span className="w-1.5 h-1.5 bg-brand-neon rounded-full animate-pulse" />
                <span>Cloud Run actif</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-36">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">LATENCE MOYENNE</p>
                  <h3 className="text-3xl font-display font-bold text-gray-900 mt-2 font-mono">12 ms</h3>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl text-amber-600 border border-amber-100/50">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold mt-4">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span>Temps de réponse excellent</span>
              </div>
            </div>

            <div className="bg-brand-dark p-6 rounded-2xl border border-brand-primary/25 shadow-lg flex flex-col justify-between h-36">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold text-brand-neon/80 uppercase tracking-widest">TRANSACTIONS IA</p>
                  <h3 className="text-3xl font-display font-bold text-white mt-2 font-mono">42.8K req</h3>
                </div>
                <div className="p-3 bg-brand-primary/50 rounded-xl text-brand-neon border border-brand-neon/20">
                  <Cpu className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-brand-neon text-xs font-semibold mt-4">
                <span className="w-2 h-2 bg-brand-neon rounded-full animate-pulse" />
                <span>Gemini API connectée</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Quick Directory */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between overflow-hidden">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h2 className="text-base font-display font-bold text-gray-900">Annuaire Simplifié</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Filtrez et recherchez les profils opérationnels de l'entreprise</p>
                  </div>
                  <button
                    onClick={() => setIsInviteOpen(true)}
                    className="self-start px-3 py-1.5 bg-brand-dark hover:bg-[#04281f] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    Inviter un Collaborateur
                  </button>
                </div>

                {/* Filters inside directory card so everything is NOT "mélangé" */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-5">
                  <div className="sm:col-span-7 flex flex-wrap gap-1.5 items-center">
                    {["all", "Direction", "Ressources Humaines", "Ingénierie", "Marketing"].map((dept) => (
                      <button
                        key={dept}
                        onClick={() => setDbDept(dept)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all cursor-pointer ${
                          dbDept === dept
                            ? "bg-brand-medium text-white border-brand-medium"
                            : "bg-gray-50 text-gray-500 border-gray-200/60 hover:bg-gray-100/75"
                        }`}
                      >
                        {dept === "all" ? "Tous les services" : dept}
                      </button>
                    ))}
                  </div>

                  <div className="sm:col-span-5 relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Rechercher par nom, email..."
                      value={dbSearch}
                      onChange={(e) => setDbSearch(e.target.value)}
                      className="w-full pl-8.5 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-primary placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3">
                        <th className="pb-3 pl-2">Identité</th>
                        <th className="pb-3">Département</th>
                        <th className="pb-3">Rôle système</th>
                        <th className="pb-3 text-right pr-2">Accès / Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {employees
                        .filter((emp) => {
                          const matchesDept = dbDept === "all" || emp.department === dbDept;
                          const matchesSearch = emp.name.toLowerCase().includes(dbSearch.toLowerCase()) || 
                                                emp.email.toLowerCase().includes(dbSearch.toLowerCase()) ||
                                                emp.id.toLowerCase().includes(dbSearch.toLowerCase());
                          return matchesDept && matchesSearch;
                        })
                        .slice(0, 5)
                        .map((emp) => (
                          <tr key={emp.id} className="group hover:bg-gray-50/40 transition-colors">
                            <td className="py-3 pl-2">
                              <div className="flex items-center gap-2.5">
                                <img src={emp.avatar} alt={emp.name} className="w-8 h-8 rounded-full object-cover border border-gray-100" referrerPolicy="no-referrer" />
                                <div>
                                  <h4 className="text-xs font-bold text-gray-950 group-hover:text-brand-dark transition-colors">{emp.name}</h4>
                                  <p className="text-[9.5px] text-gray-400 font-mono leading-none mt-0.5">{emp.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-xs text-gray-600 font-medium">{emp.department}</td>
                            <td className="py-3">{getRoleBadge(emp.role)}</td>
                            <td className="py-3 text-right pr-2">
                              {emp.isActive !== false ? (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                  Actif
                                </span>
                              ) : (
                                <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                                  Suspendu
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      {employees.filter((emp) => {
                        const matchesDept = dbDept === "all" || emp.department === dbDept;
                        const matchesSearch = emp.name.toLowerCase().includes(dbSearch.toLowerCase()) || 
                                              emp.email.toLowerCase().includes(dbSearch.toLowerCase());
                        return matchesDept && matchesSearch;
                      }).length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-xs text-gray-400">
                            Aucun collaborateur trouvé pour vos filtres.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                <span>Affichage de 5 collaborateurs max (utilisez la recherche pour affiner)</span>
                <span className="font-mono text-gray-500 font-semibold bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">Total : {employees.length}</span>
              </div>
            </div>

            {/* AI Control Suite */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-brand-dark p-6 rounded-3xl border border-brand-primary/20 shadow-lg text-white">
                <div className="flex items-start gap-2.5 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-brand-neon/10 border border-brand-neon/20 flex items-center justify-center text-brand-neon">
                    <CpuIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm">Gestion IA AutoFlow</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Décisions et répartitions intelligentes</p>
                  </div>
                </div>

                <div className="bg-[#011410] border border-brand-primary/30 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-neon">Modèle Sélectionné</h4>
                    <p className="text-xs text-gray-100 font-bold mt-1">
                      {aiEngine === "gemini" ? "Gemini 3.5 Flash (Actif)" : "GPT-4 (Inactif)"}
                    </p>
                  </div>
                  <button
                    onClick={() => setAiEngine(aiEngine === "gemini" ? "gpt4" : "gemini")}
                    className="w-12 h-6 bg-brand-primary/60 border border-brand-neon/30 rounded-full p-0.5 relative transition-colors duration-300 cursor-pointer"
                  >
                    <div className={`w-5 h-5 bg-brand-neon rounded-full shadow-md transition-transform duration-300 ${aiEngine === "gemini" ? "translate-x-6" : "translate-x-0"}`} />
                  </button>
                </div>

                <div className="mt-5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Efficacité moyenne :</span>
                    <span className="text-brand-neon font-bold font-mono">91%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Tokens consommés :</span>
                    <span className="text-white font-mono">12.5 M</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowConfigModels(true)}
                  className="w-full mt-5 py-2.5 rounded-xl bg-brand-neon hover:bg-emerald-300 text-brand-dark text-[11px] font-bold tracking-wider uppercase transition-colors"
                >
                  Configurer les Quotas
                </button>
              </div>

              {/* Alertes Actives Card */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-gray-900 text-xs">Dernières Alertes Système</h3>
                  <span className="bg-red-50 text-red-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-red-200 uppercase">
                    2 alertes
                  </span>
                </div>
                <div className="space-y-3">
                  {alerts.slice(0, 2).map((alert) => (
                    <div key={alert.id} className="p-3 rounded-xl border border-amber-100 bg-amber-50/50 text-amber-900 text-xs">
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-bold">{alert.title}</h5>
                          <p className="text-[10px] text-amber-700 mt-0.5">{alert.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: ANALYSES ==================== */}
      {activeTab === "analyses" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Detailed metrics grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-lg font-display font-bold text-gray-900 mb-2">Télémétrie en Temps Réel</h3>
              <p className="text-xs text-gray-500 mb-6">Visualisation de la latence d'exécution de l'IA de décision et des appels de base de données.</p>

              {/* Graphical simulation bars */}
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                    <span className="text-gray-600 font-semibold">Temps de réponse du plan d'affectation IA (Gemini 3.5)</span>
                    <span className="text-brand-dark font-bold">142 ms (Stable)</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "35%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                    <span className="text-gray-600 font-semibold">Temps d'analyse des risques de surcharge RH</span>
                    <span className="text-brand-dark font-bold">88 ms</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-primary rounded-full" style={{ width: "22%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                    <span className="text-gray-600 font-semibold">Temps de réponse moyen de la base Firestore</span>
                    <span className="text-brand-dark font-bold">12 ms</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: "8%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                    <span className="text-gray-600 font-semibold">Temps de calcul d'index anti-triche (QR Codes)</span>
                    <span className="text-brand-dark font-bold">3 ms</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-400 rounded-full" style={{ width: "4%" }} />
                  </div>
                </div>
              </div>

              {/* Status checklist */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100">
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                  <span className="text-2xl font-bold font-mono text-gray-800">4,289</span>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Requêtes / Min</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                  <span className="text-2xl font-bold font-mono text-emerald-600">0.00%</span>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Taux d'erreur</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                  <span className="text-2xl font-bold font-mono text-gray-800">100%</span>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Garantie SLA</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                  <span className="text-2xl font-bold font-mono text-brand-primary">4 serveurs</span>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Nodes Scalés</p>
                </div>
              </div>
            </div>

            {/* Performance analysis right box */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <h4 className="font-display font-bold text-gray-900 text-sm mb-4">Analyse Comparative des Modèles</h4>
                <div className="space-y-4">
                  <div className="p-3 bg-[#011410] text-white rounded-2xl border border-brand-primary/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-neon">Gemini 3.5 Flash</span>
                      <span className="text-[9px] bg-brand-primary text-white font-mono font-bold px-1.5 py-0.5 rounded">RECOMMANDÉ</span>
                    </div>
                    <ul className="text-[10px] text-gray-400 mt-2 space-y-1 list-disc pl-3">
                      <li>Consommation de tokens réduite de 60%</li>
                      <li>Latence ultra-faible pour l'anti-triche</li>
                      <li>Précision d'évaluation des compétences de 94.8%</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
                    <span className="text-xs font-bold text-gray-800">GPT-4 Turbo</span>
                    <ul className="text-[10px] text-gray-500 mt-2 space-y-1 list-disc pl-3">
                      <li>Coût de transaction supérieur</li>
                      <li>Temps de réponse plus long de 1.2s</li>
                      <li>Recommandations similaires sur l'assignation</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 bg-brand-dark/5 p-4 rounded-2xl mt-4">
                <h5 className="text-xs font-bold text-brand-dark mb-1 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-brand-primary" /> Intégrité des Données
                </h5>
                <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                  Toutes les transactions de présence sont signées via hachage cryptographique SHA-256 unique au pointage pour garantir qu'aucune modification rétroactive ne soit possible sans trace d'audit.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: GESTION DES UTILISATEURS ==================== */}
      {activeTab === "structure" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, département..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-xs rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 text-gray-600 font-medium"
              >
                <option value="all">Tous les rôles</option>
                <option value="super_admin">Super Admin</option>
                <option value="hr_admin">Admin RH</option>
                <option value="chef_service">Chef de Service</option>
                <option value="employee">Employé</option>
              </select>

              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="text-xs border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 text-gray-600 font-medium"
              >
                <option value="all">Tous les départements</option>
                <option value="Direction">Direction</option>
                <option value="Ressources Humaines">RH</option>
                <option value="Ingénierie">Ingénierie</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
          </div>

          {/* Core Employee Directory and Action */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-display font-bold text-gray-900">Registre Global de Comptes</h2>
                <p className="text-xs text-gray-500 mt-0.5">Activer/Désactiver les accès à la plateforme et modifier les rôles de sécurité.</p>
              </div>
              <span className="bg-brand-dark/5 text-brand-dark font-mono text-[10px] px-2.5 py-1 rounded-md font-bold">
                {filteredEmployees.length} comptes trouvés
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-3">
                    <th className="pb-3.5 pl-2">Identité</th>
                    <th className="pb-3.5">Département</th>
                    <th className="pb-3.5">Rôle</th>
                    <th className="pb-3.5">Statut de sécurité</th>
                    <th className="pb-3.5 text-right pr-2">Actions d'accès</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredEmployees.map((emp) => {
                    const isUserActive = emp.isActive !== false;
                    return (
                      <tr key={emp.id} className="group hover:bg-gray-50/50 transition-colors">
                        {/* Identity */}
                        <td className="py-4 pl-2">
                          <div className="flex items-center gap-3">
                            <img src={emp.avatar} alt={emp.name} className="w-10 h-10 rounded-full object-cover border border-gray-100" referrerPolicy="no-referrer" />
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 leading-tight">{emp.name}</h4>
                              <p className="text-xs text-gray-500">{emp.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="py-4 text-xs text-gray-600 font-semibold">
                          {emp.department}
                        </td>

                        {/* Role Change Select */}
                        <td className="py-4">
                          <select
                            value={emp.role}
                            onChange={(e) => onUpdateRole(emp.id, e.target.value as UserRole)}
                            className="text-xs font-semibold text-gray-700 border border-gray-200 bg-white rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                          >
                            <option value="super_admin">Super Admin</option>
                            <option value="hr_admin">Admin RH</option>
                            <option value="chef_service">Chef Service</option>
                            <option value="employee">Employé</option>
                          </select>
                        </td>

                        {/* Status badge */}
                        <td className="py-4">
                          {isUserActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              ACCÈS ACTIF
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                              COMPTE SUSPENDU
                            </span>
                          )}
                        </td>

                        {/* Toggle active / deactivate */}
                        <td className="py-4 text-right pr-2">
                          <button
                            onClick={() => handleToggleActive(emp.id, isUserActive)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ml-auto cursor-pointer ${
                              isUserActive
                                ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{isUserActive ? "Suspendre" : "Activer"}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: AUDIT LOGS ==================== */}
      {activeTab === "rapports" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Audit header panel */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par utilisateur, action ou détails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-xs rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">Filtrer par type :</span>
              <select
                value={auditCategory}
                onChange={(e) => setAuditCategory(e.target.value)}
                className="text-xs border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 text-gray-600 font-medium"
              >
                <option value="all">Toutes les catégories</option>
                <option value="Système">Système</option>
                <option value="Sécurité">Sécurité</option>
                <option value="Ressources Humaines">RH</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
              <div>
                <h3 className="text-base font-display font-bold text-gray-900">Journal d'Audit Général</h3>
                <p className="text-xs text-gray-500 mt-0.5">Historique cryptographique sécurisé des actions critiques effectuées sur l'application.</p>
              </div>

              <button
                onClick={() => {
                  alert("Rapport d'audit exporté avec succès sous format sécurisé CSV (Signé SHA-256).");
                }}
                className="px-3.5 py-2 bg-brand-dark hover:bg-[#04281f] text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-brand-neon" />
                <span>Exporter Logs</span>
              </button>
            </div>

            <div className="space-y-3.5">
              {filteredLogs.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  Aucun log ne correspond à votre recherche.
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        log.category === "Sécurité"
                          ? "bg-red-50 text-red-500 border border-red-100"
                          : log.category === "Système"
                          ? "bg-blue-50 text-blue-500 border border-blue-100"
                          : "bg-teal-50 text-teal-600 border border-teal-100"
                      }`}>
                        {log.category === "Sécurité" ? <ShieldAlert className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-gray-900">{log.action}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            log.category === "Sécurité"
                              ? "bg-red-100 text-red-800"
                              : log.category === "Système"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-teal-100 text-teal-800"
                          }`}>
                            {log.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{log.details}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1.5 font-mono">
                          <span>Auteur : <b>{log.user}</b></span>
                          <span>•</span>
                          <span>{new Date(log.timestamp).toLocaleString("fr-FR")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-auto md:ml-0">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase">IMMUABLE</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: SUPPORT & DEPLOIEMENT ==================== */}
      {activeTab === "support" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Documentation panels */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-display font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brand-primary" /> Architecture Anti-Triche AutoFlow
                </h3>
                <p className="text-xs text-gray-500 mb-6">
                  Le système de pointage par QR Code utilise un algorithme de cryptographie asymétrique temporaire pour empêcher le pointage frauduleux à distance ou via capture d'écran.
                </p>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <h4 className="text-xs font-bold text-brand-dark mb-1">1. Génération de clé dynamique</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      La borne d'accueil (installée physiquement sur une tablette à l'entrée des bureaux) appelle l'API d'AutoFlow toutes les 15 secondes pour obtenir un jeton crypté unique à durée limitée.
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <h4 className="text-xs font-bold text-brand-dark mb-1">2. Lecture par le Collaborateur</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      L'employé ouvre l'application sur son smartphone, clique sur "Scanner mon pointage" et scanne le code à l'aide de sa caméra. L'appareil photo capture le code en direct et le transmet instantanément au serveur.
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <h4 className="text-xs font-bold text-brand-dark mb-1">3. Validation à double facteur</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Le serveur central compare la date d'émission de la clé scannée et sa valeur avec la clé active. Si la transaction prend plus de 15 secondes (ou si le code a déjà été validé/expiré), le pointage est immédiatement rejeté et une alerte de fraude est émise.
                    </p>
                  </div>
                </div>
              </div>

              {/* Troubleshooting Form */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-base font-display font-bold text-gray-900 mb-4">Besoin d'Assistance ou Support ?</h3>
                <form onSubmit={(e) => { e.preventDefault(); alert("Votre demande de support technique a été transmise à notre équipe Cloud Run. Un ingénieur vous répondra dans un délai de 2 heures."); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">Sujet du ticket</label>
                      <input type="text" placeholder="ex: Problème d'accès Caméra Iframe" required className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">Niveau de Priorité</label>
                      <select className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white">
                        <option>Priorité Faible</option>
                        <option>Priorité Moyenne</option>
                        <option>Priorité Haute (SLA)</option>
                        <option>Urgente (Panne Totale)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">Description détaillée du bug ou de la demande</label>
                    <textarea rows={3} placeholder="Détaillez le comportement observé..." required className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900" />
                  </div>

                  <button type="submit" className="px-5 py-2.5 bg-brand-dark text-white rounded-xl text-xs font-semibold hover:bg-[#04281f] transition-all">
                    Ouvrir un ticket support
                  </button>
                </form>
              </div>
            </div>

            {/* QA terminal details */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-brand-dark p-6 rounded-3xl text-white border border-brand-primary/25 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-4.5 h-4.5 text-brand-neon" />
                  <h4 className="font-display font-bold text-sm">Borne Interactive Intégrée</h4>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Pour présenter le pointage dynamique en soutenance :
                </p>
                <div className="bg-brand-medium/50 p-4 rounded-2xl border border-brand-primary/20 mt-4 text-[11px] space-y-2 font-mono">
                  <p>1. Cliquez sur le menu latéral : <b>Borne QR d'Accueil</b></p>
                  <p>2. Laissez cette vue active à l'écran</p>
                  <p>3. Ouvrez l'application sur un autre profil (ex: Employé)</p>
                  <p>4. Cliquez sur <b>Scanner mon pointage</b> pour valider l'entrée en temps réel !</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-xs space-y-3">
                <h4 className="font-display font-bold text-gray-900">FAQ & Diagnostics de soutenance</h4>
                <div className="space-y-3 font-medium">
                  <div>
                    <p className="text-gray-900 font-bold">Q: Pourquoi l'accès caméra ne s'ouvre pas ?</p>
                    <p className="text-gray-500 text-[11px] mt-0.5">R: En iframe de prévisualisation, l'accès caméra est restreint par défaut. C'est pourquoi nous avons développé un simulateur de scan conforme/frauduleux à usage unique extrêmement puissant.</p>
                  </div>
                  <div>
                    <p className="text-gray-900 font-bold">Q: Où sont sauvés les scans ?</p>
                    <p className="text-gray-500 text-[11px] mt-0.5">R: Dans le state global réactif connecté de l'application et mis à jour instantanément.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==================== TAB 6: SETTINGS (PARAMETRES SYSTEME) ==================== */}
      {activeTab === "settings" && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: AI & Security Configuration */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* AI Engine Settings */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5 border-b border-gray-50 pb-4">
                  <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100/50">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-gray-900 text-sm">Paramètres d'Intelligence Artificielle</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Ajustez le moteur décisionnel d'affectation automatique de tâches</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                      Sélection du Modèle Gemini
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSettingsModel("gemini-3.5-flash")}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          settingsModel === "gemini-3.5-flash"
                            ? "bg-brand-medium/5 border-brand-medium text-gray-900 shadow-xs"
                            : "bg-white border-gray-200/80 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">Gemini 3.5 Flash</span>
                          {settingsModel === "gemini-3.5-flash" && <span className="w-2.5 h-2.5 bg-brand-neon rounded-full" />}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                          Recommandé par défaut. Vitesse d'exécution ultra-rapide (latence ~20ms) et coûts optimisés.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSettingsModel("gemini-3.5-pro")}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          settingsModel === "gemini-3.5-pro"
                            ? "bg-brand-medium/5 border-brand-medium text-gray-900 shadow-xs"
                            : "bg-white border-gray-200/80 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">Gemini 3.5 Pro</span>
                          {settingsModel === "gemini-3.5-pro" && <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                          Haute précision pour les analyses de charge complexes et les réattributions en cascade.
                        </p>
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">Réaffectation prédictive</span>
                        <span className="text-[11px] text-gray-500">
                          L'IA réalloue automatiquement les tâches d'un ingénieur déclaré malade/absent.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettingsAutoAssign(!settingsAutoAssign)}
                        className={`w-11 h-6 rounded-full p-0.5 relative transition-colors cursor-pointer ${settingsAutoAssign ? "bg-brand-medium" : "bg-gray-200"}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${settingsAutoAssign ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-50">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-gray-800">Facteur d'Aléatoire Décisionnel (Température)</span>
                      <span className="text-xs font-mono font-bold text-brand-medium bg-brand-medium/10 px-2 py-0.5 rounded-md">
                        {settingsTempLevel}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.1"
                      value={settingsTempLevel}
                      onChange={(e) => setSettingsTempLevel(parseFloat(e.target.value))}
                      className="w-full accent-brand-medium h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                      <span>Précis & Déterministe (0.0)</span>
                      <span>Créatif & Exploratoire (1.0)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security & Access Settings */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5 border-b border-gray-50 pb-4">
                  <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 border border-blue-100/50">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-gray-900 text-sm">Sécurité & Contrôle d'Accès</h3>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">Gérez le chiffrement, le filtrage IP et les politiques d'accès de l'entreprise</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        Intervalle de Rotation du QR Code (s)
                      </label>
                      <select
                        value={settingsQrInterval}
                        onChange={(e) => setSettingsQrInterval(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      >
                        <option value="10">10 secondes (Ultra-Sûr)</option>
                        <option value="15">15 secondes (Recommandé)</option>
                        <option value="30">30 secondes</option>
                        <option value="60">1 minute</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        Expiration de session d'accès
                      </label>
                      <select
                        value={settingsTimeout}
                        onChange={(e) => setSettingsTimeout(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      >
                        <option value="15">15 minutes d'inactivité</option>
                        <option value="60">60 minutes (1 heure)</option>
                        <option value="720">12 heures (Fin de journée)</option>
                        <option value="0">Aucune expiration</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">Restriction par IP d'Entreprise</span>
                        <span className="text-[11px] text-gray-500">
                          Exiger que les scans de QR soient effectués sur le sous-réseau IP officiel de l'entreprise.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettingsWhitelist(!settingsWhitelist)}
                        className={`w-11 h-6 rounded-full p-0.5 relative transition-colors cursor-pointer ${settingsWhitelist ? "bg-brand-medium" : "bg-gray-200"}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${settingsWhitelist ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Platform Maintenance & Actions */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Maintenance Card */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-display font-bold text-gray-900 text-sm mb-4">Maintenance de la Plateforme</h3>
                
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDbBackupSaved(true);
                      setTimeout(() => setIsDbBackupSaved(false), 3000);
                    }}
                    className="w-full py-2.5 px-4 bg-brand-dark hover:bg-[#04281f] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Database className="w-4 h-4 text-brand-neon" />
                    {isDbBackupSaved ? "État de la Base Sauvegardé !" : "Sauvegarder l'état (dbState.json)"}
                  </button>

                  <button
                    type="button"
                    onClick={() => alert("La base de démonstration a été réinitialisée avec les collaborateurs initiaux d'AutoFlow.")}
                    className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                    Réinitialiser les données démo
                  </button>

                  <button
                    type="button"
                    onClick={() => alert("Purger réussi. 128 anciens logs d'audit obsolètes (> 30 jours) ont été supprimés.")}
                    className="w-full py-2.5 px-4 bg-rose-50 border border-rose-100 hover:bg-rose-100/50 text-rose-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Power className="w-4 h-4 text-rose-500" />
                    Purger les logs d'audit (&gt; 30 jours)
                  </button>
                </div>
              </div>

              {/* Status card */}
              <div className="bg-brand-dark p-6 rounded-3xl text-white border border-brand-primary/20">
                <h4 className="font-display font-bold text-sm text-brand-neon mb-1.5">Informations d'Environnement</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed mb-4">
                  AutoFlow RH fonctionne en mode hybride conteneurisé. Toutes vos données sont stockées de façon persistante dans Cloud Run.
                </p>
                <div className="space-y-2 text-[10.5px] font-mono text-gray-400">
                  <div className="flex justify-between">
                    <span>Base de données :</span>
                    <span className="text-white">Firestore Blueprints</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Version Moteur :</span>
                    <span className="text-white">v2.1.0-prod</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Région d'Infrastruct :</span>
                    <span className="text-white">europe-west2</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ==================== CONFIG MODELS MODAL ==================== */}
      {showConfigModels && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl max-w-sm w-full border border-gray-100 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-gray-900">Configuration Sauvegardée</h3>
            <p className="text-xs text-gray-500 mt-2">
              Le moteur AutoFlow RH est synchronisé sur l'IA <strong>{aiEngine === "gemini" ? "Gemini 3.5 Flash" : "GPT-4"}</strong>. Vos quotas de requêtes ont été mis à jour automatiquement.
            </p>
            <button
              onClick={() => setShowConfigModels(false)}
              className="mt-6 w-full py-2 bg-brand-dark text-white rounded-xl text-xs font-semibold cursor-pointer hover:bg-[#04281f] transition-all"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* ==================== INVITE MODAL ==================== */}
      {isInviteOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full border border-gray-100 shadow-2xl p-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-lg text-gray-900">Inviter un Collaborateur Administrateur</h3>
              <button onClick={() => setIsInviteOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm font-semibold cursor-pointer">✕</button>
            </div>
            
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Nom complet</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Jean Dupont"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">E-mail professionnel</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="j.dupont@autoflow.io"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Rôle initial</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="hr_admin">Admin RH</option>
                    <option value="chef_service">Chef Service</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="employee">Employé</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Département</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="Direction">Direction</option>
                    <option value="Ressources Humaines">Ressources Humaines</option>
                    <option value="Ingénierie">Ingénierie</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-dark text-white rounded-xl text-xs font-semibold hover:bg-[#04281f] cursor-pointer"
                >
                  Envoyer l'Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
