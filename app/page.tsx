// app/page.tsx
'use client';

import { useState } from 'react';
import PreFlightCheck from '@/components/PreFlightCheck';
import ExecutionHUD from '@/components/ExecutionHUD';
import PostFlightCheck from '@/components/PostFlightCheck';

type ViewState = 'PREFLIGHT' | 'EXECUTION' | 'POSTFLIGHT';

export default function DashboardOrchestrator() {
  const [currentView, setCurrentView] = useState<ViewState>('PREFLIGHT');
  // Almacén temporal de la asistencia para cruzarla con las evidencias
  const [asistentesActivos, setAsistentesActivos] = useState<{id_nino: string, nombre: string}[]>([]);

  const handleStartPipeline = (datosPreFlight: any[]) => {
    // Filtramos SOLO a los que tienen presente === true
    const presentes = datosPreFlight.filter(n => n.presente).map(n => ({ id_nino: n.id_nino, nombre: n.nombre }));
    setAsistentesActivos(presentes);
    setCurrentView('EXECUTION');
  };

  const handleFinishPipeline = () => {
    setCurrentView('POSTFLIGHT');
  };

  const handleSyncAndClose = () => {
    console.log('[Worker] Empaquetando transacciones y encolando en Dexie...');
    // Aquí invocarás syncProgresoOffline() en el futuro
    setCurrentView('PREFLIGHT'); // Reset del loop
  };

  return (
    <div className="flex flex-col h-full w-full">
      {currentView === 'PREFLIGHT' && (
        <PreFlightCheck onStartPipeline={handleStartPipeline} />
      )}
      
      {currentView === 'EXECUTION' && (
        <ExecutionHUD onFinish={handleFinishPipeline} />
      )}
      
      {currentView === 'POSTFLIGHT' && (
        <PostFlightCheck 
          asistentes={asistentesActivos} 
          onSyncAndClose={handleSyncAndClose} 
        />
      )}
    </div>
  );
}