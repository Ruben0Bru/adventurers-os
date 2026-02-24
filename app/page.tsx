'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import PreFlightCheck from '@/components/PreFlightCheck';
import ExecutionHUD from '@/components/ExecutionHUD';
import PostFlightCheck from '@/components/PostFlightCheck';
import { syncProgresoOffline, prefetchData } from '@/lib/syncService';
import Navbar from '@/components/NavBar';

type ViewState = 'PREFLIGHT' | 'EXECUTION' | 'POSTFLIGHT' | 'DONE';

// ELIMINAMOS EL MOCK: Ahora usamos un Fallback de Seguridad estricto para cuando la DB esté vacía
const FALLBACK_THEME = {
  id_clase: '00000000-0000-0000-0000-000000000000',
  nombre: 'Setup Inicial',
  color_primario_hex: '#94a3b8',   // Slate 400
  color_secundario_hex: '#cbd5e1', // Slate 300
  color_acento_hex: '#e2e8f0',     // Slate 200
  color_fondo_hex: '#f8fafc'       // Slate 50
};

export default function DashboardOrchestrator() {
  const [currentView, setCurrentView] = useState<ViewState>('PREFLIGHT');
  const [presentes, setPresentes] = useState<any[]>([]);
  const [ausentes, setAusentes] = useState<any[]>([]);
  
  // 1. LECTURA REACTIVA DE LA BASE DE DATOS LOCAL
  const clasesDB = useLiveQuery(() => db.club_clase.toArray());
  const [activeThemeId, setActiveThemeId] = useState<string>('');

  // 2. SELECCIÓN DINÁMICA DE LA CLASE
  // Si no hay selección, toma la primera de la DB. Si la DB está vacía, usa el Fallback.
  const activeTheme = clasesDB?.find(c => c.id_clase === activeThemeId) 
    || (clasesDB && clasesDB.length > 0 ? clasesDB[0] : FALLBACK_THEME);

  // Auto-seleccionar la primera clase cuando Dexie termine de cargar
  useEffect(() => {
    if (clasesDB && clasesDB.length > 0 && !activeThemeId) {
      setActiveThemeId(clasesDB[0].id_clase);
    }
  }, [clasesDB, activeThemeId]);

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

  // Pantalla de carga mientras el motor de Dexie arranca (Evita flasheos de UI)
  if (clasesDB === undefined) {
    return <div className="flex h-screen w-full items-center justify-center text-slate-500 font-mono text-sm">Inicializando Motor Local...</div>;
  }

  return (
    <div 
      className="flex flex-col h-full w-full transition-colors duration-500"
      style={{ 
        '--color-primario': activeTheme.color_primario_hex, 
        '--color-secundario': activeTheme.color_secundario_hex,
        '--color-acento': activeTheme.color_acento_hex,
        '--color-fondo': activeTheme.color_fondo_hex,
        backgroundColor: 'var(--color-fondo)' 
      } as React.CSSProperties}
    >
      <Navbar nombreClase={activeTheme.nombre} />

      {/* HEADER DE PRUEBAS MULTI-TENANT */}
      <div className="bg-slate-900 text-white p-2 flex justify-between items-center text-xs z-40 relative">
        <span className="font-mono text-slate-400">Contexto Local (Dexie):</span>
        <select 
          className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white outline-none disabled:opacity-50"
          value={activeTheme.id_clase}
          onChange={(e) => setActiveThemeId(e.target.value)}
          disabled={clasesDB.length === 0}
        >
          {clasesDB.length === 0 ? (
            <option value={FALLBACK_THEME.id_clase}>Sin Datos</option>
          ) : (
            clasesDB.map(tema => (
              <option key={tema.id_clase} value={tema.id_clase}>{tema.nombre}</option>
            ))
          )}
        </select>
      </div>

      {/* CONTENEDOR DE LA APLICACIÓN */}
      <div className="flex-col h-full w-full p-4 flex-grow flex">
        {currentView === 'PREFLIGHT' && (
          <>
            {/* NOTA: Recuerda reemplazar el UUID quemado aquí cuando pruebes con otras clases */}
            <button 
              onClick={() => prefetchData('359ede06-9c4e-4c89-aaa3-7d81ee99271a')} 
              className="mb-4 text-xs text-slate-500 hover:text-slate-800 transition-colors text-center w-full"
            >
              ⬇️ Fetch Datos de Supabase (Sábado)
            </button>
            <PreFlightCheck nombreClase={activeTheme.nombre} onStartPipeline={handleStartPipeline} />
          </>
        )}
        
        {currentView === 'EXECUTION' && <ExecutionHUD onFinish={handleFinishPipeline} />}
        
        {currentView === 'POSTFLIGHT' && (
          <PostFlightCheck asistentes={presentes} ausentes={ausentes} onSyncAndClose={handleSyncAndClose} />
        )}
        
        {currentView === 'DONE' && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center animate-fade-in">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-2 shadow-inner" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primario) 15%, transparent)', color: 'var(--color-primario)'}}>
              <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">¡Clase Completada!</h2>
            <p className="text-slate-500 font-medium px-6 leading-relaxed">
              Excelente trabajo hoy. Los registros han sido guardados y se sincronizarán en segundo plano.
            </p>
            <button 
              onClick={() => setCurrentView('PREFLIGHT')}
              className="mt-12 text-sm font-bold transition-colors py-2 px-4 rounded-lg hover:bg-black/5"
              style={{ color: 'var(--color-primario)' }}
            >
              Volver al inicio (Modo Pruebas)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}