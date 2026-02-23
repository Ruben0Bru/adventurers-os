// components/Navbar.tsx
'use client'; // Directiva estricta de Next.js para interactividad en el cliente

import { useState, useEffect } from 'react';

export default function Navbar() {
  const [isOnline, setIsOnline] = useState(true);

  // Listener para el estado de la red (Arquitectura Offline-First)
  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white shadow-md z-50 px-4 flex items-center justify-between">
      {/* Identidad visual mínima y legible */}
      <div className="flex flex-col">
        <h1 className="text-xl font-bold tracking-tight">Corderitos OS</h1>
        <span className="text-xs text-slate-400">Dashboard de Ejecución</span>
      </div>

      {/* Telemetría de Red (Indicador visual de estado) */}
      <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
        <div 
          className={`w-3 h-3 rounded-full ${
            isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
          }`}
        />
        <span className="text-sm font-medium">
          {isOnline ? 'Conectado' : 'Offline'}
        </span>
      </div>
    </nav>
  );
}