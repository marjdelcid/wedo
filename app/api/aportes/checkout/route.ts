/* =====================================================================
   wedo. — app/api/aportes/checkout/route.ts (POST)
   Crea un checkout de Recurrente para un aporte a un fondo de regalos.
   El invitado paga aporte + comisión de servicio (Recurrente ~4.5% + Q2 +
   wedo. 3.5%); la pareja recibe el aporte completo. La contribución nace
   'pendiente' y el webhook intent.succeeded la confirma.
   Sin llaves configuradas responde { simulado: true } y el cliente usa el
   flujo local de siempre (modo demo).
   ===================================================================== */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseServer";
import { APORTE_MINIMO, comisionServicio } from "../../../lib/aportes";
import { esDemo } from "../../../lib/demo";

export const runtime = "nodejs";

const SITE = "https://wedo.gifts";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { fondo_id, nombre, mensaje, monto } = body || {};
    const aporte = Math.round(Number(monto) * 100) / 100;
    if (!fondo_id || !aporte || aporte < APORTE_MINIMO) {
      return NextResponse.json({ error: `El aporte mínimo es Q${APORTE_MINIMO}.` }, { status: 400 });
    }

    // Recurrente ya solo requiere la llave secreta (la pública quedó opcional)
    const pub = process.env.RECURRENTE_PUBLIC_KEY;
    const sec = process.env.RECURRENTE_SECRET_KEY;
    if (!sec) return NextResponse.json({ simulado: true });

    const admin = supabaseAdmin();
    const { data: fondo } = await admin.from("fondos").select("id,nombre,pareja_id,foto").eq("id", fondo_id).single();
    if (!fondo) return NextResponse.json({ error: "Regalo no encontrado." }, { status: 404 });
    const { data: pareja } = await admin.from("parejas").select("slug,nombre1,nombre2").eq("id", fondo.pareja_id).single();
    if (!pareja) return NextResponse.json({ error: "Evento no encontrado." }, { status: 404 });
    // las invitaciones de muestra del home nunca generan cobros reales
    if (esDemo(pareja.slug)) return NextResponse.json({ simulado: true });

    // comisión escalonada al invitado; la pareja recibe el aporte íntegro
    const servicio = comisionServicio(aporte);
    const total = Math.round((aporte + servicio) * 100) / 100;

    // contribución pendiente (el webhook la marca 'pagado')
    const { data: contrib, error: e1 } = await admin.from("contribuciones").insert({
      fondo_id: fondo.id,
      nombre_invitado: (nombre || "").trim() || "Anónimo",
      monto: aporte,
      mensaje: (mensaje || "").trim() || null,
      estado: "pendiente",
      total_pagado: total,
    }).select("id").single();
    if (e1 || !contrib) throw e1 || new Error("No se pudo crear la contribución");

    const nombres = [pareja.nombre1, pareja.nombre2].filter(Boolean).map((n: string) => n.split(" ")[0]).join(" & ");
    const invUrl = `${SITE}/boda/${pareja.slug}`;
    const res = await fetch("https://app.recurrente.com/api/checkouts", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-SECRET-KEY": sec, ...(pub ? { "X-PUBLIC-KEY": pub } : {}) },
      body: JSON.stringify({
        items: [{
          name: `Regalo para ${nombres} · ${fondo.nombre}`,
          ...(fondo.foto ? { image_url: fondo.foto } : {}),
          description: `Aporte de Q${aporte.toFixed(2)} + Q${servicio.toFixed(2)} de tarifa de la pasarela de pago`,
          amount_in_cents: Math.round(total * 100),
          currency: "GTQ",
          quantity: 1,
        }],
        success_url: `${invUrl}?pago=ok#regalos`,
        cancel_url: `${invUrl}#regalos`,
        metadata: { contribucion_id: contrib.id, fondo_id: fondo.id },
      }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("recurrente checkout:", res.status, txt.slice(0, 400));
      await admin.from("contribuciones").delete().eq("id", contrib.id).eq("estado", "pendiente");
      return NextResponse.json({ error: "No pudimos iniciar el pago. Intenta de nuevo." }, { status: 502 });
    }
    const data = await res.json();
    const url = data?.checkout_url || data?.url;
    if (!url) {
      await admin.from("contribuciones").delete().eq("id", contrib.id).eq("estado", "pendiente");
      return NextResponse.json({ error: "No pudimos iniciar el pago. Intenta de nuevo." }, { status: 502 });
    }
    await admin.from("contribuciones").update({ checkout_id: data?.id || null }).eq("id", contrib.id);
    return NextResponse.json({ url });
  } catch (e: any) {
    console.error("aportes/checkout:", e?.message || e);
    return NextResponse.json({ error: "No pudimos iniciar el pago. Intenta de nuevo." }, { status: 500 });
  }
}
