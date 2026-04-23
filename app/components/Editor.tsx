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
  const [showNewFondo, setShowNewFondo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [newFondo, setNewFondo] = useState({
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

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFoto(true);
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("fondos").upload(fileName, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from("fondos").getPublicUrl(fileName);
      setNewFondo(p => ({ ...p, foto: urlData.publicUrl }));
    }
    setUploadingFoto(false);
  }

  async function handleSaveFondo() {
    if (!newFondo.nombre) return;
    setSaving(true);
    await supabase.from("fondos").insert({
      pareja_id: pareja.id,
      nombre: newFondo.nombre,
      descripcion: newFondo.descripcion,
      historia: newFondo.historia,
      meta: parseFloat(newFondo.meta) || 0,
      recaudado: 0,
      orden: fondos.length,
      foto: newFondo.foto || null,
    });
    setNewFondo({ nombre: "", descripcion: "", historia: "", meta: "", foto: "" });
    setShowNewFondo(false);
    setSaving(false);
    loadData();
  }

  async function handleDeleteFondo(id: string) {
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
              <button onClick={() => setShowNewFondo(true)} style={{ padding: "9px 20px", background: "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
                + Agregar fondo
              </button>
            </div>

            {/* NEW FONDO FORM */}
            {showNewFondo && (
              <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 24, marginBottom: 20, position: "relative" as const, overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #8C6D4F, #B8964A)" }} />
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 300, color: "#1A1714", marginBottom: 16 }}>Nuevo fondo</div>

                <label style={labelStyle}>Nombre del fondo *</label>
                <input value={newFondo.nombre} onChange={e => setNewFondo(p => ({ ...p, nombre: e.target.value }))} placeholder="Luna de miel, Noche de bodas, Nuestro hogar..." style={inputStyle} />

                <label style={labelStyle}>Descripción corta</label>
                <input value={newFondo.descripcion} onChange={e => setNewFondo(p => ({ ...p, descripcion: e.target.value }))} placeholder="Una frase que inspire a tus invitados" style={inputStyle} />

                <label style={labelStyle}>¿Por qué es especial para ustedes?</label>
                <textarea value={newFondo.historia} onChange={e => setNewFondo(p => ({ ...p, historia: e.target.value }))} placeholder="Cuéntales a tus invitados por qué este regalo es tan importante..." style={{ ...inputStyle, minHeight: 80, resize: "vertical" as const, lineHeight: 1.6 }} />

                <label style={labelStyle}>Meta en Quetzales (opcional)</label>
                <input type="number" value={newFondo.meta} onChange={e => setNewFondo(p => ({ ...p, meta: e.target.value }))} placeholder="2000" style={inputStyle} />

                <label style={labelStyle}>Foto del fondo</label>
                <input type="file" accept="image/*" id="foto-fondo" onChange={handleFotoUpload} style={{ display: "none" }} />
                {newFondo.foto ? (
                  <div style={{ marginBottom: 12 }}>
                    <img src={newFondo.foto} alt="preview" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 3, marginBottom: 6 }} />
                    <button onClick={() => setNewFondo(p => ({ ...p, foto: "" }))} style={{ fontSize: 10, color: "#A89C90", background: "none", border: "none", cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>Cambiar foto</button>
                  </div>
                ) : (
                  <div onClick={() => document.getElementById("foto-fondo")?.click()} style={{ border: "1.5px dashed rgba(26,23,20,0.14)", borderRadius: 3, padding: "20px", textAlign: "center" as const, cursor: "pointer", marginBottom: 12, background: "#FAF8F5" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, color: uploadingFoto ? "#8C6D4F" : "#A89C90" }}>
                      {uploadingFoto ? "Subiendo..." : "📷 Subir foto"}
                    </div>
                    <div style={{ fontSize: 10, color: "#A89C90", marginTop: 4 }}>JPG o PNG</div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button onClick={() => setShowNewFondo(false)} style={{ flex: 1, padding: 11, background: "transparent", color: "#5A524A", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
                    Cancelar
                  </button>
                  <button onClick={handleSaveFondo} disabled={saving || !newFondo.nombre} style={{ flex: 1, padding: 11, background: saving ? "#A89C90" : "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
                    {saving ? "Guardando..." : "Guardar fondo"}
                  </button>
                </div>
              </div>
            )}

            {/* FONDOS LIST */}
            {fondos.length === 0 && !showNewFondo ? (
              <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 40, textAlign: "center" }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, color: "#A89C90", marginBottom: 8 }}>Aún no tienes fondos</div>
                <div style={{ fontSize: 13, color: "#A89C90", marginBottom: 20, fontWeight: 300 }}>Agrega los regalos que quieres recibir</div>
                <button onClick={() => setShowNewFondo(true)} style={{ padding: "10px 24px", background: "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
                  Crear primer fondo
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                {fondos.map((f, i) => (
                  <div key={i} style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: "16px 18px", display: "flex", alignItems: "center", gap: 16 }}>
                    {f.foto && <img src={f.foto} alt={f.nombre} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: "#1A1714", marginBottom: 3 }}>{f.nombre}</div>
                      <div style={{ fontSize: 12, color: "#A89C90", fontWeight: 300 }}>{f.descripcion}</div>
                      <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11, color: "#A89C90" }}>
                        <span>Meta: <strong style={{ color: "#1A1714" }}>Q{(f.meta || 0).toLocaleString()}</strong></span>
                        <span>Recaudado: <strong style={{ color: "#8C6D4F" }}>Q{(f.recaudado || 0).toLocaleString()}</strong></span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteFondo(f.id)} style={{ padding: "6px 14px", background: "transparent", color: "#A89C90", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
                      Eliminar
                    </button>
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