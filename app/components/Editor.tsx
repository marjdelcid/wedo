"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

const PALETAS = [
  { id: "champagne", nombre: "Champagne", accent: "#8C6D4F", bg: "#FAF8F5", dots: ["#8C6D4F", "#FAF8F5", "#B8964A"] },
  { id: "jardin", nombre: "Jardín", accent: "#4A7C59", bg: "#F4F7F4", dots: ["#4A7C59", "#F4F7F4", "#8BB49A"] },
  { id: "rose", nombre: "Rosa polvos", accent: "#A0556A", bg: "#FDF5F6", dots: ["#A0556A", "#FDF5F6", "#D4A0AE"] },
  { id: "midnight", nombre: "Noche & Oro", accent: "#C9A84C", bg: "#141210", dots: ["#141210", "#C9A84C", "#F0E8D8"] },
  { id: "terracotta", nombre: "Terracotta", accent: "#C4562A", bg: "#FDF8F5", dots: ["#C4562A", "#FDF8F5", "#E8B49A"] },
];

const TIPOGRAFIAS = [
  { id: "Cormorant Garamond", nombre: "Cormorant Garamond", muestra: "Andrea & Diego" },
  { id: "Playfair Display", nombre: "Playfair Display", muestra: "Andrea & Diego" },
  { id: "DM Serif Display", nombre: "DM Serif Display", muestra: "Andrea & Diego" },
  { id: "Bodoni Moda", nombre: "Bodoni Moda", muestra: "Andrea & Diego" },
];

export default function Editor() {
  const router = useRouter();
  const [pareja, setPareja] = useState<any>(null);
  const [fondos, setFondos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("diseno");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [uploadingInv, setUploadingInv] = useState(false);

  // Fondos state
  const [showForm, setShowForm] = useState(false);
  const [editingFondo, setEditingFondo] = useState<any>(null);
  const [savingFondo, setSavingFondo] = useState(false);
  const [uploadingFotoFondo, setUploadingFotoFondo] = useState(false);
  const [fondo, setFondo] = useState({ nombre: "", descripcion: "", historia: "", meta: "", foto: "" });

  // Pareja editable
  const [form, setForm] = useState<any>({
    nombre1: "", nombre2: "", fecha: "", lugar: "", hora: "",
    ceremonia: "", recepcion: "", dresscode: "", historia: "",
    musica: "", hashtag: "", foto_hero: "", tipografia: "Cormorant Garamond",
    paleta: "champagne", hero_oscuridad: 45, invitacion_url: "",
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data: p } = await supabase.from("parejas").select("*").eq("user_id", user.id).single();
    if (!p) { router.push("/onboarding"); return; }
    setPareja(p);
    setForm({
      nombre1: p.nombre1 || "", nombre2: p.nombre2 || "",
      fecha: p.fecha || "", lugar: p.lugar || "", hora: p.hora || "",
      ceremonia: p.ceremonia || "", recepcion: p.recepcion || "",
      dresscode: p.dresscode || "", historia: p.historia || "",
      musica: p.musica || "", hashtag: p.hashtag || "",
      foto_hero: p.foto_hero || "", tipografia: p.tipografia || "Cormorant Garamond",
      paleta: p.paleta || "champagne", hero_oscuridad: p.hero_oscuridad || 45,
      invitacion_url: p.invitacion_url || "",
    });
    const { data: f } = await supabase.from("fondos").select("*").eq("pareja_id", p.id).order("orden");
    setFondos(f || []);
    setLoading(false);
  }

 async function handleSaveForm() {
  setSaving(true);
  const { error } = await supabase.from("parejas").update({
    nombre1: form.nombre1, nombre2: form.nombre2,
    fecha: form.fecha || null, lugar: form.lugar, hora: form.hora,
    ceremonia: form.ceremonia, recepcion: form.recepcion,
    dresscode: form.dresscode, historia: form.historia,
    musica: form.musica, hashtag: form.hashtag,
    foto_hero: form.foto_hero, tipografia: form.tipografia,
    paleta: form.paleta, hero_oscuridad: form.hero_oscuridad,
    invitacion_url: form.invitacion_url,
  }).eq("id", pareja.id);
  if (error) {
    alert("Error: " + error.message);
  } else {
    alert("Guardado exitosamente");
  }
  setSaving(false);
  setSaved(true);
  setTimeout(() => setSaved(false), 2500);
}

  async function handleFotoHero(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingFoto(true);
    const fileName = `hero-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("bodas").upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from("bodas").getPublicUrl(fileName);
      setForm((p: any) => ({ ...p, foto_hero: data.publicUrl }));
    }
    setUploadingFoto(false);
  }

  async function handleInvitacion(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingInv(true);
    const fileName = `inv-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("bodas").upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from("bodas").getPublicUrl(fileName);
      setForm((p: any) => ({ ...p, invitacion_url: data.publicUrl }));
    }
    setUploadingInv(false);
  }

  async function handleFotoFondo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingFotoFondo(true);
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("fondos").upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from("fondos").getPublicUrl(fileName);
      setFondo(p => ({ ...p, foto: data.publicUrl }));
    }
    setUploadingFotoFondo(false);
  }

  function openNew() {
    setEditingFondo(null);
    setFondo({ nombre: "", descripcion: "", historia: "", meta: "", foto: "" });
    setShowForm(true);
  }

  function openEdit(f: any) {
    setEditingFondo(f);
    setFondo({ nombre: f.nombre || "", descripcion: f.descripcion || "", historia: f.historia || "", meta: f.meta?.toString() || "", foto: f.foto || "" });
    setShowForm(true);
  }

  async function handleSaveFondo() {
    if (!fondo.nombre) return;
    setSavingFondo(true);
    if (editingFondo) {
      await supabase.from("fondos").update({ nombre: fondo.nombre, descripcion: fondo.descripcion, historia: fondo.historia, meta: parseFloat(fondo.meta) || 0, foto: fondo.foto || null }).eq("id", editingFondo.id);
    } else {
      await supabase.from("fondos").insert({ pareja_id: pareja.id, nombre: fondo.nombre, descripcion: fondo.descripcion, historia: fondo.historia, meta: parseFloat(fondo.meta) || 0, recaudado: 0, orden: fondos.length, foto: fondo.foto || null });
    }
    setFondo({ nombre: "", descripcion: "", historia: "", meta: "", foto: "" });
    setShowForm(false); setEditingFondo(null); setSavingFondo(false);
    loadData();
  }

  async function handleDeleteFondo(id: string) {
    await supabase.from("fondos").delete().eq("id", id);
    loadData();
  }

  const paleta = PALETAS.find(p => p.id === form.paleta) || PALETAS[0];
  const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 13, fontFamily: "'Jost', sans-serif", background: "#FAF8F5", color: "#1A1714", outline: "none", marginBottom: 12 };
  const labelStyle = { fontSize: 10, fontWeight: 600 as const, color: "#5A524A", display: "block" as const, marginBottom: 5, letterSpacing: 0.5 };
  const sectionTitle = { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 300 as const, color: "#1A1714", marginBottom: 16 };

  if (loading) return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: "#FAF8F5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, color: "#A89C90" }}>Cargando...</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: "#FAF8F5", minHeight: "100vh" }}>

      {/* TOP BAR */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", background: "rgba(250,248,245,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(26,23,20,0.14)", gap: 8 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase" as const, color: "#1A1714", flexShrink: 0 }}>
          WE<em style={{ color: "#8C6D4F", fontStyle: "italic", letterSpacing: 0 }}>do</em>
        </div>
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" as const, justifyContent: "center" }}>
          {[["diseno","Diseño"],["info","Información"],["invitacion","Invitación"],["fondos","Fondos"]].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 12px", fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, border: "1px solid rgba(26,23,20,0.14)", background: tab === t ? "#1A1714" : "transparent", cursor: "pointer", borderRadius: 3, color: tab === t ? "#fff" : "#A89C90", fontFamily: "'Jost', sans-serif" }}>
              {l}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <a href={`/boda/${pareja?.slug}`} target="_blank" style={{ padding: "7px 14px", fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, border: "1px solid #8C6D4F", background: "transparent", cursor: "pointer", borderRadius: 3, color: "#8C6D4F", fontFamily: "'Jost', sans-serif", textDecoration: "none" }}>Ver página</a>
          <a href="/dashboard" style={{ padding: "7px 14px", fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, border: "1px solid rgba(26,23,20,0.14)", background: "transparent", cursor: "pointer", borderRadius: 3, color: "#A89C90", fontFamily: "'Jost', sans-serif", textDecoration: "none" }}>Dashboard</a>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px" }}>

        {/* ===== DISEÑO ===== */}
        {tab === "diseno" && (
          <div>
            <div style={{ ...sectionTitle, marginBottom: 24 }}>Diseño de tu página</div>

            {/* FOTO HERO */}
            <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 20, marginBottom: 16 }}>
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
            <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 12 }}>Paleta de color</div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                {PALETAS.map(p => (
                  <div key={p.id} onClick={() => setForm((f: any) => ({ ...f, paleta: p.id }))} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", border: `1px solid ${form.paleta === p.id ? "#8C6D4F" : "rgba(26,23,20,0.14)"}`, borderRadius: 3, cursor: "pointer", background: form.paleta === p.id ? "#EDE0D4" : "#FAF8F5", transition: "all 0.15s" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {p.dots.map((d, i) => <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: d, border: "1px solid rgba(0,0,0,0.08)" }} />)}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#5A524A" }}>{p.nombre}</div>
                    {form.paleta === p.id && <div style={{ marginLeft: "auto", fontSize: 12, color: "#8C6D4F" }}>✓</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* TIPOGRAFIA */}
            <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 12 }}>Tipografía</div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                {TIPOGRAFIAS.map(t => (
                  <div key={t.id} onClick={() => setForm((f: any) => ({ ...f, tipografia: t.id }))} style={{ padding: "10px 14px", border: `1px solid ${form.tipografia === t.id ? "#8C6D4F" : "rgba(26,23,20,0.14)"}`, borderRadius: 3, cursor: "pointer", background: form.tipografia === t.id ? "#EDE0D4" : "#FAF8F5", transition: "all 0.15s" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#A89C90", marginBottom: 3 }}>{t.nombre}</div>
                    <div style={{ fontFamily: `'${t.id}', serif`, fontSize: 20, color: "#1A1714", fontStyle: "italic" }}>{t.muestra}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* HERO OSCURIDAD */}
            <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 12 }}>Oscuridad de la portada</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 11, color: "#A89C90" }}>Claro</span>
                <input type="range" min={0} max={80} value={form.hero_oscuridad} onChange={e => setForm((f: any) => ({ ...f, hero_oscuridad: parseInt(e.target.value) }))} style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: "#A89C90" }}>Oscuro</span>
              </div>
            </div>

            <button onClick={handleSaveForm} style={{ width: "100%", padding: 13, background: saved ? "#6B8C76" : saving ? "#A89C90" : "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif", transition: "background 0.3s" }}>
              {saved ? "¡Guardado! ✦" : saving ? "Guardando..." : "Guardar diseño"}
            </button>
          </div>
        )}

        {/* ===== INFORMACIÓN ===== */}
        {tab === "info" && (
          <div>
            <div style={{ ...sectionTitle, marginBottom: 24 }}>Información de la boda</div>

            <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 14 }}>Los novios</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={labelStyle}>Nombre 1</label><input value={form.nombre1} onChange={e => setForm((f: any) => ({ ...f, nombre1: e.target.value }))} placeholder="Andrea" style={{ ...inputStyle, marginBottom: 0 }} /></div>
                <div><label style={labelStyle}>Nombre 2</label><input value={form.nombre2} onChange={e => setForm((f: any) => ({ ...f, nombre2: e.target.value }))} placeholder="Diego" style={{ ...inputStyle, marginBottom: 0 }} /></div>
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 14 }}>El gran día</div>
              <label style={labelStyle}>Fecha</label>
              <input type="date" value={form.fecha} onChange={e => setForm((f: any) => ({ ...f, fecha: e.target.value }))} style={inputStyle} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={labelStyle}>Ciudad</label><input value={form.lugar} onChange={e => setForm((f: any) => ({ ...f, lugar: e.target.value }))} placeholder="Guatemala City" style={{ ...inputStyle, marginBottom: 0 }} /></div>
                <div><label style={labelStyle}>Hora</label><input value={form.hora} onChange={e => setForm((f: any) => ({ ...f, hora: e.target.value }))} placeholder="6:00 PM" style={{ ...inputStyle, marginBottom: 0 }} /></div>
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 14 }}>Venues</div>
              <label style={labelStyle}>Ceremonia</label>
              <input value={form.ceremonia} onChange={e => setForm((f: any) => ({ ...f, ceremonia: e.target.value }))} placeholder="Catedral Metropolitana" style={inputStyle} />
              <label style={labelStyle}>Recepción</label>
              <input value={form.recepcion} onChange={e => setForm((f: any) => ({ ...f, recepcion: e.target.value }))} placeholder="Casa Santo Domingo, Antigua" style={inputStyle} />
              <label style={labelStyle}>Dress code</label>
              <input value={form.dresscode} onChange={e => setForm((f: any) => ({ ...f, dresscode: e.target.value }))} placeholder="Formal · Tonos neutros y tierra" style={{ ...inputStyle, marginBottom: 0 }} />
            </div>

            <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 14 }}>Su historia</div>
              <label style={labelStyle}>Cuéntales a sus invitados cómo se conocieron</label>
              <textarea value={form.historia} onChange={e => setForm((f: any) => ({ ...f, historia: e.target.value }))} placeholder="Nos conocimos en Guatemala City en 2020..." style={{ ...inputStyle, minHeight: 100, resize: "vertical" as const, lineHeight: 1.6 }} />
            </div>

            <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 14 }}>Detalles especiales</div>
              <label style={labelStyle}>Canción favorita de la pareja</label>
              <input value={form.musica} onChange={e => setForm((f: any) => ({ ...f, musica: e.target.value }))} placeholder="Perfect - Ed Sheeran" style={inputStyle} />
              <label style={labelStyle}>Hashtag de la boda</label>
              <input value={form.hashtag} onChange={e => setForm((f: any) => ({ ...f, hashtag: e.target.value }))} placeholder="#AndreayDiego2025" style={{ ...inputStyle, marginBottom: 0 }} />
            </div>

            <button onClick={handleSaveForm} style={{ width: "100%", padding: 13, background: saved ? "#6B8C76" : saving ? "#A89C90" : "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif", transition: "background 0.3s" }}>
              {saved ? "¡Guardado! ✦" : saving ? "Guardando..." : "Guardar información"}
            </button>
          </div>
        )}

        {/* ===== INVITACIÓN ===== */}
        {tab === "invitacion" && (
          <div>
            <div style={{ ...sectionTitle, marginBottom: 8 }}>Invitación digital</div>
            <div style={{ fontSize: 13, color: "#A89C90", marginBottom: 24, fontWeight: 300 }}>Sube tu invitación como imagen o PDF para que tus invitados la vean en tu página.</div>

            <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 24, marginBottom: 24 }}>
              <input type="file" accept="image/*,.pdf" id="inv-file" onChange={handleInvitacion} style={{ display: "none" }} />
              {form.invitacion_url ? (
                <div>
                  {form.invitacion_url.includes(".pdf") ? (
                    <div style={{ background: "#FAF8F5", borderRadius: 3, padding: 20, textAlign: "center" as const, marginBottom: 12 }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1714", marginBottom: 4 }}>Invitación PDF subida</div>
                      <a href={form.invitacion_url} target="_blank" style={{ fontSize: 11, color: "#8C6D4F", textDecoration: "none", fontWeight: 600 }}>Ver PDF →</a>
                    </div>
                  ) : (
                    <img src={form.invitacion_url} alt="invitación" style={{ width: "100%", borderRadius: 3, marginBottom: 12 }} />
                  )}
                  <button onClick={() => document.getElementById("inv-file")?.click()} style={{ fontSize: 11, color: "#8C6D4F", background: "none", border: "none", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontWeight: 600 }}>
                    📷 Cambiar invitación
                  </button>
                </div>
              ) : (
                <div onClick={() => document.getElementById("inv-file")?.click()} style={{ border: "1.5px dashed rgba(26,23,20,0.14)", borderRadius: 3, padding: 40, textAlign: "center" as const, cursor: "pointer", background: "#FAF8F5" }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>💌</div>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, color: uploadingInv ? "#8C6D4F" : "#A89C90" }}>
                    {uploadingInv ? "Subiendo invitación..." : "Subir invitación"}
                  </div>
                  <div style={{ fontSize: 11, color: "#A89C90", marginTop: 6, fontWeight: 300 }}>Imagen JPG, PNG o PDF</div>
                </div>
              )}
            </div>

            <button onClick={handleSaveForm} style={{ width: "100%", padding: 13, background: saved ? "#6B8C76" : saving ? "#A89C90" : "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
              {saved ? "¡Guardado! ✦" : saving ? "Guardando..." : "Guardar invitación"}
            </button>
          </div>
        )}

        {/* ===== FONDOS ===== */}
        {tab === "fondos" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
              <div>
                <div style={sectionTitle}>Lista de regalos</div>
                <div style={{ fontSize: 12, color: "#A89C90", marginTop: -12 }}>Los invitados verán estos fondos en tu página</div>
              </div>
              {!showForm && (
                <button onClick={openNew} style={{ padding: "9px 20px", background: "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
                  + Agregar
                </button>
              )}
            </div>

            {showForm && (
              <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 24, marginBottom: 20, position: "relative" as const, overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #8C6D4F, #B8964A)" }} />
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 300, color: "#1A1714", marginBottom: 16 }}>{editingFondo ? "Editar fondo" : "Nuevo fondo"}</div>
                <label style={labelStyle}>Nombre *</label>
                <input value={fondo.nombre} onChange={e => setFondo(p => ({ ...p, nombre: e.target.value }))} placeholder="Luna de miel, Noche de bodas..." style={inputStyle} />
                <label style={labelStyle}>Descripción corta</label>
                <input value={fondo.descripcion} onChange={e => setFondo(p => ({ ...p, descripcion: e.target.value }))} placeholder="Una frase inspiradora" style={inputStyle} />
                <label style={labelStyle}>¿Por qué es especial?</label>
                <textarea value={fondo.historia} onChange={e => setFondo(p => ({ ...p, historia: e.target.value }))} placeholder="Cuéntales a tus invitados..." style={{ ...inputStyle, minHeight: 70, resize: "vertical" as const, lineHeight: 1.6 }} />
                <label style={labelStyle}>Meta en Quetzales</label>
                <input type="number" value={fondo.meta} onChange={e => setFondo(p => ({ ...p, meta: e.target.value }))} placeholder="2000" style={inputStyle} />
                <label style={labelStyle}>Foto</label>
                <input type="file" accept="image/*" id="foto-fondo" onChange={handleFotoFondo} style={{ display: "none" }} />
                {fondo.foto ? (
                  <div style={{ marginBottom: 12 }}>
                    <img src={fondo.foto} alt="preview" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 3, marginBottom: 6 }} />
                    <button onClick={() => document.getElementById("foto-fondo")?.click()} style={{ fontSize: 10, color: "#8C6D4F", background: "none", border: "none", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontWeight: 600 }}>📷 Cambiar foto</button>
                  </div>
                ) : (
                  <div onClick={() => document.getElementById("foto-fondo")?.click()} style={{ border: "1.5px dashed rgba(26,23,20,0.14)", borderRadius: 3, padding: 20, textAlign: "center" as const, cursor: "pointer", marginBottom: 12, background: "#FAF8F5" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, color: uploadingFotoFondo ? "#8C6D4F" : "#A89C90" }}>{uploadingFotoFondo ? "Subiendo..." : "📷 Subir foto"}</div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { setShowForm(false); setEditingFondo(null); }} style={{ flex: 1, padding: 11, background: "transparent", color: "#5A524A", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>Cancelar</button>
                  <button onClick={handleSaveFondo} disabled={savingFondo || !fondo.nombre} style={{ flex: 1, padding: 11, background: savingFondo ? "#A89C90" : "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
                    {savingFondo ? "Guardando..." : editingFondo ? "Guardar cambios" : "Crear fondo"}
                  </button>
                </div>
              </div>
            )}

            {fondos.length === 0 && !showForm ? (
              <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 40, textAlign: "center" }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, color: "#A89C90", marginBottom: 8 }}>Aún no tienes fondos</div>
                <button onClick={openNew} style={{ padding: "10px 24px", background: "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>Crear primer fondo</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                {fondos.map((f, i) => (
                  <div key={i} style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 60, height: 60, borderRadius: 4, overflow: "hidden", flexShrink: 0, background: "#F5F2ED", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {f.foto ? <img src={f.foto} alt={f.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 22 }}>🎁</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 400, color: "#1A1714", marginBottom: 3 }}>{f.nombre}</div>
                      <div style={{ fontSize: 11, color: "#A89C90", fontWeight: 300, marginBottom: 5 }}>{f.descripcion}</div>
                      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#A89C90" }}>
                        <span>Meta: <strong style={{ color: "#1A1714" }}>Q{(f.meta || 0).toLocaleString()}</strong></span>
                        <span>Recaudado: <strong style={{ color: "#8C6D4F" }}>Q{(f.recaudado || 0).toLocaleString()}</strong></span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
                      <button onClick={() => openEdit(f)} style={{ padding: "5px 12px", background: "transparent", color: "#8C6D4F", border: "1px solid #8C6D4F", borderRadius: 3, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>Editar</button>
                      <button onClick={() => handleDeleteFondo(f.id)} style={{ padding: "5px 12px", background: "transparent", color: "#A89C90", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}