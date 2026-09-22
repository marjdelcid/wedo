"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getEventType } from "../lib/eventTypes";
import { elegirPareja, setEventoActivoId } from "../lib/eventoActivo";
import "../app-ui.css";

const AVA_COLORS = [
  "var(--pink)",
  "var(--peri)",
  "var(--lime)",
  "var(--teal)",
  "var(--wine)",
  "var(--coral)",
];

function initials(name?: string, max = 2) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, max)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

function fmtInt(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

function fmtMoney2(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Big stat value: Q (small) + integer + .00 (small)
function Money({ n }: { n: number }) {
  return (
    <>
      <span className="q">Q</span> {fmtInt(n)}
      <span className="dec">.00</span>
    </>
  );
}

/** Los timestamps de Supabase vienen sin zona horaria pero SON UTC. */
function parseUTC(iso: string): Date {
  let s = iso.replace(" ", "T");
  if (!/([zZ]|[+-]\d{2}:?\d{2})$/.test(s)) s += "Z";
  return new Date(s);
}

function hace(iso?: string) {
  if (!iso) return "";
  const then = parseUTC(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const min = Math.floor(diff / 60000);
  if (min < 2) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ayer";
  if (d < 7) return `hace ${d} días`;
  return parseUTC(iso).toLocaleDateString("es-GT", {
    day: "numeric",
    month: "short",
  });
}

function fmtFecha(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("es-GT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Dashboard() {
  const router = useRouter();
  const [pareja, setPareja] = useState<any>(null);
  const [eventos, setEventos] = useState<any[]>([]);
  const [evtMenu, setEvtMenu] = useState(false);
  const [cargaError, setCargaError] = useState(false);
  const [fondos, setFondos] = useState<any[]>([]);
  const [contribuciones, setContribuciones] = useState<any[]>([]);
  const [invitados, setInvitados] = useState<any[]>([]);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [host, setHost] = useState("");
  const [copied, setCopied] = useState(false);
  const [esAdminUser, setEsAdminUser] = useState(false);
  const [rsvpFiltro, setRsvpFiltro] = useState<"todas" | "si" | "parcial" | "no" | "msj" | "pend">("todas");
  const [rsvpBusqueda, setRsvpBusqueda] = useState("");
  const [rsvpAbierto, setRsvpAbierto] = useState<string | null>(null);

  /** Chequeo ligero contra /api/admin/me (la tabla admins no es legible desde el
   *  cliente). Reintenta una vez: justo después del callback de OAuth la sesión
   *  puede tardar unos ms en persistirse y un solo intento daba falso negativo. */
  async function esAdminCliente(): Promise<boolean> {
    for (let intento = 0; intento < 2; intento++) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const res = await fetch("/api/admin/me", { headers: { Authorization: `Bearer ${session.access_token}` } });
          if (res.ok) {
            const j = await res.json().catch(() => ({}));
            return !!j.admin;
          }
        }
      } catch { /* reintenta */ }
      await new Promise((r) => setTimeout(r, 700));
    }
    return false;
  }

  useEffect(() => {
    setHost(window.location.host);
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // varios eventos por cuenta: sin .single() (con 2+ filas devolvía null
    // y expulsaba al onboarding); el activo se recuerda en localStorage
    const { data: parejasRows, error: parejasErr } = await supabase
      .from("parejas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    const admin = await esAdminCliente();
    setEsAdminUser(admin);

    if (parejasErr) { setCargaError(true); return; }
    const parejaData = elegirPareja(parejasRows || []);
    if (!parejaData) {
      // los admins sin evento propio van a su panel, no al onboarding
      router.push(admin ? "/admin" : "/onboarding");
      return;
    }
    setEventos(parejasRows || []);
    setPareja(parejaData);

    const { data: fondosData } = await supabase
      .from("fondos")
      .select("*")
      .eq("pareja_id", parejaData.id)
      .order("orden");
    setFondos(fondosData || []);

    if (fondosData && fondosData.length > 0) {
      const fondoIds = fondosData.map((f: any) => f.id);
      const { data: contribData } = await supabase
        .from("contribuciones")
        .select("*")
        .in("fondo_id", fondoIds)
        .neq("estado", "pendiente")
        .order("created_at", { ascending: false });
      setContribuciones(contribData || []);
    }

    const { data: invData } = await supabase
      .from("invitados")
      .select("*")
      .eq("pareja_id", parejaData.id);
    setInvitados(invData || []);

    const { data: rsvpData } = await supabase
      .from("rsvp")
      .select("*")
      .eq("pareja_id", parejaData.id)
      .order("created_at", { ascending: false });
    // una sola respuesta por invitación (la primera del grupo)
    const vistos = new Set<string>();
    const unicos = (rsvpData || []).slice().reverse().filter((r: any) => {
      if (!r.invitado_id) return true;
      if (vistos.has(r.invitado_id)) return false;
      vistos.add(r.invitado_id);
      return true;
    }).reverse();
    setRsvps(unicos);

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const slug = pareja?.slug || "";
  const inviteUrl =
    (host ? `https://${host}` : "") + (slug ? `/boda/${slug}` : "");

  function copyLink() {
    if (!slug) return;
    const url = inviteUrl || `${window.location.origin}/boda/${slug}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  // ---- derived data ----
  const totalRecaudado = fondos.reduce((s, f) => s + (f.recaudado || 0), 0);
  const disponible = totalRecaudado; // nada retirado aún → todo disponible
  // modelo actual: la comisión de servicio la paga el INVITADO al aportar;
  // la pareja recibe el 100% de sus regalos

  const rsvpSi = rsvps.filter((r) => r.asistencia === "si");
  const confirmados = rsvpSi.length;
  const pendientes = Math.max(0, invitados.length - rsvps.length);
  // personas (no invitaciones): usa la lista de asistentes si existe
  const personasPax = (r: any) => (Array.isArray(r.asistentes) && r.asistentes.length ? r.asistentes.length : (r.acompanantes || 0) + 1);
  const personasConfirmadas = rsvpSi.reduce((s, r) => s + personasPax(r), 0);
  const rsvpNo = rsvps.filter((r) => r.asistencia !== "si");
  const rsvpConMsj = rsvps.filter((r) => r.mensaje);
  const sinResponder = invitados
    .filter((i) => !rsvps.some((r) => r.invitado_id === i.id))
    .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"));
  const q = rsvpBusqueda.trim().toLowerCase();
  const matchRsvp = (r: any) =>
    !q ||
    (r.nombre || "").toLowerCase().includes(q) ||
    (Array.isArray(r.asistentes) && r.asistentes.some((n: string) => (n || "").toLowerCase().includes(q)));
  const matchInv = (i: any) =>
    !q ||
    (i.nombre || "").toLowerCase().includes(q) ||
    (Array.isArray(i.miembros) && i.miembros.some((m: any) => (m.nombre || "").toLowerCase().includes(q)));
  const sinResponderVisibles = sinResponder.filter(matchInv);
  // parciales: confirmaron sí, pero por menos personas que los asientos de su invitación
  const asientosDe = (r: any) => invitados.find((i) => i.id === r.invitado_id)?.asientos || 0;
  const esParcial = (r: any) => { const a = asientosDe(r); return a > 0 && personasPax(r) < a; };
  const rsvpParcial = rsvpSi.filter(esParcial);
  const lugaresLiberados = rsvpParcial.reduce((s, r) => s + (asientosDe(r) - personasPax(r)), 0);
  const rsvpsFiltradas = (rsvpFiltro === "si" ? rsvpSi : rsvpFiltro === "parcial" ? rsvpParcial : rsvpFiltro === "no" ? rsvpNo : rsvpFiltro === "msj" ? rsvpConMsj : rsvps).filter(matchRsvp);

  const aportes = contribuciones.length;
  const invitadosDistintos = new Set(
    contribuciones.map((c) => c.nombre_invitado || "Anónimo")
  ).size;

  const nombre1 = pareja?.nombre1 || "";
  const nombre2 = pareja?.nombre2 || "";
  const evtType = getEventType(pareja?.tipo_evento);
  const esBoda = evtType.id === "boda";
  // "Andrea & Diego" para bodas; solo el festejado cuando no hay nombre2
  const tituloEvento = nombre2 ? (
    <>
      {nombre1} <span className="it">&amp;</span> {nombre2}
    </>
  ) : (
    <>{nombre1}</>
  );
  const kickerEvento = esBoda ? "Tu boda" : `Tu ${evtType.label.toLowerCase()}`;
  const fechaTxt = fmtFecha(pareja?.fecha);
  const dias = pareja?.fecha
    ? Math.ceil((new Date(pareja.fecha).getTime() - Date.now()) / 86400000)
    : null;
  const greetSub =
    dias == null
      ? "Su celebración va tomando forma."
      : dias > 0
      ? `Faltan ${dias} días. Su celebración va tomando forma.`
      : dias === 0
      ? "¡Hoy es el gran día!"
      : "Su celebración ya pasó. ¡Felicidades!";

  const recentActivity = contribuciones.slice(0, 6);

  if (cargaError)
    return (
      <div className="wedo-app" style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="serif it" style={{ fontSize: 24, color: "var(--ink-soft)" }}>No pudimos cargar tu evento<span style={{ color: "var(--pink)" }}>.</span></div>
        <button className="btn btn-pink btn-sm" onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );

  if (loading)
    return (
      <div
        className="wedo-app"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div
          className="serif it"
          style={{ fontSize: 26, color: "var(--ink-faint)" }}
        >
          Cargando<span style={{ color: "var(--pink)" }}>.</span>
        </div>
      </div>
    );

  return (
    <div className="wedo-app">
      {/* TOPBAR */}
      <header className="topbar">
        <div className="wrap topbar-in">
          <Link className="logo" href="/">
            wedo<span className="dot">.</span>
          </Link>
          <div className="evt-wrap">
            <button className="evt-switch" type="button" title="Tu evento" onClick={() => setEvtMenu((v) => !v)}>
              <span className="tag">Evento</span>
              <span>
                {nombre2 ? `${nombre1} & ${nombre2}` : nombre1} · {evtType.label}
              </span>
              <span className="chev">▾</span>
            </button>
            {evtMenu && (
              <div className="evt-menu">
                {eventos.map((e) => (
                  <button key={e.id} type="button" className={e.id === pareja?.id ? "on" : ""}
                    onClick={() => { setEventoActivoId(e.id); window.location.reload(); }}>
                    {e.nombre2 ? `${e.nombre1} & ${e.nombre2}` : e.nombre1}
                    <span className="tipo">{getEventType(e.tipo_evento).label}</span>
                  </button>
                ))}
                <a className="nuevo" href="/onboarding">＋ Crear otro evento</a>
              </div>
            )}
          </div>
          <div className="topbar-r">
            {esAdminUser && (
              <Link className="btn btn-ghost btn-sm" href="/admin">
                Admin
              </Link>
            )}
            {slug && (
              <a
                className="btn btn-ghost btn-sm"
                href={`/boda/${slug}`}
                target="_blank"
                rel="noreferrer"
              >
                Ver invitación
              </a>
            )}
            <button
              className="avatar"
              onClick={handleLogout}
              title="Cerrar sesión"
            >
              {initials(nombre1, 1)}
            </button>
          </div>
        </div>
      </header>

      <main className="wrap" style={{ paddingTop: 38, paddingBottom: 120 }}>
        {/* GREETING */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
            marginBottom: 26,
          }}
        >
          <div>
            <span className="kick">
              <span className="bdot" />
              {fechaTxt ? `${kickerEvento} · ${fechaTxt}` : kickerEvento}
            </span>
            <h1 className="greet" style={{ marginTop: 12 }}>
              {tituloEvento}
              <span style={{ color: "var(--pink)" }}>.</span>
            </h1>
            <p className="greet-sub">{greetSub}</p>
          </div>
          <button
            className="btn btn-pink"
            type="button"
            onClick={copyLink}
            disabled={!slug}
          >
            {copied ? "¡Link copiado!" : "Compartir invitación"}
          </button>
        </div>

        {/* INVITATION PREVIEW */}
        <section className="preview-card">
          {pareja?.foto_hero ? (
            <img
              className="preview-photo"
              src={pareja.foto_hero}
              alt="Portada de la invitación"
            />
          ) : (
            <div className="preview-photo">
              Aún sin foto de portada — agrégala en el editor.
            </div>
          )}
          <div className="preview-info">
            <span className="kick">
              <span className="bdot" />
              Tu invitación
            </span>
            <div className="preview-title serif">
              {tituloEvento}
              <span style={{ color: "var(--pink)" }}>.</span>
            </div>
            <div className="preview-url" onClick={copyLink}>
              {(host || "wedo.gifts")}/boda/{slug}{" "}
              <span className="cp">· {copied ? "¡copiado!" : "copiar link"}</span>
            </div>
            <div className="preview-actions">
              {slug && (
                <a
                  className="btn btn-pink"
                  href={`/boda/${slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver invitación
                </a>
              )}
              <Link className="btn btn-ghost" href="/editor">
                Editar diseño
              </Link>
            </div>
          </div>
        </section>

        {/* STATS */}
        <div className="stats">
          <div className="stat s1">
            <span className="lab">
              <span className="d" />
              Recaudado
            </span>
            <div className="val">
              <Money n={totalRecaudado} />
            </div>
            <div className="delta">
              {aportes} {aportes === 1 ? "aporte" : "aportes"} en total
            </div>
          </div>
          <div className="stat s2">
            <span className="lab">
              <span className="d" />
              RSVP
            </span>
            <div className="val">{personasConfirmadas}</div>
            <div className="delta">
              personas confirmadas · {confirmados} {confirmados === 1 ? "invitación" : "invitaciones"} · {pendientes} pendientes{lugaresLiberados > 0 ? ` · ${lugaresLiberados} ${lugaresLiberados === 1 ? "lugar liberado" : "lugares liberados"}` : ""}
            </div>
          </div>
          <div className="stat s3">
            <span className="lab">
              <span className="d" />
              Aportes
            </span>
            <div className="val">{aportes}</div>
            <div className="delta">
              de {invitadosDistintos}{" "}
              {invitadosDistintos === 1 ? "invitado" : "invitados"} distintos
            </div>
          </div>
          <div className="stat s4">
            <span className="lab">
              <span className="d" />
              Disponible
            </span>
            <div className="val">
              <Money n={disponible} />
            </div>
            <div className="delta">listo para retirar</div>
          </div>
        </div>

        {/* RSVP CONFIRMADOS */}
        {(rsvps.length > 0 || invitados.length > 0) && (
          <section className="panel rsvp-sec">
            <div className="panel-h">
              <h3>
                Respuestas RSVP
                <span className="rsvp-count">{personasConfirmadas} personas</span>
              </h3>
              <Link
                href="/editor/invitados"
                style={{ fontSize: 13, color: "var(--ink-faint)", fontWeight: 600 }}
              >
                Ver todos · gestionar
              </Link>
            </div>
            <div style={{ padding: "0 22px" }}>
            <input
              value={rsvpBusqueda}
              onChange={(e) => setRsvpBusqueda(e.target.value)}
              placeholder="Buscar por nombre…"
              style={{ width: "100%", maxWidth: 340, border: "1.5px solid var(--line)", borderRadius: 100, padding: "9px 16px", fontFamily: "'Archivo',sans-serif", fontSize: 13.5, background: "#fffdf8", color: "var(--ink)", outline: "none", margin: "2px 0 12px" }}
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "2px 0 14px" }}>
              {([
                ["todas", `Todas · ${rsvps.length}`],
                ["si", `Asisten · ${confirmados}`],
                ["parcial", `Confirmaron menos · ${rsvpParcial.length}`],
                ["no", `No podrán · ${rsvpNo.length}`],
                ["msj", `Con mensaje · ${rsvpConMsj.length}`],
                ["pend", `Sin responder · ${sinResponder.length}`],
              ] as const).map(([k, label]) => (
                <button key={k} onClick={() => setRsvpFiltro(k)}
                  style={{
                    padding: "6px 13px", borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: "1px solid " + (rsvpFiltro === k ? "var(--ink)" : "var(--line)"),
                    background: rsvpFiltro === k ? "var(--ink)" : "#fffdf8",
                    color: rsvpFiltro === k ? "#fff" : "var(--ink-soft)",
                    fontFamily: "'Archivo',sans-serif",
                    whiteSpace: "nowrap",
                  }}>{label}</button>
              ))}
            </div>
            </div>
            <div className="rsvp-grid" style={rsvpFiltro === "msj" ? { gridTemplateColumns: "1fr", maxWidth: 640 } : undefined}>
              {rsvpFiltro === "pend" && sinResponderVisibles.map((inv, i) => (
                <div className="rsvp-item" key={inv.id}>
                  <div className="ava" style={{ background: "var(--peri)" }}>{initials(inv.nombre, 2)}</div>
                  <div className="txt">
                    <div className="nm">{inv.nombre}</div>
                    <div className="sub">{inv.asientos} {inv.asientos === 1 ? "asiento" : "asientos"}</div>
                  </div>
                  <span className="pax" style={{ background: "rgba(35,23,18,.07)", color: "var(--ink-faint)" }}>
                    <span className="bdot" style={{ background: "var(--peri)" }} />
                    Sin responder
                  </span>
                </div>
              ))}
              {rsvpFiltro === "pend" && sinResponderVisibles.length === 0 && (
                <p className="hint" style={{ margin: 0 }}>¡Todos han respondido! 🎉</p>
              )}
              {rsvpFiltro !== "pend" && rsvpsFiltradas.length === 0 && (
                <p className="hint" style={{ margin: 0 }}>Nada por aquí todavía.</p>
              )}
              {rsvpFiltro !== "pend" && rsvpsFiltradas.map((r, i) => {
                const si = r.asistencia === "si";
                const pax = personasPax(r);
                const asientosInv = asientosDe(r);
                const parcial = si && esParcial(r);
                // solo listamos nombres cuando hay grupo (2+); en solitario es redundante
                const quienes = pax > 1 && Array.isArray(r.asistentes) && r.asistentes.length > 1 ? r.asistentes.join(" · ") : null;
                const tieneMsj = !!(r.mensaje || r.restricciones);
                const abierto = rsvpFiltro === "msj" || rsvpAbierto === r.id;
                return (
                  <div className="rsvp-item" key={r.id || i} style={{ flexWrap: "wrap", cursor: tieneMsj ? "pointer" : "default" }}
                    onClick={() => tieneMsj && setRsvpAbierto(rsvpAbierto === r.id ? null : r.id)}>
                    <div
                      className="ava"
                      style={{ background: si ? AVA_COLORS[i % AVA_COLORS.length] : "var(--ink-faint)" }}
                    >
                      {initials(r.nombre, 2)}
                    </div>
                    <div className="txt">
                      <div className="nm">{r.nombre}{tieneMsj && <span style={{ marginLeft: 6, fontSize: 12 }}>💬</span>}</div>
                      <div className="sub">{si ? "Confirmó" : "No podrán ir"} {hace(r.created_at)}{si && quienes ? ` · ${quienes}` : ""}</div>
                    </div>
                    <span className="pax" style={!si ? { background: "rgba(35,23,18,.07)", color: "var(--ink-faint)" } : parcial ? { background: "rgba(238,90,40,.12)", color: "#93401D" } : undefined}>
                      <span className="bdot" style={!si || parcial ? { background: "var(--coral)" } : undefined} />
                      {si ? (parcial ? `${pax} de ${asientosInv}` : `${pax} ${pax === 1 ? "persona" : "personas"}`) : "No asistirán"}
                    </span>
                    {abierto && r.mensaje && (
                      <div style={{ width: "100%", paddingLeft: 46, marginTop: 2, fontStyle: "italic", fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-soft)" }}>
                        “{r.mensaje}”
                      </div>
                    )}
                    {abierto && r.restricciones && (
                      <div style={{ width: "100%", paddingLeft: 46, fontSize: 12, color: "var(--ink-faint)" }}>
                        Restricciones: {r.restricciones}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </section>
        )}
        {/* COLS */}
        <div className="cols">
          {/* LEFT: funds + withdraw */}
          <div>
            <div className="panel">
              <div className="panel-h">
                <h3>Tus regalos</h3>
                <Link className="btn btn-ghost btn-sm" href="/editor/fondos">
                  Editar regalos
                </Link>
              </div>
              <div className="panel-b">
                {fondos.length === 0 ? (
                  <div className="empty-note">
                    Aún no tienes regalos.{" "}
                    <Link href="/editor/fondos">Crear regalos →</Link>
                  </div>
                ) : (
                  fondos.map((f, i) => {
                    const meta = f.meta || 0;
                    const recaudado = f.recaudado || 0;
                    const pct =
                      meta > 0
                        ? Math.min(Math.round((recaudado / meta) * 100), 100)
                        : Math.min(Math.round((recaudado / 4000) * 100), 100);
                    const fundAportes = contribuciones.filter(
                      (c) => c.fondo_id === f.id
                    ).length;
                    return (
                      <div className={`fund f${(i % 3) + 1}`} key={f.id}>
                        <div className="fund-top">
                          <span className="fund-name">{f.nombre}</span>
                          <span className="fund-amt">
                            Q {fmtInt(recaudado)}{" "}
                            <span className="goal">
                              {meta > 0 ? `/ Q ${fmtInt(meta)}` : "/ meta libre"}
                            </span>
                          </span>
                        </div>
                        <div className="bar">
                          <span style={{ width: `${pct}%` }} />
                        </div>
                        <div className="fund-meta">
                          <span>
                            {meta > 0 ? `${pct}% de la meta` : "Sin meta fija"}
                          </span>
                          <span>
                            {fundAportes}{" "}
                            {fundAportes === 1 ? "aporte" : "aportes"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* WITHDRAW */}
            <div className="withdraw">
              <span className="kick">
                <span className="bdot" />
                Retirar a tu cuenta
              </span>
              <div style={{ marginTop: 14 }}>
                <div className="wd-row">
                  <span className="lbl">Recaudado en regalos</span>
                  <span className="big">Q {fmtMoney2(disponible)}</span>
                </div>
                <div className="wd-row tot">
                  <span>Recibes en tu cuenta</span>
                  <span className="big" style={{ color: "var(--ok)" }}>
                    Q {fmtMoney2(disponible)}
                  </span>
                </div>
              </div>
              <p className="wd-note">
                <span className="bdot" style={{ background: "var(--peri)" }} />
                Recibes el 100% de tus regalos: la comisión de servicio la cubre
                el invitado al aportar. Llega a tu cuenta bancaria en Guatemala
                en 2–3 días hábiles.
              </p>
              <a
                className="btn btn-pink"
                href="#"
                style={{ width: "100%" }}
                onClick={(e) => e.preventDefault()}
              >
                Retirar Q {fmtMoney2(disponible)}
              </a>
            </div>
          </div>

          {/* RIGHT: activity */}
          <div>
            <div className="panel">
              <div className="panel-h">
                <h3>Actividad reciente</h3>
              </div>
              <div className="panel-b">
                {recentActivity.length === 0 ? (
                  <div className="empty-note">
                    Todavía no hay aportes. Cuando tus invitados regalen,
                    aparecerán aquí.
                  </div>
                ) : (
                  recentActivity.map((c, i) => {
                    const fundName =
                      fondos.find((f) => f.id === c.fondo_id)?.nombre || "";
                    return (
                      <div className="act" key={c.id || i}>
                        <div
                          className="ava"
                          style={{
                            background: AVA_COLORS[i % AVA_COLORS.length],
                          }}
                        >
                          {initials(c.nombre_invitado, 1)}
                        </div>
                        <div>
                          <div className="who">
                            {c.nombre_invitado || "Anónimo"}
                          </div>
                          <div className="meta">
                            {fundName ? `${fundName} · ` : ""}
                            {hace(c.created_at)}
                          </div>
                          <span className="state-chip sc-ok">
                            <span className="d" />
                            Recibido
                          </span>
                        </div>
                        <div className="amt">Q {fmtMoney2(c.monto || 0)}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* PILL NAV */}
      <nav className="pillnav">
        <Link href="/editor">Editor</Link>
        <Link className="on" href="/dashboard">
          Dashboard<span className="d" />
        </Link>
      </nav>
    </div>
  );
}
