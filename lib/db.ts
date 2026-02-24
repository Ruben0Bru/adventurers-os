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
export interface ClubClaseLocal {
  id_clase: string;
  nombre: string;
  edad_objetivo: number;
  color_primario_hex: string;
  color_secundario_hex: string;
  color_acento_hex: string;
  color_fondo_hex: string;
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
  club_clase!: Table<ClubClaseLocal, string>; // NUEVA TABLA
  ninos!: Table<NinoLocal, string>;
  unidad_actividad!: Table<any, string>;
  registro_progreso!: Table<RegistroProgresoLocal, string>;

  constructor() {
    super('CorderitosOS_DB');
    
    // VERSIÓN 2: Migración Multi-Tenant
    this.version(2).stores({
      club_clase: 'id_clase', // Solo necesitamos buscar por el ID
      ninos: 'id_nino, id_clase, activo', // Añadimos id_clase al índice
      unidad_actividad: 'id_actividad, id_clase, eje_curricular', // Añadimos id_clase al índice
      registro_progreso: 'id_registro, id_nino, fecha_ejecucion, sync_status, [id_nino+fecha_ejecucion]'
    });
  }
}

export const db = new CorderitosDB();