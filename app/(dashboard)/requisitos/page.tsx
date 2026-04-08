// app/(dashboard)/requisitos/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabaseClient';

type RequisitoParsed = {
  eje_curricular: string;
  titulo: string;
};

export default function RequisitosPage() {
  const router = useRouter();
  const [idClase, setIdClase] = useState<string>('');
  const [parsedData, setParsedData] = useState<RequisitoParsed[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setIdClase(localStorage.getItem('offline_id_clase') || '');
  }, []);

  // MOTOR DE PARSEO DE EXCEL (Client-Side)
  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convertimos el Excel a un arreglo de objetos JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];

        // Mapeo defensivo: Nos aseguramos de extraer solo lo que necesitamos
        // ADVERTENCIA: Cambia 'Eje Curricular' y 'Titulo' por los nombres exactos de las columnas de tu Excel
        const cleanData: RequisitoParsed[] = jsonData.map(row => ({
          eje_curricular: row['Eje_Tematico'] || row['eje_curricular'] || row['Eje'] || 'General',
          titulo: row['Requisito'] || row['titulo'] || row['Requisito'] || 'Sin título',
        })).filter(req => req.titulo !== 'Sin título'); 

        setParsedData(cleanData);
      } catch (error) {
        alert('Error al leer el archivo. Asegúrate de que sea un Excel válido (.xlsx o .csv)');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Manejadores de Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // MOTOR DE INGESTA MASIVA
  const handleIngest = async () => {
    if (parsedData.length === 0 || !idClase) return;
    setLoading(true);

    try {
      // Preparamos el payload añadiendo el id_clase del consejero a cada registro
      const payload = parsedData.map(req => ({
        id_clase: idClase,
        eje_curricular: req.eje_curricular,
        titulo: req.titulo
      }));

      // Inserción masiva en Supabase
      const { error } = await supabase.from('catalogo_requisito').insert(payload);

      if (error) throw error;

      alert(`¡Éxito! Se inyectaron ${parsedData.length} requisitos a tu clase.`);
      setParsedData([]); // Limpiamos la tabla
      router.push('/'); // Devolvemos a la torre de control

    } catch (error: any) {
      alert('Error en la inyección de datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!idClase) return <div className="flex justify-center items-center h-full text-slate-500">Cargando identidad...</div>;

  return (
    <div className="flex flex-col h-full animate-fade-in pb-6 gap-6">
      
      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/')} className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors" style={{ color: 'var(--color-primario)' }}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Ingesta de Requisitos</h1>
          <p className="text-slate-500 font-medium text-sm">Sube el Excel de tu cartilla de clase</p>
        </div>
      </div>

      {/* ZONA DE ARRASTRE (Dropzone) */}
      {parsedData.length === 0 && (
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all
            ${isDragging ? 'border-sky-500 bg-sky-50 scale-[1.02]' : 'border-slate-300 bg-white hover:bg-slate-50'}
          `}
        >
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          </div>
          <h3 className="font-bold text-slate-700 text-lg mb-1">Arrastra tu Excel aquí</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-xs">El archivo debe contener las columnas "Eje Curricular" y "Titulo".</p>
          
          <label className="cursor-pointer text-white font-bold py-3 px-6 rounded-xl shadow-sm hover:brightness-110 transition-all active:scale-95" style={{ backgroundColor: 'var(--color-primario)' }}>
            Explorar Archivos
            <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      )}

      {/* PRE-FLIGHT CHECK (Tabla de validación) */}
      {parsedData.length > 0 && (
        <div className="flex flex-col flex-grow bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Validación de Datos ({parsedData.length} detectados)</h3>
            <button onClick={() => setParsedData([])} className="text-xs font-bold text-rose-500 hover:text-rose-600">Cancelar</button>
          </div>
          
          <div className="overflow-y-auto flex-grow p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-xs">
                <tr>
                  <th className="p-4">Eje Curricular</th>
                  <th className="p-4">Título del Requisito</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedData.map((req, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-600 whitespace-nowrap">{req.eje_curricular}</td>
                    <td className="p-4 text-slate-800">{req.titulo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 mt-auto">
            <button 
              onClick={handleIngest}
              disabled={loading}
              className="w-full text-white font-bold py-4 rounded-xl shadow-sm transition-transform active:scale-95 disabled:bg-slate-300 disabled:shadow-none flex justify-center items-center"
              style={{ backgroundColor: loading ? undefined : 'var(--color-primario)' }}
            >
              {loading ? 'Inyectando Base de Datos...' : `🚀 Confirmar Ingesta de ${parsedData.length} Requisitos`}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}