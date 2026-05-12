"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

const PALETAS = [
  { id: "champagne", nombre: "Champagne", dots: ["#8C6D4F", "#FAF8F5", "#B8964A"] },
  { id: "jardin", nombre: "Jardín", dots: ["#4A7C59", "#F4F7F4", "#8BB49A"] },
  { id: "rose", nombre: "Rosa polvos", dots: ["#A0556A", "#FDF5F6", "#D4A0AE"] },
  { id: "midnight", nombre: "Noche & Oro", dots: ["#141210", "#C9A84C", "#F0E8D8"] },
  { id: "terracotta", nombre: "Terracotta", dots: ["#C4562A", "#FDF8F5", "#E8B49A"] },
];

const TIPOGRAFIAS = [
  { id: "Cormorant Garamond", muestra: "Andrea & Diego" },
  { id: "Playfair Display", muestra: "Andrea & Diego" },
  { id: "DM Serif Display", muestra: "Andrea & Diego" },
  { id: "Bodoni Moda", muestra: "Andrea & Diego" },
];

export default function EditorDiseno() {
  const router = useRouter();
  const [pareja, setPareja] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [form, setForm] = useState({ foto_hero: "", tipografia: "Cormorant Garamond", paleta: "champagne", hero_oscuridad: 45 });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data: p } = await supabase.from("parejas").select("*").eq("user_id", user.id).single();
    if (!p) { router.push("/onboarding"); return; }
    setPareja(p);
    setForm({ foto_hero: p.foto_hero || "", tipografia: p.tipografia || "Cormorant Garamond", paleta: p.paleta || "champagne", hero_oscuridad: p.hero_oscuridad || 45 });
    setLoading(false);
  }

  async function handleFotoHero(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingFoto(true);
    const fileName = `hero-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("bodas").upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from("bodas").getPublicUrl(fileName);
      setForm(f => ({ ...f, foto_hero: data.publicUrl }));
    }
    setUploadingFoto(false);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from("parejas").update(form).eq("id", pareja.id);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, color: "#A89C90" }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px" }}>

      {/* FOTO HERO */}
      <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 12 }}>Foto de portada</div>
        <input type="file" accept="image/*" id="foto-hero" onChange={handleFotoHero} style={{ display: "none" }} />
        {form.foto_hero ? (
          <div>
            <img src={form.foto_hero} alt="hero" style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 3, marginBottom: 8 }} />
            <button onClick={() => document.getElementById("foto-hero")?.click()} style={{ fontSize: 11, color: "#8C6D4F", background: "none", border: "none", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontWeight: 600 }}>📷 Cambiar foto</button>
          </div>
        ) : (
          <div onClick={() => document.getElementById("foto-hero")?.click()} style={{ border: "1.5px dashed rgba(26,23,20,0.14)", borderRadius: 3, padding: 28, textAlign: "center" as const, cursor: "pointer", background: "#FAF8F5" }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, color: uploadingFoto ? "#8C6D4F" : "#A89C90" }}>{uploadingFoto ? "Subiendo..." : "📷 Subir foto de portada"}</div>
            <div style={{ fontSize: 10, color: "#A89C90", marginTop: 4 }}>Recomendado: 1600×900px</div>
          </div>
        )}
      </div>

      {/* PALETA */}
      <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 12 }}>Paleta de color</div>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
          {PALETAS.map(p => (
            <div key={p.id} onClick={() => setForm(f => ({ ...f, paleta: p.id }))} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", border: `1px solid ${form.paleta === p.id ? "#8C6D4F" : "rgba(26,23,20,0.14)"}`, borderRadius: 3, cursor: "pointer", background: form.paleta === p.id ? "#EDE0D4" : "#FAF8F5", transition: "all 0.15s" }}>
              <div style={{ display: "flex", gap: 4 }}>
                {p.dots.map((d, i) => <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: d, border: "1px solid rgba(0,0,0,0.08)" }} />)}
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#5A524A" }}>{p.nombre}</div>
              {form.paleta === p.id && <div style={{ marginLeft: "auto", color: "#8C6D4F" }}>✓</div>}
            </div>
          ))}
        </div>
      </div>

      {/* TIPOGRAFIA */}
      <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 12 }}>Tipografía</div>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
          {TIPOGRAFIAS.map(t => (
            <div key={t.id} onClick={() => setForm(f => ({ ...f, tipografia: t.id }))} style={{ padding: "10px 14px", border: `1px solid ${form.tipografia === t.id ? "#8C6D4F" : "rgba(26,23,20,0.14)"}`, borderRadius: 3, cursor: "pointer", background: form.tipografia === t.id ? "#EDE0D4" : "#FAF8F5" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#A89C90", marginBottom: 3 }}>{t.id}</div>
              <div style={{ fontFamily: `'${t.id}', serif`, fontSize: 20, color: "#1A1714", fontStyle: "italic" }}>{t.muestra}</div>
            </div>
          ))}
        </div>
      </div>

      {/* OSCURIDAD */}
      <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 12 }}>Oscuridad de la portada</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: "#A89C90" }}>Claro</span>
          <input type="range" min={0} max={80} value={form.hero_oscuridad} onChange={e => setForm(f => ({ ...f, hero_oscuridad: parseInt(e.target.value) }))} style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: "#A89C90" }}>Oscuro</span>
        </div>
      </div>

      <button onClick={handleSave} style={{ width: "100%", padding: 13, background: saved ? "#6B8C76" : saving ? "#A89C90" : "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif", transition: "background 0.3s" }}>
        {saved ? "¡Guardado! ✦" : saving ? "Guardando..." : "Guardar diseño"}
      </button>
    </div>
  );
}