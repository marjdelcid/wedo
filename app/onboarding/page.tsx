"use client";
/* =====================================================================
   wedo. — app/onboarding/page.tsx
   Host onboarding wizard multi-evento, wired a Supabase.
   Paso 0: selección de tipo de evento.
   Pasos 1..n: se renderizan dinámicamente desde EVENT_TYPES
   (app/lib/eventTypes.ts). Agregar un tipo nuevo NO requiere
   tocar este archivo.
   Brand: wedo. — app-ui.css (.wedo-app) + onboarding.css + onboarding-tipos.css
   ===================================================================== */
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { featureEnabled } from "../lib/featureFlags";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  EVENT_TYPES,
  getEventType,
  COLUMNAS_PAREJAS,
  type EventType,
  type Campo,
} from "../lib/eventTypes";
import { generarDisenoIA, DisenoIAError, type DisenoIA } from "../lib/disenoIA";
import DisenoIAPreview from "../components/DisenoIAPreview";
import "../app-ui.css";
import "../onboarding.css";
import "../onboarding-tipos.css";

export default function OnboardingPage() {
  const router = useRouter();

  // tipo === null → estamos en el selector de tipo de evento (paso 0)
  const [tipo, setTipo] = useState<EventType | null>(null);
  // índice del paso dentro de tipo.pasos (0-based). El paso "listo" es pasos.length
  const [paso, setPaso] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});

  // diseñador IA (campos con disenoIA: true, ej. "tema")
  const [ia, setIa] = useState<{
    loading: boolean;
    error: string;
    diseno: DisenoIA | null;
    usado: boolean;
    restantes: number | null;
  }>({ loading: false, error: "", diseno: null, usado: false, restantes: null });
  const [iaEnabled, setIaEnabled] = useState(true);
  useEffect(() => { featureEnabled("diseno_ia").then(setIaEnabled); }, []);

  const totalPasos = tipo ? tipo.pasos.length : 0;
  const done = tipo !== null && paso >= totalPasos;
  const pasoActual = tipo && !done ? tipo.pasos[paso] : null;

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function elegirTipo(t: EventType) {
    setTipo(t);
    setPaso(0);
    setForm({});
    setError("");
    setIa({ loading: false, error: "", diseno: null, usado: false, restantes: null });
  }

  async function generarIA(campoKey: string, nocache = false) {
    if (!tipo || ia.loading) return;
    const tema = (form[campoKey] || "").trim();
    if (!tema) return;
    setIa((s) => ({ ...s, loading: true, error: "" }));
    try {
      const d = await generarDisenoIA({ tema, tipoEvento: tipo.id, nocache });
      setIa({ loading: false, error: "", diseno: d, usado: false, restantes: d.restantes ?? null });
    } catch (e: any) {
      setIa((s) => ({
        ...s,
        loading: false,
        error: e?.message || "No pudimos generar el diseño. Intenta de nuevo.",
        restantes: e instanceof DisenoIAError && typeof e.restantes === "number" ? e.restantes : s.restantes,
      }));
    }
  }

  function puedeAvanzar(): boolean {
    if (!pasoActual) return false;
    return pasoActual.campos
      .filter((c) => c.requerido)
      .every((c) => !!(form[c.key] || "").trim());
  }

  /** Garantiza slug único agregando -2, -3… si ya existe */
  async function slugUnico(base: string): Promise<string> {
    const limpio = base || "mi-evento";
    const { data } = await supabase
      .from("parejas")
      .select("slug")
      .like("slug", `${limpio}%`);
    const usados = new Set((data || []).map((r: any) => r.slug));
    if (!usados.has(limpio)) return limpio;
    let n = 2;
    while (usados.has(`${limpio}-${n}`)) n++;
    return `${limpio}-${n}`;
  }

  async function handleCreate() {
    if (loading || !tipo) return;
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Separar campos: columnas de `parejas` vs detalles_evento (jsonb)
    const columnas: Record<string, any> = {};
    const detalles: Record<string, string> = {};
    for (const p of tipo.pasos) {
      for (const c of p.campos) {
        const v = (form[c.key] || "").trim();
        if (!v) continue;
        if (c.detalle || !COLUMNAS_PAREJAS.has(c.key)) detalles[c.key] = v;
        else columnas[c.key] = v;
      }
    }

    const slug = await slugUnico(tipo.slugBase(form));

    const { error: insertErr } = await supabase.from("parejas").insert({
      user_id: user.id,
      slug,
      tipo_evento: tipo.id,
      detalles_evento: detalles,
      frase_portada: tipo.frasePortada,
      nombre1: columnas.nombre1 || "",
      nombre2: columnas.nombre2 || null,
      fecha: columnas.fecha || null,
      lugar: columnas.lugar || "",
      hora: columnas.hora || "",
      ceremonia: columnas.ceremonia || "",
      recepcion: columnas.recepcion || "",
      dresscode: columnas.dresscode || "",
      historia: columnas.historia || "",
      // diseño generado con IA (si el usuario eligió "Usar este diseño")
      ...(ia.usado && ia.diseno
        ? {
            paleta: "personalizado",
            paleta_colores: ia.diseno.colores,
            color_acento: ia.diseno.colores[0],
            tipografia: ia.diseno.tipografia,
            tipografia_titulos: ia.diseno.tipografia_titulos,
            foto_hero: ia.diseno.foto_hero || null,
            frase_portada: ia.diseno.frase_portada,
          }
        : {}),
    });

    if (insertErr) {
      setError("Hubo un error al crear tu página. Intenta de nuevo.");
      setLoading(false);
    } else {
      setLoading(false);
      setPaso(totalPasos); // pantalla de éxito
    }
  }

  function siguiente() {
    if (paso === totalPasos - 1) handleCreate();
    else setPaso(paso + 1);
  }
  function atras() {
    if (paso === 0) { setTipo(null); setForm({}); }
    else setPaso(paso - 1);
  }

  const kicker = !tipo
    ? "¿Qué vamos a celebrar?"
    : done
    ? "¡Bienvenidos!"
    : tipo.pasos[paso].kicker;

  const esUltimo = tipo !== null && paso === totalPasos - 1;

  function renderCampo(c: Campo) {
    const label = (
      <label>
        {c.label}
        {c.opcional && <span className="opt"> · opcional</span>}
      </label>
    );
    if (c.tipo === "textarea") {
      return (
        <div className="field" key={c.key}>
          {label}
          <textarea
            className="inp"
            placeholder={c.placeholder}
            value={form[c.key] || ""}
            onChange={(e) => updateForm(c.key, e.target.value)}
          />
        </div>
      );
    }
    return (
      <div className="field" key={c.key}>
        {label}
        <input
          className="inp"
          type={c.tipo === "date" ? "date" : "text"}
          placeholder={c.placeholder}
          value={form[c.key] || ""}
          onChange={(e) => updateForm(c.key, e.target.value)}
        />
        {c.disenoIA && renderDisenoIA(c)}
      </div>
    );
  }

  /** Bloque "✨ Generar diseño" bajo los campos con disenoIA (ej. tema) */
  function renderDisenoIA(c: Campo) {
    if (!iaEnabled) return null;
    const tema = (form[c.key] || "").trim();
    const agotado = ia.restantes === 0;
    return (
      <div style={{ marginTop: 8 }}>
        {tema && !ia.diseno && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => generarIA(c.key)} disabled={ia.loading || agotado}>
            {ia.loading ? <><span className="ob-ia-spin" aria-hidden="true" /> Diseñando…</> : "✨ Generar diseño"}
          </button>
        )}
        {ia.error && (
          <p style={{ fontFamily: "'Archivo',sans-serif", fontSize: 12.5, color: "var(--coral)", margin: "8px 0 0" }}>
            {ia.error}{" "}
            {!agotado && (
              <button type="button" className="ob-skip" onClick={() => generarIA(c.key)} disabled={ia.loading}>Reintentar</button>
            )}
          </p>
        )}
        {ia.diseno && (
          <DisenoIAPreview diseno={ia.diseno}>
            <button
              type="button"
              className={"btn btn-sm " + (ia.usado ? "btn-ghost" : "btn-pink")}
              onClick={() => setIa((s) => ({ ...s, usado: !s.usado }))}
            >
              {ia.usado ? "✓ Se usará este diseño" : "Usar este diseño"}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => generarIA(c.key, true)}
              disabled={ia.loading || agotado}
              title={agotado ? "Ya usaste tus 3 diseños con IA" : undefined}
            >
              {ia.loading ? <><span className="ob-ia-spin" aria-hidden="true" /> Diseñando…</> : "Regenerar"}
            </button>
            {ia.restantes != null && (
              <span style={{ fontFamily: "'Archivo',sans-serif", fontSize: 11.5, color: "var(--ink-faint)" }}>
                {agotado ? "Sin generaciones disponibles" : `${ia.restantes} ${ia.restantes === 1 ? "generación disponible" : "generaciones disponibles"}`}
              </span>
            )}
            {ia.usado && (
              <span style={{ flexBasis: "100%", fontFamily: "'Archivo',sans-serif", fontSize: 11.5, color: "var(--ink-faint)" }}>
                Puedes ajustar colores, tipografía y foto cuando quieras en Diseño.
              </span>
            )}
          </DisenoIAPreview>
        )}
      </div>
    );
  }

  /** Agrupa campos: los `medio` consecutivos se emparejan en .ob-grid2 */
  function renderCampos(campos: Campo[]) {
    const out: React.ReactNode[] = [];
    let i = 0;
    while (i < campos.length) {
      const c = campos[i];
      if (c.medio && campos[i + 1]?.medio) {
        out.push(
          <div className="ob-grid2" key={`g-${c.key}`}>
            {renderCampo(c)}
            {renderCampo(campos[i + 1])}
          </div>
        );
        i += 2;
      } else {
        out.push(renderCampo(c));
        i += 1;
      }
    }
    return out;
  }

  return (
    <div className="wedo-app">
      <div className="ob" data-screen-label="Onboarding">
        <span className="ob-blob b1" aria-hidden="true" />
        <span className="ob-blob b2" aria-hidden="true" />
        <span className="ob-blob b3" aria-hidden="true" />

        <div className="ob-inner">
          <div className="ob-head">
            <span className="ob-logo">wedo<span className="dot">.</span></span>
            <div className="ob-kicker">{kicker}</div>
            {tipo && !done && (
              <div className="ob-prog">
                {tipo.pasos.map((_, i) => (
                  <i key={i} className={i < paso ? "done" : i === paso ? "active" : ""} />
                ))}
              </div>
            )}
          </div>

          <div className="ob-card">

            {/* PASO 0 · Tipo de evento */}
            {!tipo && (
              <section className="ob-step on">
                <h2 className="ob-title">¿Qué evento quieres crear?</h2>
                <p className="ob-sub">
                  Elige el tipo de celebración y armamos tu página con lo que necesitas:
                  invitación, confirmaciones y mesa de regalos.
                </p>

                <div className="ob-tipos">
                  {EVENT_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="ob-tipo-card"
                      onClick={() => elegirTipo(t)}
                    >
                      <span className="ob-tipo-emoji" aria-hidden="true">{t.emoji}</span>
                      <span className="ob-tipo-txt">
                        <b>{t.label}</b>
                        <span>{t.desc}</span>
                      </span>
                      <span className="ob-tipo-arrow" aria-hidden="true">→</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* PASOS DINÁMICOS según tipo de evento */}
            {tipo && pasoActual && (
              <section className="ob-step on">
                <h2 className="ob-title">{pasoActual.titulo}</h2>
                <p className="ob-sub">{pasoActual.sub}</p>

                {renderCampos(pasoActual.campos)}

                {pasoActual.omitible && !esUltimo && (
                  <button className="ob-skip" type="button" onClick={() => setPaso(paso + 1)}>
                    Omitir por ahora →
                  </button>
                )}
                {pasoActual.omitible && esUltimo && (
                  <button className="ob-skip" type="button" onClick={handleCreate} disabled={loading}>
                    Omitir por ahora →
                  </button>
                )}

                {error && (
                  <p className="ob-sub" style={{ color: "var(--coral)", margin: "0 0 8px", textAlign: "center" }}>
                    {error}
                  </p>
                )}

                <div className="ob-foot">
                  <button className="btn btn-ghost" onClick={atras} disabled={loading}>
                    Atrás
                  </button>
                  <button
                    className="btn btn-pink grow2"
                    onClick={siguiente}
                    disabled={loading || !puedeAvanzar()}
                  >
                    {esUltimo ? (loading ? "Creando…" : "Crear mi página") : "Siguiente"}
                  </button>
                </div>
              </section>
            )}

            {/* LISTO */}
            {done && tipo && (
              <section className="ob-step on">
                <div className="ob-done">
                  <div className="seal">{tipo.emoji}</div>
                  <h2 className="ob-title" style={{ textAlign: "center" }}>¡Tu página está lista!</h2>
                  <p>
                    Ya puedes personalizar la portada, armar tu mesa de regalos en quetzales
                    y enviar las invitaciones de tu {tipo.label.toLowerCase()}.
                  </p>
                  <div className="ob-foot single">
                    <Link className="btn btn-pink" href="/editor">Ir al editor</Link>
                  </div>
                </div>
              </section>
            )}

          </div>

          {tipo && !done && (
            <div className="ob-count">Paso {paso + 1} de {totalPasos}</div>
          )}
        </div>
      </div>
    </div>
  );
}
