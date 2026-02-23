// components/PostFlightCheck.tsx
'use client';

import { useState } from 'react';

// Reutilizamos la estructura básica
type NinoPresente = {
  id_nino: string;
  nombre: string;
  evidenciaCompletada: boolean;
};

export default function PostFlightCheck({ 
  asistentes, 
  onSyncAndClose 
}: { 
  asistentes: { id_nino: string, nombre: string }[], 
  onSyncAndClose: () => void 
}) {
  // Inicializamos el estado asumiendo que, si estuvieron en clase, probablemente hicieron la manualidad
  const [evidencias, setEvidencias] = useState<NinoPresente[]>(
    asistentes.map(a => ({ ...a, evidenciaCompletada: true }))
  );

  const handleToggleEvidencia = (id: string) => {
    setEvidencias(prev => prev.map(n => 
      n.id_nino === id ? { ...n, evidenciaCompletada: !n.evidenciaCompletada } : n
    ));
  };

  const sinEvidenciaCount = evidencias.filter(e => !e.evidenciaCompletada).length;

  return (
    <div className="flex flex-col h-full flex-grow">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Post-Flight</h2>
        <p className="text-slate-500 font-medium text-sm">Validación de Evidencias y Cierre</p>
      </div>

      {/* Lista de Evaluación */}
      <div className="flex-grow flex flex-col gap-3 overflow-y-auto pb-4">
        {evidencias.length === 0 ? (
          <div className="text-center text-slate-500 my-auto">No hubo asistentes en esta sesión.</div>
        ) : (
          evidencias.map((nino) => (
            <div key={nino.id_nino} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">{nino.nombre}</h3>
              
              <button 
                onClick={() => handleToggleEvidencia(nino.id_nino)}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-colors ${
                  nino.evidenciaCompletada ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {nino.evidenciaCompletada ? 'Manualidad ✓' : 'Sin Evidencia'}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Acción Inferior: Despachar a Dexie/Supabase */}
      <div className="mt-auto pt-4 bg-slate-50">
        {sinEvidenciaCount > 0 && (
          <p className="text-xs text-amber-600 text-center mb-2 font-medium">
            ⚠️ {sinEvidenciaCount} niño(s) sin evidencia. Quedará pendiente de recuperación.
          </p>
        )}
        <button 
          onClick={onSyncAndClose}
          className="w-full bg-slate-900 active:bg-slate-800 text-white font-bold text-lg py-5 rounded-2xl shadow-lg transition-transform transform active:scale-[0.98] flex justify-center items-center gap-2"
        >
          Finalizar y Encolar Sync
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
        </button>
      </div>
    </div>
  );
}