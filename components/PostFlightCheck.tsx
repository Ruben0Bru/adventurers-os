// components/PostFlightCheck.tsx
'use client';

import { useState } from 'react';

type NinoRegistroState = { id_nino: string; nombre: string; telefono_contacto: string; };
type NinoPresente = NinoRegistroState & { evidenciaCompletada: boolean; };

export default function PostFlightCheck({ 
  asistentes, 
  ausentes,
  onSyncAndClose 
}: { 
  asistentes: NinoRegistroState[], 
  ausentes: NinoRegistroState[],
  onSyncAndClose: () => void 
}) {
  const [evidencias, setEvidencias] = useState<NinoPresente[]>(
    asistentes.map(a => ({ ...a, evidenciaCompletada: true }))
  );

  const handleToggleEvidencia = (id: string) => {
    setEvidencias(prev => prev.map(n => 
      n.id_nino === id ? { ...n, evidenciaCompletada: !n.evidenciaCompletada } : n
    ));
  };

  // Generador de Deep Link para WhatsApp (Protocolo T-X)
  const handleNotifyAbsence = (nino: NinoRegistroState) => {
    // Limpiamos el número de teléfono (quitamos espacios o caracteres raros por seguridad)
    const phone = nino.telefono_contacto.replace(/\D/g, '');
    const mensaje = encodeURIComponent(
      `¡Hola! Notamos que ${nino.nombre} no pudo asistir hoy a la clase de Corderitos. Para que no se atrase con su investidura, por favor ayúdale a hacer la actividad de hoy en casa. Te enviaré los detalles en breve. ¡Feliz semana!`
    );
    window.open(`https://wa.me/${phone}?text=${mensaje}`, '_blank');
  };

  const sinEvidenciaCount = evidencias.filter(e => !e.evidenciaCompletada).length;

  return (
    <div className="flex flex-col h-full flex-grow">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Post-Flight</h2>
        <p className="text-slate-500 font-medium text-sm">Validación y Acciones Pendientes</p>
      </div>

      <div className="flex-grow flex flex-col gap-6 overflow-y-auto pb-4">
        
        {/* Bloque 1: Presentes (Evidencias) */}
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Auditoría de Evidencias</h3>
          <div className="flex flex-col gap-3">
            {evidencias.map((nino) => (
              <div key={nino.id_nino} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
                <span className="font-bold text-lg text-slate-800">{nino.nombre}</span>
               {/* Botón: Evidencia (Física Índigo/Cierre) */}
              <button 
                onClick={() => handleToggleEvidencia(nino.id_nino)}
                className={`
                  relative px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wide
                  transition-all duration-200 ease-in-out select-none active:scale-95
                  ${nino.evidenciaCompletada 
                    ? 'bg-indigo-500 text-white border-2 border-indigo-500 shadow-[0_4px_0_rgb(79,70,229)] active:translate-y-1 active:shadow-none' 
                    : 'bg-white text-slate-400 border-2 border-slate-200 shadow-sm hover:bg-slate-50'
                  }
                `}
              >
                {nino.evidenciaCompletada ? 'Manualidad ✓' : 'Sin Evidencia'}
              </button>
              </div>
            ))}
            {evidencias.length === 0 && <p className="text-slate-400 text-sm italic">Sin asistentes para auditar.</p>}
          </div>
        </div>

        {/* Bloque 2: Ausentes (Recovery Protocol) */}
        {ausentes.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span>⚠️</span> Recovery Protocol
            </h3>
            <div className="flex flex-col gap-3">
              {ausentes.map((nino) => (
                <div key={nino.id_nino} className="p-4 rounded-2xl border border-rose-200 bg-rose-50 flex items-center justify-between">
                  <span className="font-bold text-lg text-rose-900">{nino.nombre}</span>
                  <button 
                    onClick={() => handleNotifyAbsence(nino)} 
                    className="flex items-center gap-2 px-4 py-2 bg-rose-600 active:bg-rose-700 text-white rounded-xl font-bold text-sm transition-transform active:scale-95"
                  >
                    Notificar <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.711.927 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824z"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <div className="mt-auto pt-4 bg-slate-50">
        <button onClick={onSyncAndClose} className="w-full bg-slate-900 active:bg-slate-800 text-white font-bold text-lg py-5 rounded-2xl shadow-lg transition-transform transform active:scale-[0.98] flex justify-center items-center gap-2">
          Finalizar y Guardar
        </button>
      </div>
    </div>
  );
}