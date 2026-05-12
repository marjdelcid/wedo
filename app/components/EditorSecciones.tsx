"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

const SECCIONES = [
  { id: "historia", label: "Historia de amor", desc: "Cuéntales cómo se conocieron" },
  { id: "detalles", label: "Detalles del evento", desc: "Hora, ceremonia, recepción, dress code" },
  { id: "invitacion", label: "Invitación digital", desc: "Imagen o PDF de su invitación" },
  { id: "regalos", label: "Lista de regalos", desc: "Fondos para contribuir" },
  { id: "countdown", label: "Cuenta regresiva", desc: "Días que faltan para la boda" },
];

export default function EditorSecciones() {
  const router = useRouter();
  const [pareja, setPareja] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [secciones, setSecciones] = useState<Record<string, boolean>>({
    historia: true, detalles: true, invitacion: true, regalos: true, countdown: true,
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data: p } = await supabase.from("parejas").select("*").eq("user_id", user.id).single();
    if (!p) { router.push("/onboarding"); return; }
    setPareja(p);
    if (p.secciones) setSecciones(p.secciones);
    setLoading(false);
  }

  function toggle(id: string) {
    setSecciones(s => ({ ...s, [id]: !s[id] }));
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from("parejas").update({ secciones }).eq("id", pareja.id);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, color: "#A89C90" }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: "#1A1714", marginBottom: 8 }}>Secciones de tu página</div>
      <div style={{ fontSize: 13, color: "#A89C90", marginBottom: 24, fontWeight: 300 }}>Activa o desactiva las secciones que quieres mostrar a tus invitados.</div>

      <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, marginBottom: 24 }}>
        {SECCIONES.map(s => (
          <div key={s.id} style={{ background: "#fff", border: `1px solid ${secciones[s.id] ? "rgba(26,23,20,0.08)" : "rgba(26,23,20,0.05)"}`, borderRadius: 4, padding: "16px 18px", display: "flex", alignItems: "center", gap: 16, opacity: secciones[s.id] ? 1 : 0.5, transition: "all 0.2s" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 400, color: "#1A1714", marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: "#A89C90", fontWeight: 300 }}>{s.desc}</div>
            </div>
            <button onClick={() => toggle(s.id)} style={{ width: 44, height: 24, borderRadius: 12, background: secciones[s.id] ? "#8C6D4F" : "rgba(26,23,20,0.14)", border: "none", cursor: "pointer", position: "relative" as const, transition: "background 0.2s", flexShrink: 0 }}>
              <div style={{ position: "absolute", top: 2, left: secciones[s.id] ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
            </button>
          </div>
        ))}
      </div>

      <button onClick={handleSave} style={{ width: "100%", padding: 13, background: saved ? "#6B8C76" : saving ? "#A89C90" : "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif", transition: "background 0.3s" }}>
        {saved ? "¡Guardado! ✦" : saving ? "Guardando..." : "Guardar secciones"}
      </button>
    </div>
  );
}