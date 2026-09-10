import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { getEventType } from "../../lib/eventTypes";
import BodaClient from "./BodaClient";
import BodaClientAM from "./BodaClientAM";

const AM_SLUG = "andre-gonzalez-y-marjorie-del-cid";

async function getPareja(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const sb = createClient(url, key, { global: { fetch: (i: any, o?: any) => fetch(i, { ...o, cache: "no-store" }) } });
    const { data } = await sb.from("parejas").select("id,nombre1,nombre2,fecha,lugar,foto_hero,frase_portada,tipo_evento").eq("slug", slug).single();
    return data;
  } catch { return null; }
}

/** Nombres (de pila) de la invitación a la que pertenece un link personal (?i=token). */
async function getNombresInvitacion(parejaId: string, token: string): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return "";
  try {
    const sb = createClient(url, key, { global: { fetch: (i: any, o?: any) => fetch(i, { ...o, cache: "no-store" }) } });
    const { data } = await sb.from("invitados").select("miembros")
      .eq("pareja_id", parejaId)
      .contains("miembros", JSON.stringify([{ token }]))
      .single();
    const nombres = (data?.miembros || [])
      .filter((m: any) => m.nombre)
      .map((m: any) => String(m.nombre).trim().split(" ")[0]);
    if (!nombres.length) return "";
    return nombres.length === 1 ? nombres[0] : nombres.slice(0, -1).join(", ") + " & " + nombres[nombres.length - 1];
  } catch { return ""; }
}

export async function generateMetadata(
  { params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ i?: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPareja(slug);
  if (!p) return { title: "Invitación · wedo." };
  // multi-evento: sin "&" cuando no hay nombre2; frase default según tipo.
  // TODO: evaluar ruta /evento/[slug] con redirect desde /boda en una fase posterior.
  const evtType = getEventType(p.tipo_evento);
  const n = [p.nombre1, p.nombre2].filter(Boolean).join(" & ");
  const fecha = p.fecha ? new Date(p.fecha + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" }) : "";
  // link personal (?i=token): la tarjeta de WhatsApp saluda por nombre
  const { i } = await searchParams;
  const paraNombres = i && p.id ? await getNombresInvitacion(p.id, i) : "";
  const baseTitle = `${n || (evtType.id === "boda" ? "Nuestra boda" : "Nuestro evento")} · ${p.frase_portada || evtType.frasePortada}`;
  const title = paraNombres ? `Para ${paraNombres} 💌 ${n || "Nuestra celebración"}` : baseTitle;
  const description = (paraNombres ? "Tu invitación te espera · " : "") + ([fecha, p.lugar].filter(Boolean).join(" · ") || "Te invitamos a celebrar con nosotros.");
  // el template exclusivo A&M comparte su propia tarjeta (portada de terciopelo)
  const images = [{ url: slug === AM_SLUG ? "/og-am.jpg" : ((p.foto_hero as string) || "/og.png") }];
  const url = `https://wedo.gifts/boda/${slug}`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website", url, images },
    twitter: { card: "summary_large_image", title, description, images: images.map((i) => i.url) },
  };
}

export default async function BodaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === AM_SLUG) return <BodaClientAM slug={slug} />;
  return <BodaClient slug={slug} />;
}
