import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import StdClient from "./StdClient";

async function getPareja(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const sb = createClient(url, key);
    const { data } = await sb.from("parejas").select("nombre1,nombre2,fecha,lugar,foto_hero,std_estilo").eq("slug", slug).single();
    return data;
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPareja(slug);
  if (!p) return { title: "Save the Date · wedo." };
  const n = `${p.nombre1 || ""} & ${p.nombre2 || ""}`.trim().replace(/^& | &$/g, "");
  const fecha = p.fecha ? new Date(p.fecha + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" }) : "";
  const title = `${n || "Nuestra boda"} · Save the date`;
  const description = ["Reserva la fecha", fecha, p.lugar].filter(Boolean).join(" · ");
  // imagen = la "tarjeta de WhatsApp" del estilo elegido (póster vertical)
  const estilo = (p.std_estilo || "c").toLowerCase();
  let image: { url: string; width?: number; height?: number };
  if (estilo === "a") image = { url: (p.foto_hero as string) || "/og.png" };
  else if (estilo === "b") image = { url: "/og-std-b.png", width: 1080, height: 1350 };
  else image = { url: "/og-std-c.png", width: 1080, height: 1350 };
  const url = `https://wedo.gifts/std/${slug}`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website", url, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

export default async function StdPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StdClient slug={slug} />;
}
