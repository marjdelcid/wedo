"use client";
/* =====================================================================
   wedo. — public wedding invitation (/boda/[slug])
   Visual design follows the handoff (Invitación.html): full-bleed, tab
   sections, rich cover with 6 style variants (chosen in the Editor —
   NOT here), carousel gallery, info cards + dress code. The couple's
   ACCENT + fonts come from their editor choices via inline --c-* vars.
   The money/trust modal stays wedo. brand (.wedo-pay, inv-pay.css).
   ===================================================================== */
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import "../../inv-pay.css";
import "../../inv-public.css";

const fmtQ = (n: number) => "Q " + (n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// couple palettes — 4-color story per palette (must match EditorApp PALETAS).
// colores[0] is the accent; the 4 colors theme the cover, the 4 Detalles
// info-cards, the RSVP and the dress-code swatches. The canvas itself stays
// the light wedo. editorial design.
const PAL_COLORS: Record<string, string[]> = {
  rosawedo: ["#E84B8A", "#87A6E8", "#B3C24A", "#EE5A28"],
  periwinkle: ["#87A6E8", "#E84B8A", "#B3C24A", "#5E6FB0"],
  lima: ["#B3C24A", "#E84B8A", "#87A6E8", "#7E8C28"],
  coral: ["#EE5A28", "#F3C9C2", "#E84B8A", "#C4562A"],
  vino: ["#5E1E2E", "#E84B8A", "#C4788A", "#87A6E8"],
  champagne: ["#8C6D4F", "#B8964A", "#C4A878", "#7A8B6A"],
  jardin: ["#4A7C59", "#8BB49A", "#B3C24A", "#C4A878"],
  rose: ["#A0556A", "#D4A0AE", "#E84B8A", "#87A6E8"],
  midnight: ["#C9A84C", "#87A6E8", "#E84B8A", "#B3C24A"],
  terracotta: ["#C4562A", "#E8B49A", "#B8964A", "#87A6E8"],
  lavanda: ["#7B6BA8", "#C4BCDC", "#E84B8A", "#87A6E8"],
  azulpolvo: ["#4A6E8C", "#8AAEC4", "#87A6E8", "#B3C24A"],
  bordeaux: ["#7A2B3A", "#C4788A", "#E84B8A", "#B8964A"],
  olivo: ["#5C6E3E", "#A0A870", "#B3C24A", "#C4A878"],
  grisperla: ["#5A5A5A", "#A8A8A8", "#87A6E8", "#E84B8A"],
  vinedo: ["#7A2B3A", "#5C6E3E", "#B8964A", "#C4788A"],
  brand: ["#E84B8A", "#87A6E8", "#B3C24A", "#EE5A28"],
};

const PETAL_COLORS = ["#E84B8A", "#B3C24A", "#F3C9C2", "#87A6E8", "#EE5A28", "#E84B8A", "#B3C24A"];
const PETAL_LEFT = [8, 22, 38, 54, 68, 82, 91];
const PETAL_DUR = [9, 11, 8, 12, 10, 9.5, 11.5];
const PETAL_DELAY = [0, 1.4, 2.6, 0.8, 3.2, 1.9, 4];

const BOT_PATH = "M20 150C36 120 46 96 60 70C60 68 60 67 60 66C30 14 90 14 60 66C92 30 112 70 60 66C104 92 76 116 60 66C44 116 16 92 60 66C8 70 28 30 60 66C52 94 68 94 60 66";

const PUB_LABELS: Record<string, string> = { historia: "Historia", galeria: "Galería", regalos: "Regalos", rsvp: "RSVP", detalles: "Detalles", invitacion: "Invitación" };
const PUB_DEFAULT = ["historia", "galeria", "regalos", "rsvp", "detalles", "invitacion"];

function Carousel({ photos }: { photos: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (photos.length <= 1) return;
    const t = setInterval(() => setI((p) => (p + 1) % photos.length), 3200);
    return () => clearInterval(t);
  }, [photos.length]);
  return (
    <div className="carousel">
      <div className="car-track" style={{ transform: `translateX(-${i * 100}%)` }}>
        {photos.map((u, k) => <img key={k} src={u} alt="" />)}
      </div>
      {photos.length > 1 && (
        <div className="car-dots">{photos.map((_, k) => <b key={k} className={k === i ? "on" : ""} onClick={() => setI(k)} />)}</div>
      )}
    </div>
  );
}

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

  // ---- couple theme (4 palette colors + fonts; canvas stays light editorial) ----
  const pid = pareja.paleta || "brand";
  const colores: string[] = (Array.isArray(pareja.paleta_colores) && pareja.paleta_colores.length === 4)
    ? pareja.paleta_colores
    : (pid === "personalizado"
      ? [pareja.color_acento || "#E84B8A", "#87A6E8", "#B3C24A", "#EE5A28"]
      : (PAL_COLORS[pid] || PAL_COLORS.brand));
  const accent = colores[0];
  const font = pareja.tipografia || "Cormorant Garamond";
  const fontTitulos = pareja.tipografia_titulos || font;

  const themeVars = {
    ["--c-accent" as string]: accent,
    ["--c1" as string]: colores[0],
    ["--c2" as string]: colores[1],
    ["--c3" as string]: colores[2],
    ["--c4" as string]: colores[3],
    ["--c-font" as string]: `'${font}', Georgia, serif`,
    ["--c-font-tit" as string]: `'${fontTitulos}', Georgia, serif`,
  } as React.CSSProperties;

  const n1 = pareja.nombre1 || "", n2 = pareja.nombre2 || "";
  const frasePortada = pareja.frase_portada || "Nos casamos";
  const estiloPortada = pareja.estilo_portada || "clasica";
  const animEstilo = pareja.animaciones_estilo || "elegante";
  const petalos = !!pareja.petalos;
  const fotoHero = pareja.foto_hero || "";

  const secs: any = { historia: true, detalles: true, invitacion: true, regalos: true, rsvp: true, countdown: true, galeria: true, ...(pareja.secciones || {}) };
  const galeriaFotos: string[] = Array.isArray(pareja.galeria_fotos) ? pareja.galeria_fotos : [];
  const savedOrder: string[] = Array.isArray(pareja.secciones_orden) && pareja.secciones_orden.length > 0 ? pareja.secciones_orden : [];

  // date pieces
  const dObj = pareja.fecha ? new Date(pareja.fecha + "T12:00:00") : null;
  const dateLine = dObj ? `${dObj.getDate()} · ${dObj.toLocaleDateString("es-GT", { month: "long" })} · ${dObj.getFullYear()}` : "";
  const fParts = (pareja.fecha || "").split("-"); // [yyyy, mm, dd]

  const secAnim: React.CSSProperties = animEstilo === "ninguna"
    ? {}
    : { animation: `${animEstilo === "alegre" ? "wedo-pop" : "wedo-fade"} ${animEstilo === "sutil" ? ".3s" : ".6s"} ${animEstilo === "alegre" ? "cubic-bezier(.34,1.56,.64,1)" : "ease"} both` };

  // section order/nav (couple toggles + saved order); galería fused into historia
  let orderedSecs = [...savedOrder, ...PUB_DEFAULT.filter((x) => !savedOrder.includes(x))]
    .filter((x, i, a) => PUB_DEFAULT.includes(x) && a.indexOf(x) === i)
    .filter((x) => !!secs[x] && (x !== "galeria" || galeriaFotos.length > 0));
  const histFused = orderedSecs.includes("historia");
  if (histFused) orderedSecs = orderedSecs.filter((x) => x !== "galeria");
  const firstSec = orderedSecs[0];
  const cvNextLabel = firstSec ? (firstSec === "historia" ? "Nuestra historia" : PUB_LABELS[firstSec]) : "";

  // countdown on the cover (when the section is enabled and the date is future)
  const cd = (secs.countdown && pareja.fecha) ? (() => {
    const diff = new Date(pareja.fecha + "T12:00:00").getTime() - Date.now();
    if (diff <= 0) return null;
    return { days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), mins: Math.floor((diff % 3600000) / 60000) };
  })() : null;

  function renderInline(text: string): React.ReactNode[] {
    return text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={i} style={{ fontWeight: 600, color: "var(--c-ink)" }}>{part.slice(2, -2)}</strong>;
      if (part.length > 2 && part.startsWith("_") && part.endsWith("_"))
        return <em key={i}>{part.slice(1, -1)}</em>;
      return <span key={i}>{part}</span>;
    });
  }
  function renderDresscode(text: string) {
    return text.split("\n").map((line, i) => {
      const t = line.trim();
      if (!t) return <div key={i} style={{ height: 5 }} />;
      if (t.startsWith("## ")) return <div key={i} style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "var(--c-muted)", margin: "8px 0 4px" }}>{renderInline(t.slice(3))}</div>;
      if (t.startsWith("* ")) return <div key={i} style={{ display: "flex", gap: 8, marginBottom: 3, justifyContent: "flex-start" }}><span style={{ color: "var(--c-accent)" }}>·</span><span>{renderInline(t.slice(2))}</span></div>;
      return <div key={i} style={{ marginBottom: 3 }}>{renderInline(t)}</div>;
    });
  }

  const f = fondos[selected];
  const inpStyle: React.CSSProperties = { width: "100%", padding: "11px 14px", border: "1px solid var(--c-line)", borderRadius: 10, fontSize: 14, fontFamily: "'Archivo', sans-serif", background: "#fff", color: "var(--c-ink)", outline: "none", boxSizing: "border-box" };

  const Countdown = () => cd ? (
    <div className="cd">
      <div className="u"><div className="n">{cd.days}</div><div className="l">días</div></div>
      <div className="u"><div className="n">{cd.hours}</div><div className="l">horas</div></div>
      <div className="u"><div className="n">{cd.mins}</div><div className="l">min</div></div>
    </div>
  ) : null;

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
        {galeriaFotos.length > 0 && <Carousel photos={galeriaFotos} />}
      </div>
    );
    if (id === "galeria") return (
      <div className="sec">
        <div className="sec-k">Galería</div>
        <h2 className="sec-h">Nuestros momentos</h2>
        <Carousel photos={galeriaFotos} />
      </div>
    );
    if (id === "regalos") return (
      <div className="sec">
        <div className="sec-k">Mesa de regalos</div>
        <h2 className="sec-h">Tu cariño es nuestro mejor regalo</h2>
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
      const cards: React.ReactNode[] = [];
      if (pareja.ceremonia) cards.push(
        <div className="info-card" key="cer">
          <div className="ic-k">Ceremonia</div>
          {pareja.hora && <div className="ic-v">{pareja.hora}</div>}
          <div className="ic-s">{pareja.ceremonia}</div>
          {pareja.ceremonia_maps && <a className="ic-map" href={pareja.ceremonia_maps} target="_blank" rel="noreferrer">Ver en Maps ↗</a>}
        </div>
      );
      if (pareja.recepcion) cards.push(
        <div className="info-card" key="rec">
          <div className="ic-k">Recepción</div>
          <div className="ic-s">{pareja.recepcion}</div>
          {pareja.recepcion_maps && <a className="ic-map" href={pareja.recepcion_maps} target="_blank" rel="noreferrer">Ver en Maps ↗</a>}
        </div>
      );
      if (pareja.hashtag) cards.push(
        <div className="info-card" key="ht"><div className="ic-k">Comparte tus fotos</div><div className="ic-s">{pareja.hashtag}</div></div>
      );
      if (secs.regalos) cards.push(
        <div className="info-card" key="reg"><div className="ic-k">Mesa de regalos</div><div className="ic-s">Aportes en quetzales, directo a su cuenta.</div></div>
      );

      const dressFotos: string[] = Array.isArray(pareja.dresscode_fotos) ? pareja.dresscode_fotos : [];
      const hasDress = !!(pareja.dresscode || pareja.dresscode_notas || dressFotos.length);
      const hasAny = cards.length > 0 || hasDress;

      return (
        <div className="sec">
          <div className="sec-k">Detalles del día</div>
          <h2 className="sec-h">El gran día</h2>
          {cards.length > 0 && <div className="info-grid">{cards}</div>}
          {hasDress && (
            <div className="dress">
              <div className="dress-k">Dress code</div>
              <h3 className="dress-h">{pareja.dresscode || "Código de vestimenta"}</h3>
              {pareja.dresscode_notas && <div className="dress-p">{renderDresscode(pareja.dresscode_notas)}</div>}
              {dressFotos.length > 0 && <div className="dress-photos">{dressFotos.slice(0, 6).map((u, i) => <img key={i} src={u} alt="" />)}</div>}
              <div className="dress-sw">
                <span className="sw-l">Paleta sugerida</span>
                <i style={{ background: "var(--c1)" }} /><i style={{ background: "var(--c2)" }} /><i style={{ background: "var(--c3)" }} /><i style={{ background: "var(--c4)" }} />
              </div>
            </div>
          )}
          {!hasAny && <p className="body">Pronto compartiremos los detalles del día.</p>}
        </div>
      );
    }
    if (id === "rsvp") return (
      <div className="sec">
        <div className="sec-k">Confirma tu asistencia</div>
        <h2 className="sec-h">¿Nos acompañas?</h2>
        {rsvpDone ? (
          <div className="rsvp-box">
            <div className="rsvp-ico">&amp;</div>
            <div style={{ fontFamily: "var(--c-font-tit)", fontSize: 26, color: "var(--c-accent)", marginBottom: 8 }}>{rsvpForm.asistencia === "si" ? "¡Nos vemos pronto!" : "Gracias por avisarnos"}</div>
            <div style={{ fontSize: 13.5, color: "var(--c-soft)", fontFamily: "'Archivo',sans-serif" }}>{rsvpForm.asistencia === "si" ? "Tu asistencia quedó confirmada. ¡Te esperamos con mucho amor!" : "Lamentamos que no puedas acompañarnos, gracias por responder."}</div>
          </div>
        ) : rsvpCodigoStep ? (
          <div className="rsvp-box" style={{ textAlign: "left" }}>
            <button onClick={() => { setRsvpSelected(null); setRsvpCodigoStep(false); }} style={{ background: "none", border: "none", color: "var(--c-muted)", cursor: "pointer", fontFamily: "'Archivo',sans-serif", fontSize: 12, marginBottom: 14, padding: 0 }}>← Volver</button>
            <div style={{ fontFamily: "var(--c-font-tit)", fontSize: 22, color: "var(--c-ink)", marginBottom: 4 }}>{rsvpSelected.nombre}</div>
            <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--c-muted)", marginBottom: 18 }}>Ingresa tu código de acceso</div>
            <input value={rsvpCodigoInput} onChange={(e) => { setRsvpCodigoInput(e.target.value.toUpperCase()); setRsvpCodigoError(false); }} onKeyDown={(e) => e.key === "Enter" && handleVerifyCodigo()} placeholder="Ej: ABC123" maxLength={8} style={{ ...inpStyle, textAlign: "center", letterSpacing: 3, fontFamily: "monospace", fontSize: 18, marginBottom: 8 }} />
            {rsvpCodigoError && <div style={{ fontSize: 12, color: "#b23a1c", textAlign: "center", marginBottom: 10 }}>Código incorrecto. Revisa tu invitación.</div>}
            <button onClick={handleVerifyCodigo} disabled={!rsvpCodigoInput.trim() || rsvpCodigoLoading} className="rbtn" style={{ opacity: !rsvpCodigoInput.trim() ? 0.5 : 1 }}>{rsvpCodigoLoading ? "Verificando..." : "Continuar"}</button>
          </div>
        ) : !rsvpSelected ? (
          <div className="rsvp-box">
            <div className="rsvp-ico">&amp;</div>
            <input value={rsvpQuery} onChange={(e) => setRsvpQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchRsvp()} placeholder="Escribe tu nombre…" />
            <button onClick={searchRsvp} className="rbtn">Buscar mi invitación</button>
            <div className="rsvp-note">Tu confirmación llega directo a {n1} &amp; {n2}.</div>
            {rsvpSearched && rsvpResults.length === 0 && <div style={{ textAlign: "center", color: "var(--c-muted)", fontSize: 13, padding: "12px 0 0" }}>No encontramos tu nombre. Intenta con otro término.</div>}
            {rsvpResults.length > 0 && <div style={{ marginTop: 14 }}>{rsvpResults.map((inv, i) => (
              <div key={i} onClick={() => { setRsvpSelected(inv); setRsvpCodigoInput(""); setRsvpCodigoError(false); if (pareja.rsvp_codigo_requerido && inv.tiene_codigo) { setRsvpCodigoStep(true); } else { setRsvpCodigoStep(false); setRsvpForm({ telefono: "", asistencia: "", acompanantes: "0", restricciones: "", mensaje: "" }); } }} style={{ background: "#fff", border: "1px solid var(--c-line)", borderRadius: 12, padding: "14px 18px", marginBottom: 8, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left" }}>
                <div>
                  <div style={{ fontFamily: "var(--c-font-tit)", fontSize: 19, color: "var(--c-ink)" }}>{inv.nombre}</div>
                  <div style={{ fontSize: 11, color: "var(--c-muted)" }}>{inv.asientos} {inv.asientos === 1 ? "lugar reservado" : "lugares reservados"}{inv.confirmado ? " · ✓ ya confirmaste" : ""}</div>
                </div>
                <div style={{ color: "var(--c-muted)" }}>→</div>
              </div>
            ))}</div>}
          </div>
        ) : (
          <div className="rsvp-box" style={{ textAlign: "left" }}>
            <button onClick={() => setRsvpSelected(null)} style={{ background: "none", border: "none", color: "var(--c-muted)", cursor: "pointer", fontFamily: "'Archivo',sans-serif", fontSize: 12, marginBottom: 14, padding: 0 }}>← Volver</button>
            <div style={{ fontFamily: "var(--c-font-tit)", fontSize: 23, color: "var(--c-ink)", marginBottom: 4 }}>{rsvpSelected.nombre}</div>
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
                <button onClick={handleRsvpSubmit} disabled={!rsvpForm.asistencia || rsvpSubmitting} className="rbtn" style={{ opacity: !rsvpForm.asistencia ? 0.5 : 1 }}>{rsvpSubmitting ? "Enviando..." : "Confirmar asistencia"}</button>
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
              <section className="isection on" data-sec="portada" style={secAnim}>
                <div className="cover" data-style={estiloPortada}>
                  <span className="cv-blob bk1" aria-hidden="true" />
                  <span className="cv-blob bk2" aria-hidden="true" />
                  <span className="cv-blob bk3" aria-hidden="true" />
                  <span className="cv-bot tl" aria-hidden="true"><svg viewBox="0 0 120 156"><path d={BOT_PATH} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                  <span className="cv-bot br" aria-hidden="true"><svg viewBox="0 0 120 156"><path d={BOT_PATH} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                  {petalos && (
                    <div className="petals" aria-hidden="true">
                      {PETAL_COLORS.map((col, i) => (
                        <span key={i} className="petal" style={{ left: `${PETAL_LEFT[i]}%`, background: col, animationDuration: `${PETAL_DUR[i]}s`, animationDelay: `${PETAL_DELAY[i]}s` }} />
                      ))}
                    </div>
                  )}
                  <div className="cv-frame" aria-hidden="true" />

                  <div className="cover-inner">
                    <div className="cv-kick"><span className="ln" />{frasePortada}<span className="ln" /></div>
                    <div className="big-date" aria-hidden="true"><span className="bd-d">{fParts[2] || ""}</span><span className="bd-dot">·</span><span className="bd-m">{fParts[1] || ""}</span><span className="bd-y">{fParts[0] || ""}</span></div>

                    {fotoHero && (
                      <div className="cover-photo-wrap">
                        <img className="cover-photo" src={fotoHero} alt="" />
                        <span className="cv-seal"><span className="mk">wedo<span className="dot">.</span></span></span>
                      </div>
                    )}

                    <div className="cover-text">
                      <div className="names"><span className="n1">{n1}</span><span className="amp">&amp;</span><span className="n2">{n2}</span></div>
                      <div className="cv-div" aria-hidden="true"><svg viewBox="0 0 160 16"><path d="M4 8C34 1 54 1 70 8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><path d="M90 8C106 15 126 15 156 8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><circle cx="80" cy="8" r="3.4" fill="var(--c-accent)" /></svg></div>
                      {dateLine && <div className="date">{dateLine}</div>}
                      {pareja.lugar && <div className="place">{pareja.lugar}</div>}
                      <Countdown />
                    </div>

                    {firstSec && (
                      <button className="cv-next" type="button" onClick={() => setActiveSection(firstSec)}>
                        <span>{cvNextLabel}</span>
                        <svg viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              </section>
            ) : (
              <section className="isection on" data-sec={activeSection} style={secAnim}>{renderSection(activeSection)}</section>
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
                    <div className="gracias" style={{ color: accent }}>“{pareja.mensaje_gracias || "Con todo nuestro amor, gracias por ser parte de este momento tan especial."}”</div>
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
