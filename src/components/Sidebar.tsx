import React from "react";
import { LayoutDashboard, BarChart3, Users, FileText, HelpCircle, HardDrive, Settings, QrCode } from "lucide-react";
import { Employee } from "../types";
import Logo from "./Logo";

interface SidebarProps {
  currentUser: Employee;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onItemClick?: () => void;
}

export default function Sidebar({ currentUser, activeTab, setActiveTab, onLogout, onItemClick }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    ...(currentUser.role === "super_admin" ? [{ id: "borne_qr", label: "Borne QR d'Accueil (Aperçu)", icon: QrCode }] : []),
    { id: "analyses", label: "Analyses", icon: BarChart3 },
    { id: "structure", label: "Structure", icon: Users },
    { id: "rapports", label: "Rapports", icon: FileText },
    { id: "support", label: "Support", icon: HelpCircle },
    { id: "settings", label: "Paramètres", icon: Settings }
  ];

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "super_admin": return "SUPER ADMIN";
      case "hr_admin": return "ADMIN RH";
      case "chef_service": return "CHEF DE SERVICE";
      case "employee": return "EMPLOYÉ";
      default: return "UTILISATEUR";
    }
  };

  return (
    <div className="w-64 bg-brand-dark flex flex-col h-full text-white border-r border-brand-primary/20 shrink-0 select-none">
      {/* Brand Logo - Fixed */}
      <div className="p-6 shrink-0">
        <Logo variant="dark" className="h-9" />
      </div>

      {/* Scrollable Container for Navigation Menu and Node Metrics */}
      <div className="flex-1 overflow-y-auto min-h-0 py-2 space-y-6 scrollbar-thin scrollbar-thumb-brand-primary/20 scrollbar-track-transparent">
        {/* Navigation Menu */}
        <nav className="px-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (onItemClick) onItemClick();
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative group ${
                  isActive
                    ? "bg-brand-medium text-white shadow-md shadow-brand-dark/50"
                    : "text-gray-400 hover:text-white hover:bg-brand-medium/30"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-brand-neon rounded-r-md" />
                )}
                <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-105 ${isActive ? "text-brand-neon" : "text-gray-400 group-hover:text-gray-200"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Node Metrics Panel */}
        <div className="p-4 mx-4 rounded-xl bg-brand-medium/40 border border-brand-primary/10 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-brand-neon" />
              NŒUDS ACTIFS
            </span>
            <span className="font-bold text-white">75%</span>
          </div>
          <div className="w-full h-1.5 bg-brand-dark rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-primary to-brand-neon rounded-full" style={{ width: "75%" }} />
          </div>
        </div>
      </div>

      {/* User Info Profile Footer - Fixed at bottom */}
      <div className={`p-4 border-t border-brand-primary/20 flex items-center justify-between shrink-0 transition-colors ${activeTab === "profil" ? "bg-brand-medium/40 border-l-4 border-l-brand-neon" : "bg-brand-dark"}`}>
        <div 
          onClick={() => {
            setActiveTab("profil");
            onItemClick?.();
          }}
          title="Consulter mon profil"
          className="flex items-center gap-3 overflow-hidden cursor-pointer hover:opacity-85 transition-opacity flex-1 mr-2"
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className={`w-10 h-10 rounded-full object-cover shrink-0 border ${activeTab === "profil" ? "border-brand-neon" : "border-brand-primary/30"}`}
            referrerPolicy="no-referrer"
          />
          <div className="overflow-hidden">
            <h4 className={`text-xs font-semibold truncate leading-tight ${activeTab === "profil" ? "text-brand-neon font-bold" : "text-white"}`}>{currentUser.name}</h4>
            <p className="text-[9px] font-bold text-brand-neon tracking-wider font-mono uppercase mt-0.5">{getRoleLabel(currentUser.role)}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          title="Se déconnecter"
          className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-brand-medium/50 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
        </button>
      </div>
    </div>
  );
}
