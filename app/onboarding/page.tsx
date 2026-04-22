"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

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
    ceremonia: "",
    recepcion: "",
    hora: "",
    historia: "",
    dresscode: "",
  });

  function updateForm(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function generateSlug(n1: string, n2: string) {
    return `${n1}-y-${n2}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  async function handleFinish() {
    setLoading(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const slug = generateSlug(form.nombre1, form.nombre2);

    const { error } = await supabase.from("parejas").insert({
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

    if (error) {
      setError("Hubo un error. Intenta de nuevo.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 13, fontFamily: "'Jost', sans-serif", background: "#FAF8F5", color: "#1A1714", outline: "none", marginBottom: 14 };
  const labelStyle = { fontSize: 10, fontWeight: 600 as const, color: "#5A524A", display: "block" as const, marginBottom: 5, letterSpacing: 0.5 };

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: "#FAF8F5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 480 }}>

        {/* LOGO */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase" as const, color: "#1A1714" }}>
            WE<em style={{ color: "#8C6D4F", fontStyle: "italic", letterSpacing: 0 }}>do</em>
          </div>
          <div style={{ fontSize: 11, color: "#A89C90", letterSpacing: 1, marginTop: 6, textTransform: "uppercase" as const }}>
            {step === 1 ? "Cuéntanos de su boda" : step === 2 ? "Detalles del evento" : "Su historia"}
          </div>
        </div>

        {/* PROGRESS */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: 2, borderRadius: 1, background: s <= step ? "#8C6D4F" : "#EDE0D4", transition: "background 0.3s" }} />
          ))}
        </div>

        {/* CARD */}
        <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 32, position: "relative" as const, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #8C6D4F, #B8964A)" }} />

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 300, color: "#1A1714", marginBottom: 20 }}>Los novios</div>
              <div>
                <label style={labelStyle}>Nombre del novio / novia 1</label>
                <input value={form.nombre1} onChange={e => updateForm("nombre1", e.target.value)} placeholder="Andrea" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Nombre del novio / novia 2</label>
                <input value={form.nombre2} onChange={e => updateForm("nombre2", e.target.value)} placeholder="Diego" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Fecha de la boda</label>
                <input type="date" value={form.fecha} onChange={e => updateForm("fecha", e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Ciudad</label>
                <input value={form.lugar} onChange={e => updateForm("lugar", e.target.value)} placeholder="Guatemala City" style={inputStyle} />
              </div>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 300, color: "#1A1714", marginBottom: 20 }}>El gran día</div>
              <div>
                <label style={labelStyle}>Hora de la ceremonia</label>
                <input value={form.hora} onChange={e => updateForm("hora", e.target.value)} placeholder="6:00 PM" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Lugar de la ceremonia</label>
                <input value={form.ceremonia} onChange={e => updateForm("ceremonia", e.target.value)} placeholder="Catedral Metropolitana" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Lugar de la recepción</label>
                <input value={form.recepcion} onChange={e => updateForm("recepcion", e.target.value)} placeholder="Casa Santo Domingo, Antigua" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Dress code</label>
                <input value={form.dresscode} onChange={e => updateForm("dresscode", e.target.value)} placeholder="Formal · Tonos neutros" style={inputStyle} />
              </div>
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 300, color: "#1A1714", marginBottom: 20 }}>Su historia</div>
              <div>
                <label style={labelStyle}>Cuéntales a sus invitados cómo se conocieron</label>
                <textarea value={form.historia} onChange={e => updateForm("historia", e.target.value)} placeholder="Nos conocimos en Guatemala City en 2020..." style={{ ...inputStyle, minHeight: 120, resize: "vertical" as const, lineHeight: 1.6 }} />
              </div>
              {error && <div style={{ fontSize: 12, color: "#C4562A", marginBottom: 12, textAlign: "center" as const }}>{error}</div>}
            </>
          )}

          {/* BUTTONS */}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: 12, background: "transparent", color: "#5A524A", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
                Atrás
              </button>
            )}
            {step < 3 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={step === 1 && (!form.nombre1 || !form.nombre2)} style={{ flex: 1, padding: 12, background: "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
                Siguiente
              </button>
            ) : (
              <button onClick={handleFinish} disabled={loading} style={{ flex: 1, padding: 12, background: loading ? "#A89C90" : "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
                {loading ? "Creando tu página..." : "Crear mi página ✦"}
              </button>
            )}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "#A89C90" }}>
          Paso {step} de 3
        </div>
      </div>
    </div>
  );
}