// components/PreFlightCheck.tsx
'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

type NinoRegistroState = {
  id_nino: string;
  nombre: string;
  telefono_contacto: string;
  presente: boolean;
  trajoMateriales: boolean;
  cultoFirmado: boolean;
};

export default function PreFlightCheck({ nombreClase, onStartPipeline }: { nombreClase: string, onStartPipeline: (datos: NinoRegistroState[]) => void }) {
  const ninosDB = useLiveQuery(() => db.ninos.toArray());
  const [ninosUI, setNinosUI] = useState<NinoRegistroState[]>([]);

  useEffect(() => {
    if (ninosDB) {
      setNinosUI(ninosDB.map(n => ({
        id_nino: n.id_nino,
        nombre: n.nombre_completo.split(' ')[0],
        telefono_contacto: n.telefono_contacto,
        presente: false,
        trajoMateriales: false,
        cultoFirmado: false
      })));
    }
  }, [ninosDB]);

  const handleToggle = (id: string, field: keyof NinoRegistroState) => {
    setNinosUI((prev) =>
      prev.map((nino) => {
        if (nino.id_nino !== id) return nino;
        const updated = { ...nino, [field]: !nino[field] };
        if (field === 'presente' && !updated.presente) {
          updated.trajoMateriales = false;
          updated.cultoFirmado = false;
        }
        return updated;
      })
    );
  };

  const ausentesCount = ninosUI.filter(n => !n.presente).length;

  if (!ninosDB) return <div className="p-8 text-center text-slate-500">Cargando base de datos local...</div>;

  return (
    <div className="flex flex-col h-full flex-grow">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight transition-colors">Recepción de {nombreClase}</h2>
        <p className="text-slate-500 font-medium text-sm">Pase de lista y revisión de materiales</p>
      </div>

      <div className="flex-grow flex flex-col gap-3 overflow-y-auto pb-4">
        {ninosUI.length === 0 ? (
          <div className="text-center p-4 bg-amber-50 rounded-xl text-amber-700 text-sm">
            No hay niños en la base de datos local. Ejecuta el Pre-Fetch primero.
          </div>
        ) : (
          ninosUI.map((nino) => (
            <div key={nino.id_nino} className={`p-4 rounded-2xl border transition-colors ${nino.presente ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-bold text-lg ${nino.presente ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{nino.nombre}</h3>
                
                {/* CORRECCIÓN: Inyectamos backgroundColor directamente en el estilo en línea */}
                <button 
                  onClick={() => handleToggle(nino.id_nino, 'presente')} 
                  className={`
                    relative px-5 py-3 rounded-xl font-bold text-sm uppercase tracking-wide
                    transition-all duration-200 ease-in-out transform select-none
                    ${nino.presente 
                      ? 'text-white hover:brightness-110 active:translate-y-1 active:shadow-none' // Quitamos bg-clase-primario de aquí
                      : 'bg-white text-slate-500 border-2 border-slate-200 shadow-sm hover:bg-slate-50 active:scale-95'
                    }
                  `}
                  style={nino.presente ? { 
                    backgroundColor: 'var(--color-primario)', // <-- AQUÍ ESTÁ LA MAGIA
                    boxShadow: '0 4px 0 color-mix(in srgb, var(--color-primario) 75%, black)' 
                  } : {}}
                >
                  {nino.presente ? '✓ Presente' : 'Ausente'}
                </button>
              </div>

              <div className={`flex gap-3 mt-3 transition-all duration-300 origin-top ${nino.presente ? 'scale-y-100 opacity-100 h-auto' : 'scale-y-0 opacity-0 h-0 overflow-hidden pointer-events-none'}`}>
                <button
                  onClick={() => handleToggle(nino.id_nino, 'trajoMateriales')}
                  className={`relative flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ease-in-out select-none active:scale-95 ${nino.trajoMateriales ? 'text-white active:translate-y-1 active:shadow-none' : 'bg-white text-slate-500 border-2 border-slate-200 shadow-sm hover:bg-slate-50'}`}
                  style={nino.trajoMateriales ? { 
                    backgroundColor: 'var(--color-secundario)', 
                    boxShadow: '0 4px 0 color-mix(in srgb, var(--color-secundario) 75%, black)' 
                  } : {}}
                >
                  {nino.trajoMateriales ? '📦 Materiales ✓' : '📦 Faltó material'}
                </button>

                <button
                  onClick={() => handleToggle(nino.id_nino, 'cultoFirmado')}
                  className={`relative flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ease-in-out select-none active:scale-95 ${nino.cultoFirmado ? 'text-white active:translate-y-1 active:shadow-none' : 'bg-white text-slate-500 border-2 border-slate-200 shadow-sm hover:bg-slate-50'}`}
                  style={nino.cultoFirmado ? { 
                    backgroundColor: 'var(--color-acento)', 
                    boxShadow: '0 4px 0 color-mix(in srgb, var(--color-acento) 75%, black)' 
                  } : {}}
                >
                  {nino.cultoFirmado ? '📖 Culto ✓' : '📖 Sin Culto'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-auto pt-4 bg-transparent">
        {ausentesCount > 0 && ninosUI.length > 0 && (
          <p className="text-xs text-rose-500 text-center mb-2 font-medium">
            ⚠️ {ausentesCount} niño(s) ausente(s). Se activará el plan de apoyo.
          </p>
        )}
        {/* CORRECCIÓN: Inyectamos backgroundColor también en el botón final */}
        <button 
          onClick={() => onStartPipeline(ninosUI)} 
          disabled={ninosUI.length === 0} 
          className="w-full text-white font-bold text-lg py-5 rounded-2xl transition-all flex justify-center items-center gap-2 hover:brightness-110 active:translate-y-1.5 active:shadow-none disabled:bg-slate-300 disabled:shadow-none disabled:translate-y-0"
          style={{ 
            backgroundColor: ninosUI.length > 0 ? 'var(--color-primario)' : undefined,
            boxShadow: ninosUI.length > 0 ? '0 6px 0 color-mix(in srgb, var(--color-primario) 75%, black)' : 'none' 
          }}
        >
          Comenzar Clase 🚀
        </button>
      </div>
    </div>
  );
}