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

export default function PreFlightCheck({ onStartPipeline }: { onStartPipeline: (datos: NinoRegistroState[]) => void }) {
  // Conexión real a la BD local: Trae todos los niños de Dexie
  const ninosDB = useLiveQuery(() => db.ninos.toArray());
  
  // Estado para manejar los toggles en la pantalla antes de hacer el commit
  const [ninosUI, setNinosUI] = useState<NinoRegistroState[]>([]);

  // Cuando la BD local cargue los datos, inicializamos el estado de la UI
  // Todos inician como Ausentes (false) por defecto.
  useEffect(() => {
    if (ninosDB) {
      setNinosUI(ninosDB.map(n => ({
        id_nino: n.id_nino,
        nombre: n.nombre_completo.split(' ')[0], // Mostramos solo el primer nombre para no saturar UI
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

  // Pantalla de carga mientras lee Dexie
  if (!ninosDB) return <div className="p-8 text-center text-slate-500">Cargando base de datos local...</div>;

  return (
    <div className="flex flex-col h-full flex-grow">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pase de Lista</h2>
        <p className="text-slate-500 font-medium text-sm">Pre-Flight Check - 10:00 AM</p>
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
                
                <button onClick={() => handleToggle(nino.id_nino, 'presente')} 
                  className={`
                    relative px-5 py-3 rounded-xl font-bold text-sm uppercase tracking-wide
                    transition-all duration-200 ease-in-out transform
                    active:scale-95 active:shadow-inner select-none
                    ${nino.presente 
                      ? 'bg-emerald-500 text-white shadow-[0_4px_0_rgb(4,120,87)] hover:bg-emerald-400 active:translate-y-1 active:shadow-[0_0px_0_rgb(4,120,87)]' 
                      : 'bg-white text-slate-500 border-2 border-slate-200 shadow-sm hover:bg-slate-50'
                    }
                  `}>
                  {nino.presente ? '✓ Presente' : 'Ausente'}
                </button>
              </div>

              <div className={`flex gap-3 mt-3 transition-all duration-300 origin-top ${nino.presente ? 'scale-y-100 opacity-100 h-auto' : 'scale-y-0 opacity-0 h-0 overflow-hidden pointer-events-none'}`}>
  
              {/* Botón: Materiales (Física Slate/Oscuro) */}
              <button
                onClick={() => handleToggle(nino.id_nino, 'trajoMateriales')}
                className={`
                  relative flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider
                  transition-all duration-200 ease-in-out select-none active:scale-95
                  ${nino.trajoMateriales 
                    ? 'bg-slate-700 text-white border-2 border-slate-700 shadow-[0_4px_0_rgb(51,65,85)] active:translate-y-1 active:shadow-none' 
                    : 'bg-white text-slate-500 border-2 border-slate-200 shadow-sm hover:bg-slate-50'
                  }
                `}
              >
                {nino.trajoMateriales ? '📦 Materiales ✓' : '📦 Faltó material'}
              </button>

              {/* Botón: Culto (Física Púrpura/Continuo) */}
              <button
                onClick={() => handleToggle(nino.id_nino, 'cultoFirmado')}
                className={`
                  relative flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider
                  transition-all duration-200 ease-in-out select-none active:scale-95
                  ${nino.cultoFirmado 
                    ? 'bg-purple-600 text-white border-2 border-purple-600 shadow-[0_4px_0_rgb(147,51,234)] active:translate-y-1 active:shadow-none' 
                    : 'bg-white text-slate-500 border-2 border-slate-200 shadow-sm hover:bg-slate-50'
                  }
                `}
              >
                {nino.cultoFirmado ? '📖 Culto ✓' : '📖 Sin Culto'}
              </button>
            </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-auto pt-4 bg-slate-50">
        {ausentesCount > 0 && ninosUI.length > 0 && <p className="text-xs text-rose-600 text-center mb-2 font-medium">⚠️ {ausentesCount} niño(s) ausente(s). Se encolará el Recovery Protocol.</p>}
        <button onClick={() => onStartPipeline(ninosUI)} disabled={ninosUI.length === 0} className="w-full bg-emerald-600 disabled:bg-slate-300 disabled:transform-none active:bg-emerald-700 text-white font-bold text-lg py-5 rounded-2xl shadow-lg transition-transform transform active:scale-[0.98] flex justify-center items-center gap-2">
          Arrancar Clase (Commit)
        </button>
      </div>
    </div>
  );
}