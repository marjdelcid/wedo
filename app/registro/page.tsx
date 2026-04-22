"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegistroPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegistro() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/onboarding");
    }
  }

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: "#FAF8F5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase" as const, color: "#1A1714" }}>
            WE<em style={{ color: "#8C6D4F", fontStyle: "italic", letterSpacing: 0 }}>do</em>
          </div>
          <div style={{ fontSize: 11, color: "#A89C90", letterSpacing: 1, marginTop: 6, textTransform: "uppercase" as const }}>Crea tu lista de regalos</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 32, position: "relative" as const, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #8C6D4F, #B8964A)" }} />
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: "#5A524A", display: "block", marginBottom: 6 }}>Tu nombre</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} type="text" placeholder="Marjorie" style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 13, fontFamily: "'Jost', sans-serif", background: "#FAF8F5", color: "#1A1714", outline: "none" }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: "#5A524A", display: "block", marginBottom: 6 }}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="tu@email.com" style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 13, fontFamily: "'Jost', sans-serif", background: "#FAF8F5", color: "#1A1714", outline: "none" }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: "#5A524A", display: "block", marginBottom: 6 }}>Contraseña</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 13, fontFamily: "'Jost', sans-serif", background: "#FAF8F5", color: "#1A1714", outline: "none" }} />
          </div>
          {error && <div style={{ fontSize: 12, color: "#C4562A", marginBottom: 16, textAlign: "center" as const }}>{error}</div>}
          <button onClick={handleRegistro} disabled={loading} style={{ width: "100%", padding: 13, background: loading ? "#A89C90" : "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>
            {loading ? "Creando cuenta..." : "Comenzar gratis"}
          </button>
          <div style={{ fontSize: 11, color: "#A89C90", textAlign: "center" as const, marginTop: 16, fontWeight: 300 }}>
            Solo 3.5% por contribución recibida · Sin costo fijo
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#A89C90" }}>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" style={{ color: "#8C6D4F", fontWeight: 500, textDecoration: "none" }}>Iniciar sesión</Link>
        </div>
      </div>
    </div>
  );
}