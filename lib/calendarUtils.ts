// lib/calendarUtils.ts

export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/**
 * Genera una matriz lineal representativa de un mes para CSS Grid.
 * Los espacios vacíos al inicio del mes se rellenan con `null`.
 */
export function generarMatrizMes(año: number, mes: number): (Date | null)[] {
  // 0 = Domingo, 1 = Lunes, etc.
  const primerDiaDelMes = new Date(año, mes, 1).getDay();
  
  // El día 0 del siguiente mes nos da el último día del mes actual
  const totalDias = new Date(año, mes + 1, 0).getDate();
  
  const matriz: (Date | null)[] = [];
  
  // 1. Rellenar el "offset" inicial (días vacíos antes del 1ro)
  for (let i = 0; i < primerDiaDelMes; i++) {
    matriz.push(null);
  }
  
  // 2. Llenar los días reales
  for (let i = 1; i <= totalDias; i++) {
    matriz.push(new Date(año, mes, i));
  }
  
  return matriz;
}

/**
 * Utilidad para comparar si dos fechas son exactamente el mismo día (ignorando horas)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}