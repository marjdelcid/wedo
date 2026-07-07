/* =====================================================================
   wedo. — app/lib/featureFlags.ts
   Lectura de feature flags desde el cliente (la tabla tiene lectura
   pública; la escritura es solo del panel admin). Si algo falla,
   por defecto la funcionalidad se considera ENCENDIDA para no romper UX.
   ===================================================================== */
import { supabase } from "./supabase";

export async function featureEnabled(key: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.from("feature_flags").select("enabled").eq("key", key).maybeSingle();
    if (error || !data) return true;
    return !!data.enabled;
  } catch {
    return true;
  }
}
