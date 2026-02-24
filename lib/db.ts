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

export interface PlanClaseLocal {
  id_plan: string;
  id_clase: string;          // Para mantener el aislamiento Multi-Tenant
  fecha_programada: string;  // Formato 'YYYY-MM-DD'
  titulo_requisito?: string; // Título inyectado desde el catálogo
  hud_fase3_instruccion: string;
  hud_fase3_auxiliar?: string;
  hud_fase4_instruccion: string;
  hud_fase4_auxiliar?: string;
  materiales_requeridos: string[];
}

export class CorderitosDB extends Dexie {
  club_clase!: Table<ClubClaseLocal, string>;
  ninos!: Table<NinoLocal, string>;
  unidad_actividad!: Table<any, string>; // <- Nota: Esta tabla quedó obsoleta, la limpiaremos después
  registro_progreso!: Table<any, string>;
  
  // 2. LA NUEVA TABLA EN LA BÓVEDA
  plan_ejecucion!: Table<PlanClaseLocal, string>;

  constructor() {
    super('CorderitosOS_DB');
    
    // VERSIÓN 2: Migración Multi-Tenant
    this.version(2).stores({
      club_clase: 'id_clase', // Solo necesitamos buscar por el ID
      ninos: 'id_nino, id_clase, activo', // Añadimos id_clase al índice
      unidad_actividad: 'id_actividad, id_clase, eje_curricular', // Añadimos id_clase al índice
      registro_progreso: 'id_registro, id_nino, fecha_ejecucion, sync_status, [id_nino+fecha_ejecucion]'
    });
  // 3. VERSIÓN 3: El Puente de Datos (Módulo 2 -> Módulo 3)
    this.version(3).stores({
      club_clase: 'id_clase',
      ninos: 'id_nino, id_clase, activo',
      unidad_actividad: 'id_actividad, id_clase, eje_curricular',
      registro_progreso: 'id_registro, id_nino, fecha_ejecucion, sync_status, [id_nino+fecha_ejecucion]',
      
      // La clave aquí es el índice compuesto [id_clase+fecha_programada]. 
      // El domingo, el celular dirá: "Dame el plan para MIS corderitos, HOY".
      plan_ejecucion: 'id_plan, id_clase, fecha_programada, [id_clase+fecha_programada]'
    });
  }
}

export const db = new CorderitosDB();