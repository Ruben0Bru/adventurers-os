 // app/(dashboard)/page.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { prefetchData } from '@/lib/syncService';
import { supabase } from '@/lib/supabaseClient';

export default function DashboardHub() {
  const router = useRouter();
  const [consejeroIdClase, setConsejeroIdClase] = useState<string>('');
  const [isOnline, setIsOnline] = useState(true);

  // Como el Layout ya nos protegió del servidor, aquí podemos leer tranquilamente
  useEffect(() => {
    setIsOnline(navigator.onLine);
    setConsejeroIdClase(localStorage.getItem('offline_id_clase') || '');
  }, []);

  const clasesDB = useLiveQuery(() => db.club_clase.toArray());
  const planesDB = useLiveQuery(() => db.plan_ejecucion.where('id_clase').equals(consejeroIdClase).toArray(), [consejeroIdClase]);

  const activeTheme = clasesDB?.find(c => c.id_clase === consejeroIdClase) || {
    nombre: 'Cargando...',
    color_primario_hex: '#94a3b8'
  };

  // MOTOR DE BÚSQUEDA DE PRÓXIMA CLASE
  const proximaClase = useMemo(() => {
    if (!planesDB || planesDB.length === 0) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Normalizamos a medianoche

    const planesOrdenados = [...planesDB].sort((a, b) => new Date(a.fecha_programada).getTime() - new Date(b.fecha_programada).getTime());
    return planesOrdenados.find(plan => new Date(plan.fecha_programada).getTime() >= hoy.getTime()) || null;
  }, [planesDB]);

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch (error) {} 
    finally {
      localStorage.removeItem('offline_id_clase');
      await Promise.all([ db.club_clase.clear(), db.ninos.clear(), db.plan_ejecucion.clear(), db.registro_progreso.clear() ]);
      router.push('/login');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10 h-full">
      
      {/* Cabecera y Logout */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">¡Hola, Consejero!</h1>
          <p className="text-slate-500 font-medium text-sm">Clase de {activeTheme.nombre}</p>
        </div>
        <button onClick={handleLogout} disabled={!isOnline} className={`text-xs font-bold flex items-center gap-1 transition-colors ${isOnline ? 'text-slate-400 hover:text-rose-500' : 'text-slate-300 opacity-50'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
        </button>
      </div>

      {/* HERO WIDGET: Próxima Clase */}
      <div className="rounded-3xl p-6 shadow-lg text-white relative overflow-hidden" style={{ backgroundColor: 'var(--color-primario)' }}>
        <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-20">
          <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 12h3v9h6v-6h4v6h6v-9h3L12 2z"/></svg>
        </div>
        <div className="relative z-10">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/80 mb-1">Próximo Domingo</h2>
          
          {proximaClase ? (
            <>
              <p className="text-xl font-black leading-tight mb-4">{proximaClase.titulo_requisito}</p>
              <button 
                onClick={() => router.push('/sesion')}
                className="w-full bg-white text-slate-900 font-bold py-3 px-4 rounded-xl shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Iniciar Clase
              </button>
            </>
          ) : (
            <>
              <p className="text-lg font-bold leading-tight mb-4 opacity-90">No hay clases planificadas</p>
              <button 
                onClick={() => router.push('/planificador')}
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold py-3 px-4 rounded-xl border border-white/30 active:scale-95 transition-all"
              >
                Planificar ahora
              </button>
            </>
          )}
        </div>
      </div>

      {/* GRID DE ACCIONES */}
      <div className="grid grid-cols-2 gap-4">
        
        <button onClick={() => isOnline ? prefetchData(consejeroIdClase) : alert("Requiere internet.")} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-sky-50 text-sky-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </div>
          <span className="text-sm font-bold text-slate-700">Sincronizar</span>
        </button>

        <button onClick={() => router.push('/planificador')} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-50 text-purple-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </div>
          <span className="text-sm font-bold text-slate-700">Calendario</span>
        </button>

        <button onClick={() => router.push('/requisitos')} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </div>
          <span className="text-sm font-bold text-slate-700">Requisitos</span>
        </button>

        <button onClick={() => router.push('/comunicaciones')} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-50 text-amber-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
          </div>
          <span className="text-sm font-bold text-slate-700">Avisos</span>
        </button>

      </div>
    </div>
  );
}