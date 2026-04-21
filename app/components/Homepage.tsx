"use client";
import { useState } from "react";

export default function Homepage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (email) { setSubmitted(true); }
  }

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: "#FAF8F5", minHeight: "100vh" }}>

      {/* NAV */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", background: "rgba(250,248,245,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(26,23,20,0.08)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase" as const, color: "#1A1714" }}>
          WE<em style={{ color: "#8C6D4F", fontStyle: "italic", letterSpacing: 0 }}>do</em>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ padding: "8px 20px", fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, border: "1px solid rgba(26,23,20,0.14)", background: "transparent", cursor: "pointer", borderRadius: 3, color: "#5A524A", fontFamily: "'Jost', sans-serif" }}>
            Iniciar sesión
          </button>
          <button style={{ padding: "8px 20px", fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, border: "none", background: "#8C6D4F", color: "#fff", cursor: "pointer", borderRadius: 3, fontFamily: "'Jost', sans-serif" }}>
            Crear mi lista
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ position: "relative", minHeight: "90vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1519741497674-611481863552?w=1400&q=80')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(26,23,20,0.35), rgba(26,23,20,0.65))" }} />
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 24px", maxWidth: 700 }}>
          <div style={{ fontSize: 10, letterSpacing: 5, textTransform: "uppercase" as const, color: "rgba(255,255,255,0.65)", marginBottom: 16, fontWeight: 500 }}>La lista de regalos para tu boda</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 64, fontWeight: 300, color: "#fff", lineHeight: 1.0, marginBottom: 16, letterSpacing: 0.5 }}>
            Regala momentos,<br /><em style={{ color: "#F0D8BC" }}>no cosas</em>
          </div>
          <div style={{ fontSize: 16, color: "rgba(255,255,255,0.72)", lineHeight: 1.75, marginBottom: 36, fontWeight: 300, maxWidth: 500, margin: "0 auto 36px" }}>
            Crea tu lista de regalos de boda en minutos. Tus invitados contribuyen en quetzales y tú recibes el dinero directo en tu cuenta bancaria guatemalteca.
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" as const }}>
            {!submitted ? (
              <>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" style={{ padding: "13px 18px", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 3, fontSize: 14, fontFamily: "'Jost', sans-serif", background: "rgba(255,255,255,0.12)", color: "#fff", backdropFilter: "blur(8px)", width: 240, outline: "none" }} />
                <button onClick={handleSubmit} style={{ padding: "13px 28px", background: "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
                  Comenzar gratis
                </button>
              </>
            ) : (
              <div style={{ background: "rgba(107,140,118,0.9)", backdropFilter: "blur(8px)", padding: "13px 28px", borderRadius: 3, fontSize: 13, color: "#fff", fontWeight: 500 }}>
                ✦ ¡Gracias! Te contactamos pronto.
              </div>
            )}
          </div>
          <div style={{ marginTop: 16, fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: 0.5 }}>Gratis para empezar · Solo 3.5% por contribución recibida</div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ padding: "80px 40px", textAlign: "center", background: "#fff" }}>
        <div style={{ fontSize: 9, letterSpacing: 4, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 10, fontWeight: 600 }}>Así funciona</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 300, color: "#1A1714", marginBottom: 12 }}>Simple como debe ser</div>
        <div style={{ width: 36, height: 1, background: "#8C6D4F", margin: "0 auto 48px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 32, maxWidth: 800, margin: "0 auto" }}>
          {[
            { num: "01", title: "Crea tu lista", desc: "Agrega los fondos que quieres — luna de miel, hogar, experiencias. Sube fotos y escribe tu historia." },
            { num: "02", title: "Comparte con tus invitados", desc: "Tu página personalizada con tu URL única. Los invitados la ven desde cualquier dispositivo." },
            { num: "03", title: "Recibe el dinero", desc: "Tus invitados contribuyen en quetzales con tarjeta. El dinero llega directo a tu banco guatemalteco." },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "left" as const }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, fontWeight: 300, color: "#EDE0D4", lineHeight: 1, marginBottom: 12 }}>{s.num}</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 400, color: "#1A1714", marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: "#5A524A", lineHeight: 1.75, fontWeight: 300 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ padding: "80px 40px", background: "#FAF8F5" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 9, letterSpacing: 4, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 10, fontWeight: 600 }}>Por qué Wedo</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 300, color: "#1A1714" }}>Hecho para Guatemala</div>
          <div style={{ width: 36, height: 1, background: "#8C6D4F", margin: "12px auto 0" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, maxWidth: 900, margin: "0 auto" }}>
          {[
            { icon: "🇬🇹", title: "Pagos en Quetzales", desc: "Integración con Recurrente — la pasarela de pagos líder en Guatemala. Acepta Visa y Mastercard locales." },
            { icon: "🏦", title: "A tu cuenta bancaria", desc: "Retira tus fondos a Banrural, BI, BAC, o cualquier banco guatemalteco en 2–3 días hábiles." },
            { icon: "✦", title: "Página personalizada", desc: "Diseña tu invitación con tus colores, fotos y tipografía. Una URL única para compartir con tus invitados." },
            { icon: "📊", title: "Dashboard en tiempo real", desc: "Ve quién contribuyó, cuánto llevas recaudado y gestiona tus fondos desde cualquier lugar." },
          ].map((f, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: "24px 20px" }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: "#1A1714", marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: "#5A524A", lineHeight: 1.75, fontWeight: 300 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PRICING */}
      <div style={{ padding: "80px 40px", background: "#fff", textAlign: "center" }}>
        <div style={{ fontSize: 9, letterSpacing: 4, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 10, fontWeight: 600 }}>Precio</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 300, color: "#1A1714", marginBottom: 12 }}>Transparente y justo</div>
        <div style={{ width: 36, height: 1, background: "#8C6D4F", margin: "0 auto 48px" }} />
        <div style={{ maxWidth: 400, margin: "0 auto", background: "#FAF8F5", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 32, position: "relative" as const, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #8C6D4F, #B8964A)" }} />
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 8 }}>Por contribución recibida</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 64, fontWeight: 300, color: "#1A1714", lineHeight: 1 }}>3.5<span style={{ fontSize: 32 }}>%</span></div>
          <div style={{ fontSize: 13, color: "#5A524A", marginTop: 8, marginBottom: 24, fontWeight: 300 }}>Sin costo fijo mensual. Solo pagas cuando recibes.</div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, textAlign: "left" as const, marginBottom: 28 }}>
            {["Página de invitación personalizada", "Fondos ilimitados", "Dashboard en tiempo real", "Transferencias a cualquier banco GT", "Soporte en español"].map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "#5A524A", fontWeight: 300 }}>
                <span style={{ color: "#8C6D4F", fontWeight: 600 }}>✦</span> {f}
              </div>
            ))}
          </div>
          <button style={{ width: "100%", padding: 14, background: "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
            Crear mi lista gratis
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ padding: "40px", background: "#1A1714", textAlign: "center" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase" as const, color: "#FAF8F5", marginBottom: 8 }}>
          WE<em style={{ color: "#8C6D4F", fontStyle: "italic", letterSpacing: 0 }}>do</em>
        </div>
        <div style={{ fontSize: 11, color: "rgba(250,248,245,0.35)", letterSpacing: 1, marginBottom: 16 }}>La lista de regalos para bodas en Guatemala</div>
        <div style={{ fontSize: 10, color: "rgba(250,248,245,0.2)", letterSpacing: 0.5 }}>© 2025 Wedo · Guatemala · hola@wedo.gt</div>
      </div>

    </div>
  );
}