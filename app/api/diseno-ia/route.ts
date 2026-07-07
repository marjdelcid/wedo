/* =====================================================================
   wedo. — app/api/diseno-ia/route.ts
   Diseñador IA de invitaciones. POST { parejaId?, tema, tipoEvento }.
   1) Auth (Bearer token del cliente) y ownership de la pareja
   2) Límite: 3 generaciones por pareja (o por usuario en onboarding)
   3) Caché por (tema normalizado, tipo_evento) — no descuenta límite
   4) Tema → diseño con Anthropic (claude-sonnet-4-6): SOLO JSON
   5) Imagen con ImageProvider → Supabase Storage (bucket bodas)
   6) Persistencia en disenos_ia. NO aplica nada a `parejas`.
   ===================================================================== */
import { NextResponse } from "next/server";
import { supabaseAdmin, getUserFromRequest } from "../../lib/supabaseServer";
import { getImageProvider } from "../../lib/ai/imageProvider";
import { TIPOGRAFIA_IDS, esTipografiaValida } from "../../lib/tipografias";
import { getEventType } from "../../lib/eventTypes";

export const runtime = "nodejs";
export const maxDuration = 60;

const LIMITE = 3;
const ANTHROPIC_TIMEOUT_MS = 60_000;
const MAX_IMG_BYTES = 8 * 1024 * 1024;

/* Tipografía de respaldo si la IA propone algo fuera del catálogo */
const FALLBACK_TIPOGRAFIA: Record<string, { titulos: string; cuerpo: string }> = {
  boda: { titulos: "Cormorant Garamond", cuerpo: "Cormorant Garamond" },
  quince: { titulos: "Playfair Display", cuerpo: "Lora" },
  cumple_nino: { titulos: "Poppins", cuerpo: "Nunito" },
  cumple_adulto: { titulos: "DM Serif Display", cuerpo: "DM Sans" },
  baby_shower: { titulos: "Josefin Serif", cuerpo: "Nunito" },
  despedida: { titulos: "Abril Fatface", cuerpo: "Outfit" },
  otro: { titulos: "Playfair Display", cuerpo: "Lora" },
};

function normalizarTema(t: string): string {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ---- contraste AA del acento contra crema #F7F0E5 ---- */
function luminancia(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contraste(a: string, b: string): number {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
/** Oscurece el color hasta lograr contraste ≥3 (AA texto grande) vs crema. */
function asegurarContraste(hex: string): string {
  let h = hex;
  for (let i = 0; i < 12 && contraste(h, "#F7F0E5") < 3; i++) {
    const n = h.replace("#", "");
    const dark = [0, 2, 4]
      .map((j) => Math.max(0, Math.round(parseInt(n.slice(j, j + 2), 16) * 0.85)))
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("");
    h = `#${dark}`;
  }
  return h;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

async function disenarConClaude(tema: string, tipoEvento: string) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY no está configurada");
  const evt = getEventType(tipoEvento);

  const prompt = `Eres el director de arte de wedo., una plataforma guatemalteca de invitaciones digitales para eventos. La invitación es HTML tematizado (no una imagen): tú generas los INGREDIENTES del diseño.

Evento: ${evt.label} (${tipoEvento})
Tema que escribió el usuario: "${tema}"

Catálogo EXACTO de tipografías disponibles (usa los nombres tal cual):
${TIPOGRAFIA_IDS.join(", ")}

Responde SOLO un objeto JSON válido, sin texto adicional ni fences, con este shape:
{
  "colores": ["#hex", "#hex", "#hex", "#hex"],
  "tipografia": "<una del catálogo, para los nombres/display>",
  "tipografia_titulos": "<una del catálogo, para títulos de sección>",
  "frase_portada": "…",
  "prompt_imagen": "…"
}

Reglas:
- colores: 4 hex de una paleta coherente con el tema. colores[0] es el ACENTO principal y debe tener contraste AA contra crema #F7F0E5 (evita tonos pastel muy claros en [0]).
- tipografia y tipografia_titulos: SOLO nombres del catálogo, acordes al tono del tema y del tipo de evento.
- frase_portada: en español (Guatemala), corta (2-5 palabras), celebratoria, acorde al tipo de evento (ej. boda "Nos casamos", cumpleaños "¡Ven a celebrar!").
- prompt_imagen: en INGLÉS. Describe un fondo/escena decorativa vertical acorde al tema, estilo editorial suave (soft editorial illustration/photography backdrop). PROHIBIDO: texto, letras, números, logos, marcas, personas reconocibles y personajes con copyright. Si el tema es una marca o personaje (ej. "Frozen", "Spiderman"), tradúcelo a su esencia genérica (ej. "winter princess palace, ice blue tones", "red and blue comic-style city skyline"). Debe funcionar como foto de portada con texto encima: composición limpia, zona central despejada.`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ANTHROPIC_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Anthropic ${res.status}: ${detail.slice(0, 300)}`);
    }
    const json = await res.json();
    const texto: string = json?.content?.[0]?.text || "";
    // parseo tolerante: quita fences y busca el primer objeto JSON
    const limpio = texto.replace(/```json/gi, "").replace(/```/g, "").trim();
    const m = limpio.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("La IA no devolvió JSON");
    const d = JSON.parse(m[0]);

    // validar shape con tolerancia + fallbacks
    const fb = FALLBACK_TIPOGRAFIA[evt.id] || FALLBACK_TIPOGRAFIA.otro;
    let colores: string[] = Array.isArray(d.colores) ? d.colores.filter((c: any) => typeof c === "string" && HEX_RE.test(c)) : [];
    if (colores.length < 4) {
      const base = ["#E84B8A", "#87A6E8", "#B3C24A", "#EE5A28"];
      colores = [...colores, ...base].slice(0, 4);
    }
    colores = colores.slice(0, 4);
    colores[0] = asegurarContraste(colores[0]);

    return {
      colores,
      tipografia: esTipografiaValida(d.tipografia) ? d.tipografia : fb.cuerpo,
      tipografia_titulos: esTipografiaValida(d.tipografia_titulos) ? d.tipografia_titulos : fb.titulos,
      frase_portada: (typeof d.frase_portada === "string" && d.frase_portada.trim()) ? d.frase_portada.trim().slice(0, 60) : evt.frasePortada,
      prompt_imagen: (typeof d.prompt_imagen === "string" && d.prompt_imagen.trim()) ? d.prompt_imagen.trim() : `soft editorial decorative backdrop for a ${evt.label} celebration, ${tema}, no text, no letters, clean central area`,
    };
  } finally {
    clearTimeout(timer);
  }
}

function esImagenValida(buf: Buffer): "image/jpeg" | "image/png" | null {
  if (buf.length < 100 || buf.length > MAX_IMG_BYTES) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  return null;
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Inicia sesión para generar diseños." }, { status: 401 });

    const body = await req.json().catch(() => null);
    const tema: string = (body?.tema || "").toString().slice(0, 120);
    const tipoEvento: string = (body?.tipoEvento || "otro").toString();
    const parejaId: string | null = body?.parejaId || null;
    // "Regenerar" salta la lectura de caché (sí respeta el límite)
    const nocache: boolean = !!body?.nocache;
    if (!tema.trim()) return NextResponse.json({ error: "Escribe un tema para tu diseño." }, { status: 400 });

    const admin = supabaseAdmin();

    // ownership + límite
    let pareja: any = null;
    if (parejaId) {
      const { data } = await admin.from("parejas").select("id,user_id,disenos_ia_usados").eq("id", parejaId).single();
      if (!data || data.user_id !== user.id) {
        return NextResponse.json({ error: "No encontramos tu evento." }, { status: 403 });
      }
      pareja = data;
    }
    const usados = pareja
      ? (pareja.disenos_ia_usados || 0)
      : (await admin.from("disenos_ia").select("id", { count: "exact", head: true }).eq("creado_por", user.id)).count || 0;

    // caché — no llama proveedores ni descuenta límite
    const temaNorm = normalizarTema(tema);
    const { data: cacheHit } = nocache
      ? { data: null }
      : await admin
          .from("disenos_ia")
          .select("resultado,foto_hero")
          .eq("tema_normalizado", temaNorm)
          .eq("tipo_evento", tipoEvento)
          .maybeSingle();
    if (cacheHit) {
      return NextResponse.json({
        ...(cacheHit.resultado as object),
        foto_hero: cacheHit.foto_hero || null,
        cached: true,
        restantes: Math.max(0, LIMITE - usados),
      });
    }

    if (usados >= LIMITE) {
      return NextResponse.json(
        { error: "Ya usaste tus 3 diseños con IA para este evento. Puedes ajustar colores, tipografía y foto a mano en Diseño.", restantes: 0 },
        { status: 429 }
      );
    }

    // tema → diseño (Anthropic)
    const diseno = await disenarConClaude(tema, tipoEvento);

    // imagen (provider configurable) → Storage
    let fotoHero: string | null = null;
    try {
      const prov = getImageProvider();
      const out = await prov.generar(diseno.prompt_imagen);
      let buf = out.buffer || null;
      if (!buf && out.url) {
        const r = await fetch(out.url);
        if (r.ok) buf = Buffer.from(await r.arrayBuffer());
      }
      const mime = buf ? esImagenValida(buf) : null;
      if (buf && mime) {
        const path = `ia/${parejaId || user.id}/${Date.now()}.${mime === "image/png" ? "png" : "jpg"}`;
        const { error: upErr } = await admin.storage.from("bodas").upload(path, buf, { contentType: mime, upsert: false });
        if (!upErr) {
          const { data: pub } = admin.storage.from("bodas").getPublicUrl(path);
          fotoHero = pub?.publicUrl || null;
        }
      }
    } catch {
      // sin imagen no bloqueamos: devolvemos paleta/tipografía/frase igual
      fotoHero = null;
    }

    const resultado = {
      colores: diseno.colores,
      tipografia: diseno.tipografia,
      tipografia_titulos: diseno.tipografia_titulos,
      frase_portada: diseno.frase_portada,
    };

    // persistencia (cache global; upsert para que Regenerar reemplace) + descuento del límite
    await admin.from("disenos_ia").upsert(
      {
        tema_normalizado: temaNorm,
        tipo_evento: tipoEvento,
        resultado,
        foto_hero: fotoHero,
        creado_por: user.id,
      },
      { onConflict: "tema_normalizado,tipo_evento" }
    );
    if (pareja) {
      await admin.from("parejas").update({ disenos_ia_usados: usados + 1 }).eq("id", pareja.id);
    }

    return NextResponse.json({ ...resultado, foto_hero: fotoHero, cached: false, restantes: Math.max(0, LIMITE - usados - 1) });
  } catch (e: any) {
    console.error("diseno-ia:", e?.message || e);
    return NextResponse.json(
      { error: "No pudimos generar el diseño. Intenta de nuevo en un momento." },
      { status: 500 }
    );
  }
}
