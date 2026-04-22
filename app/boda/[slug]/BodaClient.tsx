"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function BodaClient({ slug }: { slug: string }) {
  const [pareja, setPareja] = useState<any>(null);
  const [fondos, setFondos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(0);
  const [amount, setAmount] = useState(100);
  const [open, setOpen] = useState(false);
  const [paid, setPaid] = useState(false);
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    loadData();
  }, [slug]);

  async function loadData() {
    const { data: parejaData } = await supabase
      .from("parejas")
      .select("*")
      .eq("slug", slug)
      .single();

    if (!parejaData) { setLoading(false); return; }
    setPareja(parejaData);

    const { data: fondosData } = await supabase
      .from("fondos")
      .select("*")
      .eq("pareja_id", parejaData.id)
      .order("orden");

    setFondos(fondosData || []);
    setLoading(false);
  }

  async function handlePay() {
    const f = fondos[selected];
    setPaid(true);
    await supabase.from("contribuciones").insert({
      fondo_id: f.id,
      nombre_invitado: nombre || "Anónimo",
      monto: amount,
    });
    await supabase.from("fondos").update({
      recaudado: (f.recaudado || 0) + amount
    }).eq("id", f.id);
    setTimeout(() => { setPaid(false); setOpen(false); loadData(); }, 2500);
  }

  if (loading) return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: "#FAF8F5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, color: "#A89C90" }}>Cargando...</div>
    </div>
  );

  if (!pareja) return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: "#FAF8F5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: "#A89C90", marginBottom: 8 }}>Página no encontrada</div>
        <a href="/" style={{ fontSize: 11, color: "#8C6D4F", textDecoration: "none", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const }}>Volver al inicio</a>
      </div>
    </div>
  );

  const f = fondos[selected];

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: "#FAF8F5", minHeight: "100vh" }}>

      {/* HERO */}
      <div style={{ position: "relative", height: 320, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url('${pareja.foto_hero || "https://images.unsplash.com/photo-1519741497674-611481863552?w=900&q=80"}')`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(26,23,20,0.05), rgba(26,23,20,0.55))" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 32px", textAlign: "center", zIndex: 2 }}>
          <div style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase" as const, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Lista de Regalos · Wedo</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, fontWeight: 300, color: "#fff", fontStyle: "italic", marginBottom: 6 }}>
            {pareja.nombre1} & {pareja.nombre2}
          </div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase" as const, color: "rgba(255,255,255,0.6)" }}>
            {pareja.fecha ? new Date(pareja.fecha + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" }) : ""} · {pareja.lugar}
          </div>
        </div>
      </div>

      {/* SECTION HEADER */}
      <div style={{ textAlign: "center", padding: "28px 24px 8px" }}>
        <div style={{ fontSize: 9, letterSpacing: 4, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 6 }}>Para los novios</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: "#1A1714" }}>Nuestros Regalos</div>
        <div style={{ width: 36, height: 1, background: "#8C6D4F", margin: "12px auto 0" }} />
      </div>

      {/* GIFT GRID */}
      {fondos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 24px" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 300, color: "#A89C90" }}>Los novios aún no han agregado regalos</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20, padding: "24px 24px 8px" }}>
          {fondos.map((fondo, i) => {
            const pct = fondo.meta > 0 ? Math.min(Math.round((fondo.recaudado / fondo.meta) * 100), 100) : 0;
            return (
              <div key={i} onClick={() => { setSelected(i); setOpen(true); }} style={{ background: "#fff", borderRadius: 4, border: "1px solid rgba(26,23,20,0.08)", overflow: "hidden", cursor: "pointer", transition: "transform 0.3s, box-shadow 0.3s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-6px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 48px rgba(26,23,20,0.10)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}>
                <div style={{ height: 150, overflow: "hidden", position: "relative", background: "#F5F2ED" }}>
                  {fondo.foto && <img src={fondo.foto} alt={fondo.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                </div>
                <div style={{ padding: "14px 16px 16px" }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: "#1A1714", marginBottom: 4 }}>{fondo.nombre}</div>
                  <div style={{ fontSize: 12, color: "#5A524A", lineHeight: 1.65, marginBottom: 9, fontWeight: 300 }}>{fondo.descripcion}</div>
                  <div style={{ height: 1, background: "#EDE0D4", marginBottom: 5 }}>
                    <div style={{ height: 1, background: "#8C6D4F", width: `${pct}%` }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#A89C90" }}>
                    <strong style={{ color: "#1A1714" }}>Q{(fondo.recaudado || 0).toLocaleString()}</strong>
                    <span>{fondo.meta > 0 ? `${pct}% · Q${fondo.meta.toLocaleString()}` : "Sin meta"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ textAlign: "center", padding: "12px 24px 20px", fontSize: 10, color: "#A89C90", letterSpacing: 1.5, textTransform: "uppercase" as const }}>
        Pagos via <span style={{ color: "#8C6D4F" }}>Recurrente</span> · Guatemala
      </div>

      {/* DETAIL OVERLAY */}
      {open && f && (
        <div onClick={(e) => e.target === e.currentTarget && setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(26,23,20,0.45)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 680, overflow: "hidden", borderTop: "1px solid rgba(26,23,20,0.08)" }}>
            <div style={{ height: 220, overflow: "hidden", position: "relative", background: "#F5F2ED" }}>
              {f.foto && <img src={f.foto} alt={f.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(26,23,20,0.5) 100%)" }} />
              <button onClick={() => setOpen(false)} style={{ position: "absolute", top: 12, right: 14, width: 30, height: 30, borderRadius: "50%", background: "rgba(250,248,245,0.9)", border: "1px solid rgba(26,23,20,0.14)", cursor: "pointer", fontSize: 13, color: "#5A524A" }}>✕</button>
            </div>
            <div style={{ width: 32, height: 2, background: "rgba(26,23,20,0.14)", borderRadius: 1, margin: "12px auto 0" }} />
            <div style={{ padding: "16px 26px 26px" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: "#1A1714", marginBottom: 5 }}>{f.nombre}</div>
              <div style={{ fontSize: 13, color: "#5A524A", lineHeight: 1.7, marginBottom: 12, fontWeight: 300 }}>{f.descripcion}</div>
              {f.historia && <div style={{ borderLeft: "1.5px solid #8C6D4F", paddingLeft: 16, fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontStyle: "italic", color: "#5A524A", lineHeight: 1.75, marginBottom: 18, fontWeight: 300 }}>{f.historia}</div>}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: "#5A524A", display: "block", marginBottom: 6, letterSpacing: 0.5 }}>Tu nombre</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="María García" style={{ width: "100%", padding: "9px 12px", border: "1px solid rgba(26,23,20,0.14)", borderRadius: 3, fontSize: 13, fontFamily: "'Jost', sans-serif", background: "#FAF8F5", color: "#1A1714", outline: "none", marginBottom: 12 }} />
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" as const }}>
                {[100, 200, 500, 1000].map(a => (
                  <button key={a} onClick={() => setAmount(a)} style={{ padding: "9px 18px", border: `1px solid ${amount === a ? "#1A1714" : "rgba(26,23,20,0.14)"}`, borderRadius: 2, fontSize: 12, fontWeight: 500, cursor: "pointer", background: amount === a ? "#1A1714" : "transparent", color: amount === a ? "#fff" : "#5A524A", fontFamily: "'Jost', sans-serif", transition: "all 0.15s" }}>Q{a.toLocaleString()}</button>
                ))}
              </div>
              <button onClick={handlePay} disabled={paid} style={{ width: "100%", padding: 15, background: paid ? "#6B8C76" : "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif", transition: "background 0.3s" }}>
                {paid ? "¡Regalo enviado! Gracias ✦" : `Regalar Q${amount.toLocaleString()} con tarjeta`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}