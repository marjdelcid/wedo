"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function EditorInvitados() {
  const router = useRouter();
  const [pareja, setPareja] = useState<any>(null);
  const [invitados, setInvitados] = useState<any[]>([]);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nombre: "", asientos: "1", grupo: "" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data: p } = await supabase.from("parejas").select("*").eq("user_id", user.id).single();
    if (!p) { router.push("/onboarding"); return; }
    setPareja(p);
    const { data: inv } = await supabase.from("invitados").select("*").eq("pareja_id", p.id).order("grupo").order("nombre");
    setInvitados(inv || []);
    const { data: r } = await supabase.from("rsvp").select("*").eq("pareja_id", p.id).order("created_at", { ascending: false });
    setRsvps(r || []);
    setLoading(false);
  }

  async function handleAdd() {
    if (!form.nombre.trim()) return;
    setSaving(true);
    await supabase.from("invitados").insert({
      pareja_id: pareja.id,
      nombre: form.nombre.trim(),
      asientos: parseInt(form.asientos) || 1,
      grupo: form.grupo.trim() || null,
    });
    setForm({ nombre: "", asientos: "1", grupo: "" });
    setShowForm(false);
    setSaving(false);
    loadData();
  }

  async function handleDelete(id: string) {
    await supabase.from("rsvp").delete().eq("invitado_id", id);
    await supabase.from("invitados").delete().eq("id", id);
    loadData();
  }

  const totalAsientos = invitados.reduce((sum, inv) => sum + (inv.asientos || 1), 0);
  const confirmadosSi = rsvps.filter(r => r.asistencia === "si").length;
  const confirmadosNo = rsvps.filter(r => r.asistencia === "no").length;
  const asientosConfirmados = rsvps.filter(r => r.asistencia === "si").reduce((sum, r) => sum + (r.acompanantes || 0) + 1, 0);

  const grupos: Record<string, any[]> = {};
  invitados.forEach(inv => {
    const g = inv.grupo || "Sin grupo";
    if (!grupos[g]) grupos[g] = [];
    grupos[g].push(inv);
  });

  const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 13, fontFamily: "'Jost', sans-serif", background: "#FAF8F5", color: "#1A1714", outline: "none", boxSizing: "border-box" as const };
  const labelStyle = { fontSize: 10, fontWeight: 600 as const, color: "#5A524A", display: "block" as const, marginBottom: 5, letterSpacing: 0.5, marginTop: 12 };

  if (loading) return <div style={{ padding: 40, textAlign: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, color: "#A89C90" }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: "#1A1714", marginBottom: 4 }}>Lista de invitados</div>
          <div style={{ fontSize: 13, color: "#A89C90", fontWeight: 300 }}>Agrega a tus invitados con los asientos que les asignas.</div>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={{ padding: "9px 20px", background: "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif", flexShrink: 0 }}>
            + Agregar
          </button>
        )}
      </div>

      {/* Stats */}
      {invitados.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
          {[
            { label: "Invitaciones", value: invitados.length },
            { label: "Asientos", value: totalAsientos },
            { label: "Asisten", value: confirmadosSi },
            { label: "No asisten", value: confirmadosNo },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 12, textAlign: "center" as const }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: i === 2 ? "#6B8C76" : i === 3 ? "#A89C90" : "#1A1714" }}>{s.value}</div>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" as const, color: "#A89C90", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 24, marginBottom: 16, position: "relative" as const, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #8C6D4F, #B8964A)" }} />
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 300, color: "#1A1714", marginBottom: 4 }}>Nuevo invitado</div>
          <label style={{ ...labelStyle, marginTop: 0 }}>Nombre *</label>
          <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Familia García" style={inputStyle} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Asientos permitidos</label>
              <input type="number" min={1} max={20} value={form.asientos} onChange={e => setForm(f => ({ ...f, asientos: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Grupo (opcional)</label>
              <input value={form.grupo} onChange={e => setForm(f => ({ ...f, grupo: e.target.value }))} placeholder="Familia, Amigos..." style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={() => { setShowForm(false); setForm({ nombre: "", asientos: "1", grupo: "" }); }} style={{ flex: 1, padding: 11, background: "transparent", color: "#5A524A", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>Cancelar</button>
            <button onClick={handleAdd} disabled={saving || !form.nombre.trim()} style={{ flex: 1, padding: 11, background: saving ? "#A89C90" : "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
              {saving ? "Guardando..." : "Agregar"}
            </button>
          </div>
        </div>
      )}

      {/* Guest list */}
      {invitados.length === 0 && !showForm ? (
        <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 40, textAlign: "center" as const }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 300, color: "#A89C90", marginBottom: 8 }}>Aún no tienes invitados</div>
          <div style={{ fontSize: 12, color: "#A89C90", marginBottom: 16, fontWeight: 300 }}>Agrega a tus invitados para que puedan confirmar asistencia</div>
          <button onClick={() => setShowForm(true)} style={{ padding: "10px 24px", background: "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>Agregar primer invitado</button>
        </div>
      ) : (
        <>
          {Object.entries(grupos).map(([grupo, invs]) => (
            <div key={grupo} style={{ marginBottom: 16 }}>
              {Object.keys(grupos).length > 1 && (
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 8 }}>{grupo}</div>
              )}
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                {invs.map((inv: any, i: number) => {
                  const rsvp = rsvps.find(r => r.invitado_id === inv.id);
                  return (
                    <div key={i} style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: rsvp?.asistencia === "si" ? "#EDF4EF" : rsvp?.asistencia === "no" ? "#F5F0F0" : "#F5F2ED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: rsvp?.asistencia === "si" ? "#6B8C76" : rsvp?.asistencia === "no" ? "#A07070" : "#8C6D4F", flexShrink: 0 }}>
                        {inv.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "#1A1714" }}>{inv.nombre}</div>
                        <div style={{ fontSize: 11, color: "#A89C90", marginTop: 1 }}>
                          {inv.asientos} {inv.asientos === 1 ? "asiento" : "asientos"}
                          {rsvp && ` · ${rsvp.acompanantes > 0 ? rsvp.acompanantes + 1 : 1} confirman`}
                        </div>
                      </div>
                      {rsvp ? (
                        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" as const, color: rsvp.asistencia === "si" ? "#6B8C76" : "#A07070", flexShrink: 0 }}>
                          {rsvp.asistencia === "si" ? "✓ Asiste" : "✕ No asiste"}
                        </div>
                      ) : (
                        <div style={{ fontSize: 10, color: "#A89C90", flexShrink: 0 }}>Pendiente</div>
                      )}
                      <button onClick={() => handleDelete(inv.id)} style={{ padding: "4px 8px", background: "transparent", color: "#C4B5A8", border: "1px solid rgba(26,23,20,0.10)", borderRadius: 3, fontSize: 10, cursor: "pointer", fontFamily: "'Jost', sans-serif", flexShrink: 0 }}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {rsvps.length > 0 && (
            <div style={{ background: "#EDF4EF", border: "1px solid rgba(107,140,118,0.2)", borderRadius: 4, padding: "12px 16px", marginTop: 8, textAlign: "center" as const }}>
              <div style={{ fontSize: 11, color: "#6B8C76", fontWeight: 600 }}>
                {asientosConfirmados} asientos confirmados de {totalAsientos} totales
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
