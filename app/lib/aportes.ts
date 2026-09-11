/* =====================================================================
   wedo. — app/lib/aportes.ts
   Comisión de servicio que paga el INVITADO sobre su aporte (la pareja
   recibe el aporte íntegro). Escalonada: a mayor regalo, menor %.
   Cubre la tarifa de Recurrente (4.5% del total + Q2) y el margen wedo.
   ÚNICA fuente de verdad: la usan el API de checkout y ambos templates,
   para que el desglose mostrado siempre coincida con lo cobrado.
   ===================================================================== */

export const APORTE_MINIMO = 25;

/** Porcentaje de servicio según el monto del aporte. */
export function tasaServicio(aporte: number): number {
  if (aporte >= 1000) return 0.06;
  if (aporte >= 300) return 0.07;
  return 0.08;
}

/** Comisión de servicio en quetzales (redondeada al centavo). */
export function comisionServicio(aporte: number): number {
  return Math.round((aporte * tasaServicio(aporte) + 2) * 100) / 100;
}

/** Total a pagar por el invitado. */
export function totalAporte(aporte: number): number {
  return Math.round((aporte + comisionServicio(aporte)) * 100) / 100;
}
