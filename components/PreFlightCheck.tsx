// components/PreFlightCheck.tsx
'use client';

import { useState } from 'react';

// Tipado y Mock de la base de datos local
type NinoRegistro = {
  id_nino: string;
  nombre: string;
  presente: boolean;
  trajoMateriales: boolean;
  cultoFirmado: boolean;
};

const MOCK_NINOS: NinoRegistro[] = [
  { id_nino: '1', nombre: 'Pedrito', presente: true, trajoMateriales: false, cultoFirmado: false },
  { id_nino: '2', nombre: 'María', presente: true, trajoMateriales: false, cultoFirmado: false },
  { id_nino: '3', nombre: 'Juan', presente: false, trajoMateriales: false, cultoFirmado: false },
  { id_nino: '4', nombre: 'Ana', presente: true, trajoMateriales: false, cultoFirmado: false },
  { id_nino: '5', nombre: 'Carlos', presente: true, trajoMateriales: false, cultoFirmado: false },
  { id_nino: '6', nombre: 'Laura', presente: false, trajoMateriales: false, cultoFirmado: false },
  { id_nino: '7', nombre: 'Miguel', presente: true, trajoMateriales: false, cultoFirmado: false },
  { id_nino: '8', nombre: 'Sofia', presente: true, trajoMateriales: false, cultoFirmado: false },
  { id_nino: '9', nombre: 'David', presente: true, trajoMateriales: false, cultoFirmado: false },
  { id_nino: '10', nombre: 'Elena', presente: true, trajoMateriales: false, cultoFirmado: false },
];

export default function PreFlightCheck({ onStartPipeline }: { onStartPipeline: (datos: NinoRegistro[]) => void }) {  const [ninos, setNinos] = useState<NinoRegistro[]>(MOCK_NINOS);

  // Manejador genérico para los toggles (Actualiza el estado inmutablemente)
  const handleToggle = (id: string, field: keyof NinoRegistro) => {
    setNinos((prev) =>
      prev.map((nino) => {
        if (nino.id_nino !== id) return nino;
        
        const updated = { ...nino, [field]: !nino[field] };
        
        // Regla de Desactivación en Cascada: Si se marca ausente, limpiar las otras variables
        if (field === 'presente' && !updated.presente) {
          updated.trajoMateriales = false;
          updated.cultoFirmado = false;
        }
        
        return updated;
      })
    );
  };

  const ausentesCount = ninos.filter(n => !n.presente).length;

  return (
    <div className="flex flex-col h-full flex-grow">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pase de Lista</h2>
        <p className="text-slate-500 font-medium text-sm">Pre-Flight Check - 10:00 AM</p>
      </div>

      {/* Lista de Niños (Scrollable) */}
      <div className="flex-grow flex flex-col gap-3 overflow-y-auto pb-4">
        {ninos.map((nino) => (
          <div 
            key={nino.id_nino} 
            className={`p-4 rounded-2xl border transition-colors ${
              nino.presente ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-100 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-bold text-lg ${nino.presente ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                {nino.nombre}
              </h3>
              
              {/* Master Toggle: Asistencia */}
              <button 
                onClick={() => handleToggle(nino.id_nino, 'presente')}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                  nino.presente ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {nino.presente ? 'Presente' : 'Ausente'}
              </button>
            </div>

            {/* Sub-Toggles (Condicionados a la asistencia) */}
            <div className={`flex gap-2 transition-opacity ${nino.presente ? 'opacity-100' : 'opacity-0 pointer-events-none hidden'}`}>
              <button
                onClick={() => handleToggle(nino.id_nino, 'trajoMateriales')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                  nino.trajoMateriales ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-300'
                }`}
              >
                📦 Materiales
              </button>
              <button
                onClick={() => handleToggle(nino.id_nino, 'cultoFirmado')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                  nino.cultoFirmado ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-500 border-slate-300'
                }`}
              >
                📖 Culto
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Acción Inferior: Commit & Start */}
      <div className="mt-auto pt-4 bg-slate-50">
        {ausentesCount > 0 && (
          <p className="text-xs text-rose-600 text-center mb-2 font-medium">
            ⚠️ {ausentesCount} niño(s) ausente(s). Se encolará el Recovery Protocol.
          </p>
        )}
        <button 
          onClick={() => onStartPipeline(ninos)}
          className="w-full bg-emerald-600 active:bg-emerald-700 text-white font-bold text-lg py-5 rounded-2xl shadow-lg transition-transform transform active:scale-[0.98] flex justify-center items-center gap-2"
        >
          Arrancar Clase (Commit)
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
        </button>
      </div>
    </div>
  );
}