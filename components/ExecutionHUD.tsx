// components/ExecutionHUD.tsx
'use client';

import { useState, useEffect } from 'react';

type PipelineState = {
  id: number;
  fase: string;
  duracionMinutos: number;
  objetivo: string;
  instruccionPrincipal: string;
  instruccionAuxiliar?: string;
};

const MOCK_PIPELINE: PipelineState[] = [
  { id: 1, fase: 'Descarga Motriz', duracionMinutos: 10, objetivo: 'Canto y mímica expansiva', instruccionPrincipal: '1. Formar un círculo.\n2. Cantar "Adentro, afuera, arriba, abajo".\n3. Repetir 3 veces aumentando la velocidad.' },
  { id: 2, fase: 'Transición', duracionMinutos: 5, objetivo: 'Bajar revoluciones', instruccionPrincipal: '1. Pedir que se sienten en sus cojines.\n2. Cantar "Silencio, silencio".' },
  { id: 3, fase: 'Pico Cognitivo', duracionMinutos: 15, objetivo: 'Instrucción directa', instruccionPrincipal: '1. Mostrar lámina de los días de la creación.\n2. Enseñar el día 1 y 2.\n3. Hacer que repitan usando los dedos.', instruccionAuxiliar: 'Mantener contacto visual con Pedrito y María para evitar distracciones. Tener listos los recortes.' },
  { id: 4, fase: 'Output Kinestésico', duracionMinutos: 15, objetivo: 'Manualidad / Evidencia', instruccionPrincipal: '1. Entregar hojas de trabajo.\n2. Guiar en el coloreado del día 1 (Luz y oscuridad).' },
  { id: 5, fase: 'Cierre y Limpieza', duracionMinutos: 5, objetivo: 'Garbage Collection', instruccionPrincipal: '1. Cantar la canción de recoger.\n2. Guardar materiales en las cajas.\n3. Oración final.' }
];

export default function ExecutionHUD({ onFinish }: { onFinish: () => void }) {
  const [currentStateIndex, setCurrentStateIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MOCK_PIPELINE[0].duracionMinutos * 60);
  
  const currentState = MOCK_PIPELINE[currentStateIndex];
  const isLastState = currentStateIndex === MOCK_PIPELINE.length - 1;

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const handleNextState = () => {
    if (!isLastState) {
      const nextIndex = currentStateIndex + 1;
      setCurrentStateIndex(nextIndex);
      setTimeLeft(MOCK_PIPELINE[nextIndex].duracionMinutos * 60);
    } else {
      onFinish();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(Math.abs(seconds) / 60).toString().padStart(2, '0');
    const s = (Math.abs(seconds) % 60).toString().padStart(2, '0');
    return seconds < 0 ? `-${m}:${s}` : `${m}:${s}`;
  };

  return (
    <div className="flex flex-col h-full flex-grow">
      {/* Progress Bar Dinámica */}
      <div className="flex w-full gap-1 mb-4 h-2 rounded-full overflow-hidden bg-slate-200">
        {MOCK_PIPELINE.map((state, index) => (
          <div 
            key={state.id} 
            className="h-full flex-1 transition-all duration-300"
            style={{ backgroundColor: index <= currentStateIndex ? 'var(--color-primario)' : 'transparent' }}
          />
        ))}
      </div>

      <div className="flex flex-col items-center justify-center py-6">
        <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-primario)' }}>
          Estado {currentState.id}: {currentState.fase}
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
          <div className="bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-700 flex-shrink-0">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg>
              Apoyo Auxiliar
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
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