"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function EditorInfo() {
  const router = useRouter();
  const [pareja, setPareja] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingDC, setUploadingDC] = useState(false);
  const [form, setForm] = useState({
    nombre1: "", nombre2: "", fecha: "", lugar: "", hora: "",
    ceremonia: "", ceremonia_maps: "",
    recepcion: "", recepcion_maps: "",
    dresscode: "", dresscode_notas: "", dresscode_fotos: [] as string[],
    historia: "", musica: "", hashtag: "",
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
      ceremonia: p.ceremonia || "", ceremonia_maps: p.ceremonia_maps || "",
      recepcion: p.recepcion || "", recepcion_maps: p.recepcion_maps || "",
      dresscode: p.dresscode || "", dresscode_notas: p.dresscode_notas || "",
      dresscode_fotos: Array.isArray(p.dresscode_fotos) ? p.dresscode_fotos : [],
      historia: p.historia || "", musica: p.musica || "", hashtag: p.hashtag || "",
    });
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from("parejas").update(form).eq("id", pareja.id);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleDCPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (form.dresscode_fotos.length >= 6) return;
    setUploadingDC(true);
    const fileName = `dresscode-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("bodas").upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from("bodas").getPublicUrl(fileName);
      setForm(f => ({ ...f, dresscode_fotos: [...f.dresscode_fotos, data.publicUrl] }));
    }
    setUploadingDC(false);
    e.target.value = "";
  }

  function removeDCPhoto(idx: number) {
    setForm(f => ({ ...f, dresscode_fotos: f.dresscode_fotos.filter((_, i) => i !== idx) }));
  }

  const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 13, fontFamily: "'Jost', sans-serif", background: "#FAF8F5", color: "#1A1714", outline: "none", marginBottom: 12, boxSizing: "border-box" as const };
  const labelStyle = { fontSize: 10, fontWeight: 600 as const, color: "#5A524A", display: "block" as const, marginBottom: 5, letterSpacing: 0.5 };
  const hintStyle = { fontSize: 10, color: "#A89C90", marginBottom: 10, lineHeight: 1.5 };
  const sectionTitle = { fontSize: 11, fontWeight: 700 as const, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 14 };
  const card = { background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 20, marginBottom: 14 };

  if (loading) return <div style={{ padding: 40, textAlign: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, color: "#A89C90" }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px" }}>

      {/* Los novios */}
      <div style={card}>
        <div style={sectionTitle}>Los novios</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Nombre 1</label><input value={form.nombre1} onChange={e => setForm(f => ({ ...f, nombre1: e.target.value }))} placeholder="Andrea" style={{ ...inputStyle, marginBottom: 0 }} /></div>
          <div><label style={labelStyle}>Nombre 2</label><input value={form.nombre2} onChange={e => setForm(f => ({ ...f, nombre2: e.target.value }))} placeholder="Diego" style={{ ...inputStyle, marginBottom: 0 }} /></div>
        </div>
      </div>

      {/* El gran día */}
      <div style={card}>
        <div style={sectionTitle}>El gran día</div>
        <label style={labelStyle}>Fecha</label>
        <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} style={inputStyle} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Ciudad</label><input value={form.lugar} onChange={e => setForm(f => ({ ...f, lugar: e.target.value }))} placeholder="Guatemala City" style={{ ...inputStyle, marginBottom: 0 }} /></div>
          <div><label style={labelStyle}>Hora</label><input value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} placeholder="6:00 PM" style={{ ...inputStyle, marginBottom: 0 }} /></div>
        </div>
      </div>

      {/* Venues + Maps */}
      <div style={card}>
        <div style={sectionTitle}>Venues</div>

        <label style={labelStyle}>Ceremonia</label>
        <input value={form.ceremonia} onChange={e => setForm(f => ({ ...f, ceremonia: e.target.value }))} placeholder="Catedral Metropolitana" style={inputStyle} />
        <label style={labelStyle}>Link de Google Maps — Ceremonia</label>
        <p style={hintStyle}>Pega cualquier link de Google Maps (el que copias al compartir una ubicación).</p>
        <input value={form.ceremonia_maps} onChange={e => setForm(f => ({ ...f, ceremonia_maps: e.target.value }))} placeholder="https://maps.app.goo.gl/..." style={inputStyle} />

        <div style={{ height: 1, background: "rgba(26,23,20,0.06)", margin: "8px 0 16px" }} />

        <label style={labelStyle}>Recepción</label>
        <input value={form.recepcion} onChange={e => setForm(f => ({ ...f, recepcion: e.target.value }))} placeholder="Casa Santo Domingo, Antigua" style={inputStyle} />
        <label style={labelStyle}>Link de Google Maps — Recepción</label>
        <p style={hintStyle}>Pega cualquier link de Google Maps (el que copias al compartir una ubicación).</p>
        <input value={form.recepcion_maps} onChange={e => setForm(f => ({ ...f, recepcion_maps: e.target.value }))} placeholder="https://maps.app.goo.gl/..." style={{ ...inputStyle, marginBottom: 0 }} />
      </div>

      {/* Dress code */}
      <div style={card}>
        <div style={sectionTitle}>Dress Code</div>

        <label style={labelStyle}>Etiqueta de dress code</label>
        <input value={form.dresscode} onChange={e => setForm(f => ({ ...f, dresscode: e.target.value }))} placeholder="Formal · Tonos neutros" style={inputStyle} />

        <label style={labelStyle}>Cómo nos gustaría que te vistieras</label>
        <p style={hintStyle}>Comparte de forma sutil las indicaciones de estilo, colores o prendas que prefieren para ese día.</p>
        <textarea
          value={form.dresscode_notas}
          onChange={e => setForm(f => ({ ...f, dresscode_notas: e.target.value }))}
          placeholder={"Nos encantaría ver tonos tierra, crema y nude.\nEvita el blanco y el rojo brillante.\nEl jardín invita a tacones cómodos o planos."}
          style={{ ...inputStyle, minHeight: 100, resize: "vertical" as const, lineHeight: 1.65 }}
        />

        <label style={labelStyle}>Fotos de inspiración <span style={{ fontWeight: 400, color: "#A89C90" }}>(máx. 6)</span></label>
        <p style={hintStyle}>Sube imágenes de outfits o looks que se alineen con el estilo que tienen en mente.</p>

        {form.dresscode_fotos.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
            {form.dresscode_fotos.map((url, i) => (
              <div key={i} style={{ position: "relative", aspectRatio: "3/4", borderRadius: 3, overflow: "hidden", border: "1px solid rgba(26,23,20,0.1)" }}>
                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button onClick={() => removeDCPhoto(i)} style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", background: "rgba(26,23,20,0.6)", border: "none", color: "#fff", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Jost', sans-serif", lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
        )}

        {form.dresscode_fotos.length < 6 && (
          <>
            <input type="file" accept="image/*" id="dc-foto" onChange={handleDCPhoto} style={{ display: "none" }} />
            <div onClick={() => document.getElementById("dc-foto")?.click()} style={{ border: "1.5px dashed rgba(26,23,20,0.14)", borderRadius: 3, padding: "14px", textAlign: "center" as const, cursor: "pointer", background: "#FAF8F5" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, color: uploadingDC ? "#8C6D4F" : "#A89C90" }}>{uploadingDC ? "Subiendo..." : "+ Agregar foto"}</div>
            </div>
          </>
        )}
      </div>

      {/* Historia */}
      <div style={card}>
        <div style={sectionTitle}>Su historia</div>
        <label style={labelStyle}>Cuéntales a sus invitados cómo se conocieron</label>
        <textarea value={form.historia} onChange={e => setForm(f => ({ ...f, historia: e.target.value }))} placeholder="Nos conocimos en Guatemala City..." style={{ ...inputStyle, minHeight: 100, resize: "vertical" as const, lineHeight: 1.6 }} />
      </div>

      {/* Detalles especiales */}
      <div style={{ ...card, marginBottom: 24 }}>
        <div style={sectionTitle}>Detalles especiales</div>
        <label style={labelStyle}>Canción favorita</label>
        <input value={form.musica} onChange={e => setForm(f => ({ ...f, musica: e.target.value }))} placeholder="Perfect - Ed Sheeran" style={inputStyle} />
        <label style={labelStyle}>Hashtag de la boda</label>
        <input value={form.hashtag} onChange={e => setForm(f => ({ ...f, hashtag: e.target.value }))} placeholder="#AndreayDiego2025" style={{ ...inputStyle, marginBottom: 0 }} />
      </div>

      <button onClick={handleSave} style={{ width: "100%", padding: 13, background: saved ? "#6B8C76" : saving ? "#A89C90" : "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif", transition: "background 0.3s" }}>
        {saved ? "¡Guardado! ✦" : saving ? "Guardando..." : "Guardar información"}
      </button>
    </div>
  );
}
