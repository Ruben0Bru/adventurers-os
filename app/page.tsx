// app/page.tsx
'use client';

import { useState } from 'react';
import PreFlightCheck from '@/components/PreFlightCheck';
import ExecutionHUD from '@/components/ExecutionHUD';
import PostFlightCheck from '@/components/PostFlightCheck';
import { syncProgresoOffline, prefetchData } from '@/lib/syncService';

type ViewState = 'PREFLIGHT' | 'EXECUTION' | 'POSTFLIGHT' | 'DONE';

// MOCK: Perfiles de las clases que luego vendrán de Supabase
const CLUB_TEMAS = [
  { id: '1', nombre: 'Corderitos', primario: '#0ea5e9', fondo: '#f0f9ff' },       // Celeste
  { id: '2', nombre: 'Abejitas Laboriosas', primario: '#eab308', fondo: '#fefce8' }, // Amarillo
  { id: '3', nombre: 'Constructores', primario: '#3b82f6', fondo: '#eff6ff' },    // Azul
];

export default function DashboardOrchestrator() {
  const [currentView, setCurrentView] = useState<ViewState>('PREFLIGHT');
  const [presentes, setPresentes] = useState<any[]>([]);
  const [ausentes, setAusentes] = useState<any[]>([]);
  
  // Estado para el motor de temas dinámicos
  const [activeTheme, setActiveTheme] = useState(CLUB_TEMAS[0]);

  const handleStartPipeline = (datosPreFlight: any[]) => {
    setPresentes(datosPreFlight.filter(n => n.presente));
    setAusentes(datosPreFlight.filter(n => !n.presente));
    setCurrentView('EXECUTION');
  };

  const handleFinishPipeline = () => setCurrentView('POSTFLIGHT');

  const handleSyncAndClose = async () => {
    if (navigator.onLine) await syncProgresoOffline();
    setCurrentView('DONE'); 
  };

  return (
    // INYECCIÓN DINÁMICA DE CSS: El nodo raíz propaga las variables a Tailwind v4
    <div 
      className="flex flex-col h-full w-full transition-colors duration-500"
      style={{ 
        '--color-primario': activeTheme.primario, 
        '--color-fondo': activeTheme.fondo,
        backgroundColor: 'var(--color-fondo)' 
      } as React.CSSProperties}
    >
      {/* HEADER DE PRUEBAS MULTI-TENANT (Eliminar en producción) */}
      <div className="bg-slate-900 text-white p-2 flex justify-between items-center text-xs z-50">
        <span className="font-mono text-slate-400">Entorno Simulado:</span>
        <select 
          className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white outline-none"
          value={activeTheme.id}
          onChange={(e) => setActiveTheme(CLUB_TEMAS.find(t => t.id === e.target.value) || CLUB_TEMAS[0])}
        >
          {CLUB_TEMAS.map(tema => (
            <option key={tema.id} value={tema.id}>{tema.nombre}</option>
          ))}
        </select>
      </div>

      {/* CONTENEDOR DE LA APLICACIÓN */}
      <div className="flex-col h-full w-full p-4 flex-grow flex">
        {currentView === 'PREFLIGHT' && (
          <>
            <button onClick={prefetchData} className="mb-4 text-xs text-slate-500 hover:text-slate-800 transition-colors text-center w-full">
              ⬇️ Fetch Datos de Supabase (Sábado)
            </button>
            <PreFlightCheck onStartPipeline={handleStartPipeline} />
          </>
        )}
        
        {currentView === 'EXECUTION' && <ExecutionHUD onFinish={handleFinishPipeline} />}
        
        {currentView === 'POSTFLIGHT' && (
          <PostFlightCheck asistentes={presentes} ausentes={ausentes} onSyncAndClose={handleSyncAndClose} />
        )}
        
        {currentView === 'DONE' && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center animate-fade-in">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-2 shadow-inner bg-clase-primario/10 text-clase-primario">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">¡Clase Completada!</h2>
            <p className="text-slate-500 font-medium px-6 leading-relaxed">
              Excelente trabajo hoy. Los registros han sido guardados y se sincronizarán en segundo plano.
            </p>
            <button 
              onClick={() => setCurrentView('PREFLIGHT')}
              className="mt-12 text-sm font-bold text-slate-400 hover:text-clase-primario transition-colors py-2 px-4 rounded-lg hover:bg-black/5"
            >
              Volver al inicio (Modo Pruebas)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}