import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { getEventType } from "../../lib/eventTypes";
import BodaClient from "./BodaClient";

async function getPareja(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const sb = createClient(url, key);
    const { data } = await sb.from("parejas").select("nombre1,nombre2,fecha,lugar,foto_hero,frase_portada,tipo_evento").eq("slug", slug).single();
    return data;
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPareja(slug);
  if (!p) return { title: "Invitación · wedo." };
  // multi-evento: sin "&" cuando no hay nombre2; frase default según tipo.
  // TODO: evaluar ruta /evento/[slug] con redirect desde /boda en una fase posterior.
  const evtType = getEventType(p.tipo_evento);
  const n = [p.nombre1, p.nombre2].filter(Boolean).join(" & ");
  const fecha = p.fecha ? new Date(p.fecha + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" }) : "";
  const title = `${n || (evtType.id === "boda" ? "Nuestra boda" : "Nuestro evento")} · ${p.frase_portada || evtType.frasePortada}`;
  const description = [fecha, p.lugar].filter(Boolean).join(" · ") || "Te invitamos a celebrar con nosotros.";
  const images = [{ url: (p.foto_hero as string) || "/og.png" }];
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
  return <BodaClient slug={slug} />;
}
