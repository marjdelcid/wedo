"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function EditorInvitacion() {
  const router = useRouter();
  const [pareja, setPareja] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingInv, setUploadingInv] = useState(false);
  const [invitacionUrl, setInvitacionUrl] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data: p } = await supabase.from("parejas").select("*").eq("user_id", user.id).single();
    if (!p) { router.push("/onboarding"); return; }
    setPareja(p);
    setInvitacionUrl(p.invitacion_url || "");
    setLoading(false);
  }

  async function handleInvitacion(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingInv(true);
    const fileName = `inv-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("bodas").upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from("bodas").getPublicUrl(fileName);
      setInvitacionUrl(data.publicUrl);
    }
    setUploadingInv(false);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from("parejas").update({ invitacion_url: invitacionUrl }).eq("id", pareja.id);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, color: "#A89C90" }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: "#1A1714", marginBottom: 8 }}>Invitación digital</div>
      <div style={{ fontSize: 13, color: "#A89C90", marginBottom: 24, fontWeight: 300 }}>Sube tu invitación como imagen o PDF para que tus invitados la vean en tu página.</div>

      <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 24, marginBottom: 24 }}>
        <input type="file" accept="image/*,.pdf" id="inv-file" onChange={handleInvitacion} style={{ display: "none" }} />
        {invitacionUrl ? (
          <div>
            {invitacionUrl.includes(".pdf") ? (
              <div style={{ background: "#FAF8F5", borderRadius: 3, padding: 20, textAlign: "center" as const, marginBottom: 12 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1714", marginBottom: 4 }}>Invitación PDF subida</div>
                <a href={invitacionUrl} target="_blank" style={{ fontSize: 11, color: "#8C6D4F", textDecoration: "none", fontWeight: 600 }}>Ver PDF →</a>
              </div>
            ) : (
              <img src={invitacionUrl} alt="invitación" style={{ width: "100%", borderRadius: 3, marginBottom: 12 }} />
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

      <button onClick={handleSave} style={{ width: "100%", padding: 13, background: saved ? "#6B8C76" : saving ? "#A89C90" : "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif", transition: "background 0.3s" }}>
        {saved ? "¡Guardado! ✦" : saving ? "Guardando..." : "Guardar invitación"}
      </button>
    </div>
  );
}