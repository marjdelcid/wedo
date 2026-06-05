"use client";
/* =====================================================================
   wedo. — app/onboarding/page.tsx
   Host onboarding wizard (4 steps incl. success), wired to Supabase.
   Brand: wedo. — see app-ui.css (.wedo-app) + onboarding.css.
   ===================================================================== */
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "../app-ui.css";
import "../onboarding.css";

const KICKERS = [
  "Cuéntanos de su boda",
  "Detalles del evento",
  "Su historia",
  "¡Bienvenidos!",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre1: "",
    nombre2: "",
    fecha: "",
    lugar: "",
    hora: "",
    ceremonia: "",
    recepcion: "",
    dresscode: "",
    historia: "",
  });

  function updateForm(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function generateSlug(n1: string, n2: string) {
    return `${n1}-y-${n2}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  async function handleCreate() {
    if (loading) return;
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const slug = generateSlug(form.nombre1, form.nombre2);

    const { error: insertErr } = await supabase.from("parejas").insert({
      user_id: user.id,
      nombre1: form.nombre1,
      nombre2: form.nombre2,
      fecha: form.fecha || null,
      lugar: form.lugar,
      slug,
      historia: form.historia,
      dresscode: form.dresscode,
      ceremonia: form.ceremonia,
      recepcion: form.recepcion,
      hora: form.hora,
    });

    if (insertErr) {
      setError("Hubo un error al crear tu página. Intenta de nuevo.");
      setLoading(false);
    } else {
      setLoading(false);
      setStep(4);
    }
  }

  const canAdvance1 = !!form.nombre1.trim() && !!form.nombre2.trim();

  return (
    <div className="wedo-app">
      <div className="ob" data-screen-label="Onboarding">
        <span className="ob-blob b1" aria-hidden="true" />
        <span className="ob-blob b2" aria-hidden="true" />
        <span className="ob-blob b3" aria-hidden="true" />

        <div className="ob-inner">
          <div className="ob-head">
            <span className="ob-logo">wedo<span className="dot">.</span></span>
            <div className="ob-kicker">{KICKERS[step - 1]}</div>
            <div className="ob-prog">
              {[0, 1, 2].map(i => (
                <i
                  key={i}
                  className={
                    i < step - 1
                      ? "done"
                      : i === step - 1 && step <= 3
                      ? "active"
                      : ""
                  }
                />
              ))}
            </div>
          </div>

          <div className="ob-card">

            {/* STEP 1 · Los novios */}
            {step === 1 && (
              <section className="ob-step on">
                <h2 className="ob-title">Los novios</h2>
                <p className="ob-sub">Lo esencial para empezar su página. Podrán editar todo después.</p>

                <div className="ob-grid2">
                  <div className="field">
                    <label>Nombre 1</label>
                    <input className="inp" type="text" placeholder="Andrea" value={form.nombre1} onChange={e => updateForm("nombre1", e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Nombre 2</label>
                    <input className="inp" type="text" placeholder="Diego" value={form.nombre2} onChange={e => updateForm("nombre2", e.target.value)} />
                  </div>
                </div>
                <div className="ob-grid2">
                  <div className="field">
                    <label>Fecha de la boda</label>
                    <input className="inp" type="date" value={form.fecha} onChange={e => updateForm("fecha", e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Ciudad</label>
                    <input className="inp" type="text" placeholder="Guatemala City" value={form.lugar} onChange={e => updateForm("lugar", e.target.value)} />
                  </div>
                </div>

                <div className="ob-foot single">
                  <button className="btn btn-pink" onClick={() => setStep(2)} disabled={!canAdvance1}>Siguiente</button>
                </div>
              </section>
            )}

            {/* STEP 2 · El gran día */}
            {step === 2 && (
              <section className="ob-step on">
                <h2 className="ob-title">El gran día</h2>
                <p className="ob-sub">Los detalles que verán sus invitados en la invitación.</p>

                <div className="ob-grid2">
                  <div className="field">
                    <label>Hora de la ceremonia</label>
                    <input className="inp" type="text" placeholder="6:00 PM" value={form.hora} onChange={e => updateForm("hora", e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Lugar de la ceremonia</label>
                    <input className="inp" type="text" placeholder="Catedral Metropolitana" value={form.ceremonia} onChange={e => updateForm("ceremonia", e.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <label>Lugar de la recepción</label>
                  <input className="inp" type="text" placeholder="Casa Santo Domingo, Antigua" value={form.recepcion} onChange={e => updateForm("recepcion", e.target.value)} />
                </div>
                <div className="field">
                  <label>Dress code <span className="opt">· opcional</span></label>
                  <input className="inp" type="text" placeholder="Formal de jardín · tonos suaves" value={form.dresscode} onChange={e => updateForm("dresscode", e.target.value)} />
                  <button className="ob-skip" type="button" onClick={() => setStep(3)}>Omitir por ahora →</button>
                </div>

                <div className="ob-foot">
                  <button className="btn btn-ghost" onClick={() => setStep(1)}>Atrás</button>
                  <button className="btn btn-pink grow2" onClick={() => setStep(3)}>Siguiente</button>
                </div>
              </section>
            )}

            {/* STEP 3 · Su historia */}
            {step === 3 && (
              <section className="ob-step on">
                <h2 className="ob-title">Su historia</h2>
                <p className="ob-sub">Cuéntenles a sus invitados cómo se conocieron. Es opcional —pueden agregarla luego.</p>

                <div className="field">
                  <label>Su historia <span className="opt">· opcional</span></label>
                  <textarea className="inp" placeholder="Nos conocimos en Antigua hace seis años…" value={form.historia} onChange={e => updateForm("historia", e.target.value)} />
                  <button className="ob-skip" type="button" onClick={handleCreate} disabled={loading}>Omitir por ahora →</button>
                </div>

                {error && (
                  <p className="ob-sub" style={{ color: "var(--coral)", margin: "0 0 8px", textAlign: "center" }}>{error}</p>
                )}

                <div className="ob-foot">
                  <button className="btn btn-ghost" onClick={() => setStep(2)} disabled={loading}>Atrás</button>
                  <button className="btn btn-pink grow2" onClick={handleCreate} disabled={loading}>
                    {loading ? "Creando…" : "Crear mi página"}
                  </button>
                </div>
              </section>
            )}

            {/* DONE */}
            {step === 4 && (
              <section className="ob-step on">
                <div className="ob-done">
                  <div className="seal">&amp;</div>
                  <h2 className="ob-title" style={{ textAlign: "center" }}>¡Su página está lista!</h2>
                  <p>Ya pueden personalizar la portada, armar su mesa de regalos en quetzales y enviar las invitaciones.</p>
                  <div className="ob-foot single">
                    <Link className="btn btn-pink" href="/editor">Ir al editor</Link>
                  </div>
                </div>
              </section>
            )}

          </div>

          {step <= 3 && (
            <div className="ob-count">Paso {step} de 3</div>
          )}
        </div>
      </div>
    </div>
  );
}
