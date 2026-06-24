import React, { useState, useRef } from "react";
import {
  User, Mail, Phone, Lock, Cpu, CheckCircle, Shield,
  Activity, Users, ClipboardList, Briefcase, Calendar,
  Award, RefreshCw, ChevronRight, Zap, Camera
} from "lucide-react";
import toast from "react-hot-toast";
import { Employee, Task, LeaveRequest, Attendance } from "../types";

interface MyProfileViewProps {
  currentUser: Employee;
  employees: Employee[];
  tasks: Task[];
  leaves: LeaveRequest[];
  attendances: Attendance[];
  onRefreshState: () => void;
  setActiveTab: (tab: string) => void;
}

export default function MyProfileView({
  currentUser,
  employees,
  tasks,
  leaves,
  attendances,
  onRefreshState,
  setActiveTab
}: MyProfileViewProps) {
  // Common personal details states
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(currentUser.phone || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // Avatar upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner un fichier image valide (JPG, PNG, GIF, etc.).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image est trop lourde. La taille maximale est de 5 Mo.");
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("avatar", file);
    formData.append("employeeId", currentUser.id);

    try {
      const res = await fetch("/api/profile/upload-avatar", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        toast.success("📸 Photo de profil mise à jour et synchronisée avec succès !");
        onRefreshState(); // reload state across the app
      } else {
        const data = await res.json();
        toast.error(data.error || "Une erreur est survenue lors de l'enregistrement de l'image.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur réseau : impossible d'atteindre le serveur de stockage.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Super Admin AI testing states
  const [aiTesting, setAiTesting] = useState(false);
  const [aiStatus, setAiStatus] = useState<"idle" | "success" | "error">("idle");
  const [aiDetails, setAiDetails] = useState("");

  // Employee Skills states
  const [newSkill, setNewSkill] = useState("");
  const [skillsSaving, setSkillsSaving] = useState(false);

  // Common identity display
  const matricule = `AF-${currentUser.id}`;
  const companyEmail = currentUser.email;

  // Handle personal info form submit
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: currentUser.id,
          phone,
          password: password || undefined
        })
      });

      if (res.ok) {
        toast.success("✨ Vos informations de profil ont été mises à jour en temps réel !");
        setIsEditing(false);
        setPassword("");
        setConfirmPassword("");
        onRefreshState(); // reload state from backend
      } else {
        const data = await res.json();
        toast.error(data.error || "Une erreur est survenue.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Impossible de se connecter au serveur.");
    } finally {
      setSaving(false);
    }
  };

  // Handle testing AI engine
  const handleTestAiConnection = async () => {
    setAiTesting(true);
    setAiStatus("idle");
    try {
      const res = await fetch("/api/profile/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        setAiStatus(data.operational ? "success" : "error");
        setAiDetails(data.details);
        toast.success("Moteur IA testé avec succès.");
      } else {
        setAiStatus("error");
        setAiDetails("Erreur de réponse du serveur d'analyse.");
        toast.error("Échec du test de liaison.");
      }
    } catch (err) {
      console.error(err);
      setAiStatus("error");
      setAiDetails("Le service d'orchestration IA ne répond pas.");
      toast.error("Erreur de liaison réseau.");
    } finally {
      setAiTesting(false);
    }
  };

  // Handle adding a skill (Employee only)
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;

    if (currentUser.skills.includes(newSkill.trim())) {
      toast.error("Cette compétence est déjà déclarée.");
      return;
    }

    setSkillsSaving(true);
    const updatedSkills = [...currentUser.skills, newSkill.trim()];
    try {
      const res = await fetch("/api/profile/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: currentUser.id,
          skills: updatedSkills
        })
      });

      if (res.ok) {
        toast.success(`💪 Compétence '${newSkill.trim()}' déclarée avec succès au moteur d'affectation IA !`);
        setNewSkill("");
        onRefreshState();
      } else {
        toast.error("Impossible d'ajouter la compétence.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur réseau lors de l'ajout.");
    } finally {
      setSkillsSaving(false);
    }
  };

  // Handle removing a skill (Employee only)
  const handleRemoveSkill = async (skillToRemove: string) => {
    setSkillsSaving(true);
    const updatedSkills = currentUser.skills.filter(s => s !== skillToRemove);
    try {
      const res = await fetch("/api/profile/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: currentUser.id,
          skills: updatedSkills
        })
      });

      if (res.ok) {
        toast.success(`Compétence '${skillToRemove}' retirée.`);
        onRefreshState();
      } else {
        toast.error("Impossible de retirer la compétence.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur réseau.");
    } finally {
      setSkillsSaving(false);
    }
  };

  // Role specific calculations
  // 1. Employee calculations
  const empAttendances = attendances.filter(a => a.employeeId === currentUser.id);
  const totalScans = empAttendances.filter(a => a.clockIn).length;
  const onTimeScans = empAttendances.filter(a => a.clockIn && a.status === "Présent").length;
  const punctualityRate = totalScans > 0 ? Math.round((onTimeScans / totalScans) * 100) : 100;

  const approvedLeaves = leaves.filter(l => l.employeeId === currentUser.id && l.status === "Approuvé");
  const takenDays = approvedLeaves.reduce((sum, l) => sum + l.durationDays, 0);
  const totalAllowance = 25; // default yearly leave
  const remainingLeaves = Math.max(0, totalAllowance - takenDays);

  // 2. Chef calculations
  const chefDept = currentUser.department;
  const teamMembers = employees.filter(e => e.department === chefDept && e.id !== currentUser.id && e.isActive);
  const activeMembersCount = teamMembers.filter(e => e.availability === "available").length;
  const teamTasks = tasks.filter(t => t.department === chefDept && t.status !== "Terminée" && t.status !== "Annulée");
  const activeTasksCount = teamTasks.length;

  // 3. HR calculations
  const hrEmployeesCount = employees.filter(e => e.role !== "super_admin" && e.isActive).length;
  const recentContractsCount = employees.filter(e => e.isActive).length;

  // 4. Super admin calculations
  const activeUsersCount = employees.filter(e => e.isActive).length;
  const serverLoad = Math.min(95, Math.round(25 + (tasks.filter(t => t.status === "En cours").length * 8)));

  return (
    <div className="flex-1 bg-[#f8faf9] h-full p-4 md:p-8 overflow-y-auto font-sans">
      
      {/* HEADER SECTION */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">Mon Profil Personnel</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gérez vos coordonnées, vos compétences et visualisez vos indicateurs de rôle exclusifs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: IDENTITY CARD & COMMON FORM (8 columns) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Identity & Session details Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
            {/* Ambient accent header */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-primary to-brand-neon" />
            
            <div className="flex flex-col sm:flex-row items-center gap-6 mt-2">
              <div className="relative group cursor-pointer" onClick={handleAvatarClick} title="Cliquez pour changer votre photo de profil">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="relative overflow-hidden rounded-2xl border-4 border-[#eef5f3] w-24 h-24">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Hover Camera icon overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 select-none">
                    <Camera className="w-5 h-5 text-brand-neon" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-neon">Modifier</span>
                  </div>

                  {/* Uploading Spinner overlay */}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                      <RefreshCw className="w-6 h-6 animate-spin text-brand-neon" />
                    </div>
                  )}
                </div>

                <div className="absolute -bottom-1.5 -right-1.5 bg-brand-dark border-2 border-white rounded-lg p-1.5 text-brand-neon">
                  <Shield className="w-4 h-4" />
                </div>
              </div>

              <div className="text-center sm:text-left flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h2 className="text-2xl font-display font-bold text-gray-900">{currentUser.name}</h2>
                  <span className="px-2.5 py-0.5 bg-brand-dark text-brand-neon rounded-full font-mono text-[9px] font-bold tracking-wider uppercase">
                    {currentUser.role.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm text-indigo-600 font-semibold uppercase tracking-wider">{currentUser.department}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4 pt-3 text-xs text-gray-500 font-medium">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{companyEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span>Matricule: <strong className="font-mono text-gray-800">{matricule}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{phone || "Non renseigné"}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Arrivée: <strong className="text-gray-800">{currentUser.joinedDate}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-50 flex justify-end">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-brand-dark hover:bg-brand-medium text-white hover:text-brand-neon text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  Modifier mes informations
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Annuler l'édition
                </button>
              )}
            </div>
          </div>

          {/* Functional Edit Form (Visible when isEditing is true) */}
          {isEditing && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 animate-fadeIn">
              <div className="flex items-center gap-3 mb-5 border-b border-gray-50 pb-4">
                <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100/50">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-gray-900 text-sm">Formulaire de Modification de Profil</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Mettez à jour vos informations de contact et d'accès</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Numéro de téléphone
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+33 6 12 34 56 78"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Laisser vide pour ne pas changer"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Confirmer le mot de passe
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Laisser vide pour ne pas changer"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-50">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-brand-dark hover:bg-brand-medium text-white hover:text-brand-neon text-xs font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Enregistrer les modifications
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* ================ ROLE DYNAMIC BLOCKS ================== */}
          {/* ======================================================== */}

          {/* 1. SUPER_ADMIN PROFILE VIEW */}
          {currentUser.role === "super_admin" && (
            <div className="space-y-6">
              
              {/* Security & System Dashboard */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5 border-b border-gray-50 pb-4">
                  <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 border border-rose-100/50">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-gray-900 text-sm">Tableau de Bord de Sécurité & Système</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Audits en temps réel de l'infrastructure d'AutoFlow</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Utilisateurs actifs
                      </span>
                      <strong className="text-2xl font-display font-black text-gray-800">{activeUsersCount} collaborateurs</strong>
                    </div>
                    <Users className="w-8 h-8 text-rose-500/35" />
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Taux de charge du serveur
                      </span>
                      <strong className="text-2xl font-display font-black text-gray-800">{serverLoad}%</strong>
                    </div>
                    <Cpu className="w-8 h-8 text-indigo-500/35" />
                  </div>
                </div>
              </div>

              {/* API keys & AI validation engine */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5 border-b border-gray-50 pb-4">
                  <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100/50">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-gray-900 text-sm">Gestion des Clés de Modèle & Intelligences</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Test de liaison avec l'orchestrateur de décision et de réaffectation</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-emerald-50/40 border border-emerald-100/50 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full animate-pulse" />
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">Liaison de décision IA</span>
                        <span className="text-[10px] text-emerald-600 font-mono font-medium">MODÈLE: gemini-3.5-flash</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold">
                      Moteur IA Opérationnel
                    </span>
                  </div>

                  <p className="text-xs text-gray-500">
                    Cliquez sur le bouton ci-dessous pour lancer une requête de ping et d'audit fonctionnel sur l'instance de production de l'API Gemini.
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-50">
                    <button
                      type="button"
                      onClick={handleTestAiConnection}
                      disabled={aiTesting}
                      className="px-4 py-2 bg-brand-dark hover:bg-brand-medium text-white hover:text-brand-neon text-xs font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      {aiTesting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Test en cours...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Tester la connexion au Moteur IA
                        </>
                      )}
                    </button>

                    {aiStatus !== "idle" && (
                      <div className={`p-3 rounded-xl border text-xs font-medium flex-1 sm:max-w-xs ${
                        aiStatus === "success"
                          ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                          : "bg-rose-50 border-rose-100 text-rose-800"
                      }`}>
                        {aiDetails}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 2. HR_ADMIN PROFILE VIEW */}
          {currentUser.role === "hr_admin" && (
            <div className="space-y-6">
              
              {/* Personal HR Metrics */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5 border-b border-gray-50 pb-4">
                  <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100/50">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-gray-900 text-sm">Vos Indicateurs RH Personnels</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Suivi de votre volume de responsabilité opérationnelle globale</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#f0f4f8] rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Employés sous votre responsabilité
                      </span>
                      <strong className="text-2xl font-display font-black text-gray-800">{hrEmployeesCount} personnes</strong>
                    </div>
                    <Users className="w-8 h-8 text-indigo-500/25" />
                  </div>

                  <div className="bg-[#f0f4f8] rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Contrats de travail actifs
                      </span>
                      <strong className="text-2xl font-display font-black text-gray-800">{recentContractsCount} validés</strong>
                    </div>
                    <ClipboardList className="w-8 h-8 text-indigo-500/25" />
                  </div>
                </div>
              </div>

              {/* Shortcut to validation */}
              <div className="bg-brand-dark rounded-3xl p-6 text-white border border-brand-primary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Calendar className="w-24 h-24" />
                </div>
                
                <h4 className="font-display font-bold text-sm text-brand-neon mb-1.5">Action Recommandée : Validation de Congés</h4>
                <p className="text-xs text-gray-400 leading-relaxed max-w-md mb-4">
                  Vous disposez de requêtes de congés et d'absences en attente de validation légale de votre part. Lancez le planificateur de réaffectation IA.
                </p>

                <button
                  type="button"
                  onClick={() => setActiveTab("rapports")}
                  className="px-4 py-2 bg-brand-medium hover:bg-brand-primary text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  Accéder au panneau de validation
                  <ChevronRight className="w-4 h-4 text-brand-neon" />
                </button>
              </div>

            </div>
          )}

          {/* 3. CHEF_SERVICE PROFILE VIEW */}
          {currentUser.role === "chef_service" && (
            <div className="space-y-6">
              
              {/* Scope of Command */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5 border-b border-gray-50 pb-4">
                  <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 border border-blue-100/50">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-gray-900 text-sm">Périmètre Opérationnel de Commandement</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Votre secteur d'attribution et de délégation d'objectifs</p>
                  </div>
                </div>

                <div className="bg-blue-50/30 border border-blue-100/50 rounded-2xl p-4 flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600 border border-blue-100/50">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Département d'Affectation
                    </span>
                    <strong className="text-base text-gray-800">Direction Technique / R&D (Ingénierie)</strong>
                  </div>
                </div>
              </div>

              {/* Team Status Counters */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5 border-b border-gray-50 pb-4">
                  <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100/50">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-gray-900 text-sm">Statut & Disponibilité d'Équipe</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Suivi temps réel de la charge et du taux d'occupation de vos ingénieurs</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Ingénieurs actifs à l'écoute
                      </span>
                      <strong className="text-2xl font-display font-black text-gray-800">{activeMembersCount} en ligne</strong>
                    </div>
                    <CheckCircle className="w-8 h-8 text-emerald-500/35" />
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                        Tâches actives sous supervision
                      </span>
                      <strong className="text-2xl font-display font-black text-gray-800">{activeTasksCount} en cours</strong>
                    </div>
                    <ClipboardList className="w-8 h-8 text-indigo-500/35" />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 4. EMPLOYE PROFILE VIEW */}
          {currentUser.role === "employee" && (
            <div className="space-y-6">
              
              {/* Radar de Ponctualité */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5 border-b border-gray-50 pb-4">
                  <div className="p-2.5 bg-[#f0fdf4] rounded-xl text-emerald-600 border border-emerald-100/50">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-gray-900 text-sm">Radar Personnel de Ponctualité</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Calcul basé sur vos scans réels de QR codes de présence de l'accueil</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 border border-emerald-100/50 rounded-2xl p-5">
                  <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                    {/* SVG Circular Progress bar */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="#eef5f3"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="#10b981"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * punctualityRate) / 100}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-display font-black text-gray-800">{punctualityRate}%</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">A l'heure</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <strong className="text-sm text-gray-800 block">Indice de ponctualité global d'AutoFlow</strong>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Ce score reflète votre assiduité par rapport aux heures réglementaires (tolérance de {totalScans > 0 ? "15" : "0"} minutes). Continuez à scanner régulièrement pour conserver un excellent score de service !
                    </p>
                    <div className="flex items-center gap-4 text-xs font-mono text-gray-400 pt-1.5">
                      <span>Total pointages : <strong className="text-emerald-600 font-bold">{totalScans}</strong></span>
                      <span>Sans retard : <strong className="text-emerald-600 font-bold">{onTimeScans}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Matrice des Compétences Interactive */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5 border-b border-gray-50 pb-4">
                  <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100/50">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-gray-900 text-sm">Matrice des Compétences d'Affectation</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Déclarez vos technologies pour que l'orchestrateur IA d'AutoFlow vous évalue</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {currentUser.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100/50 text-xs font-semibold rounded-xl flex items-center gap-2"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          disabled={skillsSaving}
                          className="text-indigo-400 hover:text-indigo-700 font-bold text-[10px] cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>

                  <form onSubmit={handleAddSkill} className="flex gap-2 pt-4 border-t border-gray-50">
                    <input
                      type="text"
                      placeholder="Ajouter une compétence (ex: Kubernetes, PostgreSQL, Go...)"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      disabled={skillsSaving}
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                    <button
                      type="submit"
                      disabled={skillsSaving}
                      className="px-4 py-2 bg-brand-dark hover:bg-brand-medium text-white hover:text-brand-neon text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      Déclarer
                    </button>
                  </form>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* RIGHT COLUMN: ADDITIONAL STATS / RIGHT COMPACT CARDS (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Stats sidebar card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#f0f5f3] flex items-center justify-center mx-auto mb-4 border border-brand-primary/10">
              <Award className="w-8 h-8 text-brand-primary" />
            </div>
            
            <h3 className="font-display font-bold text-gray-900 text-sm">Evaluation Globale</h3>
            <p className="text-xs text-gray-500 mt-1">Score d'engagement calculé par l'algorithme intelligent d'AutoFlow</p>
            
            <div className="mt-4 text-3xl font-display font-black text-brand-dark">
              {currentUser.performanceScore}/100
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50 text-left space-y-2 text-xs text-gray-500 font-medium">
              <div className="flex justify-between">
                <span>Indicateur d'assiduité :</span>
                <span className="font-bold text-gray-800">Excellent</span>
              </div>
              <div className="flex justify-between">
                <span>Charge d'affectation :</span>
                <span className="font-bold text-gray-800">{currentUser.workload}%</span>
              </div>
            </div>
          </div>

          {/* Solde de congés (Employee only) */}
          {currentUser.role === "employee" && (
            <div className="bg-indigo-900 p-6 rounded-3xl text-white border border-indigo-700/50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider block">
                  Solde de Congés Payés (PTO)
                </span>
                <Calendar className="w-5 h-5 text-indigo-300" />
              </div>

              <div className="flex items-baseline gap-1.5 mb-2">
                <strong className="text-4xl font-display font-black text-brand-neon">{remainingLeaves}</strong>
                <span className="text-xs text-indigo-200 font-bold">jours restants</span>
              </div>

              <p className="text-[11px] text-indigo-200 leading-relaxed pt-2 border-t border-indigo-800">
                Basé sur un quota légal de {totalAllowance} jours par an, diminué de vos demandes acceptées ({takenDays} jours pris).
              </p>

              <button
                type="button"
                onClick={() => setActiveTab("rapports")}
                className="w-full mt-4 py-2 bg-indigo-800 hover:bg-indigo-700 text-white hover:text-brand-neon rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                Planifier des congés
              </button>
            </div>
          )}

          {/* Connected Hub information */}
          <div className="bg-brand-dark p-6 rounded-3xl text-white border border-brand-primary/20">
            <h4 className="font-display font-bold text-sm text-brand-neon mb-2">Centre de Synchronisation</h4>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Vos informations sont instantanément partagées et auditées par l'agent IA d'évaluation pour aligner la charge de travail et la ponctualité de l'équipe.
            </p>
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
              <span className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse" />
              <span>Base synchronisée en temps réel</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
