// app/page.tsx
'use client';

import { useState } from 'react';
import PreFlightCheck from '@/components/PreFlightCheck';
import ExecutionHUD from '@/components/ExecutionHUD';
import PostFlightCheck from '@/components/PostFlightCheck';
import { syncProgresoOffline, prefetchData } from '@/lib/syncService';

// Añadimos el estado DONE para romper el bucle infinito
type ViewState = 'PREFLIGHT' | 'EXECUTION' | 'POSTFLIGHT' | 'DONE';

export default function DashboardOrchestrator() {
  const [currentView, setCurrentView] = useState<ViewState>('PREFLIGHT');
  const [presentes, setPresentes] = useState<any[]>([]);
  const [ausentes, setAusentes] = useState<any[]>([]);

  const handleStartPipeline = (datosPreFlight: any[]) => {
    // Clasificamos la entropía: quién está y quién no
    setPresentes(datosPreFlight.filter(n => n.presente));
    setAusentes(datosPreFlight.filter(n => !n.presente));
    setCurrentView('EXECUTION');
  };

  const handleFinishPipeline = () => {
    setCurrentView('POSTFLIGHT');
  };

  const handleSyncAndClose = async () => {
    console.log('[Worker] Empaquetando transacciones y encolando en Dexie...');
    // Aquí invocas la sincronización real si hay red
    if (navigator.onLine) {
      await syncProgresoOffline();
    }
    // Pasamos al estado de reposo hasta el próximo domingo
    setCurrentView('DONE'); 
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Botón temporal de utilidad para el sábado */}
      {currentView === 'PREFLIGHT' && (
        <button onClick={prefetchData} className="mb-4 text-xs text-slate-500 underline text-center w-full">
          ⬇️ Fetch Datos (Sábado)
        </button>
      )}

      {currentView === 'PREFLIGHT' && <PreFlightCheck onStartPipeline={handleStartPipeline} />}
      {currentView === 'EXECUTION' && <ExecutionHUD onFinish={handleFinishPipeline} />}
      {currentView === 'POSTFLIGHT' && (
        <PostFlightCheck 
          asistentes={presentes} 
          ausentes={ausentes} 
          onSyncAndClose={handleSyncAndClose} 
        />
      )}
      
      {/* Pantalla de Reposo (Home / Idle State) */}
      {currentView === 'DONE' && (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center animate-fade-in">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Sesión Cerrada</h2>
          <p className="text-slate-500 font-medium px-6">
            Buen trabajo hoy. El progreso está guardado localmente y se sincronizará automáticamente.
          </p>
          <button 
            onClick={() => setCurrentView('PREFLIGHT')}
            className="mt-8 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Forzar reinicio (Solo para pruebas)
          </button>
        </div>
      )}
    </div>
  );
}