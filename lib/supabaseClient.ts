// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Extracción segura de variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validación de tiempo de compilación para evitar fallos silenciosos
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase en .env.local');
}

// Instancia del cliente
export const supabase = createClient(supabaseUrl, supabaseAnonKey);