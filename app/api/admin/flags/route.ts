/* =====================================================================
   wedo. — app/api/admin/flags/route.ts (POST)
   Enciende/apaga una funcionalidad. Solo administradores.
   Body: { key: string, enabled: boolean }
   ===================================================================== */
import { NextResponse } from "next/server";
import { supabaseAdmin, getUserFromRequest, esAdmin } from "../../../lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
    if (!(await esAdmin(user.id))) return NextResponse.json({ error: "Solo administradores." }, { status: 403 });

    const body = await req.json().catch(() => null);
    const key = (body?.key || "").toString();
    const enabled = !!body?.enabled;
    if (!key) return NextResponse.json({ error: "Falta la funcionalidad." }, { status: 400 });

    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from("feature_flags")
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq("key", key)
      .select("key,enabled")
      .single();
    if (error || !data) return NextResponse.json({ error: "No encontramos esa funcionalidad." }, { status: 404 });

    return NextResponse.json({ ok: true, key: data.key, enabled: data.enabled });
  } catch (e: any) {
    console.error("admin/flags:", e?.message || e);
    return NextResponse.json({ error: "No pudimos guardar el cambio." }, { status: 500 });
  }
}
