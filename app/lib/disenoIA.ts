/* =====================================================================
   wedo. — app/lib/disenoIA.ts
   Cliente del diseñador IA (/api/diseno-ia). Manda el access token de la
   sesión como Bearer; las keys de IA viven solo en el server.
   ===================================================================== */
import { supabase } from "./supabase";

export interface DisenoIA {
  colores: string[];
  tipografia: string;
  tipografia_titulos: string;
  frase_portada: string;
  foto_hero: string | null;
  cached?: boolean;
  restantes?: number;
}

export class DisenoIAError extends Error {
  status: number;
  restantes?: number;
  constructor(message: string, status: number, restantes?: number) {
    super(message);
    this.status = status;
    this.restantes = restantes;
  }
}

export async function generarDisenoIA(params: {
  parejaId?: string | null;
  tema: string;
  tipoEvento: string;
  nocache?: boolean;
}): Promise<DisenoIA> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch("/api/diseno-ia", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(params),
  });
  const json = await res.json().catch(() => ({} as any));
  if (!res.ok) {
    throw new DisenoIAError(json?.error || "No pudimos generar el diseño. Intenta de nuevo.", res.status, json?.restantes);
  }
  return json as DisenoIA;
}
