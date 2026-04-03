// components/CalendarPlanner.tsx
'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { generarMatrizMes, MESES, DIAS_SEMANA, isSameDay } from '@/lib/calendarUtils';
import PlanificadorModal from './PlanificadorModal';

export default function CalendarPlanner({ idClase, onBack }: { idClase: string, onBack: () => void }) {
  const hoy = new Date();
  
  const [currentYear, setCurrentYear] = useState(hoy.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(hoy.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  const planesDB = useLiveQuery(() => db.plan_ejecucion.where('id_clase').equals(idClase).toArray(), [idClase]);

  const matrizMes = generarMatrizMes(currentYear, currentMonth);

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(prev => prev - 1); } 
    else { setCurrentMonth(prev => prev - 1); }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(prev => prev + 1); } 
    else { setCurrentMonth(prev => prev + 1); }
  };

  // Buscador de planes a prueba de Zonas Horarias locales
  const getPlanParaDia = (fecha: Date | null) => {
    if (!planesDB || !fecha) return undefined;
    const tzOffset = fecha.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(fecha.getTime() - tzOffset)).toISOString().split('T')[0];
    return planesDB.find(p => p.fecha_programada.split('T')[0] === localISOTime);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      
      <div className="flex items-center justify-between p-4 border-b border-slate-100" style={{ backgroundColor: 'var(--color-fondo)' }}>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors" style={{ color: 'var(--color-primario)' }}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </button>
          <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">
            {MESES[currentMonth]} {currentYear}
          </h2>
        </div>
        
        <div className="flex gap-1">
          <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-black/5 transition-colors" style={{ color: 'var(--color-primario)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-black/5 transition-colors" style={{ color: 'var(--color-primario)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 p-4 pb-2">
        {DIAS_SEMANA.map(dia => (
          <div key={dia} className="text-center text-xs font-bold tracking-widest text-slate-400 uppercase">{dia}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 p-4 pt-0">
        {matrizMes.map((fecha, index) => {
          if (!fecha) return <div key={`empty-${index}`} className="h-10 w-full" />;

          const isToday = isSameDay(fecha, hoy);
          const isSelected = selectedDate ? isSameDay(fecha, selectedDate) : false;
          
          const isSunday = fecha.getDay() === 0;
          const weekOfMonth = Math.ceil(fecha.getDate() / 7);
          const isRestDay = isSunday && weekOfMonth === 3;

          const planExistente = getPlanParaDia(fecha);
          const isPlanned = !!planExistente;

          return (
            <button
              key={fecha.toISOString()}
              onClick={() => !isRestDay && setSelectedDate(fecha)}
              disabled={isRestDay} 
              className={`
                relative h-10 w-full rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200
                ${isSelected ? 'text-white shadow-md scale-105 z-10' : ''}
                ${isPlanned && !isSelected ? 'border-2 bg-white shadow-sm' : ''}
                ${!isRestDay && !isSelected && !isPlanned ? 'text-slate-600 hover:bg-slate-50 active:scale-95' : ''}
                ${isRestDay ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400' : ''}
                ${isToday && !isSelected && !isRestDay && !isPlanned ? 'border-2 border-slate-300' : ''}
              `}
              style={{
                // Fondo: Solo se pinta si está seleccionado
                backgroundColor: isSelected ? 'var(--color-primario)' : undefined,
                
                // Borde: Usa el color primario puro si está planificado
                borderColor: (isPlanned && !isSelected) ? 'var(--color-primario)' : undefined,
                
                // Texto: Blanco si está seleccionado, Primario si está planificado, Acento si es domingo normal
                color: isSelected 
                  ? '#ffffff' 
                  : (isPlanned 
                      ? 'var(--color-primario)' 
                      : (isSunday && !isRestDay && !isPlanned ? 'var(--color-acento)' : undefined))
              }}
            >
              {fecha.getDate()}
              
              {/* Telemetría visual: Un punto nítido del color secundario para máxima claridad */}
              <div className="absolute -bottom-1.5 flex gap-1">
                {isPlanned && !isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-secundario)' }}></div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-4 mt-auto border-t border-slate-100 bg-slate-50">
        {selectedDate ? (
          <div className="text-center animate-fade-in">
            <p className="text-sm font-medium text-slate-500 mb-2">
              {getPlanParaDia(selectedDate)
                ? `Plan registrado el ${selectedDate.getDate()} de ${MESES[selectedDate.getMonth()]}`
                : `Planeando para el ${selectedDate.getDate()} de ${MESES[selectedDate.getMonth()]}`
              }
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full text-white font-bold py-3 rounded-xl shadow-sm transition-transform active:scale-95"
              style={{ backgroundColor: 'var(--color-primario)' }}
            >
              {getPlanParaDia(selectedDate) ? 'Ver / Editar Plan' : '+ Añadir Actividad'}
            </button>
          </div>
        ) : (
          <p className="text-sm font-medium text-slate-400 text-center py-2">
            Selecciona una fecha para planear.
          </p>
        )}
      </div>
      
      <PlanificadorModal 
        isOpen={isModalOpen} 
        fecha={selectedDate} 
        idClase={idClase}
        existingPlan={getPlanParaDia(selectedDate)}
        onClose={() => setIsModalOpen(false)} 
      />

    </div>
  );
}