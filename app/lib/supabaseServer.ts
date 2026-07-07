/* =====================================================================
   wedo. — app/lib/supabaseServer.ts
   Helpers de Supabase para API routes (server-side).
   La sesión del cliente vive en localStorage (flujo implícito), no en
   cookies: el cliente manda su access token en `Authorization: Bearer …`
   y aquí lo validamos. Las operaciones de BD/Storage del API usan el
   service role (jamás expuesto al cliente).
   ===================================================================== */
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/** Cliente con service role — solo para API routes. */
export function supabaseAdmin(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY no está configurada");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** ¿El usuario está en la tabla admins? (consultada con service role) */
export async function esAdmin(userId: string): Promise<boolean> {
  const admin = supabaseAdmin();
  const { data } = await admin.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  return !!data;
}

/** Valida el token Bearer del request y devuelve el usuario (o null). */
export async function getUserFromRequest(req: Request): Promise<User | null> {
  const header = req.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await anon.auth.getUser(token);
  if (error) return null;
  return data.user ?? null;
}
