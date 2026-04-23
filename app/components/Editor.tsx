"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function Editor() {
  const router = useRouter();
  const [pareja, setPareja] = useState<any>(null);
  const [fondos, setFondos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("fondos");
  const [showForm, setShowForm] = useState(false);
  const [editingFondo, setEditingFondo] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [form, setForm] = useState({
    nombre: "", descripcion: "", historia: "", meta: "", foto: "",
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data: parejaData } = await supabase.from("parejas").select("*").eq("user_id", user.id).single();
    if (!parejaData) { router.push("/onboarding"); return; }
    setPareja(parejaData);
    const { data: fondosData } = await supabase.from("fondos").select("*").eq("pareja_id", parejaData.id).order("orden");
    setFondos(fondosData || []);
    setLoading(false);
  }

  function openNew() {
    setEditingFondo(null);
    setForm({ nombre: "", descripcion: "", historia: "", meta: "", foto: "" });
    setShowForm(true);
  }

  function openEdit(fondo: any) {
    setEditingFondo(fondo);
    setForm({
      nombre: fondo.nombre || "",
      descripcion: fondo.descripcion || "",
      historia: fondo.historia || "",
      meta: fondo.meta?.toString() || "",
      foto: fondo.foto || "",
    });
    setShowForm(true);
  }

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFoto(true);
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("fondos").upload(fileName, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from("fondos").getPublicUrl(fileName);
      setForm(p => ({ ...p, foto: urlData.publicUrl }));
    }
    setUploadingFoto(false);
  }

  async function handleSave() {
    if (!form.nombre) return;
    setSaving(true);
    if (editingFondo) {
      await supabase.from("fondos").update({
        nombre: form.nombre,
        descripcion: form.descripcion,
        historia: form.historia,
        meta: parseFloat(form.meta) || 0,
        foto: form.foto || null,
      }).eq("id", editingFondo.id);
    } else {
      await supabase.from("fondos").insert({
        pareja_id: pareja.id,
        nombre: form.nombre,
        descripcion: form.descripcion,
        historia: form.historia,
        meta: parseFloat(form.meta) || 0,
        recaudado: 0,
        orden: fondos.length,
        foto: form.foto || null,
      });
    }
    setForm({ nombre: "", descripcion: "", historia: "", meta: "", foto: "" });
    setShowForm(false);
    setEditingFondo(null);
    setSaving(false);
    loadData();
  }

  async function handleDelete(id: string) {
    await supabase.from("fondos").delete().eq("id", id);
    loadData();
  }

  const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 13, fontFamily: "'Jost', sans-serif", background: "#FAF8F5", color: "#1A1714", outline: "none", marginBottom: 12 };
  const labelStyle = { fontSize: 10, fontWeight: 600 as const, color: "#5A524A", display: "block" as const, marginBottom: 5, letterSpacing: 0.5 };

  if (loading) return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: "#FAF8F5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, color: "#A89C90" }}>Cargando...</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: "#FAF8F5", minHeight: "100vh" }}>

      {/* TOP BAR */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", background: "rgba(250,248,245,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(26,23,20,0.14)" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase" as const, color: "#1A1714" }}>
          WE<em style={{ color: "#8C6D4F", fontStyle: "italic", letterSpacing: 0 }}>do</em>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["fondos", "invitacion"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 16px", fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, border: "1px solid rgba(26,23,20,0.14)", background: tab === t ? "#1A1714" : "transparent", cursor: "pointer", borderRadius: 3, color: tab === t ? "#fff" : "#A89C90", fontFamily: "'Jost', sans-serif" }}>
              {t === "fondos" ? "Fondos" : "Invitación"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href={`/boda/${pareja?.slug}`} target="_blank" style={{ padding: "7px 16px", fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, border: "1px solid #8C6D4F", background: "transparent", cursor: "pointer", borderRadius: 3, color: "#8C6D4F", fontFamily: "'Jost', sans-serif", textDecoration: "none" }}>
            Ver página
          </a>
          <a href="/dashboard" style={{ padding: "7px 16px", fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, border: "1px solid rgba(26,23,20,0.14)", background: "transparent", cursor: "pointer", borderRadius: 3, color: "#A89C90", fontFamily: "'Jost', sans-serif", textDecoration: "none" }}>
            Dashboard
          </a>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px" }}>

        {/* FONDOS TAB */}
        {tab === "fondos" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: "#1A1714" }}>Lista de regalos</div>
                <div style={{ fontSize: 12, color: "#A89C90", marginTop: 4 }}>Los invitados verán estos fondos en tu página</div>
              </div>
              {!showForm && (
                <button onClick={openNew} style={{ padding: "9px 20px", background: "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
                  + Agregar fondo
                </button>
              )}
            </div>

            {/* FORM */}
            {showForm && (
              <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 24, marginBottom: 20, position: "relative" as const, overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #8C6D4F, #B8964A)" }} />
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 300, color: "#1A1714", marginBottom: 16 }}>
                  {editingFondo ? "Editar fondo" : "Nuevo fondo"}
                </div>

                <label style={labelStyle}>Nombre del fondo *</label>
                <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Luna de miel, Noche de bodas..." style={inputStyle} />

                <label style={labelStyle}>Descripción corta</label>
                <input value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Una frase que inspire a tus invitados" style={inputStyle} />

                <label style={labelStyle}>¿Por qué es especial para ustedes?</label>
                <textarea value={form.historia} onChange={e => setForm(p => ({ ...p, historia: e.target.value }))} placeholder="Cuéntales a tus invitados por qué este regalo es tan importante..." style={{ ...inputStyle, minHeight: 80, resize: "vertical" as const, lineHeight: 1.6 }} />

                <label style={labelStyle}>Meta en Quetzales (opcional)</label>
                <input type="number" value={form.meta} onChange={e => setForm(p => ({ ...p, meta: e.target.value }))} placeholder="2000" style={inputStyle} />

                <label style={labelStyle}>Foto del fondo</label>
                <input type="file" accept="image/*" id="foto-fondo" onChange={handleFotoUpload} style={{ display: "none" }} />
                {form.foto ? (
                  <div style={{ marginBottom: 12 }}>
                    <img src={form.foto} alt="preview" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 3, marginBottom: 6 }} />
                    <button onClick={() => document.getElementById("foto-fondo")?.click()} style={{ fontSize: 10, color: "#8C6D4F", background: "none", border: "none", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontWeight: 600, letterSpacing: 0.5 }}>
                      📷 Cambiar foto
                    </button>
                  </div>
                ) : (
                  <div onClick={() => document.getElementById("foto-fondo")?.click()} style={{ border: "1.5px dashed rgba(26,23,20,0.14)", borderRadius: 3, padding: "24px", textAlign: "center" as const, cursor: "pointer", marginBottom: 12, background: "#FAF8F5" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, color: uploadingFoto ? "#8C6D4F" : "#A89C90" }}>
                      {uploadingFoto ? "Subiendo foto..." : "📷 Subir foto"}
                    </div>
                    <div style={{ fontSize: 10, color: "#A89C90", marginTop: 4 }}>JPG o PNG</div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button onClick={() => { setShowForm(false); setEditingFondo(null); }} style={{ flex: 1, padding: 11, background: "transparent", color: "#5A524A", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
                    Cancelar
                  </button>
                  <button onClick={handleSave} disabled={saving || !form.nombre} style={{ flex: 1, padding: 11, background: saving ? "#A89C90" : "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
                    {saving ? "Guardando..." : editingFondo ? "Guardar cambios" : "Crear fondo"}
                  </button>
                </div>
              </div>
            )}

            {/* FONDOS LIST */}
            {fondos.length === 0 && !showForm ? (
              <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 40, textAlign: "center" }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, color: "#A89C90", marginBottom: 8 }}>Aún no tienes fondos</div>
                <div style={{ fontSize: 13, color: "#A89C90", marginBottom: 20, fontWeight: 300 }}>Agrega los regalos que quieres recibir</div>
                <button onClick={openNew} style={{ padding: "10px 24px", background: "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
                  Crear primer fondo
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                {fondos.map((f, i) => (
                  <div key={i} style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: "16px 18px", display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 4, overflow: "hidden", flexShrink: 0, background: "#F5F2ED", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {f.foto ? <img src={f.foto} alt={f.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 24 }}>🎁</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: "#1A1714", marginBottom: 3 }}>{f.nombre}</div>
                      <div style={{ fontSize: 12, color: "#A89C90", fontWeight: 300, marginBottom: 6 }}>{f.descripcion}</div>
                      <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#A89C90" }}>
                        <span>Meta: <strong style={{ color: "#1A1714" }}>Q{(f.meta || 0).toLocaleString()}</strong></span>
                        <span>Recaudado: <strong style={{ color: "#8C6D4F" }}>Q{(f.recaudado || 0).toLocaleString()}</strong></span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 6, flexShrink: 0 }}>
                      <button onClick={() => openEdit(f)} style={{ padding: "6px 14px", background: "transparent", color: "#8C6D4F", border: "1px solid #8C6D4F", borderRadius: 3, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
                        Editar
                      </button>
                      <button onClick={() => handleDelete(f.id)} style={{ padding: "6px 14px", background: "transparent", color: "#A89C90", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* INVITACION TAB */}
        {tab === "invitacion" && (
          <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 32, textAlign: "center" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, color: "#A89C90", marginBottom: 8 }}>Editor de invitación</div>
            <div style={{ fontSize: 13, color: "#A89C90", fontWeight: 300 }}>Próximamente — personaliza colores, fotos y tipografía</div>
          </div>
        )}

      </div>
    </div>
  );
}