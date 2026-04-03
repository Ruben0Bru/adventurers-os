// components/PlanificadorModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { db } from '@/lib/db';

type CatalogoRequisito = {
  id_requisito: string;
  eje_curricular: string;
  titulo: string;
};

export default function PlanificadorModal({ 
  isOpen, 
  fecha, 
  idClase,
  existingPlan,
  onClose 
}: { 
  isOpen: boolean; 
  fecha: Date | null; 
  idClase: string; 
  existingPlan?: any;
  onClose: () => void;
}) {
  const [catalogo, setCatalogo] = useState<CatalogoRequisito[]>([]);
  const [loading, setLoading] = useState(false);

  const [idRequisito, setIdRequisito] = useState('');
  const [responsable, setResponsable] = useState('Maestro Titular');
  const [materiales, setMateriales] = useState('');
  const [fase3, setFase3] = useState('');
  const [fase4, setFase4] = useState('');

  useEffect(() => {
    if (isOpen && idClase) {
      const fetchCatalogo = async () => {
        const { data } = await supabase.from('catalogo_requisito').select('id_requisito, eje_curricular, titulo').eq('id_clase', idClase);
        if (data) setCatalogo(data);
      };
      fetchCatalogo();
    }
  }, [isOpen, idClase]);

  useEffect(() => {
    if (isOpen && existingPlan) {
      setIdRequisito(existingPlan.id_requisito || '');
      setMateriales(existingPlan.materiales_requeridos ? existingPlan.materiales_requeridos.join(', ') : '');
      setFase3(existingPlan.hud_fase3_instruccion || '');
      setFase4(existingPlan.hud_fase4_instruccion || '');
    } else if (isOpen && !existingPlan) {
      setIdRequisito('');
      setMateriales('');
      setFase3('');
      setFase4('');
    }
  }, [isOpen, existingPlan]);

  if (!isOpen || !fecha) return null;

  const handleGuardar = async () => {
    setLoading(true);
    
    // Extracción robusta de fecha local
    const tzOffset = fecha.getTimezoneOffset() * 60000;
    const fechaStr = (new Date(fecha.getTime() - tzOffset)).toISOString().split('T')[0];

    try {
      let planIdToSave = '';

      if (existingPlan) {
        planIdToSave = existingPlan.id_plan;
        const { error: updateError } = await supabase
          .from('plan_ejecucion')
          .update({
            id_requisito: idRequisito || null,
            materiales_requeridos: materiales.split(',').map(m => m.trim()).filter(Boolean),
            hud_fase3_instruccion: fase3,
            hud_fase4_instruccion: fase4
          })
          .eq('id_plan', existingPlan.id_plan);

        if (updateError) throw updateError;

      } else {
        const { data: sesionData, error: sesionError } = await supabase
          .from('sesion_calendario')
          .insert([{ id_clase: idClase, fecha_programada: fechaStr, tipo_sesion: 'Reunión Regular' }])
          .select().single();

        if (sesionError) throw sesionError;

        const { data: planData, error: planError } = await supabase
          .from('plan_ejecucion')
          .insert([{
            id_sesion: sesionData.id_sesion,
            id_requisito: idRequisito || null,
            responsable,
            materiales_requeridos: materiales.split(',').map(m => m.trim()).filter(Boolean),
            hud_fase3_instruccion: fase3,
            hud_fase4_instruccion: fase4
          }])
          .select().single();

        if (planError) throw planError;
        planIdToSave = planData.id_plan;
      }

      const tituloReq = catalogo.find(r => r.id_requisito === idRequisito)?.titulo;
      
      await db.plan_ejecucion.put({
        id_plan: planIdToSave,
        id_clase: idClase,
        fecha_programada: fechaStr,
        titulo_requisito: tituloReq,
        hud_fase3_instruccion: fase3,
        hud_fase4_instruccion: fase4,
        materiales_requeridos: materiales.split(',').map(m => m.trim()).filter(Boolean)
      });

      onClose();
    } catch (error: any) {
      alert('Error guardando el plan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-5 text-white flex justify-between items-center" style={{ backgroundColor: 'var(--color-primario)' }}>
          <div>
            <h3 className="font-black text-lg">{existingPlan ? 'Editar Plan' : 'Nuevo Plan'}</h3>
            <p className="text-sm opacity-90">{fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-black/10 rounded-full hover:bg-black/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Objetivo / Requisito</label>
            <select 
              className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400"
              value={idRequisito}
              onChange={(e) => setIdRequisito(e.target.value)}
            >
              <option value="">Selecciona un requisito de la cartilla...</option>
              {catalogo.map(req => (
                <option key={req.id_requisito} value={req.id_requisito}>
                  [{req.eje_curricular}] - {req.titulo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Materiales (Separados por coma)</label>
            <input 
              type="text" placeholder="Ej: Tijeras, Lana blanca, Colores"
              className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              value={materiales} onChange={(e) => setMateriales(e.target.value)}
            />
          </div>

          <div className="border-t border-slate-100 my-2 pt-4">
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-primario)' }}></span>
              Instrucciones para el HUD (Móvil)
            </h4>
            
            <label className="text-xs font-bold text-slate-500 uppercase mt-2 block">Fase 3: Instrucción Teórica</label>
            <textarea 
              rows={3} placeholder="1. Formar un círculo... 2. Explicar..."
              className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none"
              value={fase3} onChange={(e) => setFase3(e.target.value)}
            />

            <label className="text-xs font-bold text-slate-500 uppercase mt-4 block">Fase 4: Manualidad / Práctica</label>
            <textarea 
              rows={3} placeholder="1. Entregar hojas... 2. Pegar lana..."
              className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none"
              value={fase4} onChange={(e) => setFase4(e.target.value)}
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <button 
            onClick={handleGuardar}
            disabled={loading || !fase3 || !fase4}
            className="w-full text-white font-bold py-4 rounded-xl shadow-sm transition-transform active:scale-95 disabled:bg-slate-300 disabled:shadow-none flex justify-center items-center"
            style={{ backgroundColor: loading || !fase3 || !fase4 ? undefined : 'var(--color-primario)' }}
          >
            {loading ? 'Guardando...' : '💾 Guardar Plan de Clase'}
          </button>
        </div>

      </div>
    </div>
  );
}