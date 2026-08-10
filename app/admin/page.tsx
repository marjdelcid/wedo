"use client";
/* =====================================================================
   wedo. — app/admin/page.tsx · Super admin
   Vista global de la plataforma: métricas, todos los eventos con su
   actividad, últimos aportes, y encendido/apagado de funcionalidades
   de pago (feature flags). Solo usuarios en la tabla `admins`; el resto
   se redirige al dashboard.
   ===================================================================== */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { getEventType } from "../lib/eventTypes";
import "../app-ui.css";

const fmtQ = (n: number) => "Q " + (n || 0).toLocaleString("en-US");
const fmtFecha = (s?: string | null) =>
  s ? new Date(s.includes("T") ? s : s + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" }) : "—";

interface AdminData {
  stats: { eventos: number; eventosMes: number; recaudado: number; comision: number; aportes: number; disenosIA: number };
  eventos: any[];
  actividad: any[];
  flags: { key: string; nombre: string; descripcion: string | null; enabled: boolean }[];
}

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState("");
  const [savingFlag, setSavingFlag] = useState<string | null>(null);
  // landing propia del admin: "cargando" | "login" | "noAdmin" | "panel"
  const [estado, setEstado] = useState<"cargando" | "login" | "noAdmin" | "panel">("cargando");
  const [emailSesion, setEmailSesion] = useState("");

  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, []);

  async function authHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  }

  /** La sesión puede tardar unos ms en persistirse tras el callback de OAuth. */
  async function esperarSesion() {
    for (let i = 0; i < 8; i++) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) return session;
      await new Promise((r) => setTimeout(r, 500));
    }
    return null;
  }

  async function cargar() {
    setEstado("cargando");
    const session = await esperarSesion();
    if (!session) { setEstado("login"); return; }
    setEmailSesion(session.user?.email || "");
    // reintento por si el API tropieza justo tras el login
    for (let intento = 0; intento < 2; intento++) {
      const res = await fetch("/api/admin", { headers: await authHeaders() }).catch(() => null);
      if (res?.status === 401) { setEstado("login"); return; }
      if (res?.status === 403) { setEstado("noAdmin"); return; }
      if (res?.ok) { setData(await res.json()); setEstado("panel"); return; }
      await new Promise((r) => setTimeout(r, 800));
    }
    setError("No pudimos cargar el panel. Recarga la página.");
  }

  /** Login de Google que regresa DIRECTO a /admin (sin pasar por dashboard/onboarding) */
  async function entrarConGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/admin` : undefined,
        queryParams: { prompt: "select_account" }, // siempre muestra el selector de cuentas
      },
    });
  }

  async function cambiarCuenta() {
    await supabase.auth.signOut();
    setData(null);
    setEstado("login");
  }

  async function toggleFlag(key: string, enabled: boolean) {
    if (!data || savingFlag) return;
    setSavingFlag(key);
    // optimista
    setData({ ...data, flags: data.flags.map((f) => (f.key === key ? { ...f, enabled } : f)) });
    const res = await fetch("/api/admin/flags", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ key, enabled }),
    });
    if (!res.ok) {
      // revertir si falló
      setData((d) => (d ? { ...d, flags: d.flags.map((f) => (f.key === key ? { ...f, enabled: !enabled } : f)) } : d));
      setError("No pudimos guardar el cambio. Intenta de nuevo.");
    }
    setSavingFlag(null);
  }

  const centrado: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 };
  const cardLanding: React.CSSProperties = { background: "#FFFDF8", border: "1px solid var(--line)", borderRadius: 22, padding: "38px 34px", maxWidth: 420, width: "100%", textAlign: "center", boxShadow: "0 30px 70px -28px rgba(58,46,40,.3)" };

  // LANDING DE ADMIN — sesión no iniciada
  if (estado === "login")
    return (
      <div className="wedo-app" style={centrado}>
        <div style={cardLanding}>
          <div className="logo" style={{ fontSize: 40 }}>wedo<span className="dot">.</span></div>
          <div className="kick" style={{ justifyContent: "center", display: "inline-flex", margin: "14px 0 6px" }}><span className="bdot" />Panel de administración</div>
          <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "0 0 22px" }}>Acceso solo para administradores de wedo.</p>
          <button className="btn btn-pink" style={{ width: "100%" }} onClick={entrarConGoogle}>Entrar con Google</button>
          <p style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 14 }}>Usa la cuenta de administrador (desarrollo@…)</p>
        </div>
      </div>
    );

  // sesión iniciada pero SIN permisos de admin
  if (estado === "noAdmin")
    return (
      <div className="wedo-app" style={centrado}>
        <div style={cardLanding}>
          <div className="logo" style={{ fontSize: 40 }}>wedo<span className="dot">.</span></div>
          <h2 className="serif" style={{ fontSize: 26, margin: "16px 0 6px" }}>Esta cuenta no es admin</h2>
          <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "0 0 4px" }}>Entraste como <strong>{emailSesion || "otra cuenta"}</strong>.</p>
          <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "0 0 22px" }}>El panel es solo para la cuenta de administrador.</p>
          <button className="btn btn-pink" style={{ width: "100%", marginBottom: 10 }} onClick={cambiarCuenta}>Cambiar de cuenta</button>
          <Link className="btn btn-ghost" style={{ width: "100%" }} href="/dashboard">Ir a mi dashboard</Link>
        </div>
      </div>
    );

  if (error && !data)
    return (
      <div className="wedo-app" style={centrado}>
        <div style={{ textAlign: "center" }}>
          <div className="serif it" style={{ fontSize: 24, marginBottom: 10 }}>{error}</div>
          <button className="btn btn-ghost btn-sm" onClick={() => { setError(""); cargar(); }}>Reintentar</button>
        </div>
      </div>
    );

  if (!data)
    return (
      <div className="wedo-app" style={centrado}>
        <div className="serif it" style={{ fontSize: 26, color: "var(--ink-faint)" }}>
          Cargando<span style={{ color: "var(--pink)" }}>.</span>
        </div>
      </div>
    );

  const { stats, eventos, actividad, flags } = data;
  const th: React.CSSProperties = { textAlign: "left", fontFamily: "'Archivo',sans-serif", fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-faint)", padding: "10px 12px", borderBottom: "1px solid var(--line)" };
  const td: React.CSSProperties = { padding: "12px", borderBottom: "1px solid var(--line-2)", fontSize: 13.5, color: "var(--ink)", verticalAlign: "top" };

  return (
    <div className="wedo-app">
      <header className="topbar">
        <div className="wrap topbar-in">
          <Link className="logo" href="/">wedo<span className="dot">.</span></Link>
          <span className="kick"><span className="bdot" />Super admin</span>
          <div className="topbar-r">
            <Link className="btn btn-ghost btn-sm" href="/dashboard">Mi dashboard</Link>
          </div>
        </div>
      </header>

      <main className="wrap" style={{ paddingTop: 34, paddingBottom: 120 }}>
        <h1 className="greet" style={{ marginBottom: 6 }}>Todo wedo<span style={{ color: "var(--pink)" }}>.</span></h1>
        <p className="greet-sub" style={{ marginBottom: 26 }}>Lo que está pasando en la plataforma, en vivo.</p>

        {/* MÉTRICAS GLOBALES */}
        <section className="stats" style={{ marginBottom: 26 }}>
          <div className="stat s1">
            <span className="lab"><span className="d" />Recaudado</span>
            <div className="val">{fmtQ(stats.recaudado)}</div>
            <div className="delta">{stats.aportes} aportes · comisión wedo. {fmtQ(stats.comision)}</div>
          </div>
          <div className="stat s2">
            <span className="lab"><span className="d" />Eventos</span>
            <div className="val">{stats.eventos}</div>
            <div className="delta">{stats.eventosMes} creados en los últimos 30 días</div>
          </div>
          <div className="stat s3">
            <span className="lab"><span className="d" />Diseños IA</span>
            <div className="val">{stats.disenosIA}</div>
            <div className="delta">generaciones usadas (costo por uso)</div>
          </div>
          <div className="stat s4">
            <span className="lab"><span className="d" />Funciones</span>
            <div className="val">{flags.filter((f) => f.enabled).length}/{flags.length}</div>
            <div className="delta">funcionalidades encendidas</div>
          </div>
        </section>

        {/* FEATURE FLAGS */}
        <section className="panel" style={{ marginBottom: 26 }}>
          <div style={{ padding: "18px 22px 6px" }}>
            <span className="kick"><span className="bdot" />Funcionalidades de pago</span>
          </div>
          {flags.map((f) => (
            <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px", borderTop: "1px solid var(--line-2)" }}>
              <button
                className={"switch" + (f.enabled ? "" : " off")}
                onClick={() => toggleFlag(f.key, !f.enabled)}
                disabled={savingFlag === f.key}
                title={f.enabled ? "Apagar" : "Encender"}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>{f.nombre} {f.enabled ? "" : <span style={{ color: "var(--ink-faint)", fontWeight: 400 }}>· apagada</span>}</div>
                {f.descripcion && <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>{f.descripcion}</div>}
              </div>
            </div>
          ))}
          {error && <div style={{ padding: "0 22px 14px", color: "var(--coral)", fontSize: 12.5 }}>{error}</div>}
        </section>

        {/* EVENTOS */}
        <section className="panel" style={{ marginBottom: 26, overflowX: "auto" }}>
          <div style={{ padding: "18px 22px 10px" }}>
            <span className="kick"><span className="bdot" />Eventos ({eventos.length})</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
            <thead>
              <tr>
                <th style={th}>Evento</th>
                <th style={th}>Tipo</th>
                <th style={th}>Dueño</th>
                <th style={th}>Fecha evento</th>
                <th style={th}>Recaudado</th>
                <th style={th}>Aportes</th>
                <th style={th}>RSVP</th>
                <th style={th}>IA</th>
                <th style={th}>Creado</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((e) => (
                <tr key={e.id}>
                  <td style={td}>
                    <div style={{ fontWeight: 600 }}>{e.nombre2 ? `${e.nombre1} & ${e.nombre2}` : e.nombre1 || "—"}</div>
                    <a href={`/boda/${e.slug}`} target="_blank" rel="noreferrer" style={{ fontSize: 11.5, color: "var(--pink)", fontFamily: "'Archivo',sans-serif" }}>/boda/{e.slug} ↗</a>
                  </td>
                  <td style={td}>{getEventType(e.tipo_evento).emoji} {getEventType(e.tipo_evento).label}</td>
                  <td style={{ ...td, fontSize: 12.5, color: "var(--ink-soft)" }}>{e.email || "—"}</td>
                  <td style={td}>{fmtFecha(e.fecha)}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{fmtQ(e.recaudado)}</td>
                  <td style={td}>{e.aportes}</td>
                  <td style={td}>{e.confirmados}/{e.invitados}</td>
                  <td style={td}>{e.disenos_ia_usados}/3</td>
                  <td style={{ ...td, fontSize: 12.5, color: "var(--ink-faint)" }}>{fmtFecha(e.created_at)}</td>
                </tr>
              ))}
              {eventos.length === 0 && (
                <tr><td style={{ ...td, color: "var(--ink-faint)" }} colSpan={9}>Aún no hay eventos.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        {/* ACTIVIDAD RECIENTE */}
        <section className="panel">
          <div style={{ padding: "18px 22px 6px" }}>
            <span className="kick"><span className="bdot" />Últimos aportes</span>
          </div>
          {actividad.length === 0 && <div style={{ padding: "10px 22px 18px", color: "var(--ink-faint)", fontSize: 13 }}>Aún no hay aportes.</div>}
          {actividad.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, padding: "12px 22px", borderTop: "1px solid var(--line-2)", flexWrap: "wrap" }}>
              <div style={{ fontSize: 13.5 }}>
                <strong>{a.nombre_invitado}</strong> aportó a <span style={{ color: "var(--ink-soft)" }}>{a.evento}</span>
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
                <span className="serif" style={{ fontSize: 18 }}>{fmtQ(a.monto)}</span>
                <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{fmtFecha(a.created_at)}</span>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
