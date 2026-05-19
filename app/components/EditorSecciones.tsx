"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

const SECCIONES_META: Record<string, { label: string; desc: string }> = {
  regalos:    { label: "Lista de regalos",           desc: "Fondos para contribuir" },
  historia:   { label: "Historia de amor",            desc: "Cuéntales cómo se conocieron" },
  detalles:   { label: "Detalles del evento",         desc: "Hora, ceremonia, recepción, dress code" },
  invitacion: { label: "Invitación digital",          desc: "Imagen o PDF de su invitación" },
  rsvp:       { label: "Confirmación de asistencia",  desc: "Los invitados buscan su nombre y confirman" },
  countdown:  { label: "Cuenta regresiva",            desc: "Días que faltan para la boda" },
};

const DEFAULT_ORDER = ["regalos", "historia", "detalles", "invitacion", "rsvp", "countdown"];

export default function EditorSecciones() {
  const router = useRouter();
  const [pareja, setPareja] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [secciones, setSecciones] = useState<Record<string, boolean>>({
    historia: true, detalles: true, invitacion: true, regalos: true, rsvp: true, countdown: true,
  });
  const [orden, setOrden] = useState<string[]>(DEFAULT_ORDER);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data: p } = await supabase.from("parejas").select("*").eq("user_id", user.id).single();
    if (!p) { router.push("/onboarding"); return; }
    setPareja(p);
    if (p.secciones) setSecciones(prev => ({ ...prev, ...p.secciones }));
    if (Array.isArray(p.secciones_orden) && p.secciones_orden.length > 0) {
      const saved = p.secciones_orden as string[];
      const missing = DEFAULT_ORDER.filter(id => !saved.includes(id));
      setOrden([...saved, ...missing]);
    }
    setLoading(false);
  }

  function toggle(id: string) {
    setSecciones(s => ({ ...s, [id]: !s[id] }));
  }

  function move(from: number, to: number) {
    const next = [...orden];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setOrden(next);
  }

  function handleDragStart(i: number) {
    setDragIndex(i);
  }

  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== i) setDragOverIndex(i);
  }

  function handleDrop(i: number) {
    if (dragIndex === null || dragIndex === i) { setDragIndex(null); setDragOverIndex(null); return; }
    move(dragIndex, i);
    setDragIndex(null);
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setDragOverIndex(null);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from("parejas").update({ secciones, secciones_orden: orden }).eq("id", pareja.id);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, color: "#A89C90" }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: "#1A1714", marginBottom: 6 }}>Secciones de tu página</div>
      <div style={{ fontSize: 13, color: "#A89C90", marginBottom: 6, fontWeight: 300 }}>Activa o desactiva secciones y reorganízalas como desees.</div>
      <div style={{ fontSize: 11, color: "#C8BEB4", marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 15 }}>⠿</span> Arrastra para reordenar · usa las flechas para mover paso a paso
      </div>

      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 24 }}>
        {orden.map((id, i) => {
          const meta = SECCIONES_META[id];
          if (!meta) return null;
          const active = !!secciones[id];
          const isDragging = dragIndex === i;
          const isOver = dragOverIndex === i && dragIndex !== i;

          return (
            <div
              key={id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={e => handleDragOver(e, i)}
              onDrop={() => handleDrop(i)}
              onDragEnd={handleDragEnd}
              style={{
                background: "#fff",
                border: `1px solid ${isOver ? "#8C6D4F" : active ? "rgba(26,23,20,0.10)" : "rgba(26,23,20,0.05)"}`,
                borderRadius: 4,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                opacity: isDragging ? 0.35 : active ? 1 : 0.5,
                transition: "border-color 0.15s, opacity 0.15s, transform 0.1s",
                transform: isOver ? "translateY(-2px)" : "none",
                boxShadow: isOver ? "0 4px 16px rgba(140,109,79,0.12)" : "none",
                cursor: "default",
              }}
            >
              {/* Drag handle */}
              <div
                style={{ cursor: "grab", color: "#C8BEB4", fontSize: 18, lineHeight: 1, flexShrink: 0, userSelect: "none" as const, padding: "2px 4px" }}
                title="Arrastra para reordenar"
              >
                ⠿
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 400, color: "#1A1714", marginBottom: 2 }}>{meta.label}</div>
                <div style={{ fontSize: 11, color: "#A89C90", fontWeight: 300 }}>{meta.desc}</div>
              </div>

              {/* Flechas */}
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 2, flexShrink: 0 }}>
                <button
                  onClick={() => i > 0 && move(i, i - 1)}
                  disabled={i === 0}
                  title="Subir"
                  style={{ width: 22, height: 20, border: "1px solid rgba(26,23,20,0.10)", borderRadius: 2, background: "transparent", cursor: i === 0 ? "default" : "pointer", color: i === 0 ? "#E0D8D0" : "#8C6D4F", fontSize: 9, padding: 0, lineHeight: 1, fontFamily: "'Jost', sans-serif" }}
                >▲</button>
                <button
                  onClick={() => i < orden.length - 1 && move(i, i + 1)}
                  disabled={i === orden.length - 1}
                  title="Bajar"
                  style={{ width: 22, height: 20, border: "1px solid rgba(26,23,20,0.10)", borderRadius: 2, background: "transparent", cursor: i === orden.length - 1 ? "default" : "pointer", color: i === orden.length - 1 ? "#E0D8D0" : "#8C6D4F", fontSize: 9, padding: 0, lineHeight: 1, fontFamily: "'Jost', sans-serif" }}
                >▼</button>
              </div>

              {/* Toggle */}
              <button
                onClick={() => toggle(id)}
                title={active ? "Ocultar sección" : "Mostrar sección"}
                style={{ width: 44, height: 24, borderRadius: 12, background: active ? "#8C6D4F" : "rgba(26,23,20,0.14)", border: "none", cursor: "pointer", position: "relative" as const, transition: "background 0.2s", flexShrink: 0 }}
              >
                <div style={{ position: "absolute", top: 2, left: active ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
              </button>
            </div>
          );
        })}
      </div>

      <button onClick={handleSave} style={{ width: "100%", padding: 13, background: saved ? "#6B8C76" : saving ? "#A89C90" : "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif", transition: "background 0.3s" }}>
        {saved ? "¡Guardado! ✦" : saving ? "Guardando..." : "Guardar secciones"}
      </button>
    </div>
  );
}
