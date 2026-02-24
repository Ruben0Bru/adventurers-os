// app/login/page.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Petición de Autenticación al servidor de Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Redirección al Orquestador (Dashboard)
      if (data.session) {
        router.push('/');
      }
    } catch (error: any) {
      setError(error.message || 'Credenciales inválidas. Verifica tu acceso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Contenedor principal con una imagen de fondo inmersiva (Naturaleza / Aventura)
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-900">
      
      {/* Imagen de fondo (Reemplaza el src con una imagen real del club o un bosque vectorial) */}
      <div className="absolute inset-0 w-full h-full opacity-40 mix-blend-overlay">
        <img 
          src="https://i.pinimg.com/736x/cb/02/1f/cb021ff9e64345bbecbdb65284a0ec92.jpg" 
          alt="Fondo Aventura" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Tarjeta Glassmorphism (Optimizada para GPU) */}
      <div className="relative z-10 w-full max-w-sm px-6">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl rounded-3xl p-8 flex flex-col items-center">
          
          {/* Logo / Emblema Placeholder */}
          <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-2xl rotate-45 flex items-center justify-center shadow-lg mb-8 border-2 border-white/30">
            <div className="rotate-[-45deg] text-white font-black text-2xl tracking-tighter">
              OS
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-white tracking-tight mb-1">Aventureros OS</h1>
            <p className="text-sm text-slate-300 font-medium">Portal de Consejeros</p>
          </div>

          <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1">Correo Electrónico</label>
              <input 
                type="email" 
                required
                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-400 rounded-xl px-4 py-3 outline-none focus:bg-white/10 focus:border-amber-400/50 transition-all font-medium"
                placeholder="guia.mayor@club.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1">Contraseña de Acceso</label>
              <input 
                type="password" 
                required
                className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-400 rounded-xl px-4 py-3 outline-none focus:bg-white/10 focus:border-amber-400/50 transition-all font-medium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-rose-500/20 border border-rose-500/50 text-rose-200 text-xs font-bold p-3 rounded-lg text-center animate-fade-in">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-sm uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : 'Iniciar Sesión'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}