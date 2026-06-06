"use client";
/* =====================================================================
   wedo. — Save the Date público y standalone (/std/[slug])
   Se envía ANTES de la invitación formal. Sin conexión con las demás
   áreas (sin nav, sin RSVP, sin regalos). 3 estilos elegibles en el
   Editor (a foto · b editorial · c letterpress). Countdown en vivo +
   "Agregar al calendario" (Google Calendar) con el primer evento de la
   agenda del día.
   ===================================================================== */
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import "../../std.css";

const pad = (n: number) => String(n).padStart(2, "0");
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// parse "4:00 PM" / "16:00" / "6 PM" → {h, m} 24h, or null
function parseHora(s: string): { h: number; m: number } | null {
  if (!s) return null;
  const t = s.trim().toLowerCase();
  const ampm = /(a\.?m\.?|p\.?m\.?)/.exec(t);
  const mm = /(\d{1,2})(?::(\d{2}))?/.exec(t);
  if (!mm) return null;
  let h = parseInt(mm[1], 10);
  const min = mm[2] ? parseInt(mm[2], 10) : 0;
  if (ampm) {
    const pm = ampm[1].startsWith("p");
    if (pm && h < 12) h += 12;
    if (!pm && h === 12) h = 0;
  }
  if (h > 23 || min > 59) return null;
  return { h, m: min };
}

export default function StdClient({ slug }: { slug: string }) {
  const [pareja, setPareja] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<number>(0);

  useEffect(() => { load(); }, [slug]);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  async function load() {
    const { data } = await supabase.from("parejas").select("*").eq("slug", slug).single();
    setPareja(data || null);
    setLoading(false);
  }

  if (loading) return (
    <div style={{ fontFamily: "'Archivo', sans-serif", background: "#ECE6D9", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: 26, color: "rgba(41,40,0,.5)" }}>Cargando<span style={{ color: "#8B263E" }}>.</span></div>
    </div>
  );
  if (!pareja) return (
    <div style={{ fontFamily: "'Archivo', sans-serif", background: "#ECE6D9", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <div>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: 34, color: "#292800", marginBottom: 8 }}>Página no encontrada</div>
        <a href="/" style={{ fontSize: 12, color: "#8B263E", textDecoration: "none", fontWeight: 700 }}>Volver al inicio</a>
      </div>
    </div>
  );

  const estilo = (pareja.std_estilo || "c").toLowerCase();
  const n1 = pareja.nombre1 || "", n2 = pareja.nombre2 || "";
  const ciudad = pareja.lugar || "";
  const i1 = (n1.trim()[0] || "A").toUpperCase();
  const i2 = (n2.trim()[0] || "M").toUpperCase();

  // date pieces
  const fParts = (pareja.fecha || "").split("-"); // [yyyy, mm, dd]
  const yyyy = fParts[0] || "", mm = fParts[1] || "", dd = fParts[2] || "";
  const monthAbbr = mm ? (MESES[parseInt(mm, 10) - 1] || "") : "";
  const dObj = pareja.fecha ? new Date(pareja.fecha + "T12:00:00") : null;
  const dateLineA = dObj ? `${dd} · ${mm} · ${yyyy}` : "";

  // wedding datetime = fecha + primer evento de la agenda (o mediodía)
  const agenda = Array.isArray(pareja.agenda) ? pareja.agenda.filter((r: any) => r && (r.hora || r.evento)) : [];
  const firstHora = agenda.length ? parseHora(agenda[0].hora || "") : null;
  const weddingDate = pareja.fecha
    ? new Date(`${pareja.fecha}T${firstHora ? pad(firstHora.h) + ":" + pad(firstHora.m) : "12:00"}:00`)
    : null;

  // live countdown
  const cd = (() => {
    if (!weddingDate) return { d: 0, h: 0, m: 0 };
    let diff = Math.max(0, weddingDate.getTime() - (now || Date.now()));
    const d = Math.floor(diff / 86400000); diff -= d * 86400000;
    const h = Math.floor(diff / 3600000); diff -= h * 3600000;
    const m = Math.floor(diff / 60000);
    return { d, h, m };
  })();

  function addToCalendar() {
    if (!weddingDate) return;
    const start = weddingDate;
    const end = new Date(start.getTime() + 5 * 3600000);
    const fmt = (dt: Date) => dt.getUTCFullYear() + pad(dt.getUTCMonth() + 1) + pad(dt.getUTCDate()) + "T" + pad(dt.getUTCHours()) + pad(dt.getUTCMinutes()) + "00Z";
    const p = new URLSearchParams({
      action: "TEMPLATE",
      text: `Boda de ${n1} & ${n2}`,
      dates: `${fmt(start)}/${fmt(end)}`,
      details: "¡Reserva la fecha! Save the date — wedo.",
      location: ciudad,
    });
    window.open("https://calendar.google.com/calendar/render?" + p.toString(), "_blank", "noopener");
  }

  const Mark = () => <span className="mk">wedo<span className="dot">.</span></span>;

  // ---- A · foto a sangre ----
  if (estilo === "a") return (
    <div className="wedo-std">
      <div className="stda">
        {pareja.foto_hero && <img className="photo" src={pareja.foto_hero} alt="" />}
        <div className="scrim" />
        <span className="petal" style={{ width: 46, height: 46, background: "#E84B8A", top: "18%", right: "16%", animationDelay: ".2s" }} />
        <span className="petal" style={{ width: 30, height: 30, background: "#B3C24A", top: "27%", right: "32%", borderRadius: "50% 50% 50% 0", animationDelay: "1.6s" }} />
        <span className="petal" style={{ width: 24, height: 24, background: "#87A6E8", top: "14%", right: "36%", borderRadius: "50%", animationDelay: "2.8s" }} />
        <div className="content">
          <div className="top"><Mark /><span className="badge">Save the date</span></div>
          <div className="body">
            <div className="kick">Reserva la fecha</div>
            <div className="names">{n1} &amp; {n2}</div>
            <div className="rule" />
            {dateLineA && <div className="date">{dateLineA}</div>}
            {ciudad && <div className="place">{ciudad}</div>}
            <div className="cd">
              <div className="u"><div className="n">{cd.d}</div><div className="l">días</div></div>
              <div className="u"><div className="n">{cd.h}</div><div className="l">horas</div></div>
              <div className="u"><div className="n">{pad(cd.m)}</div><div className="l">min</div></div>
            </div>
            <div className="acts">
              <button className="cta cta-cal" onClick={addToCalendar}>＋ Agregar al calendario</button>
              <span className="note">La invitación completa llega pronto</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ---- B · bloques editoriales ----
  if (estilo === "b") return (
    <div className="wedo-std">
      <div className="stdb">
        <span className="blob b1" /><span className="blob b2" /><span className="blob b3" />
        <div className="frame" />
        <div className="inner">
          <div className="toprow"><Mark /><span className="yr">{yyyy}</span></div>
          <div className="save">
            <div className="kick">Reserva la fecha</div>
            <div className="l1">Save the</div>
            <div className="l2">date<span className="uline" /></div>
            <div className="names">{n1} &amp; {n2}</div>
            <div className="when">
              {dd && <span className="d">{dd}</span>}
              {monthAbbr && <span className="mo">{monthAbbr}</span>}
              {yyyy && <span className="d">{yyyy}</span>}
            </div>
            {ciudad && <div className="place">{ciudad}</div>}
            <div className="cd">
              <div className="u pk"><span className="n">{cd.d}</span><span className="l">días</span></div>
              <div className="u pe"><span className="n">{cd.h}</span><span className="l">hrs</span></div>
              <div className="u li"><span className="n">{pad(cd.m)}</span><span className="l">min</span></div>
            </div>
            <div className="acts">
              <button className="cta cta-cal" onClick={addToCalendar}>＋ Agregar al calendario</button>
              <span className="note">La invitación completa llega pronto</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ---- C · editorial monograma (letterpress) ----
  return (
    <div className="wedo-std">
      <div className="stdc">
        <div className="inner">
          <div className="z-top">
            <div className="tobe">TO BE</div>
            <div className="mono-row">
              <div className="dcol"><span>{dd || "—"}</span><span>{mm || "—"}</span></div>
              <div className="mono">{i1}<span className="amp">&amp;</span>{i2}</div>
              <div className="dcol"><span>{yyyy ? yyyy.slice(0, 2) : "20"}</span><span>{yyyy ? yyyy.slice(2) : "26"}</span></div>
            </div>
            <div className="wed">WED</div>
          </div>
          <div className="z-mid">
            <div className="meta">
              {ciudad && <div className="city">{ciudad}</div>}
              <div className="formal">Formal invitation to follow</div>
            </div>
          </div>
          <div className="z-bot">
            <div className="cd-c">
              <div className="u"><span className="n">{cd.d}</span><span className="l">días</span></div>
              <span className="sep" />
              <div className="u"><span className="n">{cd.h}</span><span className="l">horas</span></div>
              <span className="sep" />
              <div className="u"><span className="n">{pad(cd.m)}</span><span className="l">min</span></div>
            </div>
            <button className="cta-link" onClick={addToCalendar}><span>＋ Agregar al calendario</span></button>
          </div>
          <div className="foot"><Mark /></div>
        </div>
      </div>
    </div>
  );
}
