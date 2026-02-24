// components/ExecutionHUD.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

type PipelineState = {
  id: number;
  fase: string;
  duracionMinutos: number;
  objetivo: string;
  instruccionPrincipal: string;
  instruccionAuxiliar?: string;
};

export default function ExecutionHUD({ idClase, onFinish }: { idClase: string, onFinish: () => void }) {
  // 1. LECTURA OFFLINE: Buscamos el plan guardado en el teléfono
  const planLocal = useLiveQuery(() => db.plan_ejecucion.where('id_clase').equals(idClase).first());

  // 2. COMPILADOR DINÁMICO DE LA MÁQUINA DE ESTADOS (FSM)
  const PIPELINE = useMemo<PipelineState[]>(() => {
    // Tolerancia a fallos: Si no hay plan (el maestro olvidó planear), inyectamos contingencia
    const reqTitulo = planLocal?.titulo_requisito || 'Actividad de Contingencia';
    const fase3Inst = planLocal?.hud_fase3_instruccion || 'El maestro no sincronizó un plan para hoy.\n\nProcede con una historia bíblica libre o repaso de los ideales del club.';
    const fase3Aux = planLocal?.hud_fase3_auxiliar;
    const fase4Inst = planLocal?.hud_fase4_instruccion || 'Manualidad libre con crayones y hojas en blanco.\nFomenta el compañerismo.';
    const fase4Aux = planLocal?.hud_fase4_auxiliar;

    return [
      { id: 1, fase: 'Descarga Motriz', duracionMinutos: 10, objetivo: 'Canto y mímica expansiva', instruccionPrincipal: '1. Formar un círculo.\n2. Cantar "Adentro, afuera, arriba, abajo".\n3. Repetir 3 veces aumentando la velocidad.' },
      { id: 2, fase: 'Transición', duracionMinutos: 5, objetivo: 'Bajar revoluciones', instruccionPrincipal: '1. Pedir que se sienten en sus cojines.\n2. Cantar "Silencio, silencio".' },
      
      // LAS FASES DINÁMICAS INYECTADAS
      { id: 3, fase: 'Pico Cognitivo', duracionMinutos: 15, objetivo: reqTitulo, instruccionPrincipal: fase3Inst, instruccionAuxiliar: fase3Aux },
      { id: 4, fase: 'Output Kinestésico', duracionMinutos: 15, objetivo: 'Manualidad / Evidencia', instruccionPrincipal: fase4Inst, instruccionAuxiliar: fase4Aux },
      
      { id: 5, fase: 'Cierre y Limpieza', duracionMinutos: 5, objetivo: 'Garbage Collection', instruccionPrincipal: '1. Cantar la canción de recoger.\n2. Guardar materiales en las cajas.\n3. Oración final.' }
    ];
  }, [planLocal]);

  // 3. MOTOR DE ESTADO Y TIEMPO
  const [currentStateIndex, setCurrentStateIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  // Cuando cambia la fase (o se carga el pipeline), reseteamos el cronómetro de esa fase
  useEffect(() => {
    if (PIPELINE.length > 0) {
      setTimeLeft(PIPELINE[currentStateIndex].duracionMinutos * 60);
    }
  }, [currentStateIndex, PIPELINE]);

  const currentState = PIPELINE[currentStateIndex];
  const isLastState = currentStateIndex === PIPELINE.length - 1;

  // El Reloj Táctico
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const handleNextState = () => {
    if (!isLastState) {
      setCurrentStateIndex(prev => prev + 1);
    } else {
      onFinish();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(Math.abs(seconds) / 60).toString().padStart(2, '0');
    const s = (Math.abs(seconds) % 60).toString().padStart(2, '0');
    return seconds < 0 ? `-${m}:${s}` : `${m}:${s}`;
  };

  // Pantalla de protección mientras Dexie busca en la memoria
  if (planLocal === undefined) {
    return <div className="flex h-full w-full items-center justify-center text-slate-500 font-mono text-sm">Cargando pipeline táctico...</div>;
  }

  return (
    <div className="flex flex-col h-full flex-grow">
      {/* Progress Bar Dinámica */}
      <div className="flex w-full gap-1 mb-4 h-2 rounded-full overflow-hidden bg-slate-200">
        {PIPELINE.map((state, index) => (
          <div 
            key={state.id} 
            className="h-full flex-1 transition-all duration-300"
            style={{ backgroundColor: index <= currentStateIndex ? 'var(--color-primario)' : 'transparent' }}
          />
        ))}
      </div>

      <div className="flex flex-col items-center justify-center py-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-center px-4" style={{ color: 'var(--color-primario)' }}>
          {currentState.id}: {currentState.fase}
          <span className="block text-xs font-medium text-slate-400 mt-1 lowercase opacity-80">
            {currentState.objetivo}
          </span>
        </h2>
        
        <div className={`text-7xl font-mono font-black mt-2 tracking-tighter transition-colors ${timeLeft <= 0 ? 'text-rose-600 animate-pulse' : 'text-slate-800'}`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex-grow flex flex-col gap-4 overflow-y-auto pb-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--color-primario)' }} />
            <h3 className="font-bold text-slate-800">Tu Instrucción</h3>
          </div>
          <p className="text-slate-600 whitespace-pre-line leading-relaxed font-medium">
            {currentState.instruccionPrincipal}
          </p>
        </div>

        {currentState.instruccionAuxiliar && (
          <div className="bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-700 flex-shrink-0 animate-fade-in">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg>
              Apoyo Auxiliar
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {currentState.instruccionAuxiliar}
            </p>
          </div>
        )}
      </div>

      <button 
        onClick={handleNextState}
        className="mt-auto w-full text-white font-bold text-lg py-5 rounded-2xl transition-all flex justify-center items-center gap-2 hover:brightness-110 active:translate-y-1.5 active:shadow-none"
        style={{ 
          backgroundColor: 'var(--color-primario)',
          boxShadow: '0 6px 0 color-mix(in srgb, var(--color-primario) 75%, black)' 
        }}
      >
        {isLastState ? 'Terminar Actividades ✓' : 'Siguiente Actividad ➡️'}
      </button>
    </div>
  );
}