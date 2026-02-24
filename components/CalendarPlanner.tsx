// components/CalendarPlanner.tsx
'use client';

import { useState } from 'react';
import { generarMatrizMes, MESES, DIAS_SEMANA, isSameDay } from '@/lib/calendarUtils';
import PlanificadorModal from './PlanificadorModal';

export default function CalendarPlanner({ idClase, onBack }: { idClase: string, onBack: () => void }) {
  const hoy = new Date();
  
  // Estado para la navegación del calendario
  const [currentYear, setCurrentYear] = useState(hoy.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(hoy.getMonth());
  
  // Estado para el día seleccionado por el maestro
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const matrizMes = generarMatrizMes(currentYear, currentMonth);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      
      {/* Cabecera Unificada del Calendario */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100" style={{ backgroundColor: 'var(--color-fondo)' }}>
        
        {/* Lado Izquierdo: Volver y Mes/Año */}
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors" style={{ color: 'var(--color-primario)' }}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </button>
          <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">
            {MESES[currentMonth]} {currentYear}
          </h2>
        </div>
        
        {/* Lado Derecho: Controles de Navegación */}
        <div className="flex gap-1">
          <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-black/5 transition-colors" style={{ color: 'var(--color-primario)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-black/5 transition-colors" style={{ color: 'var(--color-primario)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>

      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 p-4 pb-2">
        {DIAS_SEMANA.map(dia => (
          <div key={dia} className="text-center text-xs font-bold tracking-widest text-slate-400 uppercase">
            {dia}
          </div>
        ))}
      </div>

      {/* Cuadrícula de Fechas (El Motor) */}
      <div className="grid grid-cols-7 gap-2 p-4 pt-0">
        {matrizMes.map((fecha, index) => {
          if (!fecha) return <div key={`empty-${index}`} className="h-10 w-full" />;

          const isToday = isSameDay(fecha, hoy);
          const isSelected = selectedDate ? isSameDay(fecha, selectedDate) : false;
          
          // LA REGLA DE ORO DEL TERCER DOMINGO
          const isSunday = fecha.getDay() === 0;
          const weekOfMonth = Math.ceil(fecha.getDate() / 7);
          const isRestDay = isSunday && weekOfMonth === 3; // ¡Bingo!

          return (
            <button
              key={fecha.toISOString()}
              onClick={() => !isRestDay && setSelectedDate(fecha)}
              disabled={isRestDay} // Deshabilitamos el clic si es descanso
              className={`
                relative h-10 w-full rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200
                ${isSelected ? 'text-white shadow-md scale-105' : 'text-slate-600'}
                ${!isRestDay && !isSelected ? 'hover:bg-slate-50 active:scale-95' : ''}
                ${isRestDay ? 'opacity-40 cursor-not-allowed bg-slate-100' : ''}
                ${isToday && !isSelected && !isRestDay ? 'border-2' : 'border border-transparent'}
              `}
              style={{
                backgroundColor: isSelected ? 'var(--color-primario)' : (isRestDay ? undefined : 'transparent'),
                borderColor: isToday && !isSelected && !isRestDay ? 'var(--color-primario)' : undefined,
                color: isSunday && !isSelected && !isRestDay ? 'var(--color-acento)' : undefined
              }}
            >
              {fecha.getDate()}
              {/* Indicador visual de descanso */}
              {isRestDay && <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-slate-400"></div>}
            </button>
          );
        })}
      </div>

      {/* Placeholder para la acción */}
      <div className="p-4 mt-auto border-t border-slate-100 bg-slate-50">
        {selectedDate ? (
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500 mb-2">
              Planeando para el {selectedDate.getDate()} de {MESES[selectedDate.getMonth()]}
            </p>
            <button 
              className="w-full text-white font-bold py-3 rounded-xl shadow-sm transition-transform active:scale-95"
              style={{ backgroundColor: 'var(--color-primario)' }}
            >
              + Añadir Actividad
            </button>
          </div>
        ) : (
          <p className="text-sm font-medium text-slate-400 text-center py-2">
            Selecciona una fecha para planear.
          </p>
        )}
      </div>
      {/* EL MODAL DE PLANIFICACIÓN */}
      <PlanificadorModal 
        isOpen={!!selectedDate} 
        fecha={selectedDate} 
        idClase={idClase}
        onClose={() => setSelectedDate(null)} 
      />

    </div>
  );
}