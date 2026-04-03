// app/(dashboard)/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabaseClient';
import Navbar from '@/components/NavBar';
import InstallPrompt from '@/components/InstallPrompt';

const FALLBACK_THEME = {
  id_clase: '',
  nombre: 'Cargando...',
  color_primario_hex: '#94a3b8',
  color_secundario_hex: '#cbd5e1',
  color_acento_hex: '#e2e8f0',
  color_fondo_hex: '#f8fafc'
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // 1. EL ESCUDO ANTI-HIDRATACIÓN (SSR Bypass)
  const [isMounted, setIsMounted] = useState(false);

  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [consejeroIdClase, setConsejeroIdClase] = useState<string>('');
  const [isOnline, setIsOnline] = useState(true);

  // Desactivamos el escudo solo cuando el navegador ya cargó todo
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 2. DETECTOR DE RED
  useEffect(() => {
    if (!isMounted) return;
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isMounted]);
  
  // 3. MOTOR DE IDENTIDAD
  useEffect(() => {
    if (!isMounted) return;
    const hidratarSesion = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push('/login'); return; }

        const offlineId = localStorage.getItem('offline_id_clase');

        try {
          if (navigator.onLine) {
            const fetchPerfil = supabase.from('consejero').select('id_clase').eq('id_usuario', session.user.id).single();
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 4000));
            const { data: perfil, error } = await Promise.race([fetchPerfil, timeout]) as any;

            if (error) throw error; 
            
            if (perfil) {
              setConsejeroIdClase(perfil.id_clase);
              localStorage.setItem('offline_id_clase', perfil.id_clase);
              return; 
            }
          }
        } catch (networkError) {
          console.warn('[Identidad] Activando Offline Fallback.');
        }

        if (offlineId) {
          setConsejeroIdClase(offlineId);
        } else {
          alert('Error: Necesitas conexión a internet para iniciar sesión la primera vez.');
          router.push('/login');
        }
      } catch (error) {
        console.error("Error en capa de identidad:", error);
      } finally {
        setIsAuthLoading(false);
      }
    };
    hidratarSesion();
  }, [isMounted, router]);

  // 4. BASE DE DATOS LOCAL Y THEMING (Dexie)
  const clasesDB = useLiveQuery(() => db.club_clase.toArray());
  const activeTheme = clasesDB?.find(c => c.id_clase === consejeroIdClase) || FALLBACK_THEME;

  useEffect(() => {
    if (!isMounted) return;
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', activeTheme.color_fondo_hex);
    } else {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      metaThemeColor.setAttribute('content', activeTheme.color_fondo_hex);
      document.head.appendChild(metaThemeColor);
    }
  }, [activeTheme.color_fondo_hex, isMounted]);

  // ==========================================
  // BARRERAS DE RENDERIZADO
  // ==========================================

  // A. BARRERA DEL SERVIDOR: Esto previene el error rojo de hidratación
  if (!isMounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500 font-medium text-sm">
        Iniciando Adventurers OS...
      </div>
    );
  }

  // B. BARRERAS DEL CLIENTE
  if (isAuthLoading) {
    return <div className="flex h-screen w-full items-center justify-center text-slate-500 font-medium text-sm">Validando credenciales...</div>;
  }
  if (clasesDB === undefined && consejeroIdClase) {
    return <div className="flex h-screen w-full items-center justify-center text-slate-500 font-medium text-sm">Montando Base de Datos Local...</div>;
  }

  // C. RENDERIZADO FINAL
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
      <Navbar nombreClase={activeTheme.nombre} isOnline={isOnline} />
      
      {/* Usamos un div para no chocar con el <main> del RootLayout */}
      <div className="flex-1 overflow-y-auto relative p-4">
        {children}
      </div>

      <InstallPrompt />
    </div>
  );
}