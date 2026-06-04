"use client";
/* =====================================================================
   wedo. — app/components/Acceso.tsx
   Combined access screen: login + signup (segmented toggle), wired to
   Supabase auth. Used by /login (view=login) and /registro (view=signup).
   ===================================================================== */
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "../app-ui.css";
import "../auth.css";

const GoogleMark = () => (
  <svg className="gmark" viewBox="0 0 18 18" aria-hidden="true">
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
    <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33z" />
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
  </svg>
);

export default function Acceso({ initialView = "login" }: { initialView?: "login" | "signup" }) {
  const router = useRouter();
  const [view, setView] = useState<"login" | "signup">(initialView);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [terms, setTerms] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  function clearMsg() { setErr(""); setOk(""); }
  function go(v: "login" | "signup") { setView(v); clearMsg(); }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    clearMsg();
    if (!email || !password) { setErr("Escribe tu correo y contraseña."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setErr("Correo o contraseña incorrectos."); setLoading(false); }
    else router.push("/dashboard");
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    clearMsg();
    if (!nombre.trim()) { setErr("Escribe tu nombre completo."); return; }
    if (!email) { setErr("Escribe tu correo electrónico."); return; }
    if (password.length < 8) { setErr("La contraseña debe tener al menos 8 caracteres."); return; }
    if (!terms) { setErr("Acepta los Términos y el Aviso de privacidad para continuar."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { nombre } } });
    if (error) { setErr(error.message); setLoading(false); }
    else router.push("/onboarding");
  }

  async function handleForgot() {
    clearMsg();
    if (!email) { setErr("Escribe tu correo arriba y te enviamos el enlace para restablecerla."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
    });
    if (error) setErr("No pudimos enviar el correo. Revisa la dirección e intenta de nuevo.");
    else setOk("Listo. Te enviamos un enlace para restablecer tu contraseña.");
  }

  async function handleGoogle() {
    clearMsg();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined },
    });
    if (error) setErr("El acceso con Google no está disponible por ahora. Usa tu correo.");
  }

  // password strength (signup)
  const score = (() => {
    const v = password; let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Za-z]/.test(v) && /\d/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    if (v.length >= 12) s++;
    return Math.min(s, 4);
  })();
  const pwColors = ["#EE5A28", "#EE5A28", "#B3C24A", "#7d8a2e"];
  const pwLabels = ["Muy corta", "Mejorando…", "Buena contraseña", "Contraseña fuerte"];
  const pwActiveColor = pwColors[Math.max(score - 1, 0)];

  return (
    <div className="wedo-app">
      <div className="auth">
        {/* LEFT · editorial art */}
        <aside className="auth-art">
          <div className="art-bg" aria-hidden="true" />
          <span className="art-petal pk" aria-hidden="true" />
          <span className="art-petal pe" aria-hidden="true" />
          <span className="art-petal li" aria-hidden="true" />
          <span className="art-petal co" aria-hidden="true" />

          <div className="art-top">
            <Link className="logo" href="/">wedo<span className="dot">.</span></Link>
            <Link className="art-back" href="/">← Volver al inicio</Link>
          </div>

          <div className="art-body">
            <h2 className="art-h">Que empiece<br /><span className="it">con un sí</span><span className="dot">.</span></h2>
            <p className="art-sub">Invitaciones, RSVP y regalos en efectivo — en quetzales, directo a tu cuenta.</p>
            <div className="art-proof">
              <div><div className="pv">+1,200</div></div>
              <span className="pdiv" />
              <div className="pl">Parejas ya celebran<br />su boda con wedo.</div>
            </div>
          </div>
        </aside>

        {/* RIGHT · form */}
        <main className="auth-form">
          <div className="form-inner">
            <div className="form-logo"><Link className="logo" href="/">wedo<span className="dot">.</span></Link></div>

            <div className="seg" role="tablist">
              <button type="button" className={view === "login" ? "on" : ""} role="tab" onClick={() => go("login")}>Ingresar</button>
              <button type="button" className={view === "signup" ? "on" : ""} role="tab" onClick={() => go("signup")}>Crear cuenta</button>
            </div>

            {/* LOGIN */}
            <section className={"view" + (view === "login" ? " on" : "")}>
              <div className="form-head">
                <h1>Hola de <span className="it">nuevo</span></h1>
                <p>Entra para seguir armando tu celebración.</p>
              </div>

              {view === "login" && err && <div className="auth-msg err">{err}</div>}
              {view === "login" && ok && <div className="auth-msg ok">{ok}</div>}

              <form onSubmit={handleLogin}>
                <div className="field">
                  <label htmlFor="l-email">Correo electrónico</label>
                  <input id="l-email" className="inp" type="email" placeholder="tu@correo.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="field">
                  <div className="field-h">
                    <label htmlFor="l-pass">Contraseña</label>
                    <button type="button" className="forgot" onClick={handleForgot}>¿Olvidaste tu contraseña?</button>
                  </div>
                  <div className="pwrap">
                    <input id="l-pass" className="inp" type={showPw ? "text" : "password"} placeholder="••••••••" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" className="peek" onClick={() => setShowPw((s) => !s)}>{showPw ? "Ocultar" : "Ver"}</button>
                  </div>
                </div>
                <button type="submit" className="btn btn-pink btn-block" style={{ marginTop: 6 }} disabled={loading}>{loading ? "Ingresando…" : "Ingresar"}</button>
              </form>

              <div className="divider">o</div>
              <button className="btn-oauth" type="button" onClick={handleGoogle}><GoogleMark />Continuar con Google</button>
              <div className="switch-foot">¿Aún no tienes cuenta? <a onClick={() => go("signup")}>Créala gratis</a></div>
            </section>

            {/* SIGNUP */}
            <section className={"view" + (view === "signup" ? " on" : "")}>
              <div className="form-head">
                <h1>Crea tu <span className="it">evento</span></h1>
                <p>Tu boda, lista para invitar y recibir regalos.</p>
              </div>

              <div className="signup-note"><span className="bdot" /><span>Crear tu evento es <b>gratis</b>.</span></div>

              {view === "signup" && err && <div className="auth-msg err">{err}</div>}
              {view === "signup" && ok && <div className="auth-msg ok">{ok}</div>}

              <form onSubmit={handleSignup}>
                <div className="field">
                  <label htmlFor="s-name">Nombre completo</label>
                  <input id="s-name" className="inp" type="text" placeholder="María González" autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="s-email">Correo electrónico</label>
                  <input id="s-email" className="inp" type="email" placeholder="tu@correo.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="field" style={{ marginBottom: 6 }}>
                  <label htmlFor="s-pass">Contraseña</label>
                  <div className="pwrap">
                    <input id="s-pass" className="inp" type={showPw ? "text" : "password"} placeholder="Mínimo 8 caracteres" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" className="peek" onClick={() => setShowPw((s) => !s)}>{showPw ? "Ocultar" : "Ver"}</button>
                  </div>
                  <div className="pw-meter">
                    {[0, 1, 2, 3].map((i) => <i key={i} style={{ background: i < score ? pwActiveColor : "rgba(35,23,18,.1)" }} />)}
                  </div>
                  <div className="pw-hint">{password ? pwLabels[Math.max(score - 1, 0)] : "Usa 8+ caracteres con letras y números."}</div>
                </div>

                <label className="terms">
                  <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
                  <span>Acepto los <a href="#">Términos</a> y el <a href="#">Aviso de privacidad</a> de wedo.</span>
                </label>

                <button type="submit" className="btn btn-pink btn-block" disabled={loading}>{loading ? "Creando…" : "Crear mi cuenta"}</button>
              </form>

              <div className="divider">o</div>
              <button className="btn-oauth" type="button" onClick={handleGoogle}><GoogleMark />Continuar con Google</button>
              <div className="switch-foot">¿Ya tienes cuenta? <a onClick={() => go("login")}>Ingresa</a></div>
            </section>

            <div className="form-legal">Protegido con cifrado. Tus datos y los de tus invitados están seguros.</div>
          </div>
        </main>
      </div>
    </div>
  );
}
