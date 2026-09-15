/* =====================================================================
   wedo. — app/lib/eventoActivo.ts
   Una cuenta puede tener varios eventos. El "activo" (el que muestran
   dashboard y editor) se recuerda en localStorage; si no hay uno
   guardado, se usa el más antiguo (normalmente el evento principal).
   ===================================================================== */

const KEY = "wedo_pareja_id";

export function getEventoActivoId(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export function setEventoActivoId(id: string) {
  try { localStorage.setItem(KEY, id); } catch { /* privado/bloqueado */ }
}

export function elegirPareja<T extends { id: string }>(rows: T[] | null | undefined): T | null {
  if (!rows || rows.length === 0) return null;
  const id = getEventoActivoId();
  return rows.find((r) => r.id === id) || rows[0];
}
