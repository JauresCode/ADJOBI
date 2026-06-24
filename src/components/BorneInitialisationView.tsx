import React, { useState, useEffect } from "react";
import { Tablet, KeyRound, HelpCircle, CheckCircle2, ShieldAlert, RefreshCw, AlertTriangle, ArrowRight } from "lucide-react";
import Logo from "./Logo";

export default function BorneInitialisationView() {
  const [pairingCode, setPairingCode] = useState("");
  const [borneName, setBorneName] = useState("");
  const [status, setStatus] = useState<"loading" | "checking" | "idle" | "success" | "error">("checking");
  const [errorMessage, setErrorMessage] = useState("");
  const [pairedName, setPairedName] = useState("");

  // Vérifier si l'appareil est déjà appairé au démarrage
  useEffect(() => {
    const checkPairingStatus = async () => {
      try {
        const res = await fetch("/api/kiosks/check-pairing");
        if (res.ok) {
          const data = await res.json();
          if (data.paired) {
            setPairedName(data.name);
            setStatus("success");
            // Redirection automatique après 2 secondes
            setTimeout(() => {
              window.location.href = "/borne/pointage";
            }, 2000);
            return;
          }
        }
      } catch (err) {
        console.error("Erreur d'évaluation d'appairage initial:", err);
      }
      setStatus("idle");
    };

    checkPairingStatus();
  }, []);

  const handlePairingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingCode.trim()) {
      setErrorMessage("Veuillez saisir le code d'appairage.");
      return;
    }
    if (!borneName.trim()) {
      setErrorMessage("Veuillez donner un nom identifiable à cette borne.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/kiosks/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: pairingCode.trim(),
          name: borneName.trim()
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPairedName(data.name);
        setStatus("success");
        // Redirection après 2 secondes
        setTimeout(() => {
          window.location.href = "/borne/pointage";
        }, 2000);
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Code invalide ou expiré.");
      }
    } catch (err) {
      console.error("Erreur de requête d'appairage:", err);
      setStatus("error");
      setErrorMessage("Connexion au serveur impossible. Vérifiez votre réseau.");
    }
  };

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="animate-spin text-brand-neon">
            <RefreshCw className="w-10 h-10" />
          </div>
          <p className="text-gray-400 text-sm font-mono tracking-widest uppercase">Vérification de l'état de la borne...</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-primary/10 blur-3xl pointer-events-none" />
        
        <div className="z-10 max-w-md w-full bg-brand-medium/40 border border-brand-primary/20 p-8 rounded-3xl backdrop-blur-md text-center flex flex-col items-center shadow-2xl">
          <CheckCircle2 className="w-16 h-16 text-brand-neon animate-bounce mb-6" />
          <h2 className="text-xl font-display font-semibold text-white mb-2">Appairage Réussi !</h2>
          <p className="text-gray-300 text-sm mb-6">
            La borne <b>"{pairedName}"</b> est désormais enregistrée et autorisée sur le réseau d'AutoFlow.
          </p>
          <div className="flex items-center gap-2 text-xs text-brand-neon font-mono font-bold animate-pulse bg-brand-dark/50 px-4 py-2 rounded-xl">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Redirection vers l'écran de pointage...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark/95 flex flex-col items-center justify-center p-4 relative select-none">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#05966905_1px,transparent_1px),linear-gradient(to_bottom,#05966905_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-brand-primary/10 blur-3xl pointer-events-none" />

      <div className="z-10 max-w-md w-full flex flex-col gap-8">
        <div className="text-center">
          <Logo variant="dark" className="h-12 mx-auto mb-3" showTagline={false} />
          <p className="text-xs text-brand-neon font-mono font-bold tracking-widest uppercase">Initialisation & Sécurisation de la borne</p>
        </div>

        <div className="bg-brand-medium/20 border border-brand-primary/15 backdrop-blur-md p-8 rounded-3xl shadow-2xl relative">
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-brand-dark border border-brand-primary/25 text-brand-primary p-2.5 rounded-full shadow-lg">
            <Tablet className="w-6 h-6" />
          </div>

          <h2 className="text-center font-display font-semibold text-white text-lg mt-3 mb-6">Configuration d'un Nouvel Appareil</h2>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-2.5 items-start text-xs text-red-400">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Erreur d'appairage</span>
                <p className="mt-0.5 text-gray-300 font-mono text-[11px] leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handlePairingSubmit} className="space-y-5">
            <div>
              <label htmlFor="borneName" className="block text-xs font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">
                Nom de la borne d'entrée
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="borneName"
                  placeholder="Ex: Tablette Hall d'accueil A"
                  value={borneName}
                  onChange={(e) => setBorneName(e.target.value)}
                  disabled={status === "loading"}
                  className="w-full bg-brand-dark/60 border border-brand-primary/20 focus:border-brand-primary/60 text-white rounded-xl py-3 pl-4 pr-4 text-sm font-medium placeholder-gray-500 outline-none transition-colors"
                  required
                />
              </div>
              <span className="text-[10px] text-gray-500 mt-1 block">
                Permet d'identifier l'appareil dans votre console d'administration.
              </span>
            </div>

            <div>
              <label htmlFor="pairingCode" className="block text-xs font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">
                Code secret d'appairage
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="pairingCode"
                  placeholder="Format: AUTH-XXX-X"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value)}
                  disabled={status === "loading"}
                  className="w-full bg-brand-dark/60 border border-brand-primary/20 focus:border-brand-primary/60 text-white font-mono rounded-xl py-3 pl-4 pr-4 text-sm font-semibold tracking-wider text-center uppercase placeholder-gray-500 outline-none transition-colors"
                  maxLength={12}
                  required
                />
              </div>
              <span className="text-[10px] text-gray-500 mt-1 block">
                Générez un code temporaire valide 5 minutes depuis votre espace Super Admin.
              </span>
            </div>

            <button
              type="submit"
              disabled={status === "loading" || !borneName.trim() || !pairingCode.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-brand-primary to-brand-neon disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-400 text-brand-dark text-sm font-bold rounded-xl shadow-lg hover:shadow-brand-neon/10 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {status === "loading" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-brand-dark" />
                  <span>Validation cryptographique...</span>
                </>
              ) : (
                <>
                  <span>Autoriser et Appairer l'appareil</span>
                  <ArrowRight className="w-4 h-4 text-brand-dark" />
                </>
              )}
            </button>
          </form>

          {status === "error" && (
            <button
              onClick={() => setStatus("idle")}
              className="w-full mt-4 text-center text-xs text-brand-primary hover:text-brand-neon font-medium underline transition-colors cursor-pointer"
            >
              Réessayer la saisie
            </button>
          )}
        </div>

        {/* Security assurance */}
        <div className="text-center text-[10px] text-gray-500 flex items-center justify-center gap-1.5 font-mono">
          <span>SÉCURITÉ MILITAIRE • PROTOCOLE DE POINTAGE INCORRUPTIBLE</span>
        </div>
      </div>
    </div>
  );
}
