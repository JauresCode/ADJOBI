import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, ShieldAlert, CheckCircle, AlertOctagon, Smartphone, RefreshCw, QrCode, ArrowRightLeft } from "lucide-react";
import { Employee } from "../types";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Employee;
  onPunchSuccess: () => void;
}

export default function QRScannerModal({ isOpen, onClose, currentUser, onPunchSuccess }: QRScannerModalProps) {
  const [actionType, setActionType] = useState<"punch_in" | "punch_out">("punch_in");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    time?: string;
    action?: string;
    delayMinutes?: number;
    isLate?: boolean;
    employeeName?: string;
  } | null>(null);
  
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = "qr-reader-container";

  useEffect(() => {
    if (!isOpen) {
      // Réinitialiser les états quand on ferme le modal
      setScanResult(null);
      setCameraError(null);
      setIsInitializing(true);
      return;
    }

    // Attendre un court instant que l'élément DOM soit prêt
    const timer = setTimeout(() => {
      startCameraScanner();
    }, 400);

    return () => {
      clearTimeout(timer);
      stopCameraScanner();
    };
  }, [isOpen, actionType]);

  const startCameraScanner = async () => {
    setIsInitializing(true);
    setCameraError(null);
    try {
      const qrScanner = new Html5Qrcode(scannerId);
      qrScannerRef.current = qrScanner;

      await qrScanner.start(
        { facingMode: "environment" },
        {
          fps: 12,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.7;
            return { width: size, height: size };
          }
        },
        (decodedText) => {
          // Jeton détecté avec succès par la caméra !
          handleValidateToken(decodedText);
          stopCameraScanner();
        },
        () => {
          // Callback de recherche continue, silencieux pour éviter le bruit de console
        }
      );
      setIsInitializing(false);
    } catch (err: any) {
      console.warn("Échec d'ouverture de la caméra (Attendu en mode iframe sans permission):", err);
      setCameraError(
        "Accès caméra restreint ou indisponible dans ce navigateur/iframe. Utilisez le simulateur de scan ci-dessous pour tester le comportement de sécurité anti-triche."
      );
      setIsInitializing(false);
    }
  };

  const stopCameraScanner = async () => {
    if (qrScannerRef.current) {
      try {
        if (qrScannerRef.current.isScanning) {
          await qrScannerRef.current.stop();
        }
      } catch (err) {
        console.error("Erreur d'arrêt du scanner:", err);
      } finally {
        qrScannerRef.current = null;
      }
    }
  };

  const handleValidateToken = async (scannedToken: string) => {
    try {
      setIsInitializing(true);
      const res = await fetch("/api/attendance/qr-validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: scannedToken,
          employeeId: currentUser.id,
          action: actionType
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setScanResult({
          success: true,
          message: "Pointage validé par le serveur central d'AutoFlow.",
          time: data.time,
          action: data.action,
          delayMinutes: data.delayMinutes,
          isLate: data.isLate,
          employeeName: data.employeeName
        });
        onPunchSuccess(); // Rafraîchit les données de l'application
      } else {
        setScanResult({
          success: false,
          message: data.error || "Échec de la validation."
        });
      }
    } catch (err) {
      setScanResult({
        success: false,
        message: "Erreur réseau. Impossible de contacter le serveur d'authentification."
      });
    } finally {
      setIsInitializing(false);
    }
  };

  // Simuler le scan : récupère le jeton actif en temps réel et l'envoie pour validation
  const handleSimulateScan = async () => {
    try {
      setIsInitializing(true);
      // Étape 1 : Récupérer le jeton actif du serveur d'accueil
      const tokenRes = await fetch("/api/attendance/qr-token");
      if (!tokenRes.ok) {
        throw new Error("Impossible de récupérer le jeton d'affichage");
      }
      const tokenData = await tokenRes.json();
      
      // Étape 2 : Envoyer immédiatement au validateur de présence
      await handleValidateToken(tokenData.token);
    } catch (err) {
      setScanResult({
        success: false,
        message: "Échec de la simulation : le serveur n'a pas répondu."
      });
      setIsInitializing(false);
    }
  };

  // Simuler un scan frauduleux (code expiré / aléatoire)
  const handleSimulateCheatScan = async () => {
    // On envoie un faux jeton aléatoire
    await handleValidateToken("AFQR_FRAUD_EXPIRED_TOKEN_XYZ_123");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-brand-dark/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-dark flex items-center justify-center text-white">
              <QrCode className="w-4 h-4 text-brand-neon" />
            </div>
            <div>
              <h3 className="font-display font-bold text-gray-900 text-sm">Scanner mon pointage</h3>
              <p className="text-[10px] text-gray-400 font-medium">AutoFlow RH • Vérification de présence physique</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCameraScanner();
              onClose();
            }}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Action Type Selector */}
          {!scanResult && (
            <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-semibold text-gray-600">
              <button
                onClick={() => setActionType("punch_in")}
                className={`flex-1 py-2 rounded-lg transition-all text-center flex items-center justify-center gap-2 ${
                  actionType === "punch_in" ? "bg-brand-dark text-white shadow-sm" : "hover:text-gray-900"
                }`}
              >
                📥 Arrivée (Check-In)
              </button>
              <button
                onClick={() => setActionType("punch_out")}
                className={`flex-1 py-2 rounded-lg transition-all text-center flex items-center justify-center gap-2 ${
                  actionType === "punch_out" ? "bg-brand-dark text-white shadow-sm" : "hover:text-gray-900"
                }`}
              >
                📤 Départ (Check-Out)
              </button>
            </div>
          )}

          {/* Result view */}
          {scanResult ? (
            <div className="py-4 text-center space-y-5 animate-scaleIn">
              {scanResult.success ? (
                // SUCCESS SCREEN (Green)
                <div className="space-y-4">
                  <div className="mx-auto w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border-4 border-emerald-100 animate-bounce">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xl font-display font-bold text-emerald-600">Pointage Validé !</h4>
                    <p className="text-xs text-gray-500">{scanResult.message}</p>
                  </div>

                  <div className="bg-emerald-50/50 rounded-2xl border border-emerald-500/10 p-5 divide-y divide-emerald-500/5 text-xs text-emerald-900 font-medium space-y-2.5">
                    <div className="flex justify-between pb-2.5">
                      <span className="text-gray-500">Collaborateur :</span>
                      <span className="font-bold">{scanResult.employeeName || currentUser.name}</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span className="text-gray-500">Heure officielle (Serveur) :</span>
                      <span className="font-bold text-base font-mono">{scanResult.time}</span>
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span className="text-gray-500">Type de pointage :</span>
                      <span className="font-bold">
                        {scanResult.action === "punch_in" ? "📥 ENTRÉE" : "📤 SORTIE"}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2.5">
                      <span className="text-gray-500">Ponctualité :</span>
                      <span>
                        {scanResult.action === "punch_in" ? (
                          scanResult.isLate ? (
                            <span className="text-amber-600 font-bold">⚠️ RETARD ({scanResult.delayMinutes} min)</span>
                          ) : (
                            <span className="text-emerald-600 font-bold">✓ À L'HEURE</span>
                          )
                        ) : (
                          <span className="text-blue-600 font-bold">✓ DÉPART ENREGISTRÉ</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-400">
                    L'horodatage a été crypté et transmis à la blockchain de présence de l'entreprise.
                  </p>
                </div>
              ) : (
                // FAILURE SCREEN (Red / Error)
                <div className="space-y-4">
                  <div className="mx-auto w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center border-4 border-red-100">
                    <AlertOctagon className="w-10 h-10 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xl font-display font-bold text-red-600">Échec du pointage</h4>
                    <p className="text-xs text-red-500 font-semibold">{scanResult.message}</p>
                  </div>

                  <div className="bg-red-50/50 rounded-2xl border border-red-500/10 p-5 text-xs text-red-900 text-left space-y-2">
                    <div className="font-bold flex items-center gap-1.5 text-red-800">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Pourquoi le pointage a-t-il été rejeté ?</span>
                    </div>
                    <p className="text-red-950 font-medium leading-relaxed">
                      Le jeton temporaire scanné a expiré (validité maximale de 15 secondes) ou ne correspond pas au code QR actuellement actif devant la borne. Le partage de photo ou l'utilisation d'anciens codes est strictement intercepté.
                    </p>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      onClick={() => {
                        setScanResult(null);
                        startCameraScanner();
                      }}
                      className="flex-1 py-2.5 bg-brand-dark hover:bg-[#04281f] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      Réessayer
                    </button>
                    <button
                      onClick={handleSimulateScan}
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      Forcer un scan valide (Simulateur)
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // ACTIVE SCANNER VIEW
            <div className="space-y-6">
              
              {/* Camera scanner wrapper */}
              <div className="relative bg-gray-950 rounded-2xl overflow-hidden aspect-square flex flex-col items-center justify-center shadow-inner border border-gray-800">
                
                {/* HTML5 QR Container */}
                <div id={scannerId} className="w-full h-full object-cover [&_video]:object-cover" />

                {/* Loading state overlay inside container */}
                {isInitializing && (
                  <div className="absolute inset-0 bg-gray-950/80 flex flex-col items-center justify-center text-white space-y-3 z-10">
                    <RefreshCw className="w-8 h-8 animate-spin text-brand-neon" />
                    <span className="text-xs font-mono font-bold tracking-wider">CHARGEMENT DE LA CAMÉRA...</span>
                  </div>
                )}

                {/* If camera fails or is blocked */}
                {cameraError && !isInitializing && (
                  <div className="absolute inset-0 bg-gray-950 p-6 flex flex-col items-center justify-center text-center text-gray-300 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed max-w-xs">{cameraError}</p>
                  </div>
                )}

                {/* Aiming target guides */}
                {!cameraError && !isInitializing && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-64 h-64 border-2 border-brand-neon rounded-3xl relative animate-pulse shadow-[0_0_20px_rgba(5,150,105,0.15)]">
                      {/* Corner marks */}
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-brand-neon rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-brand-neon rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-brand-neon rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-brand-neon rounded-br-lg" />
                    </div>
                  </div>
                )}

                {/* Simulated scanner scanning bar */}
                {!cameraError && !isInitializing && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-neon to-transparent animate-[bounce_4s_infinite] pointer-events-none" />
                )}
              </div>

              {/* Informative footer for physical scan */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-brand-dark shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-gray-900 leading-none">Comment scanner ?</h5>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                    Positionnez-vous devant l'écran de la borne d'accueil. Alignez le QR Code dynamique dans le cadre de visée de l'appareil photo. La validation est instantanée.
                  </p>
                </div>
              </div>

              {/* Simulation Sandbox Suite */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-1.5 text-brand-dark text-xs font-bold uppercase tracking-wider">
                  <Smartphone className="w-4 h-4 text-brand-primary animate-pulse" />
                  <span>Panneau de Simulation de Présence</span>
                </div>
                
                <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                  Pour tester l'anti-triche, simulez un scan conforme (qui lit la clé du serveur) ou simulez un scan frauduleux (code expiré ou volé) :
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={handleSimulateScan}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Scan Conforme (Réussi)</span>
                  </button>

                  <button
                    onClick={handleSimulateCheatScan}
                    className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Scan Frauduleux (Rejeté)</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
