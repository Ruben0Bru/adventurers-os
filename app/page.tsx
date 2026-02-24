// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabaseClient';
import PreFlightCheck from '@/components/PreFlightCheck';
import ExecutionHUD from '@/components/ExecutionHUD';
import PostFlightCheck from '@/components/PostFlightCheck';
import { syncProgresoOffline, prefetchData } from '@/lib/syncService';
import Navbar from '@/components/NavBar';
import CalendarPlanner from '@/components/CalendarPlanner';

type ViewState = 'PREFLIGHT' | 'EXECUTION' | 'POSTFLIGHT' | 'DONE' | 'PLANNER';

const FALLBACK_THEME = {
  id_clase: '',
  nombre: 'Cargando Identidad...',
  color_primario_hex: '#94a3b8',
  color_secundario_hex: '#cbd5e1',
  color_acento_hex: '#e2e8f0',
  color_fondo_hex: '#f8fafc'
};

export default function DashboardOrchestrator() {
  const router = useRouter();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [consejeroIdClase, setConsejeroIdClase] = useState<string>('');
  
  const [currentView, setCurrentView] = useState<ViewState>('PREFLIGHT');
  const [presentes, setPresentes] = useState<any[]>([]);
  const [ausentes, setAusentes] = useState<any[]>([]);
  
  // 1. MOTOR DE IDENTIDAD (Auth Guard & Offline Fallback)
  useEffect(() => {
    const hidratarSesion = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // No hay JWT, expulsar al Login
          router.push('/login');
          return;
        }

        if (navigator.onLine) {
          // Modo Online: Consultar la base de datos maestra
          const { data: perfil, error } = await supabase
            .from('consejero')
            .select('id_clase')
            .eq('id_usuario', session.user.id)
            .single();

          if (error) throw error;
          
          if (perfil) {
            setConsejeroIdClase(perfil.id_clase);
            // Guardar en Caché L1 (Offline Badge)
            localStorage.setItem('offline_id_clase', perfil.id_clase);
          }
        } else {
          // Modo Offline: Rescate desde Caché L1
          const offlineId = localStorage.getItem('offline_id_clase');
          if (offlineId) {
            setConsejeroIdClase(offlineId);
          } else {
            // Falla catastrófica: Offline sin caché previo
            alert('Necesitas conexión a internet para tu primer inicio de sesión.');
            router.push('/login');
          }
        }
      } catch (error) {
        console.error("Error de hidratación de identidad:", error);
      } finally {
        setIsAuthLoading(false);
      }
    };

    hidratarSesion();
  }, [router]);

  // 2. LECTURA REACTIVA DE LA BASE DE DATOS LOCAL (DEXIE)
  const clasesDB = useLiveQuery(() => db.club_clase.toArray());

  // 3. ENLACE DE CONTEXTO VISUAL
  // Buscamos el tema de la clase basándonos ESTRICTAMENTE en la identidad del consejero
  const activeTheme = clasesDB?.find(c => c.id_clase === consejeroIdClase) || FALLBACK_THEME;

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
  const handleLogout = async () => {
    // 1. Destruir sesión en el servidor
    await supabase.auth.signOut();
    // 2. Destruir placa de identidad local
    localStorage.removeItem('offline_id_clase');
    // 3. Purgar la bóveda L2 (Dexie) para no mezclar datos de clases
    await Promise.all([
      db.club_clase.clear(),
      db.ninos.clear(),
      db.plan_ejecucion.clear(),
      db.registro_progreso.clear()
    ]);
    // 4. Expulsar al Login
    router.push('/login');
  };

  // Pantallas de Carga de Seguridad
  if (isAuthLoading) {
    return <div className="flex h-screen w-full items-center justify-center text-slate-500 font-mono text-sm">Verificando Credenciales Criptográficas...</div>;
  }

  if (clasesDB === undefined && consejeroIdClase) {
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
      
      {/* Botón de Logout Táctico */}
      <div className="px-4 pt-2 flex justify-end">
        <button 
          onClick={handleLogout}
          className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          Cerrar Sesión
        </button>
      </div>

      {/* CONTENEDOR DE LA APLICACIÓN */}
      <div className="flex-col h-full w-full p-4 flex-grow flex">
        {currentView === 'PREFLIGHT' && (
          <>
            <div className="flex gap-2 mb-4">
              <button 
                // AHORA USA EL ID REAL DEL CONSEJERO, NO EL QUEMADO
                onClick={() => prefetchData(consejeroIdClase)} 
                className="flex-1 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 rounded-lg transition-colors text-center shadow-sm active:scale-95"
              >
                ⬇️ Fetch Datos (Sábado)
              </button>
              <button 
                onClick={() => setCurrentView('PLANNER')} 
                className="flex-1 py-2 text-xs font-bold text-white rounded-lg transition-colors text-center shadow-sm active:scale-95"
                style={{ backgroundColor: 'var(--color-primario)' }}
              >
                📅 Planificador Anual
              </button>
            </div>
            
            {/* Si aún no ha descargado datos, avisarle elegantemente */}
            {activeTheme.id_clase === '' ? (
               <div className="flex-grow flex flex-col items-center justify-center text-center p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
                 <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-2xl">📡</div>
                 <h3 className="font-bold text-slate-800 mb-2">Bóveda Local Vacía</h3>
                 <p className="text-sm text-slate-500">Presiona "Fetch Datos" para descargar el padrón de tus niños y tu planificación de la semana.</p>
               </div>
            ) : (
              <PreFlightCheck nombreClase={activeTheme.nombre} onStartPipeline={handleStartPipeline} />
            )}
          </>
        )}

        {currentView === 'PLANNER' && (
          <CalendarPlanner idClase={consejeroIdClase} onBack={() => setCurrentView('PREFLIGHT')}/>
        )}
        
        {currentView === 'EXECUTION' && (
          <ExecutionHUD idClase={consejeroIdClase} onFinish={handleFinishPipeline} />
        )}
        
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
              Volver al inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}