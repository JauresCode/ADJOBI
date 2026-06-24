import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Globe, Building2, ShieldAlert, Sparkles } from "lucide-react";
import { Employee } from "../types";
import Logo from "./Logo";
import { auth, googleAuthProvider, signInWithPopup } from "../lib/firebase.ts";

interface LoginViewProps {
  onLoginSuccess: (user: Employee) => void;
  employeesList: Employee[];
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

      const contentType = res.headers.get("content-type");
      let data: any;
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error("Non-JSON response for login:", text);
        throw new Error(`Le serveur a renvoyé une réponse invalide (${res.status}). Veuillez vérifier que le serveur est démarré.`);
      }

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

  const handleGoogleLogin = async () => {
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      // Déclencher le popup Google Auth officiel
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      // Envoyer le token ID au backend pour vérification
      const res = await fetch("/api/login-firebase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ idToken })
      });

      const contentType = res.headers.get("content-type");
      let data: any;
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error("Non-JSON response for login-firebase:", text);
        throw new Error(`Le serveur d'authentification a renvoyé une réponse invalide (${res.status}).`);
      }

      if (!res.ok || !data.success) {
        setError(data.error || "L'accès à votre compte n'a pas pu être validé.");
        setLoading(false);
      } else {
        const userRole = data.user.mappedRole;
        let targetWorkspace = "";
        if (userRole === "SUPER_ADMIN") targetWorkspace = "l'espace Super Administrateur";
        if (userRole === "RH") targetWorkspace = "l'espace Ressources Humaines";
        if (userRole === "CHEF_SERVICE") targetWorkspace = "l'espace Chef de Service";
        if (userRole === "EMPLOYE") targetWorkspace = "l'espace Profil Employé";

        setSuccessMessage(`Authentification Google réussie ! Bienvenue, redirection vers ${targetWorkspace}...`);

        setTimeout(() => {
          onLoginSuccess(data.user);
          setLoading(false);
        }, 1200);
      }
    } catch (err: any) {
      console.error("Google Auth failed:", err);
      if (err.code === "auth/popup-blocked") {
        setError("Le popup de connexion Google a été bloqué par votre navigateur. Veuillez autoriser les popups pour ce site.");
      } else if (err.code === "auth/cancelled-popup-request") {
        setError("La connexion via Google a été annulée par l'utilisateur.");
      } else {
        setError("Erreur lors de la connexion Google SSO : " + (err.message || err));
      }
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
              Gérez de manière professionnelle et ultra-sécurisée la présence, le pointage numérique, les demandes de congés et le planning des équipes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-4 max-w-sm mx-auto lg:mx-0 border-t border-brand-primary/20">
            <div>
              <p className="text-3xl md:text-4xl font-display font-bold text-white">100%</p>
              <p className="text-xs text-gray-400 font-medium uppercase mt-1">Données Sécurisées</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-display font-bold text-brand-neon">Real-time</p>
              <p className="text-xs text-gray-400 font-medium uppercase mt-1">Pointage Numérique</p>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form Box */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Main Login Card */}
          <div className="glass-panel p-8 md:p-10 rounded-3xl shadow-2xl shadow-black/60 relative overflow-hidden max-w-lg mx-auto border border-white/20 bg-white/95">
            <div className="space-y-2 mb-8 text-center">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 flex items-center justify-center gap-2">
                Espace Connexion
              </h2>
              <p className="text-sm text-gray-500">Seuls les comptes créés par le Super Admin sont autorisés</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50/90 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 backdrop-blur-sm">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 backdrop-blur-sm">
                <Globe className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 animate-spin" />
                <span className="leading-relaxed">{successMessage}</span>
              </div>
            )}

            {/* Google Authentication Button (SSO) */}
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="w-full py-3 px-4 rounded-xl border border-gray-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/30 text-gray-700 text-sm font-semibold flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm hover:shadow-md disabled:opacity-60"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.81-2.5-2.61-4.44-6.19-4.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Se connecter avec Google</span>
            </button>

            <div className="my-6 flex items-center justify-center gap-3">
              <div className="h-px bg-gray-200 flex-1" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">OU IDENTIFIANTS</span>
              <div className="h-px bg-gray-200 flex-1" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">Adresse Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <span className="text-sm">@</span>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre.nom@autoflow.ci"
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/70 focus:bg-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all duration-200 text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-60"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">Mot de passe</label>
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
                  Se souvenir de cette session
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
                    <span>Vérification...</span>
                  </>
                ) : (
                  <>
                    <span>Se connecter</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-6 text-xs text-gray-400">
              <p>
                Si vous n'êtes pas encore enregistré, demandez à votre <span className="font-semibold text-brand-primary">Super Admin</span> de créer votre compte de collaborateur.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
