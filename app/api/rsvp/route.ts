/* =====================================================================
   wedo. — app/api/rsvp/route.ts (POST)
   Confirmación de asistencia por link personal (?i=token). Corre con
   service role porque los invitados son anónimos y el RLS de `invitados`
   solo deja escribir a los novios (las confirmaciones fallaban en
   silencio y el estado compartido del grupo nunca se guardaba).
   A prueba de carreras: el update condicional (confirmado=false) hace de
   "claim"; si otro miembro ya respondió, se devuelve su respuesta para
   mostrar "X ya respondió por ustedes".
   ===================================================================== */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const b = await req.json().catch(() => ({}));
    const { token, asistencia, quienes, acompanante_nombre, restricciones, mensaje } = b || {};
    if (!token || !["si", "no"].includes(asistencia)) {
      return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const { data: inv } = await admin.from("invitados")
      .select("*")
      .contains("miembros", JSON.stringify([{ token }]))
      .single();
    if (!inv) return NextResponse.json({ error: "Link no válido." }, { status: 404 });

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

    const grupal = (inv.miembros || []).length > 1 && Array.isArray(quienes);
    const seleccion = grupal ? miembros.filter((m: any) => quienes.includes(m.token)) : miembros;
    const asistentes = asistencia === "si" ? seleccion.map((m: any) => m.nombre || "Acompañante") : [];

    await admin.from("rsvp").insert({
      invitado_id: inv.id,
      pareja_id: inv.pareja_id,
      nombre: quien,
      asistencia,
      acompanantes: asistencia === "si" ? Math.max(0, asistentes.length - 1) : 0,
      restricciones: (restricciones || "").trim() || null,
      mensaje: (mensaje || "").trim() || null,
      asistentes,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("rsvp:", e?.message || e);
    return NextResponse.json({ error: "No pudimos guardar tu confirmación." }, { status: 500 });
  }
}
