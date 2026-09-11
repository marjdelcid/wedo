/* =====================================================================
   wedo. — app/api/webhooks/recurrente/route.ts (POST)
   Recibe los webhooks de Recurrente (firmados con Svix). Ante un cobro
   exitoso (intent.succeeded) marca la contribución 'pagado' y suma el
   aporte al recaudado del fondo. Idempotente: solo procesa pendientes.
   ===================================================================== */
import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "../../../lib/supabaseServer";

export const runtime = "nodejs";

/** Verificación manual de firma Svix: HMAC-SHA256 de "id.timestamp.body"
    con la porción base64 del signing secret (whsec_...). */
function firmaValida(secret: string, id: string, timestamp: string, body: string, signatures: string): boolean {
  try {
    const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
    const firmado = crypto.createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64");
    // svix-signature puede traer varias firmas separadas por espacio: "v1,abc v1,def"
    return signatures.split(" ").some((s) => {
      const [, sig] = s.split(",");
      if (!sig) return false;
      const a = Buffer.from(firmado); const b = Buffer.from(sig);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    });
  } catch { return false; }
}

/** Busca un valor por clave en cualquier nivel del payload (la forma exacta
    del envelope puede variar entre versiones del API). */
function buscar(obj: any, claves: string[]): string | null {
  if (!obj || typeof obj !== "object") return null;
  for (const k of claves) if (typeof obj[k] === "string" && obj[k]) return obj[k];
  for (const v of Object.values(obj)) {
    if (v && typeof v === "object") { const r = buscar(v, claves); if (r) return r; }
  }
  return null;
}

export async function POST(req: Request) {
  const body = await req.text();
  const secret = process.env.RECURRENTE_WEBHOOK_SECRET;

  if (secret) {
    const id = req.headers.get("svix-id") || "";
    const ts = req.headers.get("svix-timestamp") || "";
    const sig = req.headers.get("svix-signature") || "";
    if (!id || !ts || !sig || !firmaValida(secret, id, ts, body, sig)) {
      return NextResponse.json({ error: "firma inválida" }, { status: 400 });
    }
  } else {
    // sin secret configurado no aceptamos nada (evita confirmaciones falsas)
    return NextResponse.json({ error: "webhook no configurado" }, { status: 503 });
  }

  let evento: any = {};
  try { evento = JSON.parse(body); } catch { return NextResponse.json({ ok: true }); }

  const tipo = evento?.event_type || evento?.type || "";
  if (!String(tipo).includes("succeeded")) return NextResponse.json({ ok: true });

  try {
    const admin = supabaseAdmin();
    // localizar la contribución: por metadata o por checkout id
    const contribId = buscar(evento, ["contribucion_id"]);
    const checkoutId = buscar(evento, ["checkout_id"]) || evento?.checkout?.id || null;

    let q = admin.from("contribuciones").select("id,fondo_id,monto,estado").limit(1);
    if (contribId) q = q.eq("id", contribId);
    else if (checkoutId) q = q.eq("checkout_id", checkoutId);
    else return NextResponse.json({ ok: true });

    const { data: rows } = await q;
    const c = rows?.[0];
    if (!c || c.estado !== "pendiente") return NextResponse.json({ ok: true }); // idempotente

    await admin.from("contribuciones").update({ estado: "pagado" }).eq("id", c.id).eq("estado", "pendiente");
    const { data: fondo } = await admin.from("fondos").select("recaudado").eq("id", c.fondo_id).single();
    await admin.from("fondos").update({ recaudado: (Number(fondo?.recaudado) || 0) + Number(c.monto) }).eq("id", c.fondo_id);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("webhook recurrente:", e?.message || e);
    // 500 para que Svix reintente
    return NextResponse.json({ error: "error interno" }, { status: 500 });
  }
}
