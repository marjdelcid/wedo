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
  // la foto solo aplica al estilo A; en los demás usamos el OG de marca
  const img = (p.std_estilo === "a" && p.foto_hero) ? (p.foto_hero as string) : "/og.png";
  const url = `https://wedo.gifts/std/${slug}`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website", url, images: [{ url: img }] },
    twitter: { card: "summary_large_image", title, description, images: [img] },
  };
}

export default async function StdPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StdClient slug={slug} />;
}
