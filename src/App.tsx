import React, { useState, useEffect, useRef } from "react";
import { Employee, Task, LeaveRequest, Attendance, SystemAlert, AIDecisionLog, UserRole } from "./types";
import Sidebar from "./components/Sidebar";
import toast, { Toaster } from "react-hot-toast";
import LoginView from "./components/LoginView";
import Logo from "./components/Logo";
import SuperAdminView from "./components/SuperAdminView";
import AdminRHView from "./components/AdminRHView";
import ChefServiceView from "./components/ChefServiceView";
import EmployeeView from "./components/EmployeeView";
import BorneQRView from "./components/BorneQRView";
import MyProfileView from "./components/MyProfileView";
import AIAssistantDrawer from "./components/AIAssistantDrawer";
import { Sparkles, User, RefreshCw, AlertTriangle, Play, Menu, X } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [state, setState] = useState<{
    employees: Employee[];
    tasks: Task[];
    leaves: LeaveRequest[];
    attendances: Attendance[];
    alerts: SystemAlert[];
    decisionLogs: AIDecisionLog[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [loadingLeaveId, setLoadingLeaveId] = useState<string | null>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(false);
  const [reassignmentLogs, setReassignmentLogs] = useState<string[]>([]);
  const [demoBannerOpen, setDemoBannerOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Pour le suivi des modifications en temps réel (notifications instantanées)
  const prevTasksRef = useRef<Task[]>([]);
  const prevLeavesRef = useRef<LeaveRequest[]>([]);

  // Fetch full state from backend on startup
  const fetchState = async () => {
    try {
      const res = await fetch("/api/state");
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (err) {
      console.error("Error fetching state:", err);
    } finally {
      setLoading(false);
    }
  };

  // Récupération initiale et restauration de session
  useEffect(() => {
    fetchState();
    
    // Restaurer la session utilisateur depuis la session du navigateur si présente
    const savedUserSession = sessionStorage.getItem("autoflow_session_user");
    if (savedUserSession) {
      try {
        const user = JSON.parse(savedUserSession);
        setCurrentUser(user);
        setActiveTab("dashboard");
      } catch (err) {
        console.error("Erreur lors de la lecture de la session utilisateur:", err);
      }
    }
  }, []);

  // Rafraîchissement automatique toutes les 6 secondes pour un effet temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      fetchState();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Comparateur de changement d'état pour les notifications Toasts intelligentes
  useEffect(() => {
    if (!state || !currentUser) {
      if (state) {
        prevTasksRef.current = state.tasks;
        prevLeavesRef.current = state.leaves;
      }
      return;
    }

    const prevTasks = prevTasksRef.current;
    const prevLeaves = prevLeavesRef.current;

    // Déclencher les toasts uniquement s'il y avait un historique précédent
    if (prevTasks.length > 0) {
      // 1. Pour les employés : Alerte de nouvelle tâche ou changement de statut
      if (currentUser.role === "employee") {
        state.tasks.forEach((task) => {
          if (task.assignedTo === currentUser.id) {
            const prevTask = prevTasks.find((t) => t.id === task.id);
            if (!prevTask) {
              toast.success(`📋 Nouvelle tâche assignée : "${task.title}"`, {
                duration: 6000,
                style: {
                  border: "1px solid #059669",
                  padding: "16px",
                  color: "#065f46",
                  background: "#ecfdf5",
                },
              });
            } else if (prevTask.status !== task.status) {
              toast.success(`🔄 Statut de tâche mis à jour : "${task.title}" est maintenant "${task.status}"`, {
                icon: "🔔",
                duration: 5000,
              });
            }
          }
        });
      }

      // 2. Pour les employés : Suivi du statut des congés
      if (currentUser.role === "employee") {
        state.leaves.forEach((leave) => {
          if (leave.employeeId === currentUser.id) {
            const prevLeave = prevLeaves.find((l) => l.id === leave.id);
            if (prevLeave && prevLeave.status !== leave.status) {
              if (leave.status === "Approuvé") {
                toast.success(`🎉 Bonne nouvelle ! Votre demande de congé (${leave.type}) a été APPROUVÉE !`, {
                  duration: 8000,
                  style: {
                    background: "#f0fdf4",
                    color: "#166534",
                    border: "1px solid #bbf7d0",
                    padding: "16px",
                    fontWeight: "bold",
                  }
                });
              } else if (leave.status === "Refusé") {
                toast.error(`❌ Votre demande de congé (${leave.type}) a été refusée.`, {
                  duration: 8000,
                  style: {
                    background: "#fef2f2",
                    color: "#991b1b",
                    border: "1px solid #fecaca",
                    padding: "16px",
                  }
                });
              }
            }
          }
        });
      }

      // 3. Pour les Chefs de Service : Notification si un employé met à jour une tâche ou commente
      if (currentUser.role === "chef_service") {
        state.tasks.forEach((task) => {
          const prevTask = prevTasks.find((t) => t.id === task.id);
          if (prevTask) {
            if (prevTask.status !== task.status) {
              toast(`🔄 Statut mis à jour par l'employé : "${task.title}" est passé à "${task.status}"`, {
                icon: "📋",
                duration: 6000,
              });
            }
            if (task.comments.length > prevTask.comments.length) {
              const latestComment = task.comments[task.comments.length - 1];
              if (latestComment.user !== currentUser.name) {
                toast(`💬 Nouveau commentaire de ${latestComment.user} sur "${task.title}"`, {
                  icon: "💬",
                  duration: 5000,
                });
              }
            }
          }
        });
      }

      // 4. Pour les administrateurs RH : Alerte de nouvelle demande de congé soumise
      if (currentUser.role === "hr_admin") {
        state.leaves.forEach((leave) => {
          const prevLeave = prevLeaves.find((l) => l.id === leave.id);
          if (!prevLeave) {
            toast.success(`📅 Nouvelle demande de congé soumise par ${leave.employeeName} (${leave.type})`, {
              duration: 7000,
              icon: "✉️",
            });
          }
        });
      }
    }

    // Synchronisation
    prevTasksRef.current = state.tasks;
    prevLeavesRef.current = state.leaves;
  }, [state, currentUser]);

  // Synchronize current user with updated list from backend
  useEffect(() => {
    if (currentUser && state) {
      const freshUser = state.employees.find(e => e.id === currentUser.id);
      if (freshUser && JSON.stringify(freshUser) !== JSON.stringify(currentUser)) {
        setCurrentUser(freshUser);
        // Mettre à jour également la session enregistrée
        sessionStorage.setItem("autoflow_session_user", JSON.stringify(freshUser));
      }
    }
  }, [state, currentUser]);

  const handleLogin = (user: Employee) => {
    // Sauvegarder les informations de l'utilisateur connecté dans la session du navigateur
    sessionStorage.setItem("autoflow_session_user", JSON.stringify(user));
    setCurrentUser(user);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    // Supprimer la session lors de la déconnexion
    sessionStorage.removeItem("autoflow_session_user");
    setCurrentUser(null);
  };

  // Create task with optional AI auto-assign
  const handleCreateTask = async (taskData: {
    title: string;
    description: string;
    priority: string;
    requiredSkills: string[];
    autoAssign: boolean;
    department: string;
  }) => {
    setLoadingAssignment(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData)
      });
      if (res.ok) {
        await fetchState();
        if (taskData.autoAssign) {
          toast.success("🤖 Tâche planifiée : l'IA d'AutoFlow a analysé les charges et alloué l'employé optimal !", { duration: 6000 });
        } else {
          toast.success("📋 Nouvelle tâche créée et planifiée avec succès !");
        }
      } else {
        toast.error("Erreur lors de la création de la tâche.");
      }
    } catch (err) {
      console.error("Error creating task:", err);
      toast.error("Impossible de créer la tâche.");
    } finally {
      setLoadingAssignment(false);
    }
  };

  // Update task status
  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      const res = await fetch("/api/tasks/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status })
      });
      if (res.ok) {
        await fetchState();
        toast.success(`Statut de la tâche mis à jour : "${status}"`);
      } else {
        toast.error("Erreur de mise à jour du statut.");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Erreur de communication avec le serveur.");
    }
  };

  // Add comment to task
  const handleAddComment = async (taskId: string, commentText: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/tasks/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          user: currentUser.name,
          text: commentText
        })
      });
      if (res.ok) {
        await fetchState();
        toast.success("Commentaire ajouté !");
      } else {
        toast.error("Erreur de publication du commentaire.");
      }
    } catch (err) {
      console.error("Error commenting on task:", err);
      toast.error("Erreur réseau.");
    }
  };

  // Approve leave with automatic task reassignment if urgent/sickness
  const handleApproveLeave = async (leaveId: string) => {
    setLoadingLeaveId(leaveId);
    try {
      const res = await fetch("/api/leaves/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveId, action: "approve" })
      });
      if (res.ok) {
        await fetchState();
        toast.success("Demande de congé approuvée avec succès !");
      } else {
        toast.error("Erreur lors de l'approbation du congé.");
      }
    } catch (err) {
      console.error("Error approving leave:", err);
      toast.error("Une erreur s'est produite.");
    } finally {
      setLoadingLeaveId(null);
    }
  };

  // Refuse leave request
  const handleRefuseLeave = async (leaveId: string) => {
    setLoadingLeaveId(leaveId);
    try {
      const res = await fetch("/api/leaves/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveId, action: "refuse" })
      });
      if (res.ok) {
        await fetchState();
        toast.error("La demande de congé a été refusée.");
      } else {
        toast.error("Erreur lors du refus de la demande de congé.");
      }
    } catch (err) {
      console.error("Error refusing leave:", err);
      toast.error("Une erreur s'est produite.");
    } finally {
      setLoadingLeaveId(null);
    }
  };

  // Trigger task re-assignment d'urgence
  const handleTriggerReassignment = async (empId: string) => {
    try {
      const res = await fetch("/api/tasks/auto-reassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: empId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reassignments && data.reassignments.length > 0) {
          const logs = data.reassignments.map((r: any) => 
            `Réaffectation de "${r.taskTitle}" de ${r.fromEmployeeName} à ${r.toEmployeeName} (${r.reason})`
          );
          setReassignmentLogs(logs);
          toast.success(`🤖 Réaffectation automatique effectuée ! ${data.reassignments.length} tâche(s) réallouée(s) d'urgence par l'IA.`, { duration: 6000 });
        } else {
          setReassignmentLogs(["Aucune tâche active nécessitant une réaffectation n'a été détectée."]);
          toast("Aucune tâche active nécessitant une réaffectation d'urgence n'a été détectée.", { icon: "ℹ️" });
        }
        await fetchState();
      }
    } catch (err) {
      console.error("Error during auto-reassign:", err);
      toast.error("Erreur lors de la réaffectation d'urgence.");
    }
  };

  // Toggle Employee sickness / absence (triggers immediate AI task transfer!)
  const handleToggleEmployeeAbsence = async (empId: string, currentAvailability: string) => {
    const newAvailability = currentAvailability === "absent" ? "available" : "absent";
    try {
      // Step 1: Update availability status on server
      const res = await fetch("/api/employees/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: empId, availability: newAvailability })
      });
      
      if (res.ok) {
        // Step 2: If setting to absent, trigger automatic reassignment!
        if (newAvailability === "absent") {
          toast("L'employé est maintenant marqué ABSENT. Réaffectation intelligente des tâches en cours...", { icon: "ℹ️" });
          await handleTriggerReassignment(empId);
        } else {
          toast.success("L'employé est de nouveau disponible.");
          setReassignmentLogs([]);
          await fetchState();
        }
      }
    } catch (err) {
      console.error("Error toggling absence:", err);
      toast.error("Erreur de modification du statut de l'employé.");
    }
  };

  // Employee Punch (In/Out)
  const handlePunch = async (type: "check_in" | "check_out") => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/attendance/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: currentUser.id, type })
      });
      if (res.ok) {
        await fetchState();
        if (type === "check_in") {
          toast.success("☀️ Prise de service enregistrée ! Passez une excellente journée.", { icon: "👋" });
        } else {
          toast.success("🌙 Fin de service enregistrée ! Bonne soirée.", { icon: "🚗" });
        }
      } else {
        toast.error("Impossible de valider votre pointage.");
      }
    } catch (err) {
      console.error("Error punching attendance:", err);
      toast.error("Erreur réseau lors du pointage.");
    }
  };

  // Submit leave request from employee view
  const handleSubmitLeave = async (leaveData: {
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: currentUser.id,
          ...leaveData
        })
      });
      if (res.ok) {
        await fetchState();
        toast.success("📅 Votre demande de congé a été soumise avec succès au service RH !");
      } else {
        toast.error("Erreur lors de la soumission de la demande.");
      }
    } catch (err) {
      console.error("Error submitting leave:", err);
      toast.error("Erreur réseau de soumission.");
    }
  };

  // Send message to AI assistant
  const handleSendMessage = async (text: string): Promise<string> => {
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
      if (res.ok) {
        const data = await res.json();
        return data.response;
      }
      return "Une erreur serveur s'est produite lors de la génération de la réponse.";
    } catch (err) {
      console.error("Error sending chat message:", err);
      return "Impossible de contacter l'assistant d'AutoFlow RH.";
    }
  };

  // Admin user creator helper
  const handleInviteAdmin = async (newAdmin: { name: string; email: string; role: UserRole; department: string }) => {
    try {
      const res = await fetch("/api/employees/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: "EMP" + Math.floor(100 + Math.random() * 900),
          ...newAdmin,
          availability: "available",
          performanceScore: 85,
          workload: 0,
          skills: ["Gestion", "RH", "Leadership"],
          avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
        })
      });
      if (res.ok) {
        await fetchState();
        toast.success(`Compte Administrateur créé pour ${newAdmin.name} (${newAdmin.role}) !`);
      } else {
        toast.error("Erreur lors de la création du compte.");
      }
    } catch (err) {
      console.error("Error creating user:", err);
      toast.error("Une erreur s'est produite lors de la création.");
    }
  };

  // Update direct role of user
  const handleUpdateRole = async (empId: string, newRole: UserRole) => {
    try {
      const res = await fetch("/api/employees/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: empId, role: newRole })
      });
      if (res.ok) {
        await fetchState();
        toast.success("Rôle utilisateur mis à jour avec succès !");
        // If updating the logged in user, refresh local user
        if (currentUser && currentUser.id === empId) {
          const updatedUser = state?.employees.find(e => e.id === empId);
          if (updatedUser) setCurrentUser({ ...updatedUser, role: newRole });
        }
      } else {
        toast.error("Erreur de mise à jour du rôle.");
      }
    } catch (err) {
      console.error("Error updating role:", err);
      toast.error("Erreur serveur lors de la mise à jour.");
    }
  };

  if (loading || !state) {
    return (
      <div className="min-h-screen bg-radial from-brand-medium via-[#010c0a] to-[#000504] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-6">
          <div className="animate-pulse">
            <Logo variant="dark" className="h-16" />
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-brand-neon animate-spin" />
            <p className="text-xs text-brand-neon font-bold font-mono tracking-widest uppercase">Démarrage du moteur intelligent...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-radial from-brand-medium via-[#010c0a] to-[#000504] text-gray-900 flex flex-col relative overflow-y-auto font-sans">
        {/* 5-Role Demo Control Room Selector Capsule (Phenomenal Evaluator UX!) */}
        {demoBannerOpen && (
          <div className="bg-brand-dark text-white border-b border-brand-primary/20 px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 relative z-30 shadow-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-neon animate-pulse" />
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-brand-neon">Console de Démo Multi-Rôles</span>
              <span className="text-[9px] bg-brand-primary/60 border border-brand-neon/20 text-white font-semibold px-2 py-0.5 rounded">AUTOFLOW CONNECT</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {state.employees.map((emp) => {
                let label = "";
                if (emp.role === "super_admin") label = "Super Admin";
                if (emp.role === "hr_admin") label = "Admin RH";
                if (emp.role === "chef_service") label = "Chef Service";
                if (emp.role === "employee") label = emp.id === "EMP007" ? "Lucas" : "Sarah";

                return (
                  <button
                    key={emp.id}
                    onClick={() => handleLogin(emp)}
                    className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wide transition-all border border-brand-primary/40 cursor-pointer bg-[#011410] hover:bg-brand-primary/40 text-gray-300 hover:text-white"
                  >
                    {label} ({emp.name.split(" ")[0]})
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setDemoBannerOpen(false)}
              className="text-gray-400 hover:text-white text-xs font-bold hover:scale-105 transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <LoginView onLoginSuccess={handleLogin} employeesList={state.employees} />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#f8faf9] text-gray-900 flex flex-col relative overflow-hidden font-sans">
      
      {/* 5-Role Demo Control Room Selector Capsule (Phenomenal Evaluator UX!) */}
      {demoBannerOpen && (
        <div className="bg-brand-dark text-white border-b border-brand-primary/20 px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 relative z-30 shadow-md shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-neon animate-pulse" />
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-brand-neon">Console de Démo Multi-Rôles</span>
            <span className="text-[9px] bg-brand-primary/60 border border-brand-neon/20 text-white font-semibold px-2 py-0.5 rounded">AUTOFLOW CONNECT</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {state.employees.map((emp) => {
              let label = "";
              if (emp.role === "super_admin") label = "Super Admin";
              if (emp.role === "hr_admin") label = "Admin RH";
              if (emp.role === "chef_service") label = "Chef Service";
              if (emp.role === "employee") label = emp.id === "EMP007" ? "Lucas" : "Sarah";

              const isCurrent = currentUser?.id === emp.id;
              return (
                <button
                  key={emp.id}
                  onClick={() => handleLogin(emp)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide transition-all border cursor-pointer ${
                    isCurrent
                      ? "bg-brand-neon text-brand-dark border-brand-neon shadow-sm"
                      : "bg-[#011410] border-brand-primary/40 hover:bg-brand-primary/40 text-gray-300 hover:text-white"
                  }`}
                >
                  {label} ({emp.name.split(" ")[0]})
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setDemoBannerOpen(false)}
            className="text-gray-400 hover:text-white text-xs font-bold hover:scale-105 transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Mobile Top Header Bar */}
      <div className="md:hidden bg-brand-dark text-white px-4 py-3 flex items-center justify-between border-b border-brand-primary/20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-brand-medium/50 text-gray-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <Logo variant="dark" className="h-7" showTagline={false} />
        </div>

        <div 
          onClick={() => setActiveTab("profil")}
          title="Consulter mon profil"
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className={`w-8 h-8 rounded-full object-cover border ${activeTab === "profil" ? "border-brand-neon" : "border-brand-primary/30"}`}
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Main Content Area with proper flex containment and overflow safety */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Mobile Backdrop Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-brand-dark/80 backdrop-blur-xs z-35 md:hidden transition-opacity duration-300"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar container with slide-in animation on mobile */}
        <div className={`
          fixed inset-y-0 left-0 z-40 transform ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:relative md:transform-none md:translate-x-0 transition-transform duration-300 ease-in-out
          h-full shrink-0
        `}>
          {/* Close button inside sidebar on mobile */}
          <div className="absolute top-4 right-4 md:hidden z-50">
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1.5 bg-brand-medium/40 hover:bg-brand-medium/70 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <Sidebar
            currentUser={currentUser}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLogout={handleLogout}
            onItemClick={() => setIsMobileSidebarOpen(false)}
          />
        </div>

        {/* Active View viewport based on logged in role */}
        {activeTab === "borne_qr" ? (
          <BorneQRView
            employees={state.employees}
            attendances={state.attendances}
            onRefreshState={fetchState}
          />
        ) : activeTab === "profil" ? (
          <MyProfileView
            currentUser={currentUser}
            employees={state.employees}
            tasks={state.tasks}
            leaves={state.leaves}
            attendances={state.attendances}
            onRefreshState={fetchState}
            setActiveTab={setActiveTab}
          />
        ) : (
          <>
            {currentUser.role === "super_admin" && (
              <SuperAdminView
                employees={state.employees}
                alerts={state.alerts}
                onInviteAdmin={handleInviteAdmin}
                onUpdateRole={handleUpdateRole}
                activeTab={activeTab}
              />
            )}

            {currentUser.role === "hr_admin" && (
              <AdminRHView
                leaves={state.leaves}
                employees={state.employees}
                attendances={state.attendances}
                onApproveLeave={handleApproveLeave}
                onRefuseLeave={handleRefuseLeave}
                onTriggerReassignment={handleTriggerReassignment}
                loadingLeaveId={loadingLeaveId}
                reassignmentLogs={reassignmentLogs}
                activeTab={activeTab}
                onRefreshState={fetchState}
              />
            )}

            {currentUser.role === "chef_service" && (
              <ChefServiceView
                tasks={state.tasks}
                employees={state.employees}
                decisionLogs={state.decisionLogs}
                onCreateTask={handleCreateTask}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onAddComment={handleAddComment}
                onToggleEmployeeAbsence={handleToggleEmployeeAbsence}
                loadingAssignment={loadingAssignment}
                activeTab={activeTab}
              />
            )}

            {currentUser.role === "employee" && (
              <EmployeeView
                currentUser={currentUser}
                tasks={state.tasks}
                leaves={state.leaves}
                attendances={state.attendances}
                employees={state.employees}
                onPunch={handlePunch}
                onSubmitLeave={handleSubmitLeave}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                loadingLeaveSubmit={loadingLeaveId !== null}
                onRefreshState={fetchState}
                activeTab={activeTab}
              />
            )}
          </>
        )}

        {/* Floating AI Assistant sliding Drawer */}
        <AIAssistantDrawer onSendMessage={handleSendMessage} />
      </div>

      {/* Système de notifications toasts */}
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}
