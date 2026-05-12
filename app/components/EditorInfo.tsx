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
  const [form, setForm] = useState({
    nombre1: "", nombre2: "", fecha: "", lugar: "", hora: "",
    ceremonia: "", recepcion: "", dresscode: "", historia: "",
    musica: "", hashtag: "",
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
    });
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from("parejas").update(form).eq("id", pareja.id);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 13, fontFamily: "'Jost', sans-serif", background: "#FAF8F5", color: "#1A1714", outline: "none", marginBottom: 12 };
  const labelStyle = { fontSize: 10, fontWeight: 600 as const, color: "#5A524A", display: "block" as const, marginBottom: 5, letterSpacing: 0.5 };

  if (loading) return <div style={{ padding: 40, textAlign: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, color: "#A89C90" }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px" }}>

      <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 14 }}>Los novios</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Nombre 1</label><input value={form.nombre1} onChange={e => setForm(f => ({ ...f, nombre1: e.target.value }))} placeholder="Andrea" style={{ ...inputStyle, marginBottom: 0 }} /></div>
          <div><label style={labelStyle}>Nombre 2</label><input value={form.nombre2} onChange={e => setForm(f => ({ ...f, nombre2: e.target.value }))} placeholder="Diego" style={{ ...inputStyle, marginBottom: 0 }} /></div>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 14 }}>El gran día</div>
        <label style={labelStyle}>Fecha</label>
        <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} style={inputStyle} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Ciudad</label><input value={form.lugar} onChange={e => setForm(f => ({ ...f, lugar: e.target.value }))} placeholder="Guatemala City" style={{ ...inputStyle, marginBottom: 0 }} /></div>
          <div><label style={labelStyle}>Hora</label><input value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} placeholder="6:00 PM" style={{ ...inputStyle, marginBottom: 0 }} /></div>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 14 }}>Venues</div>
        <label style={labelStyle}>Ceremonia</label>
        <input value={form.ceremonia} onChange={e => setForm(f => ({ ...f, ceremonia: e.target.value }))} placeholder="Catedral Metropolitana" style={inputStyle} />
        <label style={labelStyle}>Recepción</label>
        <input value={form.recepcion} onChange={e => setForm(f => ({ ...f, recepcion: e.target.value }))} placeholder="Casa Santo Domingo, Antigua" style={inputStyle} />
        <label style={labelStyle}>Dress code</label>
        <input value={form.dresscode} onChange={e => setForm(f => ({ ...f, dresscode: e.target.value }))} placeholder="Formal · Tonos neutros" style={{ ...inputStyle, marginBottom: 0 }} />
      </div>

      <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 14 }}>Su historia</div>
        <label style={labelStyle}>Cuéntales a sus invitados cómo se conocieron</label>
        <textarea value={form.historia} onChange={e => setForm(f => ({ ...f, historia: e.target.value }))} placeholder="Nos conocimos en Guatemala City..." style={{ ...inputStyle, minHeight: 100, resize: "vertical" as const, lineHeight: 1.6 }} />
      </div>

      <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 20, marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 14 }}>Detalles especiales</div>
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