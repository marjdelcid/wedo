"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [pareja, setPareja] = useState<any>(null);
  const [fondos, setFondos] = useState<any[]>([]);
  const [contribuciones, setContribuciones] = useState<any[]>([]);
  const [invitados, setInvitados] = useState<any[]>([]);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferDone, setTransferDone] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: parejaData } = await supabase
      .from("parejas")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!parejaData) { router.push("/onboarding"); return; }
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
        .order("created_at", { ascending: false })
        .limit(10);
      setContribuciones(contribData || []);
    }

    const { data: invData } = await supabase.from("invitados").select("*").eq("pareja_id", parejaData.id);
    setInvitados(invData || []);

    const { data: rsvpData } = await supabase.from("rsvp").select("*").eq("pareja_id", parejaData.id).order("created_at", { ascending: false });
    setRsvps(rsvpData || []);

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  function handleTransfer() {
    setTransferDone(true);
    setTimeout(() => setTransferDone(false), 2500);
  }

  const totalRecaudado = fondos.reduce((sum, f) => sum + (f.recaudado || 0), 0);
  const totalMeta = fondos.reduce((sum, f) => sum + (f.meta || 0), 0);
  const pct = totalMeta > 0 ? Math.round((totalRecaudado / totalMeta) * 100) : 0;
  const disponible = Math.round(totalRecaudado * 0.965);

  const totalAsientos = invitados.reduce((sum, inv) => sum + (inv.asientos || 1), 0);
  const rsvpSi = rsvps.filter(r => r.asistencia === "si");
  const rsvpNo = rsvps.filter(r => r.asistencia === "no");
  const asientosConfirmados = rsvpSi.reduce((sum, r) => sum + (r.acompanantes || 0) + 1, 0);

  if (loading) return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: "#FAF8F5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, color: "#A89C90" }}>Cargando...</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: "#FAF8F5", minHeight: "100vh", padding: "24px 28px" }}>

      {/* HEADER */}
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 4 }}>Tu panel · Wedo</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 300, color: "#1A1714" }}>
            {pareja?.nombre1} <em style={{ color: "#8C6D4F" }}>&</em> {pareja?.nombre2}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href={`/boda/${pareja?.slug}`} target="_blank" style={{ padding: "7px 16px", fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, border: "1px solid #8C6D4F", background: "transparent", cursor: "pointer", borderRadius: 3, color: "#8C6D4F", fontFamily: "'Jost', sans-serif", textDecoration: "none" }}>
            Ver mi página
          </a>
          <button onClick={handleLogout} style={{ padding: "7px 16px", fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, border: "1px solid rgba(26,23,20,0.14)", background: "transparent", cursor: "pointer", borderRadius: 3, color: "#A89C90", fontFamily: "'Jost', sans-serif" }}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* HERO CARD */}
      <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 22, marginBottom: 14, position: "relative" as const, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #8C6D4F, #B8964A)" }} />
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 4 }}>Total recaudado</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 52, fontWeight: 300, letterSpacing: -1, color: "#1A1714", lineHeight: 1 }}>
          <span style={{ fontSize: 26, color: "#B8964A" }}>Q</span>{totalRecaudado.toLocaleString()}
        </div>
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: 1, color: "#A89C90", marginTop: 4, textTransform: "uppercase" as const }}>
          {pct}% de la meta · Q{totalMeta.toLocaleString()} total
        </div>
        <div style={{ height: 1, background: "#EDE0D4", marginTop: 14 }}>
          <div style={{ height: 1, background: "linear-gradient(90deg, #8C6D4F, #B8964A)", width: `${pct}%` }} />
        </div>
      </div>

      {/* METRICS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Contribuciones", value: contribuciones.length.toString(), sub: "total" },
          { label: "Regalos", value: fondos.length.toString(), sub: "activos", accent: true },
          { label: "Disponible", value: `Q${disponible.toLocaleString()}`, sub: "sin comisión" },
        ].map((m, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 5 }}>{m.label}</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 300, color: m.accent ? "#8C6D4F" : "#1A1714" }}>{m.value}</div>
            <div style={{ fontSize: 10, color: "#A89C90", marginTop: 1 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* FONDOS */}
      <div style={{ fontSize: 9, fontWeight: 700, color: "#A89C90", textTransform: "uppercase" as const, letterSpacing: 2.5, marginBottom: 10 }}>Regalos</div>
      {fondos.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 24, textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 300, color: "#A89C90", marginBottom: 8 }}>No tienes regalos todavía</div>
          <a href="/editor" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, color: "#8C6D4F", textDecoration: "none" }}>Crear regalos en el editor →</a>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 14 }}>
          {fondos.map((f, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: 4, overflow: "hidden", flexShrink: 0, background: "#F5F2ED" }}>
                {f.foto && <img src={f.foto} alt={f.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 400, marginBottom: 5, color: "#1A1714" }}>{f.nombre}</div>
                <div style={{ height: 1, background: "#EDE0D4" }}>
                  <div style={{ height: 1, background: "#8C6D4F", width: `${f.meta > 0 ? Math.min(Math.round((f.recaudado / f.meta) * 100), 100) : 0}%` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: "#A89C90" }}>
                  <span>Q{(f.recaudado || 0).toLocaleString()} de Q{(f.meta || 0).toLocaleString()}</span>
                  <span>{f.meta > 0 ? Math.round((f.recaudado / f.meta) * 100) : 0}%</span>
                </div>
              </div>
              <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 300, color: "#1A1714" }}>Q{(f.recaudado || 0).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RSVP */}
      {invitados.length > 0 && (
        <>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#A89C90", textTransform: "uppercase" as const, letterSpacing: 2.5, marginBottom: 10 }}>Asistencia</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
            {[
              { label: "Invitaciones", value: invitados.length, color: "#1A1714" },
              { label: "Asientos", value: totalAsientos, color: "#1A1714" },
              { label: "Asisten", value: `${rsvpSi.length} (${asientosConfirmados})`, color: "#6B8C76" },
              { label: "No asisten", value: rsvpNo.length, color: "#A89C90" },
            ].map((m, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 12, textAlign: "center" as const }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 300, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          {rsvpSi.length > 0 && (
            <>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#6B8C76", textTransform: "uppercase" as const, letterSpacing: 2.5, marginBottom: 8 }}>Confirmados · {asientosConfirmados} asientos</div>
              <div style={{ background: "#fff", border: "1px solid rgba(107,140,118,0.2)", borderRadius: 4, padding: "4px 16px", marginBottom: 10 }}>
                {rsvpSi.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < rsvpSi.length - 1 ? "1px solid rgba(26,23,20,0.06)" : "none" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#EDF4EF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#6B8C76", flexShrink: 0 }}>
                      {r.nombre?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 400, color: "#1A1714" }}>{r.nombre}</div>
                      <div style={{ fontSize: 10, color: "#A89C90" }}>{(r.acompanantes || 0) + 1} {(r.acompanantes || 0) + 1 === 1 ? "persona" : "personas"} · {new Date(r.created_at).toLocaleDateString("es-GT")}</div>
                    </div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 300, color: "#6B8C76", flexShrink: 0 }}>{(r.acompanantes || 0) + 1}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {rsvpNo.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: "4px 16px", marginBottom: 14 }}>
              {rsvpNo.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < rsvpNo.length - 1 ? "1px solid rgba(26,23,20,0.06)" : "none" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#F5F0F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#A07070", flexShrink: 0 }}>
                    {r.nombre?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 400, color: "#1A1714" }}>{r.nombre}</div>
                    <div style={{ fontSize: 10, color: "#A89C90" }}>{new Date(r.created_at).toLocaleDateString("es-GT")}</div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#A07070" }}>No asiste</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <a href="/editor/invitados" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, color: "#8C6D4F", textDecoration: "none" }}>
              Gestionar lista de invitados →
            </a>
          </div>
        </>
      )}

      {invitados.length === 0 && (
        <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 20, marginBottom: 14, textAlign: "center" as const }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 300, color: "#A89C90", marginBottom: 6 }}>RSVP · Sin invitados</div>
          <a href="/editor/invitados" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, color: "#8C6D4F", textDecoration: "none" }}>Agregar invitados →</a>
        </div>
      )}

      {/* TRANSFER */}
      <div style={{ fontSize: 9, fontWeight: 700, color: "#A89C90", textTransform: "uppercase" as const, letterSpacing: 2.5, marginBottom: 10 }}>Transferir regalos</div>
      <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 18, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 4 }}>Saldo disponible</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, color: "#1A1714" }}>Q{disponible.toLocaleString()}</div>
          </div>
          <button onClick={handleTransfer} style={{ padding: "11px 22px", background: transferDone ? "#6B8C76" : "#1A1714", color: "#fff", border: "none", borderRadius: 3, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif", transition: "background 0.3s" }}>
            {transferDone ? "¡Solicitud enviada!" : "Solicitar transferencia"}
          </button>
        </div>
        <div style={{ fontSize: 11, color: "#A89C90", lineHeight: 1.65, fontWeight: 300 }}>Transferencia a Banrural, BI, BAC o cualquier banco guatemalteco en 2–3 días hábiles. Wedo cobra 3.5% por transacción.</div>
      </div>

      {/* CONTRIBUCIONES */}
      {contribuciones.length > 0 && (
        <>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#A89C90", textTransform: "uppercase" as const, letterSpacing: 2.5, marginBottom: 10 }}>Últimas contribuciones</div>
          <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: "4px 16px", marginBottom: 24 }}>
            {contribuciones.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < contribuciones.length - 1 ? "1px solid rgba(26,23,20,0.08)" : "none" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#EDE0D4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#8C6D4F", flexShrink: 0 }}>
                  {c.nombre_invitado ? c.nombre_invitado.charAt(0).toUpperCase() : "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 400, color: "#1A1714" }}>{c.nombre_invitado || "Anónimo"}</div>
                  <div style={{ fontSize: 10, color: "#A89C90" }}>{new Date(c.created_at).toLocaleDateString("es-GT")} · {fondos.find((f: any) => f.id === c.fondo_id)?.nombre || ""}</div>
                  {c.mensaje && <div style={{ fontSize: 12, color: "#5A524A", fontStyle: "italic", marginTop: 3, fontWeight: 300 }}>"{c.mensaje}"</div>}
                </div>
                <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 300, color: "#6B8C76" }}>+Q{c.monto.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
}