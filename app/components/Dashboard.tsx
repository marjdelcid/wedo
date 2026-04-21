"use client";
import { useState } from "react";

const funds = [
  { name: "Luna de miel", raised: 1860, goal: 3000, pct: 62, contributors: 12, img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=200&q=80" },
  { name: "Primera cena", raised: 704, goal: 800, pct: 88, contributors: 7, img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&q=80" },
  { name: "Noche de bodas", raised: 1000, goal: 2500, pct: 40, contributors: 8, img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=200&q=80" },
  { name: "Nuestro hogar", raised: 1400, goal: 5000, pct: 28, contributors: 9, img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&q=80" },
];

const transactions = [
  { initials: "MP", name: "María Pérez", fund: "Luna de miel", amount: 500, time: "hace 2 min" },
  { initials: "JR", name: "Juan Rodríguez", fund: "Nuestro hogar", amount: 200, time: "hace 18 min" },
  { initials: "CL", name: "Carmen López", fund: "Primera cena", amount: 100, time: "hace 45 min" },
  { initials: "FA", name: "Familia Arriaga", fund: "Luna de miel", amount: 1000, time: "ayer" },
];

export default function Dashboard() {
  const [transferDone, setTransferDone] = useState(false);

  function handleTransfer() {
    setTransferDone(true);
    setTimeout(() => setTransferDone(false), 2500);
  }

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: "#FAF8F5", minHeight: "100vh", padding: "24px 28px" }}>

      {/* HEADER */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 4 }}>Tu panel · Wedo</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 300, color: "#1A1714" }}>Andrea <em>& </em>Diego</div>
      </div>

      {/* HERO CARD */}
      <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 22, marginBottom: 14, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #8C6D4F, #B8964A)" }} />
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 4 }}>Total recaudado</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 52, fontWeight: 300, letterSpacing: -1, color: "#1A1714", lineHeight: 1 }}>
          <span style={{ fontSize: 26, color: "#B8964A" }}>Q</span>5,264
        </div>
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: 1, color: "#A89C90", marginTop: 4, textTransform: "uppercase" as const }}>44% de la meta · Q11,900 total</div>
        <div style={{ height: 1, background: "#EDE0D4", marginTop: 14 }}>
          <div style={{ height: 1, background: "linear-gradient(90deg, #8C6D4F, #B8964A)", width: "44%" }} />
        </div>
      </div>

      {/* METRICS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Contribuciones", value: "38", sub: "de 120 inv." },
          { label: "Promedio", value: "Q138", sub: "por regalo", accent: true },
          { label: "Disponible", value: "Q4,817", sub: "sin comisión" },
        ].map((m, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 5 }}>{m.label}</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 300, color: m.accent ? "#8C6D4F" : "#1A1714" }}>{m.value}</div>
            <div style={{ fontSize: 10, color: "#A89C90", marginTop: 1 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* FUNDS */}
      <div style={{ fontSize: 9, fontWeight: 700, color: "#A89C90", textTransform: "uppercase" as const, letterSpacing: 2.5, marginBottom: 10 }}>Fondos</div>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 14 }}>
        {funds.map((f, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 4, overflow: "hidden", flexShrink: 0 }}>
              <img src={f.img} alt={f.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 400, marginBottom: 5, color: "#1A1714" }}>{f.name}</div>
              <div style={{ height: 1, background: "#EDE0D4" }}>
                <div style={{ height: 1, background: "#8C6D4F", width: `${f.pct}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, fontWeight: 600, letterSpacing: 0.5, color: "#A89C90" }}>
                <span>Q{f.raised.toLocaleString()} de Q{f.goal.toLocaleString()}</span>
                <span>{f.pct}%</span>
              </div>
            </div>
            <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 300, color: "#1A1714" }}>Q{f.raised.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: "#A89C90" }}>{f.contributors} regalos</div>
            </div>
          </div>
        ))}
      </div>

      {/* TRANSFER */}
      <div style={{ fontSize: 9, fontWeight: 700, color: "#A89C90", textTransform: "uppercase" as const, letterSpacing: 2.5, marginBottom: 10 }}>Transferir fondos</div>
      <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: 18, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#A89C90", marginBottom: 4 }}>Saldo disponible</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, color: "#1A1714" }}>Q4,817</div>
          </div>
          <button onClick={handleTransfer} style={{ padding: "11px 22px", background: transferDone ? "#6B8C76" : "#1A1714", color: "#fff", border: "none", borderRadius: 3, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "'Jost', sans-serif", transition: "background 0.3s" }}>
            {transferDone ? "¡Solicitud enviada!" : "Solicitar transferencia"}
          </button>
        </div>
        <div style={{ fontSize: 11, color: "#A89C90", lineHeight: 1.65, fontWeight: 300 }}>Transferencia a Banrural, BI, BAC o cualquier banco guatemalteco en 2–3 días hábiles. Wedo cobra 3.5% por transacción.</div>
      </div>

      {/* TRANSACTIONS */}
      <div style={{ fontSize: 9, fontWeight: 700, color: "#A89C90", textTransform: "uppercase" as const, letterSpacing: 2.5, marginBottom: 10 }}>Últimas contribuciones</div>
      <div style={{ background: "#fff", border: "1px solid rgba(26,23,20,0.08)", borderRadius: 4, padding: "4px 16px", marginBottom: 24 }}>
        {transactions.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < transactions.length - 1 ? "1px solid rgba(26,23,20,0.08)" : "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#EDE0D4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#8C6D4F", flexShrink: 0 }}>{t.initials}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 400, color: "#1A1714" }}>{t.name}</div>
              <div style={{ fontSize: 10, color: "#A89C90" }}>{t.fund}</div>
            </div>
            <div style={{ textAlign: "right" as const }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 300, color: "#6B8C76" }}>+Q{t.amount.toLocaleString()}</div>
              <div style={{ fontSize: 10, color: "#A89C90" }}>{t.time}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}