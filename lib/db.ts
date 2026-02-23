// lib/db.ts
import Dexie, { Table } from 'dexie';

// Definición de interfaces para tipado estricto (TypeScript)
export interface NinoLocal {
  id_nino: string;
  nombre_completo: string;
  telefono_contacto: string;
  activo: boolean;
  // ... resto de campos de Supabase
}

export interface RegistroProgresoLocal {
  id_registro: string;
  id_nino: string;
  id_actividad: string;
  fecha_ejecucion: string; // Formato YYYY-MM-DD
  estado_asistencia: boolean;
  estado_evidencia: string;
  sync_status: number; // 0 = Pendiente de subida, 1 = Sincronizado
}

export class CorderitosDB extends Dexie {
  ninos!: Table<NinoLocal, string>;
  unidad_actividad!: Table<any, string>;
  registro_progreso!: Table<RegistroProgresoLocal, string>;

  constructor() {
    super('CorderitosOS_DB');
    
    // Declaración de Esquema Local (Solo PK e Índices de Búsqueda)
    this.version(1).stores({
      // PK: id_nino. Índice secundario: activo (para filtrar rápido a los retirados)
      ninos: 'id_nino, activo', 
      
      // PK: id_actividad. 
      unidad_actividad: 'id_actividad, eje_curricular',
      
      // La tabla crítica. 
      // PK: id_registro. Índices: sync_status (para el worker asíncrono).
      // El índice compuesto [id_nino+fecha_ejecucion] es un "lock" para que 
      // tu dedo no guarde dos asistencias del mismo niño el mismo domingo por error.
      registro_progreso: 'id_registro, id_nino, fecha_ejecucion, sync_status, [id_nino+fecha_ejecucion]'
    });
  }
}

export const db = new CorderitosDB();