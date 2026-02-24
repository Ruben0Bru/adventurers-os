// lib/syncService.ts
import { db } from './db';
import { supabase } from './supabaseClient'; 

export async function syncProgresoOffline() {
  try {
    // 1. Extraer registros pendientes de la bóveda local
    const registrosPendientes = await db.registro_progreso
      .where('sync_status')
      .equals(0)
      .toArray();

    // Si no hay nada que subir, abortamos la operación silenciosamente
    if (registrosPendientes.length === 0) return;

    // 2. Limpiar el payload (A Supabase no le importa el campo local 'sync_status')
    const payloadSupabase = registrosPendientes.map(({ sync_status, ...resto }) => resto);

    // 3. Empujar a la nube (UPSERT: Actualiza si existe, inserta si es nuevo)
    const { error } = await supabase
      .from('registro_progreso')
      .upsert(payloadSupabase, { onConflict: 'id_registro' });

    if (error) throw error;

    // 4. Si el servidor responde 200 OK, marcamos como sincronizado localmente
    // Extraemos los IDs para actualizar en lote y minimizar la latencia local
    const idsSincronizados = registrosPendientes.map(r => r.id_registro);
    
    await db.registro_progreso
      .where('id_registro')
      .anyOf(idsSincronizados)
      .modify({ sync_status: 1 });

    console.log(`[Sync] ${idsSincronizados.length} registros sincronizados con éxito.`);

  } catch (error) {
    console.error('[Sync Error] Fallo en la sincronización:', error);
    // Aquí la falla es silenciosa. No rompemos la UI. 
    // El sistema simplemente lo volverá a intentar en el próximo render o recarga.
  }
}
export async function prefetchData(id_clase: string) {
  try {
    console.log(`[Pre-Fetch V2] Aislamiento de red para clase: ${id_clase}`);
    
    // 1. Descargar la identidad de la clase (Colores y Configuración)
    const { data: claseData, error: errorClase } = await supabase
      .from('club_clase')
      .select('*')
      .eq('id_clase', id_clase)
      .single(); // Esperamos un solo objeto, no un arreglo
      
    if (errorClase) throw errorClase;

    // 2. Descargar niños ESTRICTAMENTE de esta clase
    const { data: ninosData, error: errorNinos } = await supabase
      .from('nino')
      .select('*')
      .eq('activo', true)
      .eq('id_clase', id_clase);
      
    if (errorNinos) throw errorNinos;

    // 3. Descargar currículo ESTRICTAMENTE de esta clase
    const { data: actividadesData, error: errorAct } = await supabase
      .from('unidad_actividad')
      .select('*')
      .eq('id_clase', id_clase);

    if (errorAct) throw errorAct;

    // 4. Inyección en Bóveda Local (Transacción Masiva)
    // Dexie reemplazará los datos viejos si el ID existe.
    if (claseData) await db.club_clase.put(claseData);
    if (ninosData) await db.ninos.bulkPut(ninosData);
    if (actividadesData) await db.unidad_actividad.bulkPut(actividadesData);

    console.log(`[Pre-Fetch V2] Éxito. Descargados ${ninosData?.length || 0} niños de ${claseData.nombre}.`);
    return true;

  } catch (error) {
    console.error('[Pre-Fetch V2 Error] Violación de tubería de datos:', error);
    return false;
  }
}