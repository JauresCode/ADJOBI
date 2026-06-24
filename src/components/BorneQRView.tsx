import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Clock, ShieldCheck, UserCheck, RefreshCw, Smartphone, CheckCircle, AlertTriangle } from "lucide-react";
import { Employee, Attendance } from "../types";
import Logo, { getLogoSvgDataUrl } from "./Logo";

interface BorneQRViewProps {
  employees: Employee[];
  attendances: Attendance[];
  onRefreshState: () => void;
}

export default function BorneQRView({ employees, attendances, onRefreshState }: BorneQRViewProps) {
  const [token, setToken] = useState<string>("");
  const [secondsLeft, setSecondsLeft] = useState<number>(15);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(true);
  const [recentPunches, setRecentPunches] = useState<Array<{ employeeName: string; avatar: string; time: string; status: string }>>([]);

  const fetchToken = async () => {
    try {
      const res = await fetch("/api/attendance/qr-token");
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setSecondsLeft(data.expiresIn || 15);
      }
    } catch (err) {
      console.error("Erreur de récupération du jeton QR:", err);
    } finally {
      setLoading(false);
    }
  };

  // Récupération initiale et synchronisation du jeton
  useEffect(() => {
    fetchToken();

    // Décompte chaque seconde
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Re-synchronisation avec le serveur
          fetchToken();
          onRefreshState();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Heure en temps réel de la borne
  useEffect(() => {
    const timeTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timeTimer);
  }, []);

  // Détecter les nouveaux pointages aujourd'hui pour l'animation de défilement
  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    
    // Filtrer les pointages d'aujourd'hui
    const todayPunches = attendances
      .filter((att) => att.date === todayStr && att.timeline && att.timeline.length > 0)
      .flatMap((att) => {
        const emp = employees.find((e) => e.id === att.employeeId);
        return att.timeline.map((event) => ({
          employeeName: emp ? emp.name : "Employé",
          avatar: emp ? emp.avatar : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop",
          time: event.time,
          status: event.type === "in" ? (att.status === "Retard" ? "Retard" : "Présent") : "Sortie",
          timestamp: new Date(`${todayStr}T${event.time}:00`).getTime()
        }));
      })
      // Trier par événement le plus récent d'abord
      .sort((a, b) => b.time.localeCompare(a.time));

    setRecentPunches(todayPunches.slice(0, 5));
  }, [attendances, employees]);

  const progressPercentage = (secondsLeft / 15) * 100;

  return (
    <div className="flex-1 bg-brand-dark/95 text-white min-h-full p-4 md:p-8 flex flex-col items-center justify-center font-sans overflow-y-auto relative selection:bg-brand-neon/30">
      
      {/* Background visual grid decorations */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0596690a_1px,transparent_1px),linear-gradient(to_bottom,#0596690a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-primary/10 blur-3xl pointer-events-none" />

      {/* Header Borne */}
      <div className="z-10 text-center mb-8 max-w-xl">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Logo variant="dark" className="h-11" showTagline={false} />
          <div className="h-6 w-px bg-white/20 mx-1.5" />
          <span className="text-[10px] text-brand-neon font-mono font-bold tracking-widest uppercase">Borne de Pointage Officielle</span>
        </div>
        <p className="text-gray-400 text-sm">
          Présentez le code QR ci-dessous devant votre appareil mobile pour enregistrer votre arrivée ou départ de l'entreprise instantanément.
        </p>
      </div>

      <div className="z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-5xl items-stretch">
        
        {/* Left column: Dynamic QR Code panel */}
        <div className="lg:col-span-7 bg-brand-medium/30 border border-brand-primary/20 backdrop-blur-md rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
          
          {/* Header panel details */}
          <div className="w-full flex items-center justify-between mb-6 pb-4 border-b border-brand-primary/10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-neon animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-wider text-brand-neon">MÉCANISME ANTI-FRAUDE ACTIF</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono text-gray-400">SERVEUR CENTRAL SECURE</span>
            </div>
          </div>

          {/* Clock Display */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 text-2xl md:text-3xl font-mono font-semibold text-white tracking-wider">
              <Clock className="w-6 h-6 text-brand-primary" />
              <span>{currentTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1 uppercase font-semibold font-mono tracking-wider">
              {currentTime.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* QR Code Container */}
          <div className="relative p-6 bg-white rounded-2xl shadow-2xl shadow-brand-neon/5 border-4 border-brand-primary/30 group transition-all duration-300">
            {loading ? (
              <div className="w-64 h-64 flex flex-col items-center justify-center text-brand-dark">
                <RefreshCw className="w-10 h-10 animate-spin text-brand-primary mb-3" />
                <span className="text-xs font-semibold">Génération de la clé...</span>
              </div>
            ) : token ? (
              <QRCodeSVG
                value={token}
                size={240}
                level="Q"
                includeMargin={false}
                imageSettings={{
                  src: getLogoSvgDataUrl(), // real logo vector SVG data URL
                  x: undefined,
                  y: undefined,
                  height: 48,
                  width: 48,
                  excavate: true,
                }}
              />
            ) : (
              <div className="w-64 h-64 flex flex-col items-center justify-center text-red-500">
                <AlertTriangle className="w-12 h-12 mb-2" />
                <span className="text-xs font-bold text-center">Échec de connexion</span>
              </div>
            )}

            {/* Scanning scanner line effect overlay */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-neon to-transparent animate-[bounce_3s_infinite] pointer-events-none" />
          </div>

          {/* Dynamic Progress Countdown */}
          <div className="w-full mt-6 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-gray-400">Rotation de sécurité</span>
              <span className="text-brand-neon font-bold flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {secondsLeft} secondes restantes
              </span>
            </div>
            
            {/* ProgressBar */}
            <div className="w-full h-2 bg-brand-dark rounded-full overflow-hidden border border-brand-primary/10">
              <div
                className="h-full bg-gradient-to-r from-brand-primary to-brand-neon rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs text-gray-400 bg-brand-dark/40 px-4 py-2 rounded-xl border border-brand-primary/10">
            <Smartphone className="w-4 h-4 text-brand-primary" />
            <span>Ouvrez <b>AutoFlow {">"} Mes Tâches {">"} Scanner mon pointage</b></span>
          </div>

        </div>

        {/* Right column: Recent logs / Live Feed */}
        <div className="lg:col-span-5 bg-brand-medium/20 border border-brand-primary/10 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-brand-primary/10">
              <UserCheck className="w-5 h-5 text-brand-primary" />
              <h2 className="font-display font-semibold text-base text-white">Flux d'accueil en direct</h2>
            </div>

            {recentPunches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                <Smartphone className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">Aucun pointage enregistré pour le moment aujourd'hui.</p>
                <p className="text-[10px] text-gray-600 mt-1">Les scans confirmés s'afficheront ici en temps réel.</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                {recentPunches.map((punch, index) => (
                  <div
                    key={`${punch.employeeName}-${punch.time}-${index}`}
                    className="flex items-center justify-between p-3 rounded-2xl bg-brand-medium/30 border border-brand-primary/5 hover:border-brand-primary/20 transition-all duration-300 animate-fadeIn"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={punch.avatar}
                        alt={punch.employeeName}
                        className="w-9 h-9 rounded-full border border-brand-primary/30 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-xs font-semibold text-white leading-tight">{punch.employeeName}</h4>
                        <span className="text-[10px] font-mono font-medium text-gray-400">
                          Enregistré à {punch.time}
                        </span>
                      </div>
                    </div>

                    <div>
                      {punch.status === "Retard" ? (
                        <span className="px-2 py-1 rounded-md text-[9px] font-mono font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          ⚠️ RETARD
                        </span>
                      ) : punch.status === "Présent" ? (
                        <span className="px-2 py-1 rounded-md text-[9px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          ✓ À L'HEURE
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-md text-[9px] font-mono font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400">
                          → SORTIE
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-brand-primary/10 bg-brand-dark/20 p-4 rounded-2xl">
            <h3 className="text-xs font-semibold text-brand-neon mb-2">Protocole Anti-Fraude AutoFlow :</h3>
            <ul className="text-[10px] text-gray-400 space-y-1.5 list-disc pl-3">
              <li>Rotation stricte par horloge atomique toutes les 15s.</li>
              <li>Signature cryptographique à usage unique du QR Code.</li>
              <li>Interdiction absolue des captures d'écran et partages de photos.</li>
              <li>Vérification instantanée de la présence physique de l'employé.</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
