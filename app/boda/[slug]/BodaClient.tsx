"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const PALETAS: Record<string, { accent: string; bg: string; surface: string }> = {
  champagne:  { accent: "#8C6D4F", bg: "#FAF8F5", surface: "#FFFFFF" },
  jardin:     { accent: "#4A7C59", bg: "#F4F7F4", surface: "#FFFFFF" },
  rose:       { accent: "#A0556A", bg: "#FDF5F6", surface: "#FFFFFF" },
  midnight:   { accent: "#C9A84C", bg: "#141210", surface: "#1E1A16" },
  terracotta: { accent: "#C4562A", bg: "#FDF8F5", surface: "#FFFFFF" },
  lavanda:    { accent: "#7B6BA8", bg: "#F7F5FF", surface: "#FFFFFF" },
  azulpolvo:  { accent: "#4A6E8C", bg: "#F3F7FA", surface: "#FFFFFF" },
  bordeaux:   { accent: "#7A2B3A", bg: "#FDF5F6", surface: "#FFFFFF" },
  olivo:      { accent: "#5C6E3E", bg: "#F8F6EE", surface: "#FFFFFF" },
  grisperla:  { accent: "#5A5A5A", bg: "#F8F8F8", surface: "#FFFFFF" },
  vinedo:     { accent: "#7A2B3A", bg: "#F8F6EE", surface: "#FFFFFF" },
};

const TEXT: Record<string, { primary: string; secondary: string; muted: string }> = {
  champagne:  { primary: "#1A1714", secondary: "#5A524A", muted: "#A89C90" },
  jardin:     { primary: "#1A2318", secondary: "#3A5240", muted: "#7A9A84" },
  rose:       { primary: "#1F1214", secondary: "#5A3040", muted: "#A07080" },
  midnight:   { primary: "#F0E8D8", secondary: "#C8B898", muted: "#887868" },
  terracotta: { primary: "#1A1210", secondary: "#5A3820", muted: "#A07858" },
  lavanda:    { primary: "#1A1628", secondary: "#4A3D6A", muted: "#9A90B8" },
  azulpolvo:  { primary: "#0F1E28", secondary: "#2A4A60", muted: "#7A9AB0" },
  bordeaux:   { primary: "#1A0810", secondary: "#5A2030", muted: "#A07080" },
  olivo:      { primary: "#1A1E10", secondary: "#3A4A28", muted: "#8A9070" },
  grisperla:  { primary: "#1A1A1A", secondary: "#4A4A4A", muted: "#9A9A9A" },
  vinedo:     { primary: "#1A100E", secondary: "#4A3028", muted: "#7A6858" },
};

export default function BodaClient({ slug }: { slug: string }) {
  const [pareja, setPareja] = useState<any>(null);
  const [fondos, setFondos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(0);
  const [amount, setAmount] = useState(100);
  const [open, setOpen] = useState(false);
  const [paid, setPaid] = useState(false);
  const [nombre, setNombre] = useState("");
  const [activeSection, setActiveSection] = useState("");

  // RSVP state
  const [rsvpQuery, setRsvpQuery] = useState("");
  const [rsvpResults, setRsvpResults] = useState<any[]>([]);
  const [rsvpSelected, setRsvpSelected] = useState<any>(null);
  const [rsvpSearched, setRsvpSearched] = useState(false);
  const [rsvpForm, setRsvpForm] = useState({ telefono: "", asistencia: "", acompanantes: "0", restricciones: "", mensaje: "" });
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpDone, setRsvpDone] = useState(false);

  useEffect(() => { loadData(); }, [slug]);

  async function loadData() {
    const { data: p } = await supabase.from("parejas").select("*").eq("slug", slug).single();
    if (!p) { setLoading(false); return; }
    setPareja(p);
    const { data: f } = await supabase.from("fondos").select("*").eq("pareja_id", p.id).order("orden");
    setFondos(f || []);
    // Set initial active section to first enabled section in saved order
    const secs = { historia: true, detalles: true, invitacion: true, regalos: true, rsvp: true, countdown: true, ...(p.secciones || {}) };
    const order: string[] = Array.isArray(p.secciones_orden) && p.secciones_orden.length > 0 ? p.secciones_orden : ["regalos", "historia", "detalles", "invitacion", "rsvp"];
    const first = order.find(id => !!(secs as any)[id] && id !== "countdown") || "regalos";
    setActiveSection(first);
    setLoading(false);
  }

async function searchRsvp() {
  if (!rsvpQuery.trim()) return;
  setRsvpSearched(true);
  setRsvpSelected(null);
  const { data } = await supabase.from("invitados").select("*").eq("pareja_id", pareja.id).ilike("nombre", `%${rsvpQuery.trim()}%`);
  setRsvpResults(data || []);
}

async function handleRsvpSubmit() {
  if (!rsvpSelected || !rsvpForm.asistencia) return;
  setRsvpSubmitting(true);
  await supabase.from("rsvp").insert({
    invitado_id: rsvpSelected.id,
    pareja_id: pareja.id,
    nombre: rsvpSelected.nombre,
    telefono: rsvpForm.telefono,
    asistencia: rsvpForm.asistencia,
    acompanantes: parseInt(rsvpForm.acompanantes) || 0,
    restricciones: rsvpForm.restricciones,
    mensaje: rsvpForm.mensaje,
  });
  await supabase.from("invitados").update({ confirmado: true }).eq("id", rsvpSelected.id);
  setRsvpSubmitting(false);
  setRsvpDone(true);
}

async function handlePay() {
  const f = fondos[selected];
  const montoFinal = f.modo === "completo" ? f.meta : amount;
  setPaid(true);
  await supabase.from("contribuciones").insert({ fondo_id: f.id, nombre_invitado: nombre || "Anónimo", monto: montoFinal });
  await supabase.from("fondos").update({
    recaudado: (f.recaudado || 0) + montoFinal,
    ...(f.modo === "completo" ? { tomado: true } : {})
  }).eq("id", f.id);
  setTimeout(() => { setPaid(false); setOpen(false); loadData(); }, 2500);
}

  if (loading) return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: "#FAF8F5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, color: "#A89C90" }}>Cargando...</div>
    </div>
  );

  if (!pareja) return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: "#FAF8F5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: "#A89C90", marginBottom: 8 }}>Página no encontrada</div>
        <a href="/" style={{ fontSize: 11, color: "#8C6D4F", textDecoration: "none", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const }}>Volver al inicio</a>
      </div>
    </div>
  );

  const pid = pareja.paleta || "champagne";
  const pal = pid === "personalizado"
    ? { accent: pareja.color_acento || "#8C6D4F", bg: pareja.color_fondo || "#FAF8F5", surface: pareja.color_superficie || "#FFFFFF" }
    : (PALETAS[pid] || PALETAS.champagne);
  const txt = (pid === "personalizado" || !TEXT[pid]) ? TEXT.champagne : TEXT[pid];
  const font = pareja.tipografia || "Cormorant Garamond";
  const fontTitulos = pareja.tipografia_titulos || font;
  const overlayOpacity = (pareja.hero_oscuridad || 45) / 85;
  const f = fondos[selected];
  const heroImg = pareja.foto_hero || "https://images.unsplash.com/photo-1519741497674-611481863552?w=900&q=80";
  const secs = { historia: true, detalles: true, invitacion: true, regalos: true, rsvp: true, countdown: true, ...(pareja.secciones || {}) };
  const DEFAULT_SEC_ORDER = ["regalos", "historia", "detalles", "invitacion", "rsvp", "countdown"];
  const savedOrder: string[] = Array.isArray(pareja.secciones_orden) && pareja.secciones_orden.length > 0 ? pareja.secciones_orden : DEFAULT_SEC_ORDER;
  const secOrder = [...savedOrder, ...DEFAULT_SEC_ORDER.filter(id => !savedOrder.includes(id))];
  const NAV_DEF: Record<string, { label: string; visible: boolean }> = {
    regalos:    { label: "Regalos",               visible: !!secs.regalos },
    historia:   { label: "Nuestra historia",       visible: !!secs.historia },
    detalles:   { label: "Detalles",               visible: !!secs.detalles },
    invitacion: { label: "Invitación",             visible: !!secs.invitacion },
    rsvp:       { label: "Confirmar asistencia",   visible: !!secs.rsvp },
    countdown:  { label: "Cuenta regresiva",       visible: false },
  };

  function renderInline(text: string): React.ReactNode[] {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i} style={{ fontWeight: 600, color: txt.primary }}>{part.slice(2, -2)}</strong>
        : <span key={i}>{part}</span>
    );
  }

  function renderDresscode(text: string) {
    return text.split("\n").map((line, i) => {
      const t = line.trim();
      if (!t) return <div key={i} style={{ height: 6 }} />;
      if (t.startsWith("## ")) return (
        <div key={i} style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: txt.muted, marginBottom: 6, marginTop: i > 0 ? 10 : 0 }}>
          {renderInline(t.slice(3))}
        </div>
      );
      if (t.startsWith("* ")) return (
        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 5, alignItems: "flex-start" }}>
          <span style={{ color: pal.accent, flexShrink: 0, lineHeight: 1.7 }}>·</span>
          <span>{renderInline(t.slice(2))}</span>
        </div>
      );
      return <div key={i} style={{ marginBottom: 5 }}>{renderInline(t)}</div>;
    });
  }

  const navBtnStyle = (active: boolean) => ({
    padding: "8px 16px", fontSize: 10, fontWeight: 600 as const, letterSpacing: 1,
    textTransform: "uppercase" as const, border: `1px solid ${active ? pal.accent : "rgba(26,23,20,0.14)"}`,
    background: active ? pal.accent : "transparent", color: active ? "#fff" : txt.muted,
    cursor: "pointer", borderRadius: 3, fontFamily: "'Jost', sans-serif", transition: "all 0.2s"
  });

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: pal.bg, minHeight: "100vh", color: txt.primary }}>

      {/* HERO */}
      <div style={{ position: "relative", height: 340, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url('${heroImg}')`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, rgba(26,23,20,${(overlayOpacity * 0.1).toFixed(2)}), rgba(26,23,20,${overlayOpacity.toFixed(2)}))` }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 32px", textAlign: "center", zIndex: 2 }}>
          <div style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase" as const, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
            {pareja.hashtag || "Wedo · Lista de Regalos"}
          </div>
          <div style={{ fontFamily: `'${font}', serif`, fontSize: 52, fontWeight: 300, color: "#fff", marginBottom: 6, lineHeight: 1 }}>
            {pareja.nombre1} & {pareja.nombre2}
          </div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase" as const, color: "rgba(255,255,255,0.65)" }}>
            {pareja.fecha ? new Date(pareja.fecha + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" }) : ""}{pareja.lugar ? ` · ${pareja.lugar}` : ""}
          </div>
        </div>
      </div>

      {/* NAV SECTIONS */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "16px 24px", borderBottom: `1px solid rgba(26,23,20,0.08)`, flexWrap: "wrap" as const }}>
        {secOrder.map(id => {
          const nav = NAV_DEF[id];
          if (!nav || !nav.visible) return null;
          return <button key={id} onClick={() => setActiveSection(id)} style={navBtnStyle(activeSection === id)}>{nav.label}</button>;
        })}
      </div>

      {/* SECCIÓN REGALOS */}
      {secs.regalos && activeSection === "regalos" && (
        <>
          <div style={{ textAlign: "center", padding: "28px 24px 8px" }}>
            <div style={{ fontSize: 9, letterSpacing: 4, textTransform: "uppercase" as const, color: txt.muted, marginBottom: 6 }}>Para los novios</div>
            <div style={{ fontFamily: `'${fontTitulos}', serif`, fontSize: 32, fontWeight: 300, color: txt.primary }}>Nuestros Regalos</div>
            <div style={{ width: 36, height: 1, background: pal.accent, margin: "12px auto 0" }} />
          </div>

          {fondos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 24px" }}>
              <div style={{ fontFamily: `'${fontTitulos}', serif`, fontSize: 20, fontWeight: 300, color: txt.muted }}>Los novios aún no han agregado regalos</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20, padding: "24px 24px 8px" }}>
              {fondos.map((fondo, i) => {
                const pct = fondo.meta > 0 ? Math.min(Math.round((fondo.recaudado / fondo.meta) * 100), 100) : 0;
                return (
                  <div key={i} onClick={() => { setSelected(i); setOpen(true); }} style={{ background: pal.surface, borderRadius: 4, border: "1px solid rgba(26,23,20,0.08)", overflow: "hidden", cursor: "pointer", transition: "transform 0.3s, box-shadow 0.3s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-6px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 48px rgba(26,23,20,0.10)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}>
                    <div style={{ height: 150, overflow: "hidden", background: "#F5F2ED" }}>
                      {fondo.foto && <img src={fondo.foto} alt={fondo.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                    </div>
                    <div style={{ padding: "14px 16px 16px" }}>
                      <div style={{ fontFamily: `'${fontTitulos}', serif`, fontSize: 20, fontWeight: 400, color: txt.primary, marginBottom: 4 }}>{fondo.nombre}</div>
                      <div style={{ fontSize: 12, color: txt.secondary, lineHeight: 1.65, marginBottom: 9, fontWeight: 300 }}>{fondo.descripcion}</div>

                     {fondo.modo !== "completo" && (
  <>
    <div style={{ height: 1, background: "rgba(26,23,20,0.1)", marginBottom: 5 }}>
      <div style={{ height: 1, background: pal.accent, width: `${pct}%` }} />
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: txt.muted }}>
      <strong style={{ color: txt.primary }}>Q{(fondo.recaudado || 0).toLocaleString()}</strong>
      <span>{fondo.meta > 0 ? `${pct}% · Q${fondo.meta.toLocaleString()}` : "Sin meta"}</span>
    </div>
  </>
)}
{fondo.modo === "completo" && (
  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: txt.muted }}>
    <strong style={{ color: txt.primary }}>Q{(fondo.meta || 0).toLocaleString()}</strong>
    {fondo.tomado && <span style={{ color: "#6B8C76", fontWeight: 600 }}>✦ Ya regalado</span>}
  </div>
)}

                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ textAlign: "center", padding: "12px 24px 20px", fontSize: 10, color: txt.muted, letterSpacing: 1.5, textTransform: "uppercase" as const }}>
            Pagos via <span style={{ color: pal.accent }}>Recurrente</span> · Guatemala
          </div>
        </>
      )}

      {/* SECCIÓN HISTORIA */}
      {secs.historia && activeSection === "historia" && (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 9, letterSpacing: 4, textTransform: "uppercase" as const, color: txt.muted, marginBottom: 6 }}>Nosotros</div>
            <div style={{ fontFamily: `'${fontTitulos}', serif`, fontSize: 32, fontWeight: 300, color: txt.primary }}>Nuestra Historia</div>
            <div style={{ width: 36, height: 1, background: pal.accent, margin: "12px auto 0" }} />
          </div>
          {pareja.historia ? (
            <div style={{ fontSize: 15, color: txt.secondary, lineHeight: 1.85, fontWeight: 300, textAlign: "center" as const }}>{pareja.historia}</div>
          ) : (
            <div style={{ textAlign: "center", padding: "32px 0", color: txt.muted }}>
              <div style={{ fontFamily: `'${fontTitulos}', serif`, fontSize: 20, fontWeight: 300, marginBottom: 8 }}>Próximamente</div>
              <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase" as const }}>Los novios pronto compartirán su historia</div>
            </div>
          )}
          {pareja.musica && (
            <div style={{ marginTop: 32, textAlign: "center", padding: "16px", background: pal.surface, border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4 }}>
              <div style={{ fontSize: 9, letterSpacing: 3, textTransform: "uppercase" as const, color: txt.muted, marginBottom: 6 }}>Nuestra canción</div>
              <div style={{ fontFamily: `'${fontTitulos}', serif`, fontSize: 20, fontWeight: 300, color: txt.primary }}>♪ {pareja.musica}</div>
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN DETALLES */}
      {secs.detalles && activeSection === "detalles" && (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 9, letterSpacing: 4, textTransform: "uppercase" as const, color: txt.muted, marginBottom: 6 }}>El gran día</div>
            <div style={{ fontFamily: `'${fontTitulos}', serif`, fontSize: 34, fontWeight: 300, color: txt.primary }}>Detalles</div>
            <div style={{ width: 36, height: 1, background: pal.accent, margin: "12px auto 0" }} />
          </div>

          {/* Fecha & hora */}
          {(pareja.fecha || pareja.hora) && (
            <div style={{ textAlign: "center", marginBottom: 32, padding: "20px 24px", background: pal.surface, border: `1px solid ${pal.accent}22`, borderRadius: 4 }}>
              {pareja.fecha && (
                <div style={{ fontFamily: `'${fontTitulos}', serif`, fontSize: 26, fontWeight: 300, color: txt.primary, marginBottom: pareja.hora ? 6 : 0 }}>
                  {new Date(pareja.fecha + "T12:00:00").toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </div>
              )}
              {pareja.hora && (
                <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase" as const, color: txt.muted }}>{pareja.hora}{pareja.lugar ? ` · ${pareja.lugar}` : ""}</div>
              )}
            </div>
          )}

          {/* Ceremonia */}
          {pareja.ceremonia && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: 3, textTransform: "uppercase" as const, color: pal.accent, marginBottom: 8 }}>Ceremonia</div>
              <div style={{ background: pal.surface, border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: txt.primary }}>{pareja.ceremonia}</div>
                    {pareja.hora && <div style={{ fontSize: 11, color: txt.muted, marginTop: 3, letterSpacing: 1 }}>{pareja.hora}</div>}
                  </div>
                  {pareja.ceremonia_maps && (
                    <a href={pareja.ceremonia_maps} target="_blank" rel="noreferrer" style={{ flexShrink: 0, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, color: pal.accent, textDecoration: "none", border: `1px solid ${pal.accent}`, borderRadius: 3, padding: "6px 12px", fontFamily: "'Jost', sans-serif", whiteSpace: "nowrap" as const }}>
                      Ver mapa
                    </a>
                  )}
                </div>
                {pareja.ceremonia_maps && pareja.ceremonia_maps.includes("/maps/embed") && (
                  <iframe
                    src={pareja.ceremonia_maps}
                    width="100%" height="220"
                    style={{ border: "none", display: "block", borderTop: "1px solid rgba(26,23,20,0.06)" }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                )}
              </div>
            </div>
          )}

          {/* Recepción */}
          {pareja.recepcion && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 9, letterSpacing: 3, textTransform: "uppercase" as const, color: pal.accent, marginBottom: 8 }}>Recepción</div>
              <div style={{ background: pal.surface, border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: txt.primary }}>{pareja.recepcion}</div>
                    {pareja.hora && <div style={{ fontSize: 11, color: txt.muted, marginTop: 3, letterSpacing: 1 }}>{pareja.hora}</div>}
                  </div>
                  {pareja.recepcion_maps && (
                    <a href={pareja.recepcion_maps} target="_blank" rel="noreferrer" style={{ flexShrink: 0, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, color: pal.accent, textDecoration: "none", border: `1px solid ${pal.accent}`, borderRadius: 3, padding: "6px 12px", fontFamily: "'Jost', sans-serif", whiteSpace: "nowrap" as const }}>
                      Ver mapa
                    </a>
                  )}
                </div>
                {pareja.recepcion_maps && pareja.recepcion_maps.includes("/maps/embed") && (
                  <iframe
                    src={pareja.recepcion_maps}
                    width="100%" height="220"
                    style={{ border: "none", display: "block", borderTop: "1px solid rgba(26,23,20,0.06)" }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                )}
              </div>
            </div>
          )}

          {/* Dress code */}
          {(pareja.dresscode || pareja.dresscode_notas || (Array.isArray(pareja.dresscode_fotos) && pareja.dresscode_fotos.length > 0)) && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 9, letterSpacing: 3, textTransform: "uppercase" as const, color: pal.accent, marginBottom: 8 }}>Dress Code</div>
              <div style={{ background: pal.surface, border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: "20px 24px" }}>
                {pareja.dresscode && (
                  <div style={{ fontFamily: `'${fontTitulos}', serif`, fontSize: 22, fontWeight: 300, color: txt.primary, marginBottom: pareja.dresscode_notas ? 14 : 0 }}>
                    {pareja.dresscode}
                  </div>
                )}
                {pareja.dresscode_notas && (
                  <>
                    <div style={{ width: 24, height: 1, background: pal.accent, marginBottom: 14 }} />
                    <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase" as const, color: txt.muted, marginBottom: 12 }}>Cómo nos gustaría que te vistieras</div>
                    <div style={{ fontSize: 12, color: txt.secondary, lineHeight: 1.75, fontWeight: 300 }}>
                      {renderDresscode(pareja.dresscode_notas)}
                    </div>
                  </>
                )}
                {Array.isArray(pareja.dresscode_fotos) && pareja.dresscode_fotos.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase" as const, color: txt.muted, marginBottom: 12 }}>Inspiración</div>
                    <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(pareja.dresscode_fotos.length, 3)}, 1fr)`, gap: 8 }}>
                      {pareja.dresscode_fotos.map((url: string, i: number) => (
                        <div key={i} style={{ aspectRatio: "3/4", borderRadius: 3, overflow: "hidden", background: "#F5F2ED" }}>
                          <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hashtag */}
          {pareja.hashtag && (
            <div style={{ textAlign: "center", padding: "16px", border: `1px solid ${pal.accent}33`, borderRadius: 4 }}>
              <div style={{ fontFamily: `'${fontTitulos}', serif`, fontSize: 22, fontWeight: 300, color: pal.accent }}>{pareja.hashtag}</div>
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN INVITACIÓN */}
      {secs.invitacion && activeSection === "invitacion" && (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 9, letterSpacing: 4, textTransform: "uppercase" as const, color: txt.muted, marginBottom: 6 }}>Invitación</div>
          <div style={{ fontFamily: `'${fontTitulos}', serif`, fontSize: 32, fontWeight: 300, color: txt.primary, marginBottom: 20 }}>Nuestra Invitación</div>
          <div style={{ width: 36, height: 1, background: pal.accent, margin: "0 auto 24px" }} />

          {pareja.invitacion_url ? (
            pareja.invitacion_url.includes(".pdf") ? (
              <a href={pareja.invitacion_url} target="_blank" style={{ display: "inline-block", padding: "14px 28px", background: pal.accent, color: "#fff", textDecoration: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" as const, fontFamily: "'Jost', sans-serif" }}>
                Ver invitación PDF →
              </a>
            ) : (
              <img src={pareja.invitacion_url} alt="Invitación" style={{ width: "100%", borderRadius: 4, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }} />
            )
          ) : (
            <div style={{ padding: "32px 0", color: txt.muted }}>
              <div style={{ fontFamily: `'${fontTitulos}', serif`, fontSize: 20, fontWeight: 300, marginBottom: 8 }}>Próximamente</div>
              <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase" as const }}>La invitación digital estará disponible aquí</div>
            </div>
          )}

          {secs.detalles && (
            <div style={{ marginTop: 32 }}>
              <button
                onClick={() => setActiveSection("detalles")}
                style={{ padding: "12px 28px", background: "transparent", border: `1px solid ${pal.accent}`, borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" as const, color: pal.accent, cursor: "pointer", fontFamily: "'Jost', sans-serif", transition: "all 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = pal.accent; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = pal.accent; }}
              >
                Ver detalles del evento →
              </button>
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN RSVP */}
      {secs.rsvp && activeSection === "rsvp" && (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 9, letterSpacing: 4, textTransform: "uppercase" as const, color: txt.muted, marginBottom: 6 }}>Confirma tu lugar</div>
            <div style={{ fontFamily: `'${fontTitulos}', serif`, fontSize: 32, fontWeight: 300, color: txt.primary }}>¿Asistirás?</div>
            <div style={{ width: 36, height: 1, background: pal.accent, margin: "12px auto 0" }} />
          </div>

          {rsvpDone ? (
            <div style={{ background: pal.surface, border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 32, textAlign: "center" as const }}>
              <div style={{ fontFamily: `'${fontTitulos}', serif`, fontSize: 28, fontWeight: 300, color: pal.accent, marginBottom: 8 }}>
                {rsvpForm.asistencia === "si" ? "¡Nos vemos pronto!" : "Gracias por avisarnos"}
              </div>
              <div style={{ fontSize: 13, color: txt.secondary, fontWeight: 300 }}>
                {rsvpForm.asistencia === "si"
                  ? "Tu asistencia quedó confirmada. ¡Te esperamos con mucho amor!"
                  : "Lamentamos que no puedas acompañarnos, pero gracias por responder."}
              </div>
            </div>
          ) : !rsvpSelected ? (
            <>
              <div style={{ background: pal.surface, border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 24, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: txt.muted, marginBottom: 12 }}>Busca tu nombre</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={rsvpQuery}
                    onChange={e => setRsvpQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && searchRsvp()}
                    placeholder="Escribe tu nombre o apellido..."
                    style={{ flex: 1, padding: "10px 14px", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 13, fontFamily: "'Jost', sans-serif", background: "#FAF8F5", color: "#1A1714", outline: "none" }}
                  />
                  <button onClick={searchRsvp} style={{ padding: "10px 20px", background: pal.accent, color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
                    Buscar
                  </button>
                </div>
              </div>

              {rsvpSearched && rsvpResults.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px 0", color: txt.muted, fontSize: 13, fontWeight: 300 }}>
                  No encontramos tu nombre. Intenta con otro término o contacta a los novios.
                </div>
              )}

              {rsvpResults.map((inv, i) => (
                <div key={i} onClick={() => {
                  setRsvpSelected(inv);
                  setRsvpForm({ telefono: "", asistencia: "", acompanantes: "0", restricciones: "", mensaje: "" });
                }} style={{ background: pal.surface, border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: "16px 20px", marginBottom: 8, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = pal.accent}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(26,23,20,0.08)"}
                >
                  <div>
                    <div style={{ fontFamily: `'${font}', serif`, fontSize: 20, fontWeight: 400, color: txt.primary }}>{inv.nombre}</div>
                    <div style={{ fontSize: 11, color: txt.muted, marginTop: 2 }}>{inv.asientos} {inv.asientos === 1 ? "lugar reservado" : "lugares reservados"}</div>
                    {inv.confirmado && <div style={{ fontSize: 10, color: "#6B8C76", fontWeight: 600, marginTop: 4, letterSpacing: 0.5 }}>✓ Ya confirmaste</div>}
                  </div>
                  <div style={{ fontSize: 18, color: txt.muted }}>→</div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ background: pal.surface, border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 24 }}>
              <button onClick={() => setRsvpSelected(null)} style={{ fontSize: 11, color: txt.muted, background: "none", border: "none", cursor: "pointer", fontFamily: "'Jost', sans-serif", marginBottom: 16, padding: 0 }}>← Volver</button>
              <div style={{ fontFamily: `'${font}', serif`, fontSize: 24, fontWeight: 300, color: txt.primary, marginBottom: 4 }}>{rsvpSelected.nombre}</div>
              <div style={{ fontSize: 12, color: txt.muted, marginBottom: 20 }}>{rsvpSelected.asientos} {rsvpSelected.asientos === 1 ? "lugar reservado para ti" : "lugares reservados para ti"}</div>

              {rsvpSelected.confirmado ? (
                <div style={{ textAlign: "center", padding: 16, background: "#EDF4EF", borderRadius: 4 }}>
                  <div style={{ fontSize: 13, color: "#6B8C76", fontWeight: 600 }}>✓ Ya confirmaste tu asistencia</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: txt.muted, marginBottom: 10 }}>¿Asistirás?</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                    <button onClick={() => setRsvpForm(f => ({ ...f, asistencia: "si" }))} style={{ flex: 1, padding: "12px", border: `1.5px solid ${rsvpForm.asistencia === "si" ? "#6B8C76" : "rgba(26,23,20,0.14)"}`, borderRadius: 3, background: rsvpForm.asistencia === "si" ? "#EDF4EF" : "transparent", color: rsvpForm.asistencia === "si" ? "#6B8C76" : txt.secondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Jost', sans-serif", transition: "all 0.15s" }}>
                      ✓ Sí, asistiré
                    </button>
                    <button onClick={() => setRsvpForm(f => ({ ...f, asistencia: "no", acompanantes: "0" }))} style={{ flex: 1, padding: "12px", border: `1.5px solid ${rsvpForm.asistencia === "no" ? "#A07070" : "rgba(26,23,20,0.14)"}`, borderRadius: 3, background: rsvpForm.asistencia === "no" ? "#F5F0F0" : "transparent", color: rsvpForm.asistencia === "no" ? "#A07070" : txt.secondary, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Jost', sans-serif", transition: "all 0.15s" }}>
                      ✕ No podré ir
                    </button>
                  </div>

                  {rsvpForm.asistencia === "si" && rsvpSelected.asientos > 1 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: txt.muted, marginBottom: 8 }}>¿Cuántos asisten? (incluyéndote)</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                        {Array.from({ length: rsvpSelected.asientos }, (_, i) => i + 1).map(n => (
                          <button key={n} onClick={() => setRsvpForm(f => ({ ...f, acompanantes: String(n - 1) }))} style={{ padding: "8px 16px", border: `1px solid ${parseInt(rsvpForm.acompanantes) + 1 === n ? txt.primary : "rgba(26,23,20,0.14)"}`, borderRadius: 2, fontSize: 13, fontWeight: 500, cursor: "pointer", background: parseInt(rsvpForm.acompanantes) + 1 === n ? txt.primary : "transparent", color: parseInt(rsvpForm.acompanantes) + 1 === n ? "#fff" : txt.secondary, fontFamily: "'Jost', sans-serif" }}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {rsvpForm.asistencia === "si" && (
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 10, fontWeight: 600, color: txt.secondary, display: "block", marginBottom: 5, letterSpacing: 0.5 }}>Restricciones alimentarias (opcional)</label>
                      <input value={rsvpForm.restricciones} onChange={e => setRsvpForm(f => ({ ...f, restricciones: e.target.value }))} placeholder="Vegetariano, alérgico a mariscos..." style={{ width: "100%", padding: "9px 12px", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 13, fontFamily: "'Jost', sans-serif", background: "#FAF8F5", color: "#1A1714", outline: "none", boxSizing: "border-box" as const }} />
                    </div>
                  )}

                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontSize: 10, fontWeight: 600, color: txt.secondary, display: "block", marginBottom: 5, letterSpacing: 0.5 }}>Mensaje para los novios (opcional)</label>
                    <textarea value={rsvpForm.mensaje} onChange={e => setRsvpForm(f => ({ ...f, mensaje: e.target.value }))} placeholder="¡Felicidades! Los queremos mucho..." style={{ width: "100%", padding: "9px 12px", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 13, fontFamily: "'Jost', sans-serif", background: "#FAF8F5", color: "#1A1714", outline: "none", resize: "vertical" as const, minHeight: 70, boxSizing: "border-box" as const }} />
                  </div>

                  <button onClick={handleRsvpSubmit} disabled={!rsvpForm.asistencia || rsvpSubmitting} style={{ width: "100%", padding: 14, background: !rsvpForm.asistencia ? "#E0DAD4" : rsvpSubmitting ? "#A89C90" : pal.accent, color: !rsvpForm.asistencia ? "#A89C90" : "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" as const, cursor: !rsvpForm.asistencia ? "default" : "pointer", fontFamily: "'Jost', sans-serif", transition: "background 0.2s" }}>
                    {rsvpSubmitting ? "Enviando..." : "Confirmar asistencia"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* DETAIL OVERLAY */}
      {open && f && (
        <div onClick={(e) => e.target === e.currentTarget && setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(26,23,20,0.45)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 680, overflow: "hidden", borderTop: "1px solid rgba(26,23,20,0.08)" }}>
            <div style={{ height: 220, overflow: "hidden", position: "relative", background: "#F5F2ED" }}>
              {f.foto && <img src={f.foto} alt={f.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(26,23,20,0.5) 100%)" }} />
              <button onClick={() => setOpen(false)} style={{ position: "absolute", top: 12, right: 14, width: 30, height: 30, borderRadius: "50%", background: "rgba(250,248,245,0.9)", border: "1px solid rgba(26,23,20,0.14)", cursor: "pointer", fontSize: 13, color: "#5A524A" }}>✕</button>
            </div>
            <div style={{ width: 32, height: 2, background: "rgba(26,23,20,0.14)", borderRadius: 1, margin: "12px auto 0" }} />
            <div style={{ padding: "16px 26px 26px" }}>
              <div style={{ fontFamily: `'${fontTitulos}', serif`, fontSize: 32, fontWeight: 300, color: "#1A1714", marginBottom: 5 }}>{f.nombre}</div>
              <div style={{ fontSize: 13, color: "#5A524A", lineHeight: 1.7, marginBottom: 12, fontWeight: 300 }}>{f.descripcion}</div>
              {f.historia && <div style={{ borderLeft: `1.5px solid ${pal.accent}`, paddingLeft: 16, fontFamily: `'${fontTitulos}', serif`, fontSize: 17, fontStyle: "italic", color: "#5A524A", lineHeight: 1.75, marginBottom: 18, fontWeight: 300 }}>{f.historia}</div>}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: "#5A524A", display: "block", marginBottom: 6, letterSpacing: 0.5 }}>Tu nombre</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="María García" style={{ width: "100%", padding: "9px 12px", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 13, fontFamily: "'Jost', sans-serif", background: "#FAF8F5", color: "#1A1714", outline: "none" }} />
              </div>

         {f.tomado ? (
  <div style={{ width: "100%", padding: 15, background: "#F5F2ED", borderRadius: 3, textAlign: "center" as const, fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 300, color: "#8C6D4F", letterSpacing: 1 }}>
    ✦ Este regalo ya fue tomado
  </div>
) : f.modo === "completo" ? (
  <button onClick={handlePay} disabled={paid} style={{ width: "100%", padding: 15, background: paid ? "#6B8C76" : pal.accent, color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
    {paid ? "¡Regalo enviado! Gracias ✦" : `Regalar Q${(f.meta || 0).toLocaleString()} — Regalo completo`}
  </button>
) : (
  <>
    <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" as const }}>
      {(f.chips || [100, 200, 500, 1000]).map((a: number) => (
        <button key={a} onClick={() => setAmount(a)} style={{ padding: "9px 18px", border: `1px solid ${amount === a ? "#1A1714" : "rgba(26,23,20,0.14)"}`, borderRadius: 2, fontSize: 12, fontWeight: 500, cursor: "pointer", background: amount === a ? "#1A1714" : "transparent", color: amount === a ? "#fff" : "#5A524A", fontFamily: "'Jost', sans-serif" }}>Q{a.toLocaleString()}</button>
      ))}
      <button onClick={() => setAmount(0)} style={{ padding: "9px 18px", border: `1px solid ${amount === 0 ? "#1A1714" : "rgba(26,23,20,0.14)"}`, borderRadius: 2, fontSize: 12, fontWeight: 500, cursor: "pointer", background: amount === 0 ? "#1A1714" : "transparent", color: amount === 0 ? "#fff" : "#5A524A", fontFamily: "'Jost', sans-serif", fontStyle: "italic" }}>Otro</button>
    </div>
    {amount === 0 && (
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: "#5A524A" }}>Q</span>
        <input type="number" placeholder="Escribe tu monto" onChange={e => setAmount(parseInt(e.target.value) || 0)} style={{ flex: 1, padding: "9px 12px", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 13, fontFamily: "'Jost', sans-serif", background: "#FAF8F5", color: "#1A1714", outline: "none" }} />
      </div>
    )}
    <button onClick={handlePay} disabled={paid || amount <= 0} style={{ width: "100%", padding: 15, background: paid ? "#6B8C76" : amount <= 0 ? "#E0DAD4" : pal.accent, color: amount <= 0 ? "#A89C90" : "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" as const, cursor: amount <= 0 ? "default" : "pointer", fontFamily: "'Jost', sans-serif" }}>
      {paid ? "¡Regalo enviado! Gracias ✦" : amount > 0 ? `Regalar Q${amount.toLocaleString()} con tarjeta` : "Selecciona un monto"}
    </button>
  </>
)}
    
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{ padding: "24px", textAlign: "center", borderTop: "1px solid rgba(26,23,20,0.08)", marginTop: 20 }}>
        <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase" as const, color: txt.muted }}>Con amor</div>
        <div style={{ fontFamily: `'${font}', serif`, fontSize: 18, fontWeight: 300, color: txt.muted, marginTop: 4 }}>{pareja.nombre1} & {pareja.nombre2}</div>
        <div style={{ marginTop: 8, fontSize: 9, letterSpacing: 1, color: txt.muted }}>Creado con <span style={{ color: pal.accent }}>Wedo</span></div>
      </div>
    </div>
  );
}