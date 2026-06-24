import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Globe, Building2, ShieldAlert } from "lucide-react";
import { Employee } from "../types";
import Logo from "./Logo";

interface LoginViewProps {
  onLoginSuccess: (user: Employee) => void;
  employeesList: Employee[];
}

export default function LoginView({ onLoginSuccess, employeesList }: LoginViewProps) {
  const [email, setEmail] = useState("alex.w@autoflow.ci");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: email.trim(), password: password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Une erreur est survenue lors de la connexion.");
        setLoading(false);
      } else {
        const userRole = data.user.mappedRole; // 'SUPER_ADMIN' | 'RH' | 'CHEF_SERVICE' | 'EMPLOYE'
        let targetWorkspace = "";
        if (userRole === "SUPER_ADMIN") targetWorkspace = "l'espace Super Administrateur";
        if (userRole === "RH") targetWorkspace = "l'espace Ressources Humaines";
        if (userRole === "CHEF_SERVICE") targetWorkspace = "l'espace Chef de Service";
        if (userRole === "EMPLOYE") targetWorkspace = "l'espace Profil Employé";

        setSuccessMessage(`Connexion réussie ! Redirection immédiate vers ${targetWorkspace}...`);
        
        // Simuler un léger délai de chargement pour un effet visuel d'aiguillage impeccable
        setTimeout(() => {
          onLoginSuccess(data.user);
          setLoading(false);
        }, 1200);
      }
    } catch (err) {
      console.error("Login request failed:", err);
      setError("Impossible de joindre le serveur. Veuillez vérifier votre connexion.");
      setLoading(false);
    }
  };

  const handleQuickLogin = async (emp: Employee) => {
    setEmail(emp.email);
    setPassword("password123");
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: emp.email, password: "password123" })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const userRole = data.user.mappedRole;
        let targetWorkspace = "";
        if (userRole === "SUPER_ADMIN") targetWorkspace = "l'espace Super Administrateur";
        if (userRole === "RH") targetWorkspace = "l'espace Ressources Humaines";
        if (userRole === "CHEF_SERVICE") targetWorkspace = "l'espace Chef de Service";
        if (userRole === "EMPLOYE") targetWorkspace = "l'espace Profil Employé";

        setSuccessMessage(`Accès de Démo autorisé ! Redirection automatique vers ${targetWorkspace}...`);
        
        setTimeout(() => {
          onLoginSuccess(data.user);
          setLoading(false);
        }, 1200);
      } else {
        setError(data.error || "Une erreur est survenue lors de la connexion rapide.");
        setLoading(false);
      }
    } catch (err) {
      setError("Erreur serveur lors de la connexion rapide.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-radial from-brand-medium via-[#010c0a] to-[#000504] flex items-center justify-center p-4 md:p-8 font-sans overflow-y-auto">
      {/* Light glow effects */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-brand-neon/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center relative z-10 py-10">
        
        {/* Left Side: Brand Marketing & Pitch */}
        <div className="lg:col-span-6 space-y-10 text-white text-center lg:text-left px-4">
          <div className="flex items-center justify-center lg:justify-start">
            <Logo variant="dark" className="h-11" />
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-white leading-tight">
              Smart HR <br />
              <span className="bg-gradient-to-r from-brand-neon via-emerald-400 to-white bg-clip-text text-transparent">
                Intelligence
              </span> <br />
              for Modern Teams
            </h1>
            <p className="text-gray-300 text-base md:text-lg max-w-md mx-auto lg:mx-0 leading-relaxed">
              Seamlessly manage talent, performance, and workplace culture with our AI-driven management platform.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-4 max-w-sm mx-auto lg:mx-0 border-t border-brand-primary/20">
            <div>
              <p className="text-3xl md:text-4xl font-display font-bold text-white">2.4k+</p>
              <p className="text-xs text-gray-400 font-medium uppercase mt-1">Utilisateurs actifs</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-display font-bold text-brand-neon">98%</p>
              <p className="text-xs text-gray-400 font-medium uppercase mt-1">Taux d'efficacité</p>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form Box & Test Accounts */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Main Login Card */}
          <div className="glass-panel p-8 md:p-10 rounded-3xl shadow-2xl shadow-black/60 relative overflow-hidden max-w-lg mx-auto border border-white/20">
            <div className="space-y-2 mb-8 text-center">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900">Welcome Back</h2>
              <p className="text-sm text-gray-500">Please enter your credentials to access the dashboard</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50/80 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 backdrop-blur-sm">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 backdrop-blur-sm">
                <Globe className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 animate-spin" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">Professional Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <span className="text-sm">@</span>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.w@autoflow.ci"
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/70 focus:bg-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all duration-200 text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-60"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">Secure Password</label>
                  <a href="#forgot" className="text-xs font-semibold text-brand-primary hover:text-brand-light transition-colors">Forgot?</a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    disabled={loading}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-white/70 focus:bg-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all duration-200 text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-60"
                    required
                  />
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                  >
                     {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Checkbox */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary/30 disabled:opacity-50"
                />
                <label htmlFor="remember" className="text-xs font-medium text-gray-600 select-none">
                  Remember this session
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-brand-dark hover:bg-[#04281f] text-white font-display font-medium tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-brand-dark/20 hover:shadow-brand-dark/30 transition-all duration-300 cursor-pointer mt-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Vérification & Redirection...</span>
                  </>
                ) : (
                  <>
                    <span>Sign Into Dashboard</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* SSO Section */}
            <div className="my-6 flex items-center justify-center gap-3">
              <div className="h-px bg-gray-200 flex-1" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/10 px-2">SSO Integrated</span>
              <div className="h-px bg-gray-200 flex-1" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 bg-white/50 hover:bg-white text-xs font-medium text-gray-700 transition-colors">
                <span className="text-base">🌈</span>
                <span>Google</span>
              </button>
              <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 bg-white/50 hover:bg-white text-xs font-medium text-gray-700 transition-colors">
                <Building2 className="w-3.5 h-3.5 text-gray-500" />
                <span>Enterprise</span>
              </button>
            </div>

            <div className="text-center mt-6">
              <p className="text-xs text-gray-500">
                New to the platform? <a href="#request" className="font-semibold text-brand-primary hover:text-brand-light transition-colors">Request access</a>
              </p>
            </div>
          </div>

          {/* Quick Login Tray (AMAZING UX feature!) */}
          <div className="glass-panel-dark p-6 rounded-2xl max-w-lg mx-auto border border-brand-primary/20 space-y-3">
            <div className="flex items-center gap-2 text-brand-neon">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <h4 className="text-xs font-bold tracking-wider uppercase font-display">Comptes de Démo - Cliquez pour tester</h4>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              {employeesList.map((emp) => {
                let roleLabel = "";
                if (emp.role === "super_admin") roleLabel = "Super Admin";
                if (emp.role === "hr_admin") roleLabel = "Admin RH";
                if (emp.role === "chef_service") roleLabel = "Chef Service";
                if (emp.role === "employee") roleLabel = emp.id === "EMP007" ? "Lucas (Dev)" : "Sarah (Mktg)";

                return (
                  <button
                    key={emp.id}
                    disabled={loading}
                    onClick={() => handleQuickLogin(emp)}
                    className="flex flex-col text-left p-2.5 rounded-xl bg-brand-dark/80 hover:bg-brand-primary/50 border border-brand-primary/10 text-white hover:border-brand-neon/40 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="font-semibold truncate">{emp.name}</span>
                    <span className="text-[9px] text-brand-neon/80 mt-0.5">{roleLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
