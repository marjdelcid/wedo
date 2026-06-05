"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import "../../inv-pay.css";
import "../../inv-public.css";

const fmtQ = (n: number) => "Q " + (n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

const PETAL_COLORS = ["#E84B8A", "#B3C24A", "#F3C9C2", "#87A6E8", "#EE5A28", "#E84B8A", "#B3C24A"];

export default function BodaClient({ slug }: { slug: string }) {
  const [pareja, setPareja] = useState<any>(null);
  const [fondos, setFondos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(0);
  const [amount, setAmount] = useState(100);
  const [open, setOpen] = useState(false);
  const [payState, setPayState] = useState<"choose" | "pend" | "ok" | "err">("choose");
  const [customStr, setCustomStr] = useState("");
  const [nombre, setNombre] = useState("");
  const [mensajeRegalo, setMensajeRegalo] = useState("");
  const [activeSection, setActiveSection] = useState("portada");

  // RSVP state
  const [rsvpQuery, setRsvpQuery] = useState("");
  const [rsvpResults, setRsvpResults] = useState<any[]>([]);
  const [rsvpSelected, setRsvpSelected] = useState<any>(null);
  const [rsvpSearched, setRsvpSearched] = useState(false);
  const [rsvpForm, setRsvpForm] = useState({ telefono: "", asistencia: "", acompanantes: "0", restricciones: "", mensaje: "" });
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpDone, setRsvpDone] = useState(false);
  const [rsvpCodigoStep, setRsvpCodigoStep] = useState(false);
  const [rsvpCodigoInput, setRsvpCodigoInput] = useState("");
  const [rsvpCodigoError, setRsvpCodigoError] = useState(false);
  const [rsvpCodigoLoading, setRsvpCodigoLoading] = useState(false);

  useEffect(() => { loadData(); }, [slug]);

  async function loadData() {
    const { data: p } = await supabase.from("parejas").select("*").eq("slug", slug).single();
    if (!p) { setLoading(false); return; }
    setPareja(p);
    const { data: f } = await supabase.from("fondos").select("*").eq("pareja_id", p.id).order("orden");
    setFondos(f || []);
    setLoading(false);
  }

  async function searchRsvp() {
    if (!rsvpQuery.trim()) return;
    setRsvpSearched(true);
    setRsvpSelected(null);
    const { data } = await supabase.from("invitados")
      .select("id,nombre,asientos,confirmado,pareja_id,tiene_codigo")
      .eq("pareja_id", pareja.id)
      .ilike("nombre", `%${rsvpQuery.trim()}%`);
    setRsvpResults(data || []);
  }

  async function handleVerifyCodigo() {
    if (!rsvpSelected) return;
    setRsvpCodigoLoading(true);
    setRsvpCodigoError(false);
    const { data } = await supabase.from("invitados")
      .select("id")
      .eq("id", rsvpSelected.id)
      .eq("codigo", rsvpCodigoInput.trim().toUpperCase())
      .single();
    setRsvpCodigoLoading(false);
    if (data) {
      setRsvpCodigoStep(false);
      setRsvpForm({ telefono: "", asistencia: "", acompanantes: "0", restricciones: "", mensaje: "" });
    } else {
      setRsvpCodigoError(true);
    }
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

  function fireConfetti() {
    if (typeof window === "undefined") return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const COLORS = ["#E84B8A", "#87A6E8", "#B3C24A", "#EE5A28", "#F3C9C2"];
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    for (let i = 0; i < 26; i++) {
      const c = document.createElement("div");
      c.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:10px;height:14px;border-radius:2px;pointer-events:none;z-index:9999;background:${COLORS[i % COLORS.length]};`;
      if (i % 3 === 0) { c.style.borderRadius = "50%"; c.style.width = "9px"; c.style.height = "9px"; }
      document.body.appendChild(c);
      const ang = Math.PI * (0.15 + Math.random() * 0.7) * -1;
      const spread = (Math.random() - 0.5) * 2.4;
      const dist = 120 + Math.random() * 180;
      const dx = Math.cos(ang) * dist * spread * 1.2;
      const dy = Math.sin(ang) * dist - (60 + Math.random() * 80);
      const rot = Math.random() * 720 - 360;
      const dur = 800 + Math.random() * 700;
      c.animate([
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        { transform: `translate(${dx * 0.6}px,${dy}px) rotate(${rot * 0.6}deg)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx}px,${dy + 320}px) rotate(${rot}deg)`, opacity: 0 },
      ], { duration: dur, easing: "cubic-bezier(.18,.7,.4,1)", fill: "forwards" });
      setTimeout(() => c.remove(), dur + 80);
    }
  }

  function openGift(i: number) {
    const g = fondos[i];
    setSelected(i);
    setNombre(""); setMensajeRegalo(""); setCustomStr("");
    setPayState("choose");
    setAmount(g?.modo === "completo" ? (g.meta || 0) : ((g?.chips && g.chips[0]) || 100));
    setOpen(true);
  }
  function closeGift() {
    setOpen(false); setPayState("choose"); setNombre(""); setMensajeRegalo(""); setCustomStr("");
  }

  async function handlePay() {
    const g = fondos[selected];
    if (!g) return;
    const montoFinal = g.modo === "completo" ? (g.meta || 0) : amount;
    if (!montoFinal || montoFinal <= 0) return;
    setPayState("pend");
    try {
      const { error: e1 } = await supabase.from("contribuciones").insert({ fondo_id: g.id, nombre_invitado: nombre || "Anónimo", monto: montoFinal, mensaje: mensajeRegalo || null });
      if (e1) throw e1;
      await supabase.from("fondos").update({
        recaudado: (g.recaudado || 0) + montoFinal,
        ...(g.modo === "completo" ? { tomado: true } : {})
      }).eq("id", g.id);
      setPayState("ok");
      if (pareja?.confeti_regalo) fireConfetti();
      loadData();
    } catch {
      setPayState("err");
    }
  }

  if (loading) return (
    <div style={{ fontFamily: "'Archivo', sans-serif", background: "#F7F0E5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: 26, color: "rgba(35,23,18,.5)" }}>Cargando<span style={{ color: "#E84B8A" }}>.</span></div>
    </div>
  );

  if (!pareja) return (
    <div style={{ fontFamily: "'Archivo', sans-serif", background: "#F7F0E5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <div>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: 34, color: "#231712", marginBottom: 8 }}>Página no encontrada</div>
        <a href="/" style={{ fontSize: 12, color: "#E84B8A", textDecoration: "none", fontWeight: 700 }}>Volver al inicio</a>
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
  const overlayOpacity = (pareja.hero_oscuridad || 45) / 100;
  const f = fondos[selected];
  const heroImg = pareja.foto_hero || "";
  const onPhoto = !!pareja.foto_hero;
  const secs: any = { historia: true, detalles: true, invitacion: true, regalos: true, rsvp: true, countdown: true, galeria: true, ...(pareja.secciones || {}) };
  const galeriaFotos: string[] = Array.isArray(pareja.galeria_fotos) ? pareja.galeria_fotos : [];
  const savedOrder: string[] = Array.isArray(pareja.secciones_orden) && pareja.secciones_orden.length > 0 ? pareja.secciones_orden : [];

  const frasePortada = pareja.frase_portada || "Nos casamos";
  const estiloPortada = pareja.estilo_portada || "clasica";
  const animEstilo = pareja.animaciones_estilo || "elegante";
  const petalos = !!pareja.petalos;
  const heroDate = pareja.fecha ? new Date(pareja.fecha + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" }) : "";
  const heroDateLine = heroDate + (pareja.lugar ? ` · ${pareja.lugar}` : "");
  const secAnim: React.CSSProperties = animEstilo === "ninguna"
    ? {}
    : { animation: `${animEstilo === "alegre" ? "wedo-pop" : "wedo-fade"} ${animEstilo === "sutil" ? ".3s" : ".6s"} ${animEstilo === "alegre" ? "cubic-bezier(.34,1.56,.64,1)" : "ease"} both` };

  function renderInline(text: string): React.ReactNode[] {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i} style={{ fontWeight: 600, color: "var(--c-ink)" }}>{part.slice(2, -2)}</strong>
        : <span key={i}>{part}</span>
    );
  }
  function renderDresscode(text: string) {
    return text.split("\n").map((line, i) => {
      const t = line.trim();
      if (!t) return <div key={i} style={{ height: 5 }} />;
      if (t.startsWith("## ")) return <div key={i} style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "var(--c-muted)", margin: "8px 0 4px" }}>{renderInline(t.slice(3))}</div>;
      if (t.startsWith("* ")) return <div key={i} style={{ display: "flex", gap: 8, marginBottom: 3 }}><span style={{ color: "var(--c-accent)" }}>·</span><span>{renderInline(t.slice(2))}</span></div>;
      return <div key={i} style={{ marginBottom: 3 }}>{renderInline(t)}</div>;
    });
  }

  // theme vars from the couple's choices
  const themeVars = {
    ["--c-accent" as string]: pal.accent,
    ["--c-bg" as string]: pal.bg,
    ["--c-surface" as string]: pal.surface,
    ["--c-ink" as string]: txt.primary,
    ["--c-soft" as string]: txt.secondary,
    ["--c-muted" as string]: txt.muted,
    ["--c-font" as string]: `'${font}', Georgia, serif`,
    ["--c-font-tit" as string]: `'${fontTitulos}', Georgia, serif`,
  } as React.CSSProperties;

  // section order/nav per handoff (couple's enabled toggles + saved order)
  const PUB_LABELS: Record<string, string> = { historia: "Historia", galeria: "Galería", regalos: "Regalos", rsvp: "RSVP", detalles: "Detalles", invitacion: "Invitación" };
  const PUB_DEFAULT = ["historia", "galeria", "regalos", "rsvp", "detalles", "invitacion"];
  const orderedSecs = [...savedOrder, ...PUB_DEFAULT.filter((x) => !savedOrder.includes(x))]
    .filter((x, i, a) => PUB_DEFAULT.includes(x) && a.indexOf(x) === i)
    .filter((x) => !!secs[x] && (x !== "galeria" || galeriaFotos.length > 0));

  // countdown on the cover (when the section is enabled)
  const cd = (secs.countdown && pareja.fecha) ? (() => {
    const diff = new Date(pareja.fecha + "T12:00:00").getTime() - Date.now();
    if (diff <= 0) return null;
    return { days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), mins: Math.floor((diff % 3600000) / 60000) };
  })() : null;

  const cText = onPhoto ? "#fff" : "var(--c-accent)";
  const cPre = onPhoto ? "rgba(255,255,255,.85)" : "var(--c-accent)";
  const cDate = onPhoto ? "rgba(255,255,255,.82)" : "var(--c-soft)";
  const cdN = onPhoto ? "#fff" : "var(--c-accent)";
  const cdL = onPhoto ? "rgba(255,255,255,.75)" : "var(--c-soft)";
  const n1 = pareja.nombre1 || "", n2 = pareja.nombre2 || "";

  const coverStyle: React.CSSProperties = onPhoto
    ? { backgroundImage: `linear-gradient(rgba(35,23,18,${(overlayOpacity * 0.45).toFixed(2)}), rgba(35,23,18,${Math.min(overlayOpacity, 0.82).toFixed(2)})), url('${heroImg}')` }
    : { background: "var(--c-bg)" };

  const Countdown = () => cd ? (
    <div className="cd">
      <div className="u"><div className="n" style={{ color: cdN }}>{cd.days}</div><div className="l" style={{ color: cdL }}>días</div></div>
      <div className="u"><div className="n" style={{ color: cdN }}>{cd.hours}</div><div className="l" style={{ color: cdL }}>horas</div></div>
      <div className="u"><div className="n" style={{ color: cdN }}>{cd.mins}</div><div className="l" style={{ color: cdL }}>min</div></div>
    </div>
  ) : null;

  function CoverText() {
    const Pre = ({ children }: { children: React.ReactNode }) => <div className="pre" style={{ color: cPre }}>{children}</div>;
    const Date2 = () => heroDateLine.trim() ? <div className="date" style={{ color: cDate }}>{heroDateLine}</div> : null;
    if (estiloPortada === "minimalista") return (<div className="cover-text"><div className="names" style={{ color: cText, letterSpacing: ".12em", fontSize: 44 }}>{(n1 || "M").charAt(0).toUpperCase()} · {(n2 || "J").charAt(0).toUpperCase()}</div><Date2 /><Countdown /></div>);
    if (estiloPortada === "fecha") return (<div className="cover-text"><div className="names" style={{ color: cText, fontSize: 40 }}>{heroDate || "El gran día"}</div><Pre>{n1} &amp; {n2}{pareja.lugar ? ` · ${pareja.lugar}` : ""}</Pre><Countdown /></div>);
    if (estiloPortada === "apilada") return (<div className="cover-text"><Pre>{frasePortada}</Pre><div className="names" style={{ color: cText, fontSize: 44, lineHeight: 1.05 }}>{n1}<br />&amp;<br />{n2}</div><Date2 /><Countdown /></div>);
    if (estiloPortada === "marco") return (<div className="cover-text"><div style={{ border: `1px solid ${onPhoto ? "rgba(255,255,255,.55)" : "var(--c-accent)"}`, padding: "22px 18px", display: "inline-block" }}><Pre>{frasePortada}</Pre><div className="names" style={{ color: cText }}>{n1} &amp; {n2}</div><Date2 /></div><Countdown /></div>);
    if (estiloPortada === "editorial") return (<div className="cover-text"><div className="names" style={{ color: cText, fontStyle: "italic", fontSize: 46 }}>{frasePortada}</div><Date2 /><Pre>{n1} &amp; {n2}</Pre><Countdown /></div>);
    return (<div className="cover-text"><Pre>{frasePortada}</Pre><div className="names" style={{ color: cText }}>{n1} &amp; {n2}</div><Date2 /><Countdown /></div>);
  }

  const inpStyle: React.CSSProperties = { width: "100%", padding: "11px 14px", border: "1px solid var(--c-line)", borderRadius: 10, fontSize: 14, fontFamily: "'Archivo', sans-serif", background: "var(--c-bg)", color: "var(--c-ink)", outline: "none", boxSizing: "border-box" };

  function GiftCard({ g, i }: { g: any; i: number }) {
    const meta = g.meta || 0;
    const pct = meta > 0 ? Math.min(Math.round(((g.recaudado || 0) / meta) * 100), 100) : 0;
    const showBar = g.modo !== "completo" && meta > 0;
    return (
      <div className={"gift" + (g.tomado ? " done" : "")}>
        {g.foto && <div className="gthumb"><img src={g.foto} alt={g.nombre} /></div>}
        <div className="gh"><span className="gn">{g.nombre}</span><span className="gg">{g.modo === "completo" ? `Q ${meta.toLocaleString()}` : meta > 0 ? `Meta Q ${meta.toLocaleString()}` : "Aporte libre"}</span></div>
        {g.descripcion && <p className="gd">{g.descripcion}</p>}
        {showBar && (<>
          <div className="bar"><span style={{ width: `${pct}%` }} /></div>
          <div className="gp"><span>{pct}% recaudado</span><span>Q {(g.recaudado || 0).toLocaleString()}</span></div>
        </>)}
        {g.tomado
          ? <button className="gbtn done" disabled>Ya regalado</button>
          : <button className="gbtn" onClick={() => openGift(i)}>Aportar</button>}
      </div>
    );
  }

  function renderSection(id: string) {
    if (id === "historia") return (
      <div className="sec">
        <div className="sec-k">Nuestra historia</div>
        <h2 className="sec-h">Cómo empezó todo</h2>
        <p className="body">{pareja.historia || "Pronto compartiremos cómo empezó todo."}</p>
        {pareja.musica && <div className="song"><div className="k">Nuestra canción</div><div className="v">♪ {pareja.musica}</div></div>}
      </div>
    );
    if (id === "galeria") return (
      <div className="sec">
        <div className="sec-k">Galería</div>
        <h2 className="sec-h">Nuestros momentos</h2>
        <div className="gallery-grid">{galeriaFotos.map((url, i) => <div className="ph" key={i}><img src={url} alt="" /></div>)}</div>
      </div>
    );
    if (id === "regalos") return (
      <div className="sec">
        <div className="sec-k">Mesa de regalos</div>
        <h2 className="sec-h">Regálanos un momento</h2>
        {fondos.length === 0
          ? <p className="body">Los novios aún no han agregado regalos.</p>
          : <div className="gifts-wrap">{fondos.map((g, i) => <GiftCard key={g.id || i} g={g} i={i} />)}</div>}
        <div style={{ textAlign: "center", marginTop: 18, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--c-muted)" }}>Pagos vía <span style={{ color: "var(--c-accent)" }}>Recurrente</span> · Guatemala</div>
      </div>
    );
    if (id === "invitacion") return (
      <div className="sec">
        <div className="sec-k">Invitación</div>
        <h2 className="sec-h">Nuestra invitación</h2>
        {pareja.invitacion_url
          ? (pareja.invitacion_url.includes(".pdf")
            ? <div style={{ textAlign: "center" }}><a href={pareja.invitacion_url} target="_blank" rel="noreferrer" style={{ display: "inline-block", padding: "13px 26px", background: "var(--c-accent)", color: "#fff", textDecoration: "none", borderRadius: 100, fontFamily: "'Archivo',sans-serif", fontWeight: 600, fontSize: 13 }}>Ver invitación (PDF)</a></div>
            : <img src={pareja.invitacion_url} alt="Invitación" style={{ width: "100%", borderRadius: 14, boxShadow: "0 8px 30px rgba(35,23,18,.12)" }} />)
          : <p className="body">La invitación estará disponible aquí pronto.</p>}
      </div>
    );
    if (id === "detalles") {
      const rows: React.ReactNode[] = [];
      if (pareja.ceremonia) rows.push(<div className="detail" key="cer"><span className="di" /><div><div className="dt">Ceremonia{pareja.hora ? ` · ${pareja.hora}` : ""}</div><div className="ds">{pareja.ceremonia}</div>{pareja.ceremonia_maps && <a className="map" href={pareja.ceremonia_maps} target="_blank" rel="noreferrer">Ver mapa</a>}</div></div>);
      if (pareja.recepcion) rows.push(<div className="detail" key="rec"><span className="di" /><div><div className="dt">Recepción</div><div className="ds">{pareja.recepcion}</div>{pareja.recepcion_maps && <a className="map" href={pareja.recepcion_maps} target="_blank" rel="noreferrer">Ver mapa</a>}</div></div>);
      if (pareja.dresscode || pareja.dresscode_notas) rows.push(<div className="detail" key="dc"><span className="di" /><div><div className="dt">Dress code{pareja.dresscode ? ` · ${pareja.dresscode}` : ""}</div>{pareja.dresscode_notas && <div className="ds">{renderDresscode(pareja.dresscode_notas)}</div>}</div></div>);
      if (secs.regalos) rows.push(<div className="detail" key="reg"><span className="di" /><div><div className="dt">Mesa de regalos</div><div className="ds">Aportes en quetzales, directo a su cuenta.</div></div></div>);
      if (pareja.hashtag) rows.push(<div className="detail" key="ht"><span className="di" /><div><div className="dt">Comparte tus fotos</div><div className="ds">{pareja.hashtag}</div></div></div>);
      return (
        <div className="sec">
          <div className="sec-k">Detalles del día</div>
          <h2 className="sec-h">El gran día</h2>
          <div className="detalles-wrap">{rows.length ? rows : <p className="body">Pronto compartiremos los detalles del día.</p>}</div>
        </div>
      );
    }
    if (id === "rsvp") return (
      <div className="sec">
        <div className="sec-k">Confirma tu asistencia</div>
        <h2 className="sec-h">¿Nos acompañas?</h2>
        {rsvpDone ? (
          <div style={{ textAlign: "center", background: "var(--c-bg)", borderRadius: 14, padding: 26 }}>
            <div style={{ fontFamily: "var(--c-font-tit)", fontSize: 26, color: "var(--c-accent)", marginBottom: 8 }}>{rsvpForm.asistencia === "si" ? "¡Nos vemos pronto!" : "Gracias por avisarnos"}</div>
            <div style={{ fontSize: 13.5, color: "var(--c-soft)", fontFamily: "'Archivo',sans-serif" }}>{rsvpForm.asistencia === "si" ? "Tu asistencia quedó confirmada. ¡Te esperamos con mucho amor!" : "Lamentamos que no puedas acompañarnos, gracias por responder."}</div>
          </div>
        ) : rsvpCodigoStep ? (
          <div style={{ background: "var(--c-bg)", borderRadius: 14, padding: 22 }}>
            <button onClick={() => { setRsvpSelected(null); setRsvpCodigoStep(false); }} style={{ background: "none", border: "none", color: "var(--c-muted)", cursor: "pointer", fontFamily: "'Archivo',sans-serif", fontSize: 12, marginBottom: 14, padding: 0 }}>← Volver</button>
            <div style={{ fontFamily: "var(--c-font)", fontSize: 22, color: "var(--c-ink)", marginBottom: 4 }}>{rsvpSelected.nombre}</div>
            <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--c-muted)", marginBottom: 18 }}>Ingresa tu código de acceso</div>
            <input value={rsvpCodigoInput} onChange={(e) => { setRsvpCodigoInput(e.target.value.toUpperCase()); setRsvpCodigoError(false); }} onKeyDown={(e) => e.key === "Enter" && handleVerifyCodigo()} placeholder="Ej: ABC123" maxLength={8} style={{ ...inpStyle, textAlign: "center", letterSpacing: 3, fontFamily: "monospace", fontSize: 18, marginBottom: 8 }} />
            {rsvpCodigoError && <div style={{ fontSize: 12, color: "#b23a1c", textAlign: "center", marginBottom: 10 }}>Código incorrecto. Revisa tu invitación.</div>}
            <button onClick={handleVerifyCodigo} disabled={!rsvpCodigoInput.trim() || rsvpCodigoLoading} style={{ width: "100%", padding: 13, background: "var(--c-accent)", color: "#fff", border: "none", borderRadius: 100, fontFamily: "'Archivo',sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer", opacity: !rsvpCodigoInput.trim() ? 0.5 : 1 }}>{rsvpCodigoLoading ? "Verificando..." : "Continuar"}</button>
          </div>
        ) : !rsvpSelected ? (
          <>
            <div style={{ background: "var(--c-bg)", borderRadius: 14, padding: 22, marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={rsvpQuery} onChange={(e) => setRsvpQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchRsvp()} placeholder="Escribe tu nombre…" style={inpStyle} />
                <button onClick={searchRsvp} style={{ padding: "0 20px", background: "var(--c-accent)", color: "#fff", border: "none", borderRadius: 100, fontFamily: "'Archivo',sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>Buscar</button>
              </div>
            </div>
            {rsvpSearched && rsvpResults.length === 0 && <div style={{ textAlign: "center", color: "var(--c-muted)", fontSize: 13, padding: "12px 0" }}>No encontramos tu nombre. Intenta con otro término.</div>}
            {rsvpResults.map((inv, i) => (
              <div key={i} onClick={() => { setRsvpSelected(inv); setRsvpCodigoInput(""); setRsvpCodigoError(false); if (pareja.rsvp_codigo_requerido && inv.tiene_codigo) { setRsvpCodigoStep(true); } else { setRsvpCodigoStep(false); setRsvpForm({ telefono: "", asistencia: "", acompanantes: "0", restricciones: "", mensaje: "" }); } }} style={{ background: "var(--c-surface)", border: "1px solid var(--c-line)", borderRadius: 12, padding: "14px 18px", marginBottom: 8, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "var(--c-font)", fontSize: 19, color: "var(--c-ink)" }}>{inv.nombre}</div>
                  <div style={{ fontSize: 11, color: "var(--c-muted)" }}>{inv.asientos} {inv.asientos === 1 ? "lugar reservado" : "lugares reservados"}{inv.confirmado ? " · ✓ ya confirmaste" : ""}</div>
                </div>
                <div style={{ color: "var(--c-muted)" }}>→</div>
              </div>
            ))}
          </>
        ) : (
          <div style={{ background: "var(--c-bg)", borderRadius: 14, padding: 22 }}>
            <button onClick={() => setRsvpSelected(null)} style={{ background: "none", border: "none", color: "var(--c-muted)", cursor: "pointer", fontFamily: "'Archivo',sans-serif", fontSize: 12, marginBottom: 14, padding: 0 }}>← Volver</button>
            <div style={{ fontFamily: "var(--c-font)", fontSize: 23, color: "var(--c-ink)", marginBottom: 4 }}>{rsvpSelected.nombre}</div>
            <div style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 18 }}>{rsvpSelected.asientos} {rsvpSelected.asientos === 1 ? "lugar reservado para ti" : "lugares reservados para ti"}</div>
            {rsvpSelected.confirmado ? (
              <div style={{ textAlign: "center", padding: 14, background: "rgba(125,138,46,.14)", borderRadius: 10, color: "#566012", fontSize: 13, fontWeight: 600 }}>✓ Ya confirmaste tu asistencia</div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <button onClick={() => setRsvpForm((p) => ({ ...p, asistencia: "si" }))} style={{ flex: 1, padding: 12, border: `1.5px solid ${rsvpForm.asistencia === "si" ? "var(--c-accent)" : "var(--c-line)"}`, borderRadius: 10, background: rsvpForm.asistencia === "si" ? "var(--c-accent)" : "transparent", color: rsvpForm.asistencia === "si" ? "#fff" : "var(--c-soft)", fontFamily: "'Archivo',sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>✓ Sí, asistiré</button>
                  <button onClick={() => setRsvpForm((p) => ({ ...p, asistencia: "no", acompanantes: "0" }))} style={{ flex: 1, padding: 12, border: `1.5px solid ${rsvpForm.asistencia === "no" ? "var(--c-accent)" : "var(--c-line)"}`, borderRadius: 10, background: "transparent", color: "var(--c-soft)", fontFamily: "'Archivo',sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>✕ No podré ir</button>
                </div>
                {rsvpForm.asistencia === "si" && rsvpSelected.asientos > 1 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--c-muted)", marginBottom: 8 }}>¿Cuántos asisten? (incluyéndote)</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {Array.from({ length: rsvpSelected.asientos }, (_, k) => k + 1).map((nn) => (
                        <button key={nn} onClick={() => setRsvpForm((p) => ({ ...p, acompanantes: String(nn - 1) }))} style={{ padding: "8px 15px", border: `1px solid ${parseInt(rsvpForm.acompanantes) + 1 === nn ? "var(--c-ink)" : "var(--c-line)"}`, borderRadius: 8, background: parseInt(rsvpForm.acompanantes) + 1 === nn ? "var(--c-ink)" : "transparent", color: parseInt(rsvpForm.acompanantes) + 1 === nn ? "#fff" : "var(--c-soft)", fontFamily: "'Archivo',sans-serif", fontSize: 13, cursor: "pointer" }}>{nn}</button>
                      ))}
                    </div>
                  </div>
                )}
                {rsvpForm.asistencia === "si" && <div style={{ marginBottom: 12 }}><input value={rsvpForm.restricciones} onChange={(e) => setRsvpForm((p) => ({ ...p, restricciones: e.target.value }))} placeholder="Restricciones alimentarias (opcional)" style={inpStyle} /></div>}
                <textarea value={rsvpForm.mensaje} onChange={(e) => setRsvpForm((p) => ({ ...p, mensaje: e.target.value }))} placeholder="Mensaje para los novios (opcional)" style={{ ...inpStyle, minHeight: 64, resize: "vertical", marginBottom: 14 }} />
                <button onClick={handleRsvpSubmit} disabled={!rsvpForm.asistencia || rsvpSubmitting} style={{ width: "100%", padding: 13, background: "var(--c-accent)", color: "#fff", border: "none", borderRadius: 100, fontFamily: "'Archivo',sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer", opacity: !rsvpForm.asistencia ? 0.5 : 1 }}>{rsvpSubmitting ? "Enviando..." : "Confirmar asistencia"}</button>
              </>
            )}
          </div>
        )}
      </div>
    );
    return null;
  }

  return (
    <div className="inv-public" style={themeVars}>
      <style>{`@keyframes wedo-fade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@keyframes wedo-pop{0%{opacity:0;transform:translateY(18px) scale(.97)}70%{opacity:1;transform:translateY(-4px) scale(1.01)}100%{opacity:1;transform:none}}`}</style>
      <div className="backdrop">
        <main className="inv">
          <div className="inv-body" key={activeSection}>
            {activeSection === "portada" ? (
              <section className="isection on" style={secAnim}>
                <div className="cover" style={coverStyle}>
                  {petalos && (
                    <div className="petals" aria-hidden="true">
                      {PETAL_COLORS.map((col, i) => (
                        <span key={i} className="petal" style={{ left: `${[8, 22, 38, 54, 68, 82, 91][i]}%`, background: col, animationDuration: `${[9, 11, 8, 12, 10, 9.5, 11.5][i]}s`, animationDelay: `${[0, 1.4, 2.6, 0.8, 3.2, 1.9, 4][i]}s` }} />
                      ))}
                    </div>
                  )}
                  <CoverText />
                </div>
              </section>
            ) : (
              <section className="isection on" style={secAnim}>{renderSection(activeSection)}</section>
            )}
          </div>

          <nav className="inv-nav">
            <a className={activeSection === "portada" ? "on" : ""} onClick={() => setActiveSection("portada")}>Portada</a>
            {orderedSecs.map((s) => <a key={s} className={activeSection === s ? "on" : ""} onClick={() => setActiveSection(s)}>{PUB_LABELS[s]}</a>)}
          </nav>

          <footer className="inv-foot">
            <div className="mk">wedo<span className="dot">.</span></div>
            <div className="ft">Invitación &amp; regalos en efectivo · Guatemala</div>
          </footer>
        </main>
      </div>

      {/* CONTRIBUTION MODAL — wedo. brand */}
      {open && f && (() => {
        const gross = f.modo === "completo" ? (f.meta || 0) : amount;
        const fee = Math.round(gross * 0.035 * 100) / 100;
        const net = Math.round((gross - fee) * 100) / 100;
        const chips = f.chips && f.chips.length ? f.chips : [100, 200, 500, 1000];
        return (
          <div className="wedo-pay">
            <div className="overlay" onClick={(e) => e.target === e.currentTarget && closeGift()}>
              <div className="sheet">
                <div className="sheet-h">
                  <span className="mk">wedo<span className="dot">.</span></span>
                  <button className="x" onClick={closeGift}>✕</button>
                </div>

                {payState === "choose" && (f.tomado ? (
                  <div className="state-view">
                    <div className="state-ico ok">✓</div>
                    <h3>Ya fue regalado</h3>
                    <p>Este regalo ya lo tomó otro invitado. ¡Explora los demás!</p>
                    <button className="pay-btn" onClick={closeGift}>Ver otros regalos</button>
                  </div>
                ) : (
                  <>
                    <h3>{f.nombre}</h3>
                    <p className="sub">Tu aporte le llega directo a {pareja.nombre1} &amp; {pareja.nombre2}.</p>
                    {f.modo === "completo" ? (
                      <>
                        <div className="amt-label">Regalo completo</div>
                        <div className="amt-custom fixed"><span className="q">Q</span><span className="fixedval">{(f.meta || 0).toLocaleString()}</span></div>
                      </>
                    ) : (
                      <>
                        <div className="amt-label">Elige un monto</div>
                        <div className="amt-chips">
                          {chips.map((a: number) => (
                            <button key={a} className={"amt-chip" + (!customStr && amount === a ? " sel" : "")} onClick={() => { setAmount(a); setCustomStr(""); }}>Q{a.toLocaleString()}</button>
                          ))}
                        </div>
                        <div className="amt-custom">
                          <span className="q">Q</span>
                          <input inputMode="numeric" placeholder="Otro monto" value={customStr} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ""); setCustomStr(v); if (v) setAmount(parseInt(v)); }} />
                        </div>
                      </>
                    )}
                    <input className="name-field" placeholder="Tu nombre (opcional)" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                    <textarea className="msg-field" placeholder="Escribe un mensaje para los novios (opcional)…" value={mensajeRegalo} onChange={(e) => setMensajeRegalo(e.target.value)} />
                    <div className="amt-label">Resumen</div>
                    <div className="breakdown">
                      <div className="bd-row"><span>Tu aporte</span><span className="v">{fmtQ(gross)}</span></div>
                      <div className="bd-row"><span>Comisión wedo. (3.5%)</span><span className="v">– {fmtQ(fee)}</span></div>
                      <div className="bd-row net"><span>{pareja.nombre1} &amp; {pareja.nombre2} reciben</span><span className="v">{fmtQ(net)}</span></div>
                    </div>
                    <div className="bd-note"><span className="d" />La comisión cubre el procesamiento del pago en quetzales. El dinero llega a su cuenta bancaria en 2–3 días hábiles.</div>
                    <button className="pay-btn" onClick={handlePay} disabled={gross <= 0}>Aportar {fmtQ(gross)}</button>
                    <div className="secure"><span>🔒</span> Pago seguro con Recurrente · Visa &amp; Mastercard</div>
                  </>
                ))}

                {payState === "pend" && (
                  <div className="state-view">
                    <div className="state-ico pend">·</div>
                    <h3>Procesando tu aporte</h3>
                    <p>Estamos confirmando el pago con el banco. No cierres esta ventana —tarda solo unos segundos.</p>
                  </div>
                )}

                {payState === "ok" && (
                  <div className="state-view">
                    <div className="state-ico ok">✓</div>
                    <h3>¡Gracias por tu regalo!</h3>
                    <p>Tu aporte de <strong>{fmtQ(gross)}</strong> va en camino a {pareja.nombre1} &amp; {pareja.nombre2}.</p>
                    <div className="gracias" style={{ color: pal.accent }}>“{pareja.mensaje_gracias || "Con todo nuestro amor, gracias por ser parte de este momento tan especial."}”</div>
                    <button className="pay-btn" onClick={closeGift}>Volver a la invitación</button>
                  </div>
                )}

                {payState === "err" && (
                  <div className="state-view">
                    <div className="state-ico err">!</div>
                    <h3>No se pudo procesar</h3>
                    <p>Revisa los datos e intenta de nuevo. <strong>No se hizo ningún cargo.</strong></p>
                    <button className="pay-btn" onClick={() => setPayState("choose")}>Intentar de nuevo</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
