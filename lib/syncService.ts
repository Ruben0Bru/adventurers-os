// lib/syncService.ts
import { db, PlanClaseLocal } from './db';
import { supabase } from './supabaseClient'; 

export async function syncProgresoOffline() {
  try {
    const registrosPendientes = await db.registro_progreso
      .where('sync_status')
      .equals(0)
      .toArray();

    if (registrosPendientes.length === 0) return;

    const payloadSupabase = registrosPendientes.map(({ sync_status, ...resto }) => resto);

    const { error } = await supabase
      .from('registro_progreso')
      .upsert(payloadSupabase, { onConflict: 'id_registro' });

    if (error) throw error;

    const idsSincronizados = registrosPendientes.map(r => r.id_registro);
    
    await db.registro_progreso
      .where('id_registro')
      .anyOf(idsSincronizados)
      .modify({ sync_status: 1 });

    console.log(`[Sync] ${idsSincronizados.length} registros sincronizados con éxito.`);

  } catch (error) {
    console.error('[Sync Error] Fallo en la sincronización:', error);
  }
}

export async function prefetchData(id_clase: string) {
  try {
    console.log(`[Pre-Fetch V3] Iniciando hidratación de estado para clase: ${id_clase}`);
    
    // 1. Descargar la identidad de la clase (Capa de Presentación)
    const { data: claseData, error: errorClase } = await supabase
      .from('club_clase')
      .select('*')
      .eq('id_clase', id_clase)
      .single();
      
    if (errorClase) throw errorClase;

    // 2. Descargar padrón de niños activos (Capa de Entidades)
    const { data: ninosData, error: errorNinos } = await supabase
      .from('nino')
      .select('*')
      .eq('activo', true)
      .eq('id_clase', id_clase);
      
    if (errorNinos) throw errorNinos;

    // 3. Inyección base en la Bóveda Local (Transacción Masiva)
    if (claseData) await db.club_clase.put(claseData);
    if (ninosData) await db.ninos.bulkPut(ninosData);

    // ============================================================================
    // 4. EL PUENTE DE DATOS: Motor Predictivo de la Próxima Clase (Capa Lógica)
    // ============================================================================
    
    // Cálculo de fecha local a prueba de balas (Compensa el Timezone Offset)
    const offsetDate = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000);
    const hoy = offsetDate.toISOString().split('T')[0]; 

    const { data: proximaSesion } = await supabase
      .from('sesion_calendario')
      .select('id_sesion, fecha_programada')
      .eq('id_clase', id_clase)
      .gte('fecha_programada', hoy)
      .order('fecha_programada', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (proximaSesion) {
      // Join relacional en Supabase (PostgREST under the hood)
      const { data: planData, error: errorPlan } = await supabase
        .from('plan_ejecucion')
        .select(`
          id_plan,
          hud_fase3_instruccion,
          hud_fase3_auxiliar,
          hud_fase4_instruccion,
          hud_fase4_auxiliar,
          materiales_requeridos,
          catalogo_requisito ( titulo )
        `)
        .eq('id_sesion', proximaSesion.id_sesion)
        .maybeSingle();

      if (errorPlan) throw errorPlan;

      if (planData) {
        // Garbage Collection: Purgar planes caducados de la caché local
        await db.plan_ejecucion.where('id_clase').equals(id_clase).delete();

        // Resolución estricta del tipo anidado de Supabase
        const tituloReq = Array.isArray(planData.catalogo_requisito) 
            ? planData.catalogo_requisito[0]?.titulo 
            : (planData.catalogo_requisito as any)?.titulo || 'Actividad Especial';

        // Estructuración del Payload Local
        const planLocal: PlanClaseLocal = {
          id_plan: planData.id_plan,
          id_clase: id_clase,
          fecha_programada: proximaSesion.fecha_programada,
          titulo_requisito: tituloReq,
          hud_fase3_instruccion: planData.hud_fase3_instruccion,
          hud_fase3_auxiliar: planData.hud_fase3_auxiliar || '',
          hud_fase4_instruccion: planData.hud_fase4_instruccion,
          hud_fase4_auxiliar: planData.hud_fase4_auxiliar || '',
          materiales_requeridos: planData.materiales_requeridos || []
        };

        await db.plan_ejecucion.put(planLocal);
        console.log(`[Pre-Fetch V3] Payload del plan descargado para la fecha: ${proximaSesion.fecha_programada}`);
      }
    } else {
      console.log('[Pre-Fetch V3] No se encontraron sesiones futuras en el calendario.');
    }

    return true;

  } catch (error) {
    console.error('[Pre-Fetch V3 Error] Falla catastrófica en la tubería de datos:', error);
    return false;
  }
}