"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter, usePathname } from "next/navigation";

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pareja, setPareja] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUser(); }, []);

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data: p } = await supabase.from("parejas").select("nombre1, nombre2, slug").eq("user_id", user.id).single();
    if (!p) { router.push("/onboarding"); return; }
    setPareja(p);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: "#FAF8F5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, color: "#A89C90" }}>Cargando...</div>
    </div>
  );

  const isEditor = pathname?.startsWith("/editor");
  const editorTabs = [
    { path: "/editor", label: "Diseño" },
    { path: "/editor/info", label: "Información" },
    { path: "/editor/invitacion", label: "Invitación" },
    { path: "/editor/fondos", label: "Fondos" },
    { path: "/editor/secciones", label: "Secciones" },
  ];

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: "#FAF8F5", minHeight: "100vh" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(250,248,245,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(26,23,20,0.14)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 24px", gap: 12 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase" as const, color: "#1A1714", flexShrink: 0 }}>
            WE<em style={{ color: "#8C6D4F", fontStyle: "italic", letterSpacing: 0 }}>do</em>
          </div>
          <div style={{ display: "flex", gap: 3, background: "rgba(0,0,0,0.05)", padding: 3, borderRadius: 8 }}>
<a href="/dashboard" style={{ padding: "6px 18px", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" as const, border: "none", background: !isEditor ? "#fff" : "transparent", cursor: "pointer", borderRadius: 6, color: !isEditor ? "#1A1714" : "#A89C90", fontFamily: "'Jost', sans-serif", boxShadow: !isEditor ? "0 1px 3px rgba(0,0,0,0.08)" : "none", textDecoration: "none", display: "inline-block" }}>
  Dashboard
</a>
<a href="/editor" style={{ padding: "6px 18px", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" as const, border: "none", background: isEditor ? "#fff" : "transparent", cursor: "pointer", borderRadius: 6, color: isEditor ? "#1A1714" : "#A89C90", fontFamily: "'Jost', sans-serif", boxShadow: isEditor ? "0 1px 3px rgba(0,0,0,0.08)" : "none", textDecoration: "none", display: "inline-block" }}>
  Editor
</a>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <a href={`/boda/${pareja?.slug}`} target="_blank" style={{ padding: "6px 14px", fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, border: "1px solid #8C6D4F", background: "transparent", cursor: "pointer", borderRadius: 3, color: "#8C6D4F", fontFamily: "'Jost', sans-serif", textDecoration: "none" }}>
              Ver página
            </a>
            <button onClick={handleLogout} style={{ padding: "6px 14px", fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, border: "1px solid rgba(26,23,20,0.14)", background: "transparent", cursor: "pointer", borderRadius: 3, color: "#A89C90", fontFamily: "'Jost', sans-serif" }}>
              Salir
            </button>
          </div>
        </div>
        {isEditor && (
          <div style={{ display: "flex", gap: 2, padding: "0 24px 10px", overflowX: "auto" as const }}>
{editorTabs.map(t => (
  <a key={t.path} href={t.path} style={{ padding: "5px 14px", fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, border: "1px solid rgba(26,23,20,0.14)", background: pathname === t.path ? "#1A1714" : "transparent", cursor: "pointer", borderRadius: 3, color: pathname === t.path ? "#fff" : "#A89C90", fontFamily: "'Jost', sans-serif", whiteSpace: "nowrap" as const, textDecoration: "none", display: "inline-block" }}>
    {t.label}
  </a>
))}
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}