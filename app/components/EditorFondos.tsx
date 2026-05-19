"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function EditorFondos() {
  const router = useRouter();
  const [pareja, setPareja] = useState<any>(null);
  const [fondos, setFondos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFondo, setEditingFondo] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [form, setForm] = useState({
    nombre: "", descripcion: "", historia: "", meta: "", foto: "",
    modo: "libre", chips: [100, 200, 500, 1000], nuevoChip: "",
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data: p } = await supabase.from("parejas").select("*").eq("user_id", user.id).single();
    if (!p) { router.push("/onboarding"); return; }
    setPareja(p);
    const { data: f } = await supabase.from("fondos").select("*").eq("pareja_id", p.id).order("orden");
    setFondos(f || []);
    setLoading(false);
  }

  function openNew() {
    setEditingFondo(null);
    setForm({ nombre: "", descripcion: "", historia: "", meta: "", foto: "", modo: "libre", chips: [100, 200, 500, 1000], nuevoChip: "" });
    setShowForm(true);
  }

  function openEdit(f: any) {
    setEditingFondo(f);
    setForm({
      nombre: f.nombre || "", descripcion: f.descripcion || "", historia: f.historia || "",
      meta: f.meta?.toString() || "", foto: f.foto || "",
      modo: f.modo || "libre", chips: f.chips || [100, 200, 500, 1000], nuevoChip: "",
    });
    setShowForm(true);
  }

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingFoto(true);
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("fondos").upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from("fondos").getPublicUrl(fileName);
      setForm(f => ({ ...f, foto: data.publicUrl }));
    }
    setUploadingFoto(false);
  }

  function addChip() {
    const val = parseInt(form.nuevoChip);
    if (!val || val <= 0) return;
    if (form.chips.includes(val)) return;
    setForm(f => ({ ...f, chips: [...f.chips, val].sort((a, b) => a - b), nuevoChip: "" }));
  }

  function removeChip(chip: number) {
    setForm(f => ({ ...f, chips: f.chips.filter((c: number) => c !== chip) }));
  }

  async function handleSave() {
    if (!form.nombre) return;
    setSaving(true);
    const data = {
      nombre: form.nombre, descripcion: form.descripcion, historia: form.historia,
      meta: parseFloat(form.meta) || 0, foto: form.foto || null,
      modo: form.modo, chips: form.chips,
    };
    if (editingFondo) {
      await supabase.from("fondos").update(data).eq("id", editingFondo.id);
    } else {
      await supabase.from("fondos").insert({ pareja_id: pareja.id, ...data, recaudado: 0, orden: fondos.length, tomado: false });
    }
    setShowForm(false); setEditingFondo(null); setSaving(false);
    loadData();
  }

  async function handleDelete(id: string) {
    await supabase.from("fondos").delete().eq("id", id);
    loadData();
  }

  const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 13, fontFamily: "'Jost', sans-serif", background: "#FAF8F5", color: "#1A1714", outline: "none", marginBottom: 12 };
  const labelStyle = { fontSize: 10, fontWeight: 600 as const, color: "#5A524A", display: "block" as const, marginBottom: 5, letterSpacing: 0.5 };

  if (loading) return <div style={{ padding: 40, textAlign: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, color: "#A89C90" }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: "#1A1714" }}>Lista de regalos</div>
          <div style={{ fontSize: 12, color: "#A89C90", marginTop: 4 }}>Los invitados verán estos regalos en tu página</div>
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
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 300, color: "#1A1714", marginBottom: 16 }}>{editingFondo ? "Editar regalo" : "Nuevo regalo"}</div>

          <label style={labelStyle}>Nombre *</label>
          <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Luna de miel, Noche de bodas..." style={inputStyle} />

          <label style={labelStyle}>Descripción corta</label>
          <input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Una frase inspiradora" style={inputStyle} />

          <label style={labelStyle}>¿Por qué es especial?</label>
          <textarea value={form.historia} onChange={e => setForm(f => ({ ...f, historia: e.target.value }))} placeholder="Cuéntales a tus invitados..." style={{ ...inputStyle, minHeight: 70, resize: "vertical" as const, lineHeight: 1.6 }} />

          {/* MODO */}
          <label style={labelStyle}>Tipo de regalo</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <div onClick={() => setForm(f => ({ ...f, modo: "libre" }))} style={{ flex: 1, padding: "10px 14px", border: `1px solid ${form.modo === "libre" ? "#8C6D4F" : "rgba(26,23,20,0.14)"}`, borderRadius: 3, cursor: "pointer", background: form.modo === "libre" ? "#EDE0D4" : "#FAF8F5", transition: "all 0.15s" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: form.modo === "libre" ? "#8C6D4F" : "#A89C90", marginBottom: 2 }}>CONTRIBUCIÓN LIBRE</div>
              <div style={{ fontSize: 11, color: "#5A524A", fontWeight: 300 }}>Los invitados eligen el monto con chips personalizados</div>
            </div>
            <div onClick={() => setForm(f => ({ ...f, modo: "completo" }))} style={{ flex: 1, padding: "10px 14px", border: `1px solid ${form.modo === "completo" ? "#8C6D4F" : "rgba(26,23,20,0.14)"}`, borderRadius: 3, cursor: "pointer", background: form.modo === "completo" ? "#EDE0D4" : "#FAF8F5", transition: "all 0.15s" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: form.modo === "completo" ? "#8C6D4F" : "#A89C90", marginBottom: 2 }}>REGALO COMPLETO</div>
              <div style={{ fontSize: 11, color: "#5A524A", fontWeight: 300 }}>Un precio fijo, se marca como "Ya regalado" al comprarse</div>
            </div>
          </div>

          {/* META */}
          <label style={labelStyle}>{form.modo === "completo" ? "Precio del regalo (Q) *" : "Meta en Quetzales (opcional)"}</label>
          <input type="number" value={form.meta} onChange={e => setForm(f => ({ ...f, meta: e.target.value }))} placeholder="2000" style={inputStyle} />

          {/* CHIPS — solo en modo libre */}
          {form.modo === "libre" && (
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Chips de monto</label>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: 10 }}>
                {form.chips.map((chip: number) => (
                  <div key={chip} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", background: "#EDE0D4", borderRadius: 20, fontSize: 12, fontWeight: 500, color: "#8C6D4F" }}>
                    Q{chip.toLocaleString()}
                    <button onClick={() => removeChip(chip)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8C6D4F", fontSize: 14, lineHeight: 1, padding: 0, marginLeft: 2 }}>×</button>
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 6px", background: "rgba(26,23,20,0.04)", borderRadius: 20, fontSize: 11, color: "#A89C90", fontStyle: "italic" }}>
                  + Otro monto
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="number" value={form.nuevoChip} onChange={e => setForm(f => ({ ...f, nuevoChip: e.target.value }))} onKeyDown={e => e.key === "Enter" && addChip()} placeholder="Agregar monto (ej. 150)" style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
                <button onClick={addChip} style={{ padding: "9px 16px", background: "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Jost', sans-serif", whiteSpace: "nowrap" as const }}>
                  + Agregar
                </button>
              </div>
            </div>
          )}

          {/* FOTO */}
          <label style={labelStyle}>Foto</label>
          <input type="file" accept="image/*" id="foto-fondo" onChange={handleFotoUpload} style={{ display: "none" }} />
          {form.foto ? (
            <div style={{ marginBottom: 12 }}>
              <img src={form.foto} alt="preview" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 3, marginBottom: 6 }} />
              <button onClick={() => document.getElementById("foto-fondo")?.click()} style={{ fontSize: 10, color: "#8C6D4F", background: "none", border: "none", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontWeight: 600 }}>📷 Cambiar foto</button>
            </div>
          ) : (
            <div onClick={() => document.getElementById("foto-fondo")?.click()} style={{ border: "1.5px dashed rgba(26,23,20,0.14)", borderRadius: 3, padding: 20, textAlign: "center" as const, cursor: "pointer", marginBottom: 12, background: "#FAF8F5" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, color: uploadingFoto ? "#8C6D4F" : "#A89C90" }}>{uploadingFoto ? "Subiendo..." : "📷 Subir foto"}</div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setShowForm(false); setEditingFondo(null); }} style={{ flex: 1, padding: 11, background: "transparent", color: "#5A524A", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>Cancelar</button>
            <button onClick={handleSave} disabled={saving || !form.nombre} style={{ flex: 1, padding: 11, background: saving ? "#A89C90" : "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
              {saving ? "Guardando..." : editingFondo ? "Guardar cambios" : "Crear regalo"}
            </button>
          </div>
        </div>
      )}

      {fondos.length === 0 && !showForm ? (
        <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 40, textAlign: "center" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, color: "#A89C90", marginBottom: 8 }}>Aún no tienes regalos</div>
          <button onClick={openNew} style={{ padding: "10px 24px", background: "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>Crear primer regalo</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
          {fondos.map((f, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 60, height: 60, borderRadius: 4, overflow: "hidden", flexShrink: 0, background: "#F5F2ED", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {f.foto ? <img src={f.foto} alt={f.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 22 }}>🎁</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 400, color: "#1A1714" }}>{f.nombre}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" as const, padding: "2px 7px", borderRadius: 20, background: f.modo === "completo" ? "#EDE0D4" : "rgba(26,23,20,0.05)", color: f.modo === "completo" ? "#8C6D4F" : "#A89C90" }}>
                    {f.modo === "completo" ? "Regalo completo" : "Libre"}
                  </div>
                  {f.tomado && <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" as const, padding: "2px 7px", borderRadius: 20, background: "#6B8C76", color: "#fff" }}>Ya regalado</div>}
                </div>
                <div style={{ fontSize: 11, color: "#A89C90", fontWeight: 300, marginBottom: 5 }}>{f.descripcion}</div>
                <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#A89C90" }}>
                  <span>Meta: <strong style={{ color: "#1A1714" }}>Q{(f.meta || 0).toLocaleString()}</strong></span>
                  <span>Recaudado: <strong style={{ color: "#8C6D4F" }}>Q{(f.recaudado || 0).toLocaleString()}</strong></span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
                <button onClick={() => openEdit(f)} style={{ padding: "5px 12px", background: "transparent", color: "#8C6D4F", border: "1px solid #8C6D4F", borderRadius: 3, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>Editar</button>
                <button onClick={() => handleDelete(f.id)} style={{ padding: "5px 12px", background: "transparent", color: "#A89C90", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}