"use client";
import { useState } from "react";

const funds = [
  { name: "Luna de miel", story: "Europa nos espera — cada quetzal nos acerca a ese sueño compartido.", why: '"Llevamos 3 años soñando con recorrer Italia y Francia juntos. Tu regalo nos hace enormemente felices."', raised: 1860, goal: 3000, pct: 62, contributors: 12, badge: "Favorito", img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80" },
  { name: "Primera cena", story: "Una noche de esposos, velas, vino y una mesa solo para dos.", why: '"Queremos celebrar nuestra primera noche casados con una cena que jamás olvidemos."', raised: 704, goal: 800, pct: 88, contributors: 7, badge: "Casi lleno", img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80" },
  { name: "Noche de bodas", story: "Suite en Casa Santo Domingo, Antigua — nuestra primera noche juntos.", why: '"Casa Santo Domingo en la Antigua es el lugar con el que soñamos para nuestra primera noche."', raised: 1000, goal: 2500, pct: 40, contributors: 8, badge: "Popular", img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80" },
  { name: "Nuestro hogar", story: "Los primeros meses juntos: muebles, plantas, ese sofá tan soñado.", why: '"Cada contribución nos ayuda a construir el hogar con el que ambos hemos soñado."', raised: 1400, goal: 5000, pct: 28, contributors: 9, badge: "", img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80" },
  { name: "Clases de cocina", story: "Aprender a cocinar juntos — la mejor inversión en un matrimonio.", why: '"Queremos aprender recetas nuevas y crear tradiciones juntos desde el primer día."', raised: 300, goal: 600, pct: 50, contributors: 5, badge: "", img: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&q=80" },
  { name: "Regalo libre", story: "¿Quieres sorprendernos? Cualquier monto es bienvenido.", why: '"No hay montos mínimos ni máximos. Si quieres regalarnos algo especial, este fondo es para ti."', raised: 0, goal: 0, pct: 0, contributors: 0, badge: "", img: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&q=80" },
];

export default function CashFunds() {
  const [selected, setSelected] = useState(0);
  const [amount, setAmount] = useState(100);
  const [open, setOpen] = useState(false);
  const [paid, setPaid] = useState(false);

  const f = funds[selected];

  function handlePay() {
    setPaid(true);
    setTimeout(() => { setPaid(false); setOpen(false); }, 2500);
  }

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: "#FAF8F5", minHeight: "100vh" }}>

      {/* HERO */}
      <div style={{ position: "relative", height: 300, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1519741497674-611481863552?w=900&q=80')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(26,23,20,0.05), rgba(26,23,20,0.55))" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 32px", textAlign: "center", zIndex: 2 }}>
          <div style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Lista de Regalos · Wedo</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, fontWeight: 300, color: "#fff", fontStyle: "italic", marginBottom: 6 }}>Andrea & Diego</div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>14 de junio de 2025 · Guatemala City</div>
        </div>
      </div>

      {/* SECTION HEADER */}
      <div style={{ textAlign: "center", padding: "28px 24px 8px" }}>
        <div style={{ fontSize: 9, letterSpacing: 4, textTransform: "uppercase", color: "#A89C90", marginBottom: 6 }}>Para los novios</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: "#1A1714" }}>Nuestros Regalos</div>
        <div style={{ width: 36, height: 1, background: "#8C6D4F", margin: "12px auto 0" }} />
      </div>

      {/* GIFT GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20, padding: "24px 24px 8px" }}>
        {funds.map((fund, i) => (
          <div key={i} onClick={() => { setSelected(i); setOpen(true); }} style={{ background: "#fff", borderRadius: 4, border: "1px solid rgba(26,23,20,0.08)", overflow: "hidden", cursor: "pointer", transition: "transform 0.3s, box-shadow 0.3s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-6px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 48px rgba(26,23,20,0.10)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}>
            <div style={{ height: 150, overflow: "hidden", position: "relative" }}>
              <img src={fund.img} alt={fund.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              {fund.badge && <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,0.88)", color: "#8C6D4F", fontSize: 9, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", padding: "3px 9px", borderRadius: 2 }}>{fund.badge}</div>}
            </div>
            <div style={{ padding: "14px 16px 16px" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: "#1A1714", marginBottom: 4 }}>{fund.name}</div>
              <div style={{ fontSize: 12, color: "#5A524A", lineHeight: 1.65, marginBottom: 9, fontWeight: 300 }}>{fund.story}</div>
              <div style={{ height: 1, background: "#EDE0D4", marginBottom: 5 }}>
                <div style={{ height: 1, background: "#8C6D4F", width: `${fund.pct}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#A89C90" }}>
                <strong style={{ color: "#1A1714" }}>Q{fund.raised.toLocaleString()}</strong>
                <span>{fund.goal > 0 ? `${fund.pct}% · Q${fund.goal.toLocaleString()}` : "Sin meta"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", padding: "12px 24px 20px", fontSize: 10, color: "#A89C90", letterSpacing: 1.5, textTransform: "uppercase" }}>
        Pagos via <span style={{ color: "#8C6D4F" }}>Recurrente</span> · Guatemala
      </div>

      {/* DETAIL OVERLAY */}
      {open && (
        <div onClick={(e) => e.target === e.currentTarget && setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(26,23,20,0.45)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 680, overflow: "hidden", borderTop: "1px solid rgba(26,23,20,0.08)" }}>
            <div style={{ height: 220, overflow: "hidden", position: "relative" }}>
              <img src={f.img} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(26,23,20,0.5) 100%)" }} />
              <button onClick={() => setOpen(false)} style={{ position: "absolute", top: 12, right: 14, width: 30, height: 30, borderRadius: "50%", background: "rgba(250,248,245,0.9)", border: "1px solid rgba(26,23,20,0.14)", cursor: "pointer", fontSize: 13, color: "#5A524A" }}>✕</button>
            </div>
            <div style={{ width: 32, height: 2, background: "rgba(26,23,20,0.14)", borderRadius: 1, margin: "12px auto 0" }} />
            <div style={{ padding: "16px 26px 26px" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: "#1A1714", marginBottom: 5 }}>{f.name}</div>
              <div style={{ fontSize: 13, color: "#5A524A", lineHeight: 1.7, marginBottom: 12, fontWeight: 300 }}>{f.story}</div>
              <div style={{ borderLeft: "1.5px solid #8C6D4F", paddingLeft: 16, fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontStyle: "italic", color: "#5A524A", lineHeight: 1.75, marginBottom: 18, fontWeight: 300 }}>{f.why}</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" as const }}>
                {[100, 200, 500, 1000].map(a => (
                  <button key={a} onClick={() => setAmount(a)} style={{ padding: "9px 18px", border: `1px solid ${amount === a ? "#1A1714" : "rgba(26,23,20,0.14)"}`, borderRadius: 2, fontSize: 12, fontWeight: 500, cursor: "pointer", background: amount === a ? "#1A1714" : "transparent", color: amount === a ? "#fff" : "#5A524A", fontFamily: "'Jost', sans-serif", transition: "all 0.15s" }}>Q{a.toLocaleString()}</button>
                ))}
              </div>
              <button onClick={handlePay} style={{ width: "100%", padding: 15, background: paid ? "#6B8C76" : "#8C6D4F", color: "#fff", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif", transition: "background 0.3s" }}>
                {paid ? "¡Regalo enviado! Gracias ✦" : `Regalar Q${amount.toLocaleString()} con tarjeta`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}