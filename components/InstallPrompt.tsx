// components/InstallPrompt.tsx
'use client';

import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // 1. Revisar si la trampa nativa (en layout.tsx) ya capturó el evento
    const pwaEvent = (window as any).deferredPWA;
    if (pwaEvent) {
      setDeferredPrompt(pwaEvent);
      setIsInstallable(true);
    }

    // 2. Por si acaso el evento se dispara tarde, mantenemos el listener de React
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      console.log('[PWA] Bóveda orbital instalada en el dispositivo.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // 3. Disparamos el modal nativo del sistema operativo
    deferredPrompt.prompt();
    
    // 4. Esperamos la decisión del usuario (Promesa)
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Decisión del consejero: ${outcome}`); // 'accepted' o 'dismissed'
    
    // 5. Destruimos el prompt de la memoria (solo se puede usar una vez)
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // Si no es instalable (ej. ya está instalada o está en iOS Safari), no renderizamos nada.
  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[100] animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-xl shadow-inner border border-amber-400">
            📲
          </div>
          <div>
            <h4 className="text-white font-bold text-sm tracking-tight">Instalar Aventureros OS</h4>
            <p className="text-slate-400 text-xs font-medium">Acceso rápido y sin internet</p>
          </div>
        </div>
        <button 
          onClick={handleInstallClick}
          className="bg-white text-slate-900 font-black text-xs px-4 py-2.5 rounded-xl active:scale-95 transition-transform shadow-sm"
        >
          Instalar
        </button>
      </div>
    </div>
  );
}