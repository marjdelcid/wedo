/* =====================================================================
   wedo. — app/api/admin/route.ts (GET)
   Resumen global para el super admin: todos los eventos con sus métricas,
   estadísticas de plataforma, actividad reciente y feature flags.
   Solo usuarios en la tabla `admins` (validados por Bearer token).
   ===================================================================== */
import { NextResponse } from "next/server";
import { supabaseAdmin, getUserFromRequest, esAdmin } from "../../lib/supabaseServer";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
    if (!(await esAdmin(user.id))) return NextResponse.json({ error: "Solo administradores." }, { status: 403 });

    const admin = supabaseAdmin();

    const [{ data: parejas }, { data: fondos }, { data: contribuciones }, { data: invitados }, { data: flags }] =
      await Promise.all([
        admin.from("parejas").select("id,slug,nombre1,nombre2,tipo_evento,fecha,lugar,created_at,disenos_ia_usados,user_id").order("created_at", { ascending: false }),
        admin.from("fondos").select("id,pareja_id,recaudado,meta,tomado"),
        admin.from("contribuciones").select("id,fondo_id,nombre_invitado,monto,created_at").order("created_at", { ascending: false }),
        admin.from("invitados").select("id,pareja_id,confirmado"),
        admin.from("feature_flags").select("key,nombre,descripcion,enabled,updated_at").order("key"),
      ]);

    // emails de los dueños
    const emailPorUser: Record<string, string> = {};
    try {
      const { data: usersPage } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      for (const u of usersPage?.users || []) emailPorUser[u.id] = u.email || "";
    } catch { /* sin emails no bloqueamos */ }

    const fondoAPareja: Record<string, string> = {};
    for (const f of fondos || []) fondoAPareja[f.id] = f.pareja_id;

    // métricas por evento
    const porPareja: Record<string, { recaudado: number; aportes: number; invitados: number; confirmados: number }> = {};
    const met = (id: string) => (porPareja[id] ||= { recaudado: 0, aportes: 0, invitados: 0, confirmados: 0 });
    for (const f of fondos || []) met(f.pareja_id).recaudado += f.recaudado || 0;
    for (const c of contribuciones || []) {
      const pid = fondoAPareja[c.fondo_id];
      if (pid) met(pid).aportes += 1;
    }
    for (const i of invitados || []) {
      const m = met(i.pareja_id);
      m.invitados += 1;
      if (i.confirmado) m.confirmados += 1;
    }

    const eventos = (parejas || []).map((p) => ({
      id: p.id,
      slug: p.slug,
      nombre1: p.nombre1,
      nombre2: p.nombre2,
      tipo_evento: p.tipo_evento || "boda",
      fecha: p.fecha,
      lugar: p.lugar,
      created_at: p.created_at,
      disenos_ia_usados: p.disenos_ia_usados || 0,
      email: emailPorUser[p.user_id] || "",
      ...met(p.id),
    }));

    const totalRecaudado = eventos.reduce((s, e) => s + e.recaudado, 0);
    const hace30 = Date.now() - 30 * 86400000;
    const stats = {
      eventos: eventos.length,
      eventosMes: eventos.filter((e) => new Date(e.created_at).getTime() > hace30).length,
      recaudado: totalRecaudado,
      comision: Math.round(totalRecaudado * 0.035 * 100) / 100,
      aportes: (contribuciones || []).length,
      disenosIA: eventos.reduce((s, e) => s + e.disenos_ia_usados, 0),
    };

    // actividad reciente: últimos aportes con su evento
    const parejaNombre: Record<string, string> = {};
    for (const e of eventos) parejaNombre[e.id] = e.nombre2 ? `${e.nombre1} & ${e.nombre2}` : e.nombre1;
    const actividad = (contribuciones || []).slice(0, 12).map((c) => ({
      nombre_invitado: c.nombre_invitado || "Anónimo",
      monto: c.monto,
      created_at: c.created_at,
      evento: parejaNombre[fondoAPareja[c.fondo_id]] || "—",
    }));

    return NextResponse.json({ stats, eventos, actividad, flags: flags || [] });
  } catch (e: any) {
    console.error("admin:", e?.message || e);
    return NextResponse.json({ error: "No pudimos cargar el panel." }, { status: 500 });
  }
}
