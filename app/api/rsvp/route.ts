/* =====================================================================
   wedo. — app/api/rsvp/route.ts (GET / POST)
   Confirmación de asistencia por link personal (?i=token). Corre con
   service role porque los invitados son anónimos y el RLS de `invitados`
   solo deja escribir a los novios (las confirmaciones fallaban en
   silencio y el estado compartido del grupo nunca se guardaba).
   A prueba de carreras: el update condicional (confirmado=false) hace de
   "claim"; si otro miembro ya respondió, se devuelve su respuesta para
   mostrar "X ya respondió por ustedes".
   Edición: si el anfitrión activó secciones.rsvp_editable, cualquier
   miembro del grupo puede cambiar la respuesta (POST con editar: true)
   mientras la invitación no esté bloqueada ni haya pasado la fecha
   límite. GET ?i=token devuelve la respuesta actual para precargar.
   ===================================================================== */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabaseServer";

export const runtime = "nodejs";

type Admin = ReturnType<typeof supabaseAdmin>;

async function buscarInvitacion(admin: Admin, token: string) {
  const { data: inv } = await admin.from("invitados")
    .select("*")
    .contains("miembros", JSON.stringify([{ token }]))
    .single();
  return inv;
}

/** ¿Puede este grupo cambiar su respuesta? (flag del evento, sin bloqueo,
    dentro de la fecha límite). */
async function puedeEditar(admin: Admin, inv: any): Promise<boolean> {
  if (inv.rsvp_bloqueado) return false;
  const { data: p } = await admin.from("parejas")
    .select("secciones,rsvp_fecha_limite").eq("id", inv.pareja_id).single();
  if (!p?.secciones?.rsvp_editable) return false;
  if (p.rsvp_fecha_limite) {
    // la fecha límite es inclusiva (hasta el final de ese día, hora GT)
    const limite = new Date(p.rsvp_fecha_limite + "T23:59:59-06:00");
    if (Date.now() > limite.getTime()) return false;
  }
  return true;
}

/** Última respuesta registrada de la invitación (la que ve el anfitrión). */
async function respuestaActual(admin: Admin, invId: string) {
  const { data } = await admin.from("rsvp")
    .select("id,asistencia,asistentes,restricciones,mensaje,nombre")
    .eq("invitado_id", invId)
    .order("created_at", { ascending: true })
    .limit(1);
  return data?.[0] || null;
}

export async function GET(req: Request) {
  try {
    const token = new URL(req.url).searchParams.get("i") || "";
    if (!token) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
    const admin = supabaseAdmin();
    const inv = await buscarInvitacion(admin, token);
    if (!inv) return NextResponse.json({ error: "Link no válido." }, { status: 404 });
    const editable = await puedeEditar(admin, inv);
    const r = inv.confirmado ? await respuestaActual(admin, inv.id) : null;
    return NextResponse.json({
      editable,
      confirmado: !!inv.confirmado,
      asistira: inv.asistira || null,
      respondido_por: inv.respondido_por || null,
      asistentes: Array.isArray(r?.asistentes) ? r.asistentes : [],
      restricciones: r?.restricciones || "",
      mensaje: r?.mensaje || "",
    });
  } catch (e: any) {
    console.error("rsvp GET:", e?.message || e);
    return NextResponse.json({ error: "No pudimos cargar tu respuesta." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json().catch(() => ({}));
    const { token, asistencia, quienes, acompanante_nombre, restricciones, mensaje, editar } = b || {};
    if (!token || !["si", "no"].includes(asistencia)) {
      return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const inv = await buscarInvitacion(admin, token);
    if (!inv) return NextResponse.json({ error: "Link no válido." }, { status: 404 });

    // invitación con RSVP cerrado (p. ej. pasada la fecha límite)
    if (inv.rsvp_bloqueado) {
      return NextResponse.json({ error: "El periodo para confirmar asistencia ha terminado. Si tienes dudas, escríbele directo a quien te invitó." }, { status: 403 });
    }

    const yo = (inv.miembros || []).find((m: any) => m.token === token);
    const quien = yo?.nombre || inv.nombre;

    // nombra al acompañante (+1) en el primer slot vacío que venga marcado
    let nombrado = false;
    const miembros = (inv.miembros || []).map((m: any) => {
      if (!m.nombre && !nombrado && (acompanante_nombre || "").trim() && Array.isArray(quienes) && quienes.includes(m.token)) {
        nombrado = true;
        return { ...m, nombre: acompanante_nombre.trim() };
      }
      return m;
    });

    const grupal = (inv.miembros || []).length > 1 && Array.isArray(quienes);
    const seleccion = grupal ? miembros.filter((m: any) => quienes.includes(m.token)) : miembros;
    const asistentes = asistencia === "si" ? seleccion.map((m: any) => m.nombre || "Acompañante") : [];
    const fila = {
      asistencia,
      acompanantes: asistencia === "si" ? Math.max(0, asistentes.length - 1) : 0,
      restricciones: (restricciones || "").trim() || null,
      mensaje: (mensaje || "").trim() || null,
      asistentes,
    };

    // ---- edición de una respuesta ya enviada ----
    if (editar && inv.confirmado) {
      if (!(await puedeEditar(admin, inv))) {
        return NextResponse.json({ error: "Esta invitación ya no permite cambiar la respuesta. Si algo cambió, escríbele directo a quien te invitó." }, { status: 403 });
      }
      const { error: e1 } = await admin.from("invitados")
        .update({ asistira: asistencia, respondido_por: quien, miembros })
        .eq("id", inv.id);
      if (e1) throw e1;
      const previa = await respuestaActual(admin, inv.id);
      if (previa) {
        // se actualiza en sitio: el panel del anfitrión toma la primera fila por invitación
        const { error: e2 } = await admin.from("rsvp").update({ ...fila, nombre: quien }).eq("id", previa.id);
        if (e2) throw e2;
      } else {
        const { error: e2 } = await admin.from("rsvp").insert({ invitado_id: inv.id, pareja_id: inv.pareja_id, nombre: quien, ...fila });
        if (e2) throw e2;
      }
      return NextResponse.json({ ok: true, editado: true });
    }

    // claim atómico: solo la primera respuesta del grupo entra
    const { data: claimed } = await admin.from("invitados")
      .update({ confirmado: true, asistira: asistencia, respondido_por: quien, miembros })
      .eq("id", inv.id)
      .eq("confirmado", false)
      .select("id");

    if (!claimed || claimed.length === 0) {
      const { data: actual } = await admin.from("invitados")
        .select("asistira,respondido_por").eq("id", inv.id).single();
      return NextResponse.json({ ya: true, respondido_por: actual?.respondido_por || null, asistira: actual?.asistira || null });
    }

    await admin.from("rsvp").insert({
      invitado_id: inv.id,
      pareja_id: inv.pareja_id,
      nombre: quien,
      ...fila,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("rsvp:", e?.message || e);
    return NextResponse.json({ error: "No pudimos guardar tu confirmación." }, { status: 500 });
  }
}
