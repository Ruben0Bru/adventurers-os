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
import InstallPrompt from '@/components/InstallPrompt';

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
  const [isOnline, setIsOnline] = useState(true);

  // DETECTOR DE RED GLOBAL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);
  
 // 1. MOTOR DE IDENTIDAD (Auth Guard & Offline Fallback Definitivo)
  useEffect(() => {
    const hidratarSesion = async () => {
      try {
        // A. Obtener sesión de la caché del navegador (Rápido, no requiere red)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }

        // B. PRE-CARGAR LA CACHÉ L1 SIEMPRE: Nuestra red de seguridad
        const offlineId = localStorage.getItem('offline_id_clase');

        try {
          // C. Sincronización con Timeout Competitivo (Máximo 4 segundos)
          if (navigator.onLine) {
            const fetchPerfil = supabase.from('consejero').select('id_clase').eq('id_usuario', session.user.id).single();
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 4000));
            
            // Compiten las dos promesas: La red vs El Reloj
            const { data: perfil, error } = await Promise.race([fetchPerfil, timeout]) as any;

            if (error) throw error; 
            
            if (perfil) {
              setConsejeroIdClase(perfil.id_clase);
              localStorage.setItem('offline_id_clase', perfil.id_clase);
              return; // Éxito online, salimos.
            }
          }
        } catch (networkError) {
          console.warn('[Identidad] Red muy lenta o caída. Abortando y activando Offline.');
        }

        // D. EL CORTAFUEGOS OFFLINE: Si la nube falló o estamos 100% desconectados
        if (offlineId) {
          console.log('[Identidad] Usando placa de identidad local (Dexie L1).');
          setConsejeroIdClase(offlineId);
        } else {
          alert('¡Ups!. Necesitas conexión a internet para iniciar sesión la primera vez.');
          router.push('/login');
        }

      } catch (error) {
        console.error("Error catastrófico de hidratación:", error);
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
    try {
      // 1. Intenta destruir sesión en el servidor (Fallará si no hay internet)
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('[Logout] Servidor inalcanzable. Forzando limpieza local.');
    } finally {
      // 2. ESTO SE EJECUTA SÍ O SÍ
      localStorage.removeItem('offline_id_clase');
      await Promise.all([
        db.club_clase.clear(),
        db.ninos.clear(),
        db.plan_ejecucion.clear(),
        db.registro_progreso.clear()
      ]);
      router.push('/login');
    }
  };

  // Pantallas de Carga de Seguridad
  if (isAuthLoading) {
    return <div className="flex h-screen w-full items-center justify-center text-slate-500 font-medium text-sm gap-2">
      <svg className="animate-spin h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      Iniciando sesión...
    </div>;
  }

  if (clasesDB === undefined && consejeroIdClase) {
    return <div className="flex h-screen w-full items-center justify-center text-slate-500 font-medium text-sm">Preparando tu espacio de trabajo... 🏕️</div>;
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
      <Navbar nombreClase={activeTheme.nombre} isOnline={isOnline}/>
      
      {/* Botón de Logout Táctico */}
      <div className="px-4 pt-2 flex justify-end">
        <button 
          onClick={handleLogout}
          disabled={!isOnline}
          className={`text-xs font-bold flex items-center gap-1 transition-colors ${
            isOnline 
              ? 'text-slate-400 hover:text-rose-500 cursor-pointer' 
              : 'text-slate-300 opacity-50 cursor-not-allowed'
          }`}
          title={!isOnline ? "Necesitas conexión para cerrar sesión de forma segura" : "Cerrar sesión"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          {isOnline ? 'Cerrar Sesión' : 'Logout Deshabilitado (Offline)'}
        </button>
      </div>

      {/* CONTENEDOR DE LA APLICACIÓN */}
      <div className="flex-col h-full w-full p-4 flex-grow flex">
        {currentView === 'PREFLIGHT' && (
          <>
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => isOnline ? prefetchData(consejeroIdClase) : alert("Conéctate a internet para descargar la clase.")} 
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all text-center shadow-sm flex items-center justify-center gap-2 ${
                  isOnline 
                    ? 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95' 
                    : 'text-slate-400 bg-slate-50 opacity-60 cursor-not-allowed border border-slate-100'
                }`}
              >
                {isOnline ? (
                  <><svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path></svg> Descargar Clase</>
                ) : (
                  <><svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243-2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"></path></svg> Sin Conexión</>
                )}
              </button>
              
              <button 
                onClick={() => isOnline ? setCurrentView('PLANNER') : alert("La planificación requiere conexión a internet.")} 
                className={`flex-1 py-3 text-sm font-bold text-white rounded-xl transition-all text-center shadow-sm flex items-center justify-center gap-2 ${
                  isOnline ? 'active:scale-95 hover:brightness-110' : 'opacity-60 cursor-not-allowed'
                }`}
                style={{ backgroundColor: 'var(--color-primario)' }}
              >
                <svg className="w-5 h-5 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                Planificar
              </button>
            </div>
            
            {/* Si aún no ha descargado datos, avisarle elegantemente */}
            {activeTheme.id_clase === '' ? (
               <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-100/50 mt-2">
                 <div className="w-20 h-20 bg-sky-50 rounded-full flex items-center justify-center mb-5 text-4xl shadow-inner border border-sky-100">
                   ☁️
                 </div>
                 <h3 className="font-black text-slate-800 mb-2 text-lg tracking-tight">Aún no hay datos para hoy</h3>
                 <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[250px]">
                   Toca <strong className="text-slate-700">Descargar Clase</strong> para guardar la asistencia y las actividades de esta semana en tu teléfono.
                 </p>
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
      <InstallPrompt />
    </div>
  );
}