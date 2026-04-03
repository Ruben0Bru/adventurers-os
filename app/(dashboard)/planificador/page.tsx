// app/(dashboard)/planificador/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CalendarPlanner from '@/components/CalendarPlanner';

export default function PlanificadorPage() {
  const router = useRouter();
  const [idClase, setIdClase] = useState<string>('');

  useEffect(() => {
    setIdClase(localStorage.getItem('offline_id_clase') || '');
  }, []);

  if (!idClase) {
    return <div className="flex h-full w-full items-center justify-center text-slate-500 text-sm">Cargando módulo...</div>;
  }

  return (
    <div className="h-full w-full animate-fade-in pb-6">
      <CalendarPlanner idClase={idClase} onBack={() => router.push('/')} />
    </div>
  );
}