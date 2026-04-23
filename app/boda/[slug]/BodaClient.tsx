"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const PALETAS: Record<string, { accent: string; bg: string; surface: string }> = {
  champagne: { accent: "#8C6D4F", bg: "#FAF8F5", surface: "#FFFFFF" },
  jardin:    { accent: "#4A7C59", bg: "#F4F7F4", surface: "#FFFFFF" },
  rose:      { accent: "#A0556A", bg: "#FDF5F6", surface: "#FFFFFF" },
  midnight:  { accent: "#C9A84C", bg: "#141210", surface: "#1E1A16" },
  terracotta:{ accent: "#C4562A", bg: "#FDF8F5", surface: "#FFFFFF" },
};

const TEXT: Record<string, { primary: string; secondary: string; muted: string }> = {
  champagne:  { primary: "#1A1714", secondary: "#5A524A", muted: "#A89C90" },
  jardin:     { primary: "#1A2318", secondary: "#3A5240", muted: "#7A9A84" },
  rose:       { primary: "#1F1214", secondary: "#5A3040", muted: "#A07080" },
  midnight:   { primary: "#F0E8D8", secondary: "#C8B898", muted: "#887868" },
  terracotta: { primary: "#1A1210", secondary: "#5A3820", muted: "#A07858" },
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
  const [activeSection, setActiveSection] = useState("regalos");

  useEffect(() => { loadData(); }, [slug]);

  async function loadData() {
    const { data: p } = await supabase.from("parejas").select("*").eq("slug", slug).single();
    if (!p) { setLoading(false); return; }
    setPareja(p);
    const { data: f } = await supabase.from("fondos").select("*").eq("pareja_id", p.id).order("orden");
    setFondos(f || []);
    setLoading(false);
  }

  async function handlePay() {
    const f = fondos[selected];
    setPaid(true);
    await supabase.from("contribuciones").insert({ fondo_id: f.id, nombre_invitado: nombre || "Anónimo", monto: amount });
    await supabase.from("fondos").update({ recaudado: (f.recaudado || 0) + amount }).eq("id", f.id);
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
  const pal = PALETAS[pid] || PALETAS.champagne;
  const txt = TEXT[pid] || TEXT.champagne;
  const font = pareja.tipografia || "Cormorant Garamond";
  const overlayOpacity = (pareja.hero_oscuridad || 45) / 100;
  const f = fondos[selected];
  const heroImg = pareja.foto_hero || "https://images.unsplash.com/photo-1519741497674-611481863552?w=900&q=80";

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
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, rgba(26,23,20,${overlayOpacity * 0.1}), rgba(26,23,20,${overlayOpacity}))` }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 32px", textAlign: "center", zIndex: 2 }}>
          <div style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase" as const, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
            {pareja.hashtag || "Wedo · Lista de Regalos"}
          </div>
          <div style={{ fontFamily: `'${font}', serif`, fontSize: 52, fontWeight: 300, color: "#fff", fontStyle: "italic", marginBottom: 6, lineHeight: 1 }}>
            {pareja.nombre1} & {pareja.nombre2}
          </div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase" as const, color: "rgba(255,255,255,0.65)" }}>
            {pareja.fecha ? new Date(pareja.fecha + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" }) : ""}{pareja.lugar ? ` · ${pareja.lugar}` : ""}
          </div>
        </div>
      </div>

      {/* NAV SECTIONS */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "16px 24px", borderBottom: `1px solid rgba(26,23,20,0.08)`, flexWrap: "wrap" as const }}>
        <button onClick={() => setActiveSection("regalos")} style={navBtnStyle(activeSection === "regalos")}>Regalos</button>
        {pareja.historia && <button onClick={() => setActiveSection("historia")} style={navBtnStyle(activeSection === "historia")}>Nuestra historia</button>}
        {(pareja.ceremonia || pareja.recepcion) && <button onClick={() => setActiveSection("detalles")} style={navBtnStyle(activeSection === "detalles")}>Detalles</button>}
        {pareja.invitacion_url && <button onClick={() => setActiveSection("invitacion")} style={navBtnStyle(activeSection === "invitacion")}>Invitación</button>}
      </div>

      {/* SECCIÓN REGALOS */}
      {activeSection === "regalos" && (
        <>
          <div style={{ textAlign: "center", padding: "28px 24px 8px" }}>
            <div style={{ fontSize: 9, letterSpacing: 4, textTransform: "uppercase" as const, color: txt.muted, marginBottom: 6 }}>Para los novios</div>
            <div style={{ fontFamily: `'${font}', serif`, fontSize: 32, fontWeight: 300, color: txt.primary }}>Nuestros Regalos</div>
            <div style={{ width: 36, height: 1, background: pal.accent, margin: "12px auto 0" }} />
          </div>

          {fondos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 24px" }}>
              <div style={{ fontFamily: `'${font}', serif`, fontSize: 20, fontWeight: 300, color: txt.muted }}>Los novios aún no han agregado regalos</div>
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
                      <div style={{ fontFamily: `'${font}', serif`, fontSize: 20, fontWeight: 400, color: txt.primary, marginBottom: 4 }}>{fondo.nombre}</div>
                      <div style={{ fontSize: 12, color: txt.secondary, lineHeight: 1.65, marginBottom: 9, fontWeight: 300 }}>{fondo.descripcion}</div>
                      <div style={{ height: 1, background: "rgba(26,23,20,0.1)", marginBottom: 5 }}>
                        <div style={{ height: 1, background: pal.accent, width: `${pct}%` }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: txt.muted }}>
                        <strong style={{ color: txt.primary }}>Q{(fondo.recaudado || 0).toLocaleString()}</strong>
                        <span>{fondo.meta > 0 ? `${pct}% · Q${fondo.meta.toLocaleString()}` : "Sin meta"}</span>
                      </div>
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
      {activeSection === "historia" && pareja.historia && (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 9, letterSpacing: 4, textTransform: "uppercase" as const, color: txt.muted, marginBottom: 6 }}>Nosotros</div>
            <div style={{ fontFamily: `'${font}', serif`, fontSize: 32, fontWeight: 300, color: txt.primary }}>Nuestra Historia</div>
            <div style={{ width: 36, height: 1, background: pal.accent, margin: "12px auto 0" }} />
          </div>
          <div style={{ fontSize: 15, color: txt.secondary, lineHeight: 1.85, fontWeight: 300, textAlign: "center" as const }}>{pareja.historia}</div>
          {pareja.musica && (
            <div style={{ marginTop: 32, textAlign: "center", padding: "16px", background: pal.surface, border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4 }}>
              <div style={{ fontSize: 9, letterSpacing: 3, textTransform: "uppercase" as const, color: txt.muted, marginBottom: 6 }}>Nuestra canción</div>
              <div style={{ fontFamily: `'${font}', serif`, fontSize: 20, fontWeight: 300, color: txt.primary }}>🎵 {pareja.musica}</div>
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN DETALLES */}
      {activeSection === "detalles" && (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 9, letterSpacing: 4, textTransform: "uppercase" as const, color: txt.muted, marginBottom: 6 }}>El gran día</div>
            <div style={{ fontFamily: `'${font}', serif`, fontSize: 32, fontWeight: 300, color: txt.primary }}>Detalles</div>
            <div style={{ width: 36, height: 1, background: pal.accent, margin: "12px auto 0" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { icon: "📅", label: "Fecha", value: pareja.fecha ? new Date(pareja.fecha + "T12:00:00").toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : null },
              { icon: "🕐", label: "Hora", value: pareja.hora },
              { icon: "⛪", label: "Ceremonia", value: pareja.ceremonia },
              { icon: "🥂", label: "Recepción", value: pareja.recepcion },
              { icon: "📍", label: "Ciudad", value: pareja.lugar },
              { icon: "🎽", label: "Dress code", value: pareja.dresscode },
            ].filter(d => d.value).map((d, i) => (
              <div key={i} style={{ background: pal.surface, border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{d.icon}</div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" as const, color: txt.muted, marginBottom: 4 }}>{d.label}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: txt.primary }}>{d.value}</div>
              </div>
            ))}
          </div>
          {pareja.hashtag && (
            <div style={{ marginTop: 20, textAlign: "center", padding: "14px", background: pal.surface, border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4 }}>
              <div style={{ fontFamily: `'${font}', serif`, fontSize: 22, fontWeight: 300, color: pal.accent }}>{pareja.hashtag}</div>
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN INVITACIÓN */}
      {activeSection === "invitacion" && pareja.invitacion_url && (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 9, letterSpacing: 4, textTransform: "uppercase" as const, color: txt.muted, marginBottom: 6 }}>Invitación</div>
          <div style={{ fontFamily: `'${font}', serif`, fontSize: 32, fontWeight: 300, color: txt.primary, marginBottom: 20 }}>Nuestra Invitación</div>
          <div style={{ width: 36, height: 1, background: pal.accent, margin: "0 auto 24px" }} />
          {pareja.invitacion_url.includes(".pdf") ? (
            <a href={pareja.invitacion_url} target="_blank" style={{ display: "inline-block", padding: "14px 28px", background: pal.accent, color: "#fff", textDecoration: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" as const, fontFamily: "'Jost', sans-serif" }}>
              Ver invitación PDF →
            </a>
          ) : (
            <img src={pareja.invitacion_url} alt="Invitación" style={{ width: "100%", borderRadius: 4, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }} />
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
              <div style={{ fontFamily: `'${font}', serif`, fontSize: 32, fontWeight: 300, color: "#1A1714", marginBottom: 5 }}>{f.nombre}</div>
              <div style={{ fontSize: 13, color: "#5A524A", lineHeight: 1.7, marginBottom: 12, fontWeight: 300 }}>{f.descripcion}</div>
              {f.historia && <div style={{ borderLeft: `1.5px solid ${pal.accent}`, paddingLeft: 16, fontFamily: `'${font}', serif`, fontSize: 17, fontStyle: "italic", color: "#5A524A", lineHeight: 1.75, marginBottom: 18, fontWeight: 300 }}>{f.historia}</div>}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: "#5A524A", display: "block", marginBottom: 6, letterSpacing: 0.5 }}>Tu nombre</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="María García" style={{ width: "100%", padding: "9px 12px", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 13, fontFamily: "'Jost', sans-serif", background: "#FAF8F5", color: "#1A1714", outline: "none" }} />
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" as const }}>
                {[100, 200, 500, 1000].map(a => (
                  <button key={a} onClick={() => setAmount(a)} style={{ padding: "9px 18px", border: `1px solid ${amount === a ? "#1A1714" : "rgba(26,23,20,0.14)"}`, borderRadius: 2, fontSize: 12, fontWeight: 500, cursor: "pointer", background: amount === a ? "#1A1714" : "transparent", color: amount === a ? "#fff" : "#5A524A", fontFamily: "'Jost', sans-serif" }}>Q{a.toLocaleString()}</button>
                ))}
              </div>
              <button onClick={handlePay} disabled={paid} style={{ width: "100%", padding: 15, background: paid ? "#6B8C76" : pal.accent, color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
                {paid ? "¡Regalo enviado! Gracias ✦" : `Regalar Q${amount.toLocaleString()} con tarjeta`}
              </button>
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