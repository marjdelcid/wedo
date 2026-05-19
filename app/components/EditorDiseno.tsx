"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

const PALETAS = [
  { id: "champagne",  nombre: "Champagne",       accent: "#8C6D4F", bg: "#FAF8F5", dots: ["#8C6D4F", "#FAF8F5", "#B8964A"] },
  { id: "jardin",     nombre: "Jardín",            accent: "#4A7C59", bg: "#F4F7F4", dots: ["#4A7C59", "#F4F7F4", "#8BB49A"] },
  { id: "rose",       nombre: "Rosa polvos",       accent: "#A0556A", bg: "#FDF5F6", dots: ["#A0556A", "#FDF5F6", "#D4A0AE"] },
  { id: "midnight",   nombre: "Noche & Oro",       accent: "#C9A84C", bg: "#141210", dots: ["#141210", "#C9A84C", "#F0E8D8"] },
  { id: "terracotta", nombre: "Terracotta",         accent: "#C4562A", bg: "#FDF8F5", dots: ["#C4562A", "#FDF8F5", "#E8B49A"] },
  { id: "lavanda",    nombre: "Lavanda",            accent: "#7B6BA8", bg: "#F7F5FF", dots: ["#7B6BA8", "#F7F5FF", "#C4BCDC"] },
  { id: "azulpolvo",  nombre: "Azul polvos",        accent: "#4A6E8C", bg: "#F3F7FA", dots: ["#4A6E8C", "#F3F7FA", "#8AAEC4"] },
  { id: "bordeaux",   nombre: "Bordeaux",           accent: "#7A2B3A", bg: "#FDF5F6", dots: ["#7A2B3A", "#FDF5F6", "#C4788A"] },
  { id: "olivo",      nombre: "Olivo & Marfil",     accent: "#5C6E3E", bg: "#F8F6EE", dots: ["#5C6E3E", "#F8F6EE", "#A0A870"] },
  { id: "grisperla",  nombre: "Gris perla",         accent: "#5A5A5A", bg: "#F8F8F8", dots: ["#5A5A5A", "#F8F8F8", "#A8A8A8"] },
  { id: "vinedo",     nombre: "Viñedo",             accent: "#7A2B3A", bg: "#F8F6EE", dots: ["#7A2B3A", "#F8F6EE", "#5C6E3E"] },
];

const TIPOGRAFIAS = [
  { id: "Cormorant Garamond", estilo: "Clásica · Elegante" },
  { id: "Playfair Display",   estilo: "Editorial · Moderna" },
  { id: "DM Serif Display",   estilo: "Geométrica · Limpia" },
  { id: "Bodoni Moda",        estilo: "Alta moda · Dramática" },
  { id: "Great Vibes",        estilo: "Script · Romántica" },
  { id: "Cinzel",             estilo: "Romana · Majestuosa" },
  { id: "Lora",               estilo: "Tradicional · Cálida" },
  { id: "Gilda Display",      estilo: "Fina · Editorial" },
  { id: "Libre Baskerville",  estilo: "Clásica · Legible" },
  { id: "Sacramento",         estilo: "Caligráfica · Fluida" },
  { id: "Abril Fatface",      estilo: "Display · Impactante" },
  { id: "EB Garamond",        estilo: "Literaria · Refinada" },
  { id: "Josefin Serif",      estilo: "Geométrica · Delicada" },
  { id: "Italiana",           estilo: "Italiana · Estilizada" },
  { id: "Marcellus",          estilo: "Romana · Inscripcional" },
  { id: "Yeseva One",         estilo: "Display · Retro" },
  { id: "Cardo",              estilo: "Académica · Seria" },
  { id: "Tenor Sans",         estilo: "Sans · Minimalista" },
  { id: "Crimson Pro",        estilo: "Literaria · Moderna" },
  { id: "Montserrat",         estilo: "Moderna · Geométrica" },
  { id: "Raleway",            estilo: "Moderna · Elegante" },
  { id: "Josefin Sans",       estilo: "Geométrica · Fina" },
  { id: "Nunito",             estilo: "Amigable · Redondeada" },
  { id: "Outfit",             estilo: "Contemporánea · Limpia" },
  { id: "DM Sans",            estilo: "Editorial · Sans" },
  { id: "Poppins",            estilo: "Popular · Moderna" },
  { id: "Work Sans",          estilo: "Funcional · Moderna" },
  { id: "Plus Jakarta Sans",  estilo: "Contemporánea · Sharp" },
  { id: "Epilogue",           estilo: "Minimalista · Bold" },
  // Wedding scripts
  { id: "Pinyon Script",      estilo: "Boda · Caligrafía fina" },
  { id: "Allura",             estilo: "Boda · Script elegante" },
  { id: "Alex Brush",         estilo: "Boda · Pincel delicado" },
  { id: "Tangerine",          estilo: "Boda · Cursiva clásica" },
  { id: "Parisienne",         estilo: "Boda · Francesa vintage" },
  { id: "Euphoria Script",    estilo: "Boda · Caligrafía moderna" },
  { id: "Clicker Script",     estilo: "Boda · Plumilla formal" },
  { id: "Mr De Haviland",     estilo: "Boda · Copperplate" },
  { id: "The Nautigal",       estilo: "Boda · Fluida & trendy" },
  { id: "Italianno",          estilo: "Boda · Italiana clásica" },
];

function FontSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const selected = TIPOGRAFIAS.find(t => t.id === value) || TIPOGRAFIAS[0];
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 8 }}>{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "9px 12px", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 12, fontFamily: "'Jost', sans-serif", background: "#FAF8F5", color: "#1A1714", outline: "none", cursor: "pointer" }}>
        {TIPOGRAFIAS.map(t => (
          <option key={t.id} value={t.id}>{t.id} — {t.estilo}</option>
        ))}
      </select>
      <div style={{ marginTop: 8, padding: "12px 16px", background: "#FAF8F5", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 3, textAlign: "center" as const }}>
        <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 5 }}>{selected.estilo}</div>
        <div style={{ fontFamily: `'${selected.id}', serif, sans-serif`, fontSize: 26, color: "#1A1714", lineHeight: 1.2 }}>Andrea & Diego</div>
      </div>
    </div>
  );
}

const colorLabels = [
  { key: "color_acento",     label: "Color principal", desc: "Botones, acentos, líneas decorativas" },
  { key: "color_fondo",      label: "Color de fondo",   desc: "Fondo general de la página" },
  { key: "color_superficie", label: "Color de tarjetas", desc: "Fondo de las tarjetas y secciones" },
];

export default function EditorDiseno() {
  const router = useRouter();
  const [pareja, setPareja] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [form, setForm] = useState({
    foto_hero: "",
    tipografia: "Cormorant Garamond",
    tipografia_titulos: "Cormorant Garamond",
    paleta: "champagne",
    hero_oscuridad: 45,
    color_acento: "#8C6D4F",
    color_fondo: "#FAF8F5",
    color_superficie: "#FFFFFF",
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data: p } = await supabase.from("parejas").select("*").eq("user_id", user.id).single();
    if (!p) { router.push("/onboarding"); return; }
    setPareja(p);
    const palPre = PALETAS.find(x => x.id === (p.paleta || "champagne")) || PALETAS[0];
    setForm({
      foto_hero: p.foto_hero || "",
      tipografia: p.tipografia || "Cormorant Garamond",
      tipografia_titulos: p.tipografia_titulos || p.tipografia || "Cormorant Garamond",
      paleta: p.paleta || "champagne",
      hero_oscuridad: p.hero_oscuridad || 45,
      color_acento: p.color_acento || palPre.accent,
      color_fondo: p.color_fondo || palPre.bg,
      color_superficie: p.color_superficie || "#FFFFFF",
    });
    setLoading(false);
  }

  function handlePaletaChange(id: string) {
    if (id === "personalizado") {
      setForm(f => ({ ...f, paleta: "personalizado" }));
      return;
    }
    const pal = PALETAS.find(p => p.id === id);
    if (!pal) return;
    setForm(f => ({ ...f, paleta: id, color_acento: pal.accent, color_fondo: pal.bg, color_superficie: "#FFFFFF" }));
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

  const accentPreview = form.paleta === "personalizado" ? form.color_acento : (PALETAS.find(p => p.id === form.paleta)?.accent || "#8C6D4F");

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

        <select
          value={form.paleta}
          onChange={e => handlePaletaChange(e.target.value)}
          style={{ width: "100%", padding: "9px 12px", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 12, fontFamily: "'Jost', sans-serif", background: "#FAF8F5", color: "#1A1714", outline: "none", cursor: "pointer", marginBottom: 12 }}
        >
          {PALETAS.map(p => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
          <option value="personalizado">✦ Personalizado — elige tus colores</option>
        </select>

        {/* Preview de la paleta seleccionada */}
        {form.paleta !== "personalizado" && (() => {
          const pal = PALETAS.find(p => p.id === form.paleta);
          return pal ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 14px", background: pal.bg, borderRadius: 3, border: "1px solid rgba(26,23,20,0.08)" }}>
              <div style={{ display: "flex", gap: 5 }}>
                {pal.dots.map((d, i) => <div key={i} style={{ width: 18, height: 18, borderRadius: "50%", background: d, border: "1px solid rgba(0,0,0,0.1)" }} />)}
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#5A524A" }}>{pal.nombre}</div>
              <div style={{ marginLeft: "auto", width: 32, height: 14, borderRadius: 2, background: pal.accent }} />
            </div>
          ) : null;
        })()}

        {/* Colores personalizados */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 12 }}>
            {form.paleta === "personalizado" ? "Tus colores personalizados" : "Ajuste fino de colores"}
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
            {colorLabels.map(({ key, label, desc }) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#FAF8F5", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 3 }}>
                <input
                  type="color"
                  value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value, paleta: "personalizado" }))}
                  style={{ width: 36, height: 36, padding: 2, border: "1px solid rgba(26,23,20,0.14)", borderRadius: 4, cursor: "pointer", background: "none" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1714", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 10, color: "#A89C90" }}>{desc}</div>
                </div>
                <div style={{ fontSize: 11, fontFamily: "monospace", color: "#A89C90" }}>{(form as any)[key]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TIPOGRAFÍAS */}
      <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 16 }}>Tipografía</div>
        <FontSelect label="Título principal (tus nombres)" value={form.tipografia} onChange={v => setForm(f => ({ ...f, tipografia: v }))} />
        <FontSelect label="Títulos de secciones y regalos" value={form.tipografia_titulos} onChange={v => setForm(f => ({ ...f, tipografia_titulos: v }))} />
      </div>

      {/* OSCURIDAD */}
      <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 12 }}>Oscuridad de la portada</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: "#A89C90" }}>Claro</span>
          <input type="range" min={0} max={95} value={form.hero_oscuridad} onChange={e => setForm(f => ({ ...f, hero_oscuridad: parseInt(e.target.value) }))} style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: "#A89C90" }}>Oscuro</span>
        </div>
      </div>

      <button onClick={handleSave} style={{ width: "100%", padding: 13, background: saved ? "#6B8C76" : saving ? "#A89C90" : accentPreview, color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif", transition: "background 0.3s" }}>
        {saved ? "¡Guardado! ✦" : saving ? "Guardando..." : "Guardar diseño"}
      </button>
    </div>
  );
}
