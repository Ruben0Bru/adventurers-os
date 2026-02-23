// lib/syncService.ts
import { db } from './db';
import { supabase } from './supabaseClient'; // Asumiendo que ya tienes instanciado tu cliente de Supabase

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