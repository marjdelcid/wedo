"use client";
/* =====================================================================
   wedo. — app/restablecer/page.tsx
   Destino del enlace de "¿Olvidaste tu contraseña?". El enlace del correo
   inicia sesión de recuperación (detectSessionInUrl) y aquí el usuario
   define su contraseña nueva (supabase.auth.updateUser).
   ===================================================================== */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import "../app-ui.css";
import "../onboarding.css";

export default function RestablecerPage() {
  const router = useRouter();
  const [listo, setListo] = useState(false);      // sesión de recuperación detectada
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ver, setVer] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // la sesión del enlace puede tardar unos ms en persistirse
    let intentos = 0;
    const t = setInterval(async () => {
      intentos++;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) { setListo(true); clearInterval(t); }
      else if (intentos >= 8) { clearInterval(t); }
    }, 500);
    return () => clearInterval(t);
  }, []);

  async function guardar() {
    setErr("");
    if (password.length < 8) { setErr("La contraseña debe tener al menos 8 caracteres."); return; }
    if (password !== confirm) { setErr("Las contraseñas no coinciden."); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) setErr("No pudimos guardar la contraseña. Abre el enlace del correo de nuevo e intenta otra vez.");
    else setOk(true);
  }

  return (
    <div className="wedo-app">
      <div className="ob">
        <span className="ob-blob b1" aria-hidden="true" />
        <span className="ob-blob b2" aria-hidden="true" />
        <div className="ob-inner">
          <div className="ob-head">
            <span className="ob-logo">wedo<span className="dot">.</span></span>
            <div className="ob-kicker">Restablecer contraseña</div>
          </div>
          <div className="ob-card">
            {ok ? (
              <div className="ob-done">
                <div className="seal">✓</div>
                <h2 className="ob-title" style={{ textAlign: "center" }}>Contraseña actualizada</h2>
                <p>Ya puedes usar tu contraseña nueva para entrar.</p>
                <div className="ob-foot single">
                  <button className="btn btn-pink" onClick={() => router.push("/dashboard")}>Continuar</button>
                </div>
              </div>
            ) : listo ? (
              <>
                <h2 className="ob-title">Crea tu contraseña nueva</h2>
                <p className="ob-sub">Mínimo 8 caracteres.</p>
                <div className="field">
                  <label>Contraseña nueva</label>
                  <div style={{ position: "relative" }}>
                    <input className="inp" type={ver ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ paddingRight: 56 }} />
                    <button type="button" onClick={() => setVer(!ver)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontFamily: "'Archivo',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "var(--ink-faint)" }}>{ver ? "OCULTAR" : "VER"}</button>
                  </div>
                </div>
                <div className="field">
                  <label>Confírmala</label>
                  <input className="inp" type={ver ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && guardar()} />
                </div>
                {err && <p className="ob-sub" style={{ color: "var(--coral)", margin: "0 0 10px" }}>{err}</p>}
                <div className="ob-foot single">
                  <button className="btn btn-pink" onClick={guardar} disabled={saving}>{saving ? "Guardando…" : "Guardar contraseña"}</button>
                </div>
              </>
            ) : (
              <>
                <h2 className="ob-title">Enlace no válido</h2>
                <p className="ob-sub">
                  Este enlace expiró o ya se usó. Pide uno nuevo desde{" "}
                  <Link href="/login" style={{ color: "var(--pink)", fontWeight: 600 }}>iniciar sesión</Link>{" "}
                  con “¿Olvidaste tu contraseña?”.
                </p>
                <p className="ob-sub" style={{ margin: 0 }}>
                  ¿Entraste con Google? Entonces no necesitas contraseña: usa el botón <strong>Continuar con Google</strong>.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
