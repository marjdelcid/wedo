"use client";
import { useState } from "react";

const palettes = [
  { name: "Champagne", accent: "#8C6D4F", bg: "#FAF8F5", dots: ["#8C6D4F", "#FAF8F5", "#B8964A"] },
  { name: "Jardín", accent: "#4A7C59", bg: "#F4F7F4", dots: ["#4A7C59", "#F4F7F4", "#8BB49A"] },
  { name: "Rosa polvos", accent: "#A0556A", bg: "#FDF5F6", dots: ["#A0556A", "#FDF5F6", "#D4A0AE"] },
  { name: "Noche & Oro", accent: "#C9A84C", bg: "#141210", dots: ["#141210", "#C9A84C", "#F0E8D8"] },
  { name: "Terracotta", accent: "#C4562A", bg: "#FDF8F5", dots: ["#C4562A", "#FDF8F5", "#E8B49A"] },
];

const fonts = [
  { name: "Cormorant Garamond", sample: "Andrea & Diego" },
  { name: "Playfair Display", sample: "Andrea & Diego" },
  { name: "DM Serif Display", sample: "Andrea & Diego" },
];

export default function Editor() {
  const [tab, setTab] = useState("diseno");
  const [palette, setPalette] = useState(0);
  const [font, setFont] = useState(0);
  const [overlay, setOverlay] = useState(45);
  const [name1, setName1] = useState("Andrea");
  const [name2, setName2] = useState("Diego");
  const [date, setDate] = useState("2025-06-14");
  const [place, setPlace] = useState("Guatemala City");
  const [storyTitle, setStoryTitle] = useState("Nuestra Historia");
  const [storyText, setStoryText] = useState("Nos conocimos en Guatemala City en 2020. Desde esa noche supimos que algo especial había comenzado — una amistad que se convirtió en amor.");
  const [dresscode, setDresscode] = useState("Formal · Tonos neutros y tierra");
  const [wtime, setWtime] = useState("6:00 PM");
  const [ceremony, setCeremony] = useState("Catedral Metropolitana");
  const [reception, setReception] = useState("Casa Santo Domingo, Antigua");
  const [published, setPublished] = useState(false);

  const p = palettes[palette];
  const heroOverlay = `linear-gradient(to bottom, rgba(26,23,20,${(overlay * 0.001).toFixed(2)}), rgba(26,23,20,${(overlay * 0.011).toFixed(2)}))`;

  const tabs = ["diseno", "contenido", "secciones"];
  const tabLabels: Record<string, string> = { diseno: "Diseño", contenido: "Contenido", secciones: "Secciones" };

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: "#FAF8F5", minHeight: "100vh" }}>

      {/* TOP BAR */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", background: "rgba(250,248,245,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(26,23,20,0.14)", gap: 10 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase" as const, color: "#1A1714" }}>
          WE<em style={{ color: "#8C6D4F", fontStyle: "italic", letterSpacing: 0 }}>do</em>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 14px", fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, border: "1px solid rgba(26,23,20,0.14)", background: tab === t ? "#1A1714" : "transparent", cursor: "pointer", borderRadius: 3, color: tab === t ? "#fff" : "#A89C90", fontFamily: "'Jost', sans-serif", transition: "all 0.2s" }}>
              {tabLabels[t]}
            </button>
          ))}
        </div>
        <button onClick={() => { setPublished(true); setTimeout(() => setPublished(false), 2500); }} style={{ padding: "7px 18px", fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, border: "none", background: published ? "#6B8C76" : "#8C6D4F", color: "#fff", cursor: "pointer", borderRadius: 3, fontFamily: "'Jost', sans-serif", transition: "background 0.3s" }}>
          {published ? "¡Publicado! ✦" : "Publicar"}
        </button>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 49px)" }}>

        {/* LEFT PANEL */}
        <div style={{ width: 260, flexShrink: 0, background: "#fff", borderRight: "1px solid rgba(26,23,20,0.14)", overflowY: "auto" as const }}>

          {/* DISEÑO TAB */}
          {tab === "diseno" && (
            <>
              <div style={{ padding: 16, borderBottom: "1px solid rgba(26,23,20,0.08)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 10 }}>Paleta de color</div>
                {palettes.map((pal, i) => (
                  <div key={i} onClick={() => setPalette(i)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", border: `1px solid ${palette === i ? "#8C6D4F" : "rgba(26,23,20,0.14)"}`, borderRadius: 3, cursor: "pointer", marginBottom: 6, background: palette === i ? "#EDE0D4" : "#fff", transition: "all 0.15s" }}>
                    <div style={{ display: "flex", gap: 3 }}>
                      {pal.dots.map((d, j) => <div key={j} style={{ width: 12, height: 12, borderRadius: "50%", background: d, border: "1px solid rgba(0,0,0,0.08)" }} />)}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "#5A524A" }}>{pal.name}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: 16, borderBottom: "1px solid rgba(26,23,20,0.08)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 10 }}>Tipografía</div>
                {fonts.map((f, i) => (
                  <div key={i} onClick={() => setFont(i)} style={{ padding: "8px 10px", border: `1px solid ${font === i ? "#8C6D4F" : "rgba(26,23,20,0.14)"}`, borderRadius: 3, cursor: "pointer", marginBottom: 6, background: font === i ? "#EDE0D4" : "#fff", transition: "all 0.15s" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, color: "#5A524A", marginBottom: 2 }}>{f.name}</div>
                    <div style={{ fontFamily: `'${f.name}', serif`, fontSize: 18, color: "#1A1714", fontStyle: "italic" }}>{f.sample}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 10 }}>Oscuridad del hero</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, color: "#A89C90" }}>Claro</span>
                  <input type="range" min={0} max={80} value={overlay} onChange={e => setOverlay(Number(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ fontSize: 10, color: "#A89C90" }}>Oscuro</span>
                </div>
              </div>
            </>
          )}

          {/* CONTENIDO TAB */}
          {tab === "contenido" && (
            <>
              <div style={{ padding: 16, borderBottom: "1px solid rgba(26,23,20,0.08)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 10 }}>Los novios</div>
                {[
                  { label: "Nombre 1", value: name1, set: setName1 },
                  { label: "Nombre 2", value: name2, set: setName2 },
                  { label: "Lugar", value: place, set: setPlace },
                ].map((f, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 10, fontWeight: 600, color: "#5A524A", display: "block", marginBottom: 4 }}>{f.label}</label>
                    <input value={f.value} onChange={e => f.set(e.target.value)} style={{ width: "100%", padding: "7px 10px", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 12, fontFamily: "'Jost', sans-serif", background: "#FAF8F5", color: "#1A1714", outline: "none" }} />
                  </div>
                ))}
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "#5A524A", display: "block", marginBottom: 4 }}>Fecha</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: "100%", padding: "7px 10px", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 12, fontFamily: "'Jost', sans-serif", background: "#FAF8F5", color: "#1A1714", outline: "none" }} />
                </div>
              </div>
              <div style={{ padding: 16, borderBottom: "1px solid rgba(26,23,20,0.08)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 10 }}>Historia de amor</div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "#5A524A", display: "block", marginBottom: 4 }}>Título</label>
                  <input value={storyTitle} onChange={e => setStoryTitle(e.target.value)} style={{ width: "100%", padding: "7px 10px", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 12, fontFamily: "'Jost', sans-serif", background: "#FAF8F5", color: "#1A1714", outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "#5A524A", display: "block", marginBottom: 4 }}>Texto</label>
                  <textarea value={storyText} onChange={e => setStoryText(e.target.value)} style={{ width: "100%", padding: "7px 10px", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 12, fontFamily: "'Jost', sans-serif", background: "#FAF8F5", color: "#1A1714", outline: "none", minHeight: 80, resize: "vertical" as const, lineHeight: 1.5 }} />
                </div>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 10 }}>Detalles del evento</div>
                {[
                  { label: "Hora", value: wtime, set: setWtime },
                  { label: "Ceremonia", value: ceremony, set: setCeremony },
                  { label: "Recepción", value: reception, set: setReception },
                  { label: "Dress code", value: dresscode, set: setDresscode },
                ].map((f, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 10, fontWeight: 600, color: "#5A524A", display: "block", marginBottom: 4 }}>{f.label}</label>
                    <input value={f.value} onChange={e => f.set(e.target.value)} style={{ width: "100%", padding: "7px 10px", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 12, fontFamily: "'Jost', sans-serif", background: "#FAF8F5", color: "#1A1714", outline: "none" }} />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* SECCIONES TAB */}
          {tab === "secciones" && (
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 10 }}>Secciones visibles</div>
              {["Historia de amor", "Detalles del evento", "Dress code", "Lista de regalos", "RSVP", "Cuenta regresiva"].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: "#5A524A" }}>{s}</span>
                  <div style={{ width: 34, height: 18, borderRadius: 9, background: "#8C6D4F", cursor: "pointer", position: "relative" as const }}>
                    <div style={{ position: "absolute", top: 2, right: 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PREVIEW */}
        <div style={{ flex: 1, overflowY: "auto" as const, background: "#E8E4DF", padding: 20, display: "flex", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 420, background: p.bg, boxShadow: "0 8px 40px rgba(0,0,0,0.15)", borderRadius: 2, overflow: "hidden", minHeight: 600 }}>

            {/* HERO */}
            <div style={{ position: "relative", height: 260, overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1519741497674-611481863552?w=900&q=80')", backgroundSize: "cover", backgroundPosition: "center" }} />
              <div style={{ position: "absolute", inset: 0, background: heroOverlay }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 24px 22px", zIndex: 2, textAlign: "center" }}>
                <div style={{ fontSize: 8, letterSpacing: 4, textTransform: "uppercase" as const, color: "rgba(255,255,255,0.7)", marginBottom: 7 }}>Wedo · Invitación</div>
                <div style={{ fontFamily: `'${fonts[font].name}', serif`, fontSize: 40, fontWeight: 300, color: "#fff", fontStyle: "italic", marginBottom: 5, lineHeight: 1.05 }}>{name1} & {name2}</div>
                <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase" as const, color: "rgba(255,255,255,0.65)" }}>
                  {date ? new Date(date + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" }) : "—"} · {place}
                </div>
              </div>
            </div>

            {/* STORY */}
            <div style={{ padding: "20px 24px", borderBottom: `1px solid rgba(26,23,20,0.08)`, textAlign: "center" }}>
              <div style={{ fontSize: 8, letterSpacing: 3, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 6 }}>Nosotros</div>
              <div style={{ fontFamily: `'${fonts[font].name}', serif`, fontSize: 20, fontWeight: 300, color: "#1A1714", marginBottom: 10 }}>{storyTitle}</div>
              <div style={{ width: 28, height: 1, background: p.accent, margin: "0 auto 12px" }} />
              <div style={{ fontSize: 12, color: "#5A524A", lineHeight: 1.75, fontWeight: 300, textAlign: "left" as const }}>{storyText}</div>
            </div>

            {/* DETAILS */}
            <div style={{ padding: "16px 20px", borderBottom: `1px solid rgba(26,23,20,0.08)` }}>
              <div style={{ fontSize: 8, letterSpacing: 3, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 10, textAlign: "center" }}>El Gran Día</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { icon: "🕐", label: "Hora", value: wtime },
                  { icon: "📍", label: "Ceremonia", value: ceremony },
                  { icon: "🥂", label: "Recepción", value: reception },
                  { icon: "🎽", label: "Dress code", value: dresscode },
                ].map((d, i) => (
                  <div key={i} style={{ background: "rgba(26,23,20,0.04)", borderRadius: 3, padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 16, marginBottom: 4 }}>{d.icon}</div>
                    <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" as const, color: "#A89C90" }}>{d.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "#1A1714", marginTop: 2 }}>{d.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* GIFTS */}
            <div style={{ padding: "16px 20px", textAlign: "center", borderBottom: `1px solid rgba(26,23,20,0.08)` }}>
              <div style={{ fontSize: 8, letterSpacing: 3, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 6 }}>Regalos</div>
              <div style={{ fontFamily: `'${fonts[font].name}', serif`, fontSize: 18, fontWeight: 300, color: "#1A1714", marginBottom: 8 }}>Lista de regalos</div>
              <div style={{ fontSize: 11, color: "#5A524A", fontWeight: 300, lineHeight: 1.6, marginBottom: 12 }}>Tu presencia es nuestro mayor regalo. Si deseas contribuir, hemos preparado una lista especial.</div>
              <div style={{ display: "inline-block", padding: "10px 24px", border: `1px solid ${p.accent}`, borderRadius: 2, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" as const, color: p.accent }}>Ver lista de regalos</div>
            </div>

            {/* RSVP */}
            <div style={{ padding: "20px 24px", background: "rgba(26,23,20,0.03)", textAlign: "center" }}>
              <div style={{ fontSize: 8, letterSpacing: 3, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 6 }}>Confirmación</div>
              <div style={{ fontFamily: `'${fonts[font].name}', serif`, fontSize: 20, fontWeight: 300, color: "#1A1714", marginBottom: 12 }}>¿Podrás acompañarnos?</div>
              <div style={{ padding: "12px 28px", background: p.accent, color: "#fff", borderRadius: 3, fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" as const, display: "inline-block" }}>Confirmar asistencia</div>
            </div>

            {/* FOOTER */}
            <div style={{ padding: 16, textAlign: "center", borderTop: `1px solid rgba(26,23,20,0.08)` }}>
              <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90" }}>Con amor</div>
              <div style={{ fontFamily: `'${fonts[font].name}', serif`, fontSize: 16, fontWeight: 400, letterSpacing: 2, color: "#A89C90", marginTop: 2 }}>{name1} & {name2}</div>
              <div style={{ marginTop: 6, fontSize: 9, letterSpacing: 1, color: "#A89C90" }}>Creado con <span style={{ color: p.accent }}>Wedo</span></div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}